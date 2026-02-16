import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import { ErrorBoundary } from '@presentation/components/common/ErrorBoundary';
import { ToastContainer } from '@presentation/components/common/Toast';
import { App } from './App';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element #root not found');

createRoot(rootElement).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
      <ToastContainer />
    </ErrorBoundary>
  </StrictMode>,
);

// Native platform initialization
if (Capacitor.isNativePlatform()) {
  Promise.all([
    import('@capacitor/splash-screen'),
    import('@capacitor/status-bar'),
    import('@capacitor/app'),
  ]).then(([{ SplashScreen }, { StatusBar, Style }, { App: CapApp }]) => {
    // Hide splash screen with fade
    setTimeout(() => {
      SplashScreen.hide({ fadeOutDuration: 300 });
    }, 300);

    // Configure status bar
    StatusBar.setStyle({ style: Style.Dark });
    StatusBar.setBackgroundColor({ color: '#1a1614' });
    StatusBar.setOverlaysWebView({ overlay: true });

    // Auto-lock vault when app is backgrounded for >5 minutes
    let backgroundAt: number | null = null;
    const AUTO_LOCK_MS = 5 * 60 * 1000;

    CapApp.addListener('appStateChange', ({ isActive }) => {
      if (!isActive) {
        backgroundAt = Date.now();
      } else if (backgroundAt && Date.now() - backgroundAt > AUTO_LOCK_MS) {
        // Dynamic import to avoid circular dependency
        import('@application/store/useSettingsStore').then(({ useSettingsStore }) => {
          const store = useSettingsStore.getState();
          if (store.isVaultUnlocked) {
            store.lockVault();
            import('@application/store/useEntryStore').then(({ useEntryStore }) => {
              useEntryStore.getState().reset();
            });
          }
        });
        backgroundAt = null;
      } else {
        backgroundAt = null;
      }
    });
  });
}

// Expose demo seeder in dev mode — run `seedDemo()` in browser console
if (import.meta.env.DEV) {
  import('@shared/demoSeed').then(({ seedDemo }) => {
    (window as unknown as Record<string, unknown>).seedDemo = seedDemo;
  });
}
