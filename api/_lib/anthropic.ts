import Anthropic from '@anthropic-ai/sdk';
import { DIAGNOSE_TOOL_NAME, DIAGNOSE_TOOL_SCHEMA, type ChatMessage } from './prompts.js';

export interface LlmClient {
  reply(p: { system: string; messages: ChatMessage[]; signal: AbortSignal }): Promise<string>;
  /** Renvoie l'entrée brute du tool de diagnostic (non validée). */
  diagnose(p: { system: string; prompt: string; signal: AbortSignal }): Promise<unknown>;
}

/** Sous-ensemble du SDK utilisé : permet de le remplacer dans les tests. */
export interface MessagesApi {
  create(body: Anthropic.MessageCreateParamsNonStreaming, options?: { signal?: AbortSignal }): Promise<Anthropic.Message>;
}

export const DEFAULT_MODEL = 'claude-sonnet-5-5';

export function createAnthropicClient(messages: MessagesApi, model: string): LlmClient {
  return {
    async reply({ system, messages: msgs, signal }) {
      const res = await messages.create({ model, max_tokens: 300, system, messages: msgs }, { signal });
      const text = res.content
        .filter((b): b is Anthropic.TextBlock => b.type === 'text')
        .map((b) => b.text)
        .join(' ')
        .trim();
      if (!text) throw new LlmOutputError();
      return text;
    },
    async diagnose({ system, prompt, signal }) {
      const res = await messages.create(
        {
          model,
          max_tokens: 1200,
          system,
          messages: [{ role: 'user', content: prompt }],
          tools: [
            {
              name: DIAGNOSE_TOOL_NAME,
              description: 'Report the learner blockages observed in the transcript.',
              input_schema: DIAGNOSE_TOOL_SCHEMA as unknown as Anthropic.Tool.InputSchema,
            },
          ],
          tool_choice: { type: 'tool', name: DIAGNOSE_TOOL_NAME },
        },
        { signal },
      );
      const block = res.content.find(
        (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use' && b.name === DIAGNOSE_TOOL_NAME,
      );
      if (!block) throw new LlmOutputError();
      return block.input;
    },
  };
}

export class LlmOutputError extends Error {
  constructor() {
    super('invalid_output');
  }
}

/** Client réel si une clé est configurée, sinon null (mode mock serveur). */
export function llmFromEnv(env: NodeJS.ProcessEnv = process.env): LlmClient | null {
  const apiKey = env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) return null;
  const sdk = new Anthropic({ apiKey, maxRetries: 0, timeout: 20_000 });
  return createAnthropicClient(sdk.messages, env.ANTHROPIC_MODEL?.trim() || DEFAULT_MODEL);
}
