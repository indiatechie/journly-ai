import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { resolve } from 'path';

const isCapacitorBuild = !!process.env.CAPACITOR_BUILD;

// When building for Capacitor, VitePWA is excluded but App.tsx still imports
// the virtual:pwa-register/react module. This stub replaces it with a no-op
// so the build succeeds and PWAUpdateBanner silently does nothing on native.
const pwaStubPlugin = {
  name: 'pwa-register-stub',
  resolveId(id: string) {
    if (id === 'virtual:pwa-register/react') return id;
  },
  load(id: string) {
    if (id === 'virtual:pwa-register/react') {
      return `export function useRegisterSW() {
        return { needRefresh: [false, () => {}], offlineReady: [false, () => {}], updateServiceWorker: async () => {} };
      }`;
    }
  },
};

export default defineConfig({
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    ...(isCapacitorBuild ? [pwaStubPlugin] : []),
    ...(!isCapacitorBuild
      ? [
          VitePWA({
            registerType: 'prompt',
            includeAssets: ['favicon.ico', 'icons/*.png'],
            manifest: {
              name: 'Journly.ai',
              short_name: 'Journly',
              description: 'Privacy-first, offline-first journaling PWA',
              theme_color: '#1e293b',
              background_color: '#0f172a',
              display: 'standalone',
              orientation: 'portrait-primary',
              scope: '/',
              start_url: '/',
              icons: [
                {
                  src: '/icons/icon-192.png',
                  sizes: '192x192',
                  type: 'image/png',
                },
                {
                  src: '/icons/icon-512.png',
                  sizes: '512x512',
                  type: 'image/png',
                },
                {
                  src: '/icons/icon-512-maskable.png',
                  sizes: '512x512',
                  type: 'image/png',
                  purpose: 'maskable',
                },
              ],
            },
            workbox: {
              globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
              runtimeCaching: [
                {
                  urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                  handler: 'CacheFirst',
                  options: {
                    cacheName: 'google-fonts-cache',
                    expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
                    cacheableResponse: { statuses: [0, 200] },
                  },
                },
              ],
            },
          }),
        ]
      : []),
  ],
  resolve: {
    alias: {
      '@domain': resolve(__dirname, 'src/domain'),
      '@application': resolve(__dirname, 'src/application'),
      '@infrastructure': resolve(__dirname, 'src/infrastructure'),
      '@presentation': resolve(__dirname, 'src/presentation'),
      '@shared': resolve(__dirname, 'src/shared'),
    },
  },
});
