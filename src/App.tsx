/**
 * Root application component.
 *
 * Sets up React Router with the {@link AppLayout} shell and all page routes.
 */

import { BrowserRouter, HashRouter, Routes, Route } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { AppLayout } from '@presentation/layouts/AppLayout';
import { VaultGate } from '@presentation/components/common/VaultGate';
import {
  JournalPage,
  EntryEditorPage,
  StoryPage,
  SettingsPage,
} from '@presentation/pages';

const Router = Capacitor.isNativePlatform() ? HashRouter : BrowserRouter;

export function App() {
  return (
    <Router>
      <VaultGate>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<JournalPage />} />
            <Route path="entry/new" element={<EntryEditorPage />} />
            <Route path="entry/:id" element={<EntryEditorPage />} />
            <Route path="story" element={<StoryPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </VaultGate>
    </Router>
  );
}
