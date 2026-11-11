import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import { apiPlugin } from './api/_lib/devServer';

export default defineConfig(({ mode }) => {
  // Les handlers /api lisent process.env (comme sur Vercel) : on y charge .env sans préfixe VITE_.
  const env = loadEnv(mode, process.cwd(), '');
  for (const key of ['ANTHROPIC_API_KEY', 'ANTHROPIC_MODEL']) {
    if (env[key] && !process.env[key]) process.env[key] = env[key];
  }
  return {
    plugins: [react(), apiPlugin()],
    build: { target: 'es2022', sourcemap: false },
  };
});
