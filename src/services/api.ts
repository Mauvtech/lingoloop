import { mockChatReply, mockDiagnose } from '../../shared/mock';
import {
  ChatResponseSchema,
  DiagnoseResponseSchema,
  type Blockage,
  type ChatRequest,
  type DiagnoseRequest,
} from '../../shared/schemas';

export class OfflineError extends Error {
  constructor() {
    super('offline');
  }
}

export class ApiError extends Error {
  constructor(public readonly code: string) {
    super(code);
  }
}

const MOCK_CLIENT = import.meta.env.VITE_MOCK === '1';

function assertOnline(): void {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) throw new OfflineError();
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function post(path: string, body: unknown, timeoutMs: number): Promise<unknown> {
  assertOnline();
  let res: Response;
  try {
    res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) throw new OfflineError();
    throw new ApiError('network');
  }
  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const code = data && typeof data === 'object' && 'error' in data ? String((data as { error: unknown }).error) : 'http_error';
    throw new ApiError(code);
  }
  return data;
}

export async function requestReply(req: ChatRequest): Promise<string> {
  if (MOCK_CLIENT) {
    assertOnline();
    await delay(250);
    return mockChatReply(req);
  }
  const parsed = ChatResponseSchema.safeParse(await post('/api/chat', req, 25_000));
  if (!parsed.success) throw new ApiError('invalid_output');
  return parsed.data.reply;
}

export async function requestDiagnosis(req: DiagnoseRequest, timeoutMs = 8_000): Promise<Blockage[]> {
  if (MOCK_CLIENT) {
    assertOnline();
    await delay(400);
    return mockDiagnose(req);
  }
  const parsed = DiagnoseResponseSchema.safeParse(await post('/api/diagnose', req, timeoutMs));
  if (!parsed.success) throw new ApiError('invalid_output');
  return parsed.data.blockages;
}
