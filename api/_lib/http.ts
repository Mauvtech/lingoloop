export const SECURITY_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
};

export type ErrorCode =
  | 'invalid_request'
  | 'method_not_allowed'
  | 'payload_too_large'
  | 'rate_limited'
  | 'invalid_output'
  | 'upstream_error'
  | 'timeout';

const STATUS: Record<ErrorCode, number> = {
  invalid_request: 400,
  method_not_allowed: 405,
  payload_too_large: 413,
  rate_limited: 429,
  invalid_output: 502,
  upstream_error: 502,
  timeout: 504,
};

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: SECURITY_HEADERS });
}

export function error(code: ErrorCode): Response {
  return json({ error: code }, STATUS[code]);
}

export const MAX_BODY_BYTES = 100_000;

/** Lit et parse le corps JSON ; renvoie une Response d'erreur si le corps est invalide. */
export async function readJson(request: Request): Promise<unknown | Response> {
  if (request.method !== 'POST') return error('method_not_allowed');
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) return error('payload_too_large');
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return error('invalid_request');
  }
}

export function clientIp(request: Request): string {
  const fwd = request.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0]?.trim() || 'unknown';
  return request.headers.get('x-real-ip') ?? 'local';
}
