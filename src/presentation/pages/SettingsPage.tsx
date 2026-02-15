/**
 * Settings page — manage vault, data, and appearance.
 */

import { useState } from 'react';
import { APP_NAME, APP_VERSION, PREFERENCES_STORAGE_KEY } from '@shared/constants';
import { useEncryption } from '@presentation/hooks/useEncryption';
import { useSettingsStore } from '@application/store/useSettingsStore';
import { storageAdapter } from '@infrastructure/storage';
import { ConfirmDialog } from '@presentation/components/common/ConfirmDialog';
import { GoogleDriveSync } from '@presentation/components/sync/GoogleDriveSync';
import type { Theme } from '@domain/models/UserPreferences';

const THEMES: { label: string; value: Theme }[] = [
  { label: 'System', value: 'system' },
  { label: 'Dark', value: 'dark' },
  { label: 'Light', value: 'light' },
];

export function SettingsPage() {
  const { lockVault } = useEncryption();
  const theme = useSettingsStore((s) => s.preferences.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);

  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [feedback, setFeedback] = useState('');

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    // Persist to localStorage
    try {
      const raw = localStorage.getItem(PREFERENCES_STORAGE_KEY);
      if (raw) {
        const prefs = JSON.parse(raw);
        prefs.theme = newTheme;
        localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(prefs));
      }
    } catch {
      // Non-critical
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    setFeedback('');
    try {
      const envelopes = await storageAdapter.exportAll();
      const blob = new Blob(
        [JSON.stringify({ version: APP_VERSION, exportedAt: new Date().toISOString(), envelopes }, null, 2)],
        { type: 'application/json' },
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `journly-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setFeedback('Backup exported successfully.');
    } catch {
      setFeedback('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      setIsImporting(true);
      setFeedback('');
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (!data.envelopes || !Array.isArray(data.envelopes)) {
          throw new Error('Invalid backup file');
        }
        await storageAdapter.importAll(data.envelopes);
        setFeedback(`Imported ${data.envelopes.length} records. Reload to see changes.`);
      } catch {
        setFeedback('Import failed. Make sure the file is a valid Journly backup.');
      } finally {
        setIsImporting(false);
      }
    };
    input.click();
  };

  const handleResetVault = async () => {
    setShowResetConfirm(false);
    try {
      await storageAdapter.clear();
      localStorage.removeItem(PREFERENCES_STORAGE_KEY);
      localStorage.removeItem('journly-first-run-complete');
      const store = useSettingsStore.getState();
      store.reset();
      // Force full reload to return to landing page
      window.location.reload();
    } catch {
      setFeedback('Reset failed.');
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Settings</h2>

      <div className="space-y-6">
        {/* Security */}
        <section className="bg-slate-900 rounded-xl p-4 border border-slate-800">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
            Security
          </h3>
          <p className="text-sm text-slate-400 mb-4">
            AES-256-GCM encryption is active. All data is encrypted on your device.
          </p>
          <button
            onClick={lockVault}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            Lock Vault
          </button>
        </section>

        {/* Appearance */}
        <section className="bg-slate-900 rounded-xl p-4 border border-slate-800">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
            Appearance
          </h3>
          <div className="flex gap-2">
            {THEMES.map(({ label, value }) => (
              <button
                key={value}
                onClick={() => handleThemeChange(value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  theme === value
                    ? 'bg-primary text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        {/* AI Configuration */}
        <section className="bg-slate-900 rounded-xl p-4 border border-slate-800">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
            AI Provider
          </h3>
          <p className="text-sm text-slate-400">
            No AI provider configured. Coming soon — local models via WebLLM
            or your own OpenAI-compatible endpoint.
          </p>
        </section>

        {/* Cloud Sync */}
        <section className="bg-slate-900 rounded-xl p-4 border border-slate-800">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
            Cloud Sync
          </h3>
          <GoogleDriveSync />
        </section>

        {/* Data */}
        <section className="bg-slate-900 rounded-xl p-4 border border-slate-800">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
            Data
          </h3>
          <div className="flex flex-wrap gap-3 mb-3">
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-sm hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              {isExporting ? 'Exporting...' : 'Export Backup'}
            </button>
            <button
              onClick={handleImport}
              disabled={isImporting}
              className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-sm hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              {isImporting ? 'Importing...' : 'Import Backup'}
            </button>
          </div>
          {feedback && (
            <p className="text-sm text-slate-400 mb-3">{feedback}</p>
          )}
          <div className="border-t border-slate-800 pt-3 mt-3">
            <button
              onClick={() => setShowResetConfirm(true)}
              className="text-sm text-red-400 hover:text-red-300 transition-colors"
            >
              Reset vault and delete all data
            </button>
          </div>
        </section>

        {/* About */}
        <div className="text-center text-xs text-slate-600 pt-4">
          {APP_NAME} v{APP_VERSION}
        </div>
      </div>

      <ConfirmDialog
        open={showResetConfirm}
        title="Reset everything?"
        message="This will permanently delete all entries, stories, and your encryption keys. This cannot be undone."
        confirmLabel="Reset"
        danger
        onConfirm={handleResetVault}
        onCancel={() => setShowResetConfirm(false)}
      />
    </div>
  );
}
