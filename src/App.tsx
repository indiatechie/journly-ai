/**
 * Root application component.
 *
 * Sets up React Router with the {@link AppLayout} shell and all page routes.
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from '@presentation/layouts/AppLayout';
import { VaultGate } from '@presentation/components/common/VaultGate';
import {
  JournalPage,
  EntryEditorPage,
  StoryPage,
  SettingsPage,
} from '@presentation/pages';

export function App() {
  return (
    <BrowserRouter>
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
    </BrowserRouter>
  );
}
