import { afterEach, describe, expect, it, vi } from 'vitest';
import { createAnthropicClient, llmFromEnv, type LlmClient, type MessagesApi } from '../../api/_lib/anthropic';
import { handleChat, handleDiagnose, type Deps } from '../../api/_lib/handlers';
import { chatMessages } from '../../api/_lib/prompts';
import { createRateLimiter } from '../../api/_lib/rateLimit';
import type { Turn } from '../../shared/schemas';

const SECRET_SENTENCE = 'Yesterday I go to the secret museum.';
const turns: Turn[] = [
  { role: 'character', characterId: 'nova', text: "Hi, I'm Nova. What did you do?", at: 1 },
  { role: 'user', characterId: 'nova', text: SECRET_SENTENCE, at: 2 },
];

function post(path: string, body: unknown, ip = '1.2.3.4'): Request {
  return new Request(`http://localhost${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

function deps(llm: LlmClient | null, extra: Partial<Deps> = {}): Deps {
  return { llm, limiter: createRateLimiter(1000), timeoutMs: 1000, ...extra };
}

const okBlockage = { key: 'past_tense', observation: 'Tu utilises le présent.', said: SECRET_SENTENCE, corrected: 'Yesterday I went to the secret museum.', occurrences: 1, severity: 3 };

afterEach(() => vi.restoreAllMocks());

describe('validation des entrées', () => {
  const llm: LlmClient = { reply: async () => 'Hello?', diagnose: async () => ({ blockages: [] }) };
  it.each([
    ['JSON invalide', '{oops'],
    ['langue inconnue', { lang: 'de', characterId: 'nova', turns: [] }],
    ['personnage inconnu', { lang: 'en', characterId: 'zorg', turns: [] }],
    ['réplique > 2 000 caractères', { lang: 'en', characterId: 'nova', turns: [{ ...turns[1], text: 'a'.repeat(2001) }] }],
    ['plus de 40 tours', { lang: 'en', characterId: 'nova', turns: Array.from({ length: 41 }, () => turns[1]) }],
  ])('chat : %s → 400', async (_, body) => {
    const res = await handleChat(post('/api/chat', body), deps(llm));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'invalid_request' });
  });
  it('diagnose : entrée invalide → 400 ; GET → 405 ; corps trop gros → 413', async () => {
    expect((await handleDiagnose(post('/api/diagnose', { lang: 'en' }), deps(llm))).status).toBe(400);
    expect((await handleDiagnose(new Request('http://localhost/api/diagnose'), deps(llm))).status).toBe(405);
    expect((await handleDiagnose(post('/api/diagnose', 'x'.repeat(100_001)), deps(llm))).status).toBe(413);
  });
  it('en-têtes de sécurité, sans stack trace', async () => {
    const res = await handleChat(post('/api/chat', '{oops'), deps(llm));
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
    expect(res.headers.get('content-type')).toContain('application/json');
    expect(await res.text()).not.toMatch(/at |Error/);
  });
});

describe('/api/chat', () => {
  it('mode mock serveur sans clé', async () => {
    const res = await handleChat(post('/api/chat', { lang: 'en', characterId: 'nova', turns: [] }), deps(null));
    expect((await res.json()).reply).toContain('Nova');
  });
  it('appelle le modèle avec le prompt système et un dialogue user/assistant', async () => {
    const reply = vi.fn<LlmClient['reply']>(async () => 'Nice! What else?');
    const res = await handleChat(post('/api/chat', { lang: 'es', characterId: 'nova', turns, remainingSec: 20 }), deps({ reply, diagnose: async () => null }));
    expect(await res.json()).toEqual({ reply: 'Nice! What else?' });
    const arg = reply.mock.calls[0]?.[0] as unknown as { system: string; messages: { role: string }[] };
    expect(arg.system).toContain('Spanish');
    expect(arg.system).toContain('Never correct');
    expect(arg.system).toContain('20 seconds');
    expect(arg.messages[0]?.role).toBe('user');
    expect(arg.messages.at(-1)?.role).toBe('user');
  });
  it('timeout → 504 ; erreur amont → 502', async () => {
    const never: LlmClient = { reply: () => new Promise(() => undefined), diagnose: () => new Promise(() => undefined) };
    const res = await handleChat(post('/api/chat', { lang: 'en', characterId: 'nova', turns }), deps(never, { timeoutMs: 30 }));
    expect(res.status).toBe(504);
    const failing: LlmClient = { reply: async () => Promise.reject(new Error('boom')), diagnose: async () => null };
    expect((await handleChat(post('/api/chat', { lang: 'en', characterId: 'nova', turns }), deps(failing))).status).toBe(502);
  });
  it('limitation de débit : la 31e requête en 1 min → 429', async () => {
    const d = deps(null, { limiter: createRateLimiter(30, 60_000) });
    for (let i = 0; i < 30; i++) expect((await handleChat(post('/api/chat', { lang: 'en', characterId: 'nova', turns: [] }), d)).status).toBe(200);
    const res = await handleChat(post('/api/chat', { lang: 'en', characterId: 'nova', turns: [] }), d);
    expect(res.status).toBe(429);
    expect((await handleChat(post('/api/chat', { lang: 'en', characterId: 'nova', turns: [] }, '9.9.9.9'), d)).status).toBe(200);
  });
});

describe('/api/diagnose', () => {
  it('mode mock serveur ; aucun tour user → [] sans appel', async () => {
    const res = await handleDiagnose(post('/api/diagnose', { lang: 'en', turns }), deps(null));
    expect((await res.json()).blockages[0].key).toBe('past_tense');
    const diagnose = vi.fn();
    const empty = await handleDiagnose(post('/api/diagnose', { lang: 'en', turns: [turns[0]] }), deps({ reply: async () => '', diagnose }));
    expect(await empty.json()).toEqual({ blockages: [] });
    expect(diagnose).not.toHaveBeenCalled();
  });
  it('said inventé → nouvel appel, puis exemple retiré si toujours faux', async () => {
    const invented = { ...okBlockage, said: 'I eated a cake.', corrected: 'I ate a cake.' };
    const diagnose = vi.fn<LlmClient['diagnose']>(async () => ({ blockages: [invented] }));
    const res = await handleDiagnose(post('/api/diagnose', { lang: 'en', turns }), deps({ reply: async () => '', diagnose }));
    expect(diagnose).toHaveBeenCalledTimes(2);
    expect((diagnose.mock.calls[1]?.[0] as unknown as { prompt: string }).prompt).toContain('never said');
    const [b] = (await res.json()).blockages;
    expect(b.said).toBeUndefined();
    expect(b.observation).toBe(okBlockage.observation);
  });
  it('said inventé puis corrigé au 2e appel → exemple conservé', async () => {
    const diagnose = vi.fn().mockResolvedValueOnce({ blockages: [{ ...okBlockage, said: 'nope' }] }).mockResolvedValueOnce({ blockages: [okBlockage] });
    const res = await handleDiagnose(post('/api/diagnose', { lang: 'en', turns }), deps({ reply: async () => '', diagnose }));
    expect((await res.json()).blockages[0].said).toBe(SECRET_SENTENCE);
  });
  it('JSON invalide deux fois → 502 invalid_output ; une seule fois → succès', async () => {
    const bad = vi.fn(async () => ({ blockages: [{ key: 'pronunciation', severity: 9 }] }));
    const res = await handleDiagnose(post('/api/diagnose', { lang: 'en', turns }), deps({ reply: async () => '', diagnose: bad }));
    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ error: 'invalid_output' });
    expect(bad).toHaveBeenCalledTimes(2);
    const once = vi.fn().mockResolvedValueOnce('garbage').mockResolvedValueOnce({ blockages: [okBlockage] });
    expect((await handleDiagnose(post('/api/diagnose', { lang: 'en', turns }), deps({ reply: async () => '', diagnose: once }))).status).toBe(200);
  });
  it('timeout → 504', async () => {
    const res = await handleDiagnose(post('/api/diagnose', { lang: 'en', turns }), deps({ reply: async () => '', diagnose: () => new Promise(() => undefined) }, { timeoutMs: 30 }));
    expect(res.status).toBe(504);
  });
  it('aucun log ne contient le texte des échanges', async () => {
    const spies = (['log', 'info', 'warn', 'error', 'debug'] as const).map((m) => vi.spyOn(console, m).mockImplementation(() => undefined));
    await handleDiagnose(post('/api/diagnose', { lang: 'en', turns }), deps({ reply: async () => '', diagnose: async () => ({ blockages: [okBlockage] }) }));
    await handleChat(post('/api/chat', { lang: 'en', characterId: 'nova', turns }), deps({ reply: async () => Promise.reject(new Error(SECRET_SENTENCE)), diagnose: async () => null }));
    for (const s of spies) for (const call of s.mock.calls) expect(JSON.stringify(call)).not.toContain('secret museum');
  });
});

describe('client Anthropic', () => {
  function fakeMessages(content: unknown[]) {
    const create = vi.fn<MessagesApi['create']>(async () => ({ content }) as never);
    return { api: { create } as unknown as MessagesApi, create };
  }
  it('diagnose force le tool report_blockages et renvoie son entrée', async () => {
    const { api, create } = fakeMessages([{ type: 'tool_use', name: 'report_blockages', id: 't', input: { blockages: [] } }]);
    const client = createAnthropicClient(api, 'claude-sonnet-5-5');
    const out = await client.diagnose({ system: 's', prompt: 'p', signal: new AbortController().signal });
    expect(out).toEqual({ blockages: [] });
    const body = create.mock.calls[0]?.[0] as unknown as { model: string; tool_choice: unknown; tools: { name: string }[] };
    expect(body.model).toBe('claude-sonnet-5-5');
    expect(body.tool_choice).toEqual({ type: 'tool', name: 'report_blockages' });
    expect(body.tools[0]?.name).toBe('report_blockages');
  });
  it('réponse sans tool ou sans texte → erreur gérée (502 via le handler)', async () => {
    const { api } = fakeMessages([{ type: 'text', text: '' }]);
    const client = createAnthropicClient(api, 'm');
    await expect(client.diagnose({ system: 's', prompt: 'p', signal: new AbortController().signal })).rejects.toThrow('invalid_output');
    await expect(client.reply({ system: 's', messages: [], signal: new AbortController().signal })).rejects.toThrow('invalid_output');
    const res = await handleDiagnose(post('/api/diagnose', { lang: 'en', turns }), deps(client));
    expect(res.status).toBe(502);
  });
  it('reply concatène les blocs texte', async () => {
    const { api } = fakeMessages([{ type: 'text', text: 'Hello!' }, { type: 'text', text: 'How are you?' }]);
    expect(await createAnthropicClient(api, 'm').reply({ system: 's', messages: [], signal: new AbortController().signal })).toBe('Hello! How are you?');
  });
  it('llmFromEnv : null sans clé, client sinon (modèle par défaut)', () => {
    expect(llmFromEnv({})).toBeNull();
    expect(llmFromEnv({ ANTHROPIC_API_KEY: '  ' })).toBeNull();
    expect(llmFromEnv({ ANTHROPIC_API_KEY: 'test-key' })).not.toBeNull();
  });
});

describe('prompts', () => {
  it('ne garde que la partie du nouveau personnage et fusionne les rôles consécutifs', () => {
    const t: Turn[] = [
      { role: 'character', characterId: 'nova', text: 'Hi', at: 1 },
      { role: 'user', characterId: 'nova', text: 'Hello', at: 2 },
      { role: 'character', characterId: 'milo', text: "I'm Milo", at: 3 },
      { role: 'user', characterId: 'milo', text: 'Pasta', at: 4 },
      { role: 'user', characterId: 'milo', text: 'and cheese', at: 5 },
    ];
    const msgs = chatMessages(t, 'milo');
    expect(msgs.map((m) => m.role)).toEqual(['user', 'assistant', 'user']);
    expect(msgs[2]?.content).toBe('Pasta\nand cheese');
    expect(chatMessages([], 'sam')).toHaveLength(1);
  });
});
