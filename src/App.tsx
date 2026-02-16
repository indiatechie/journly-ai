/**
 * Root application component.
 *
 * Sets up React Router with the {@link AppLayout} shell and all page routes.
 * First-time visitors (no vault) see the LandingPage; returning users go to VaultGate.
 */

import { lazy, Suspense, useState, useCallback } from 'react';
import { BrowserRouter, HashRouter, Routes, Route } from 'react-router-dom';
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

export function App() {
  useThemeEffect();
  const [showSetup, setShowSetup] = useState(false);
  const vaultExists = hasExistingVault();

  const handleGetStarted = useCallback(() => {
    setShowSetup(true);
  }, []);

  // No vault and user hasn't clicked "Get Started" yet → show landing page
  if (!vaultExists && !showSetup) {
    return <LandingPage onGetStarted={handleGetStarted} />;
  }

  // Either vault exists (show unlock) or user clicked "Get Started" (show setup)
  return (
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
  );
}
