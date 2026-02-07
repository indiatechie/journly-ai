/**
 * Service Worker registration helper.
 *
 * Uses workbox-window for lifecycle management.
 * Called from main.tsx after the app mounts.
 */

export async function registerServiceWorker(): Promise<void> {
  if (!('serviceWorker' in navigator)) {
    console.warn('[SW] Service workers are not supported in this browser.');
    return;
  }

  // In production, vite-plugin-pwa handles SW generation.
  // This module provides a manual registration hook if needed.
  try {
    const { Workbox } = await import('workbox-window');
    const wb = new Workbox('/sw.js');

    wb.addEventListener('installed', (event) => {
      if (event.isUpdate) {
        console.log('[SW] New version available — refresh to update.');
      } else {
        console.log('[SW] App is now available offline.');
      }
    });

    wb.addEventListener('activated', () => {
      console.log('[SW] Service Worker activated.');
    });

    await wb.register();
  } catch (error) {
    console.error('[SW] Registration failed:', error);
  }
}
