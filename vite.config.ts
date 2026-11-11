import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { apiPlugin } from './api/_lib/devServer.ts';

export default defineConfig(({ mode }) => {
  // Les handlers /api lisent process.env (comme sur Vercel) : on y charge .env sans préfixe VITE_.
  const env = loadEnv(mode, process.cwd(), '');
  for (const key of ['ANTHROPIC_API_KEY', 'ANTHROPIC_MODEL']) {
    if (env[key] && !process.env[key]) process.env[key] = env[key];
  }
  return {
    plugins: [
      react(),
      apiPlugin(),
      VitePWA({
        registerType: 'prompt',
        injectRegister: false,
        strategies: 'generateSW',
        includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'robots.txt'],
        manifest: {
          id: '/',
          name: 'LingoLoop',
          short_name: 'LingoLoop',
          description: "Pratique l'oral d'une langue en discutant avec un personnage IA, puis découvre tes blocages.",
          lang: 'fr',
          dir: 'ltr',
          start_url: '/',
          scope: '/',
          display: 'standalone',
          orientation: 'portrait',
          theme_color: '#EAF4F8',
          background_color: '#EAF4F8',
          categories: ['education'],
          icons: [
            { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [/^\/api\//],
          cleanupOutdatedCaches: true,
          runtimeCaching: [{ urlPattern: /^\/api\//, handler: 'NetworkOnly', method: 'POST' }],
        },
        devOptions: { enabled: false },
      }),
    ],
    build: { target: 'es2022', sourcemap: false },
  };
});
