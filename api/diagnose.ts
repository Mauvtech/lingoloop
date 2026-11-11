import { getDefaultDeps, handleDiagnose } from './_lib/handlers.js';

export async function POST(request: Request): Promise<Response> {
  return handleDiagnose(request, getDefaultDeps());
}
