import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin, PreviewServer, ViteDevServer } from 'vite';
import { getDefaultDeps, handleChat, handleDiagnose, type Deps } from './handlers.js';

type Handler = (request: Request, deps: Deps) => Promise<Response>;
const ROUTES: Record<string, Handler> = { '/api/chat': handleChat, '/api/diagnose': handleDiagnose };

async function toWebRequest(req: IncomingMessage): Promise<Request> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) {
    if (typeof v === 'string') headers.set(k, v);
  }
  const method = req.method ?? 'GET';
  return new Request(`http://localhost${req.url ?? '/'}`, {
    method,
    headers,
    body: method === 'GET' || method === 'HEAD' ? undefined : Buffer.concat(chunks),
  });
}

function mount(server: ViteDevServer | PreviewServer): void {
  server.middlewares.use((req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const path = (req.url ?? '').split('?')[0] ?? '';
    const handler = ROUTES[path];
    if (!handler) return next();
    void (async () => {
      try {
        const response = await handler(await toWebRequest(req), getDefaultDeps());
        res.statusCode = response.status;
        response.headers.forEach((value, key) => res.setHeader(key, value));
        res.end(await response.text());
      } catch {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'upstream_error' }));
      }
    })();
  });
}

/** Monte les fonctions Vercel de api/ sur /api/* pendant `vite` et `vite preview`. */
export function apiPlugin(): Plugin {
  return {
    name: 'lingoloop-api',
    configureServer: mount,
    configurePreviewServer: mount,
  };
}
