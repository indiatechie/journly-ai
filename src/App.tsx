/**
 * Root application component.
 *
 * Sets up React Router with the {@link AppLayout} shell and all page routes.
 * First-time visitors (no vault) see the LandingPage; returning users go to VaultGate.
 */

import { lazy, Suspense, useState, useCallback, useEffect } from 'react';
import { BrowserRouter, HashRouter, Routes, Route } from 'react-router-dom';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Capacitor } from '@capacitor/core';
import { AppLayout } from '@presentation/layouts/AppLayout';
import { VaultGate } from '@presentation/components/common/VaultGate';
import { LandingPage } from '@presentation/pages/LandingPage';
import { PREFERENCES_STORAGE_KEY } from '@shared/constants';
import { useThemeEffect } from '@presentation/hooks/useThemeEffect';

const JournalPage = lazy(() => import('@presentation/pages/JournalPage').then(m => ({ default: m.JournalPage })));
const EntryEditorPage = lazy(() => import('@presentation/pages/EntryEditorPage').then(m => ({ default: m.EntryEditorPage })));
const StoryPage = lazy(() => import('@presentation/pages/StoryPage').then(m => ({ default: m.StoryPage })));
const StoryViewPage = lazy(() => import('@presentation/pages/StoryViewPage').then(m => ({ default: m.StoryViewPage })));
const SettingsPage = lazy(() => import('@presentation/pages/SettingsPage').then(m => ({ default: m.SettingsPage })));

const Router = Capacitor.isNativePlatform() ? HashRouter : BrowserRouter;

function PageLoader() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );
}

function hasExistingVault(): boolean {
  try {
    const raw = localStorage.getItem(PREFERENCES_STORAGE_KEY);
    if (!raw) return false;
    const prefs = JSON.parse(raw);
    return Boolean(prefs?.encryption?.saltBase64);
  } catch {
    return false;
  }
}

/**
 * Handles the OAuth popup callback: when the capgo social-login plugin opens a
 * popup that redirects back to this app URL, we detect the #access_token in the
 * hash, postMessage it back to the opener, and close the popup window.
 */
function useOAuthPopupCallback() {
  useEffect(() => {
    if (!window.opener) return;
    const hash = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hash.get('access_token');
    const idToken = hash.get('id_token');
    const error = hash.get('error');

    if (error) {
      window.opener.postMessage(
        { type: 'oauth-error', error: hash.get('error_description') || error },
        window.location.origin,
      );
      window.close();
      return;
    }

    if (accessToken && idToken) {
      window.opener.postMessage(
        { type: 'oauth-response', accessToken: { token: accessToken }, idToken },
        window.location.origin,
      );
      window.close();
    }
  }, []);
}

// Detect OAuth callback at module level so we can short-circuit rendering
const isOAuthPopupCallback =
  Boolean(window.opener) &&
  Boolean(new URLSearchParams(window.location.hash.substring(1)).get('access_token') ||
          new URLSearchParams(window.location.hash.substring(1)).get('error'));

function PWAUpdateBanner() {
  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW();
  if (!needRefresh) return null;
  return (
    <div className="fixed top-0 inset-x-0 z-[100] flex items-center justify-between gap-3 px-4 py-3 bg-slate-800 border-b border-slate-700 text-sm text-slate-200 shadow-lg">
      <span>Journly updated — new features ready.</span>
      <button
        onClick={() => updateServiceWorker(true)}
        className="shrink-0 px-3 py-1.5 bg-primary hover:bg-primary-hover text-slate-950 rounded-lg text-xs font-medium transition-colors"
      >
        Reload
      </button>
    </div>
  );
}

export function App() {
  useOAuthPopupCallback();
  useThemeEffect();
  const [showSetup, setShowSetup] = useState(false);
  const vaultExists = hasExistingVault();

  // This window is an OAuth popup redirect — render nothing while postMessage fires
  if (isOAuthPopupCallback) return null;

  const handleGetStarted = useCallback(() => {
    setShowSetup(true);
  }, []);

  // No vault and user hasn't clicked "Get Started" yet → show landing page
  if (!vaultExists && !showSetup) {
    return (
      <>
        <PWAUpdateBanner />
        <LandingPage onGetStarted={handleGetStarted} />
      </>
    );
  }

  // Either vault exists (show unlock) or user clicked "Get Started" (show setup)
  return (
    <>
      <PWAUpdateBanner />
    <Router>
      <VaultGate>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route element={<AppLayout />}>
              <Route index element={<JournalPage />} />
              <Route path="entry/new" element={<EntryEditorPage />} />
              <Route path="entry/:id" element={<EntryEditorPage />} />
              <Route path="story" element={<StoryPage />} />
              <Route path="story/:id" element={<StoryViewPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
          </Routes>
        </Suspense>
      </VaultGate>
    </Router>
    </>
  );
}
