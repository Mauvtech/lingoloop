import { getCharacter } from '../../shared/characters.js';
import { finalizeBlockages, invalidQuotes } from '../../shared/diagnosis.js';
import { mockChatReply, mockDiagnose } from '../../shared/mock.js';
import {
  ChatRequestSchema,
  DiagnoseModelOutputSchema,
  DiagnoseRequestSchema,
  type Blockage,
  type DiagnoseRequest,
} from '../../shared/schemas.js';
import { llmFromEnv, type LlmClient } from './anthropic.js';
import { clientIp, error, json, readJson } from './http.js';
import { chatMessages, chatSystemPrompt, diagnoseSystemPrompt, diagnoseUserPrompt } from './prompts.js';
import { createRateLimiter, type RateLimiter } from './rateLimit.js';

export interface Deps {
  /** null = mode mock serveur (pas de clé API). */
  llm: LlmClient | null;
  limiter: RateLimiter;
  timeoutMs: number;
}

let defaultDeps: Deps | null = null;
export function getDefaultDeps(): Deps {
  const limit = Number(process.env.LINGOLOOP_RATE_LIMIT) || 30;
  defaultDeps ??= { llm: llmFromEnv(), limiter: createRateLimiter(limit, 60_000), timeoutMs: 20_000 };
  return defaultDeps;
}

class TimeoutError extends Error {}

async function withTimeout<T>(ms: number, run: (signal: AbortSignal) => Promise<T>): Promise<T> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new TimeoutError());
    }, ms);
  });
  try {
    return await Promise.race([run(controller.signal), timeout]);
  } finally {
    clearTimeout(timer);
  }
}

function upstreamFailure(e: unknown): Response {
  return error(e instanceof TimeoutError ? 'timeout' : 'upstream_error');
}

export async function handleChat(request: Request, deps: Deps): Promise<Response> {
  if (!deps.limiter.allow(clientIp(request))) return error('rate_limited');
  const body = await readJson(request);
  if (body instanceof Response) return body;
  const parsed = ChatRequestSchema.safeParse(body);
  if (!parsed.success) return error('invalid_request');
  const req = parsed.data;
  const character = getCharacter(req.characterId);
  if (!character) return error('invalid_request');

  if (!deps.llm) return json({ reply: mockChatReply(req) });

  const llm = deps.llm;
  try {
    const reply = await withTimeout(deps.timeoutMs, (signal) =>
      llm.reply({
        system: chatSystemPrompt(character, req.lang, req.remainingSec),
        messages: chatMessages(req.turns, character.id),
        signal,
      }),
    );
    return json({ reply: reply.slice(0, 2000) });
  } catch (e) {
    return upstreamFailure(e);
  }
}

type Attempt = { ok: true; blockages: Blockage[] } | { ok: false };

async function attemptDiagnose(llm: LlmClient, req: DiagnoseRequest, timeoutMs: number, feedback?: string): Promise<Attempt> {
  const prompt = diagnoseUserPrompt(req.turns) + (feedback ? `\n\n${feedback}` : '');
  const raw = await withTimeout(timeoutMs, (signal) =>
    llm.diagnose({ system: diagnoseSystemPrompt(req.lang), prompt, signal }),
  );
  const parsed = DiagnoseModelOutputSchema.safeParse(raw);
  return parsed.success ? { ok: true, blockages: parsed.data.blockages } : { ok: false };
}

export async function handleDiagnose(request: Request, deps: Deps): Promise<Response> {
  if (!deps.limiter.allow(clientIp(request))) return error('rate_limited');
  const body = await readJson(request);
  if (body instanceof Response) return body;
  const parsed = DiagnoseRequestSchema.safeParse(body);
  if (!parsed.success) return error('invalid_request');
  const req = parsed.data;

  if (!req.turns.some((t) => t.role === 'user' && t.text.trim())) return json({ blockages: [] });
  if (!deps.llm) return json({ blockages: mockDiagnose(req) });

  const llm = deps.llm;
  try {
    let attempt = await attemptDiagnose(llm, req, deps.timeoutMs);
    if (!attempt.ok) {
      attempt = await attemptDiagnose(llm, req, deps.timeoutMs, 'Your previous answer did not match the tool schema. Call the tool again with valid data.');
    }
    if (!attempt.ok) return error('invalid_output');

    let blockages = attempt.blockages;
    const wrong = invalidQuotes(blockages, req.turns);
    if (wrong.length > 0) {
      const quotes = wrong.map((b) => `"${b.said ?? ''}"`).join(', ');
      const retry = await attemptDiagnose(
        llm,
        req,
        deps.timeoutMs,
        `Your previous answer quoted sentences the learner never said (${quotes}). "said" must be copied exactly from a Learner line.`,
      );
      if (retry.ok) blockages = retry.blockages;
    }
    return json({ blockages: finalizeBlockages(blockages, req.turns) });
  } catch (e) {
    return upstreamFailure(e);
  }
}
