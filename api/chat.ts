import { getDefaultDeps, handleChat } from './_lib/handlers.js';

export async function POST(request: Request): Promise<Response> {
  return handleChat(request, getDefaultDeps());
}
