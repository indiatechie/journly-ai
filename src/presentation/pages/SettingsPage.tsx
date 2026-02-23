/**
 * Settings page — manage vault, data, and appearance.
 */

import { useState } from 'react';
import { APP_NAME, APP_VERSION, PREFERENCES_STORAGE_KEY } from '@shared/constants';
import { useEncryption } from '@presentation/hooks/useEncryption';
import { useToastStore } from '@application/store/useToastStore';
import { useSettingsStore } from '@application/store/useSettingsStore';
import { storageAdapter } from '@infrastructure/storage';
import { FileIOService } from '@infrastructure/fileio/FileIOService';
import { ConfirmDialog } from '@presentation/components/common/ConfirmDialog';
import { GoogleDriveSync } from '@presentation/components/sync/GoogleDriveSync';
import { createAIAdapter } from '@infrastructure/ai/createAIAdapter';
import type { Theme, AIProviderType } from '@domain/models/UserPreferences';

const THEMES: { label: string; value: Theme }[] = [
  { label: 'System', value: 'system' },
  { label: 'Dark', value: 'dark' },
  { label: 'Light', value: 'light' },
];

export function SettingsPage() {
  const { lockVault } = useEncryption();
  const addToast = useToastStore((s) => s.addToast);
  const theme = useSettingsStore((s) => s.preferences.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);

  const aiConfig = useSettingsStore((s) => s.preferences.ai);
  const setAIConfig = useSettingsStore((s) => s.setAIConfig);

  const [aiProvider, setAiProvider] = useState<AIProviderType>(aiConfig.provider);
  const [aiEndpoint, setAiEndpoint] = useState(aiConfig.remoteEndpoint ?? '');
  const [aiKey, setAiKey] = useState(aiConfig.remoteApiKey ?? '');
  const [aiModel, setAiModel] = useState(aiConfig.remoteModel ?? '');
  const [showKey, setShowKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const saveAIConfig = (provider: AIProviderType, endpoint: string, key: string, model: string) => {
    const config = {
      provider,
      remoteEndpoint: endpoint || undefined,
      remoteApiKey: key || undefined,
      remoteModel: model || undefined,
    };
    setAIConfig(config);
    try {
      const raw = localStorage.getItem(PREFERENCES_STORAGE_KEY);
      if (raw) {
        const prefs = JSON.parse(raw);
        prefs.ai = config;
        localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(prefs));
      }
    } catch {
      // Non-critical
    }
  };

  const handleAIProviderChange = (provider: AIProviderType) => {
    setAiProvider(provider);
    if (provider === 'none') {
      saveAIConfig('none', '', '', '');
      setAiEndpoint('');
      setAiKey('');
      setAiModel('');
    }
  };

  const handleSaveRemoteConfig = () => {
    if (!aiEndpoint.trim() || !aiKey.trim()) {
      addToast('Endpoint and API key are required.', 'error');
      return;
    }
    saveAIConfig('remote', aiEndpoint.trim(), aiKey.trim(), aiModel.trim());
    addToast('AI configuration saved');
  };

  const handleTestConnection = async () => {
    if (!aiEndpoint.trim() || !aiKey.trim()) {
      addToast('Endpoint and API key are required.', 'error');
      return;
    }
    setIsTesting(true);
    try {
      const config = {
        provider: 'remote' as const,
        remoteEndpoint: aiEndpoint.trim(),
        remoteApiKey: aiKey.trim(),
        remoteModel: aiModel.trim() || undefined,
      };
      const adapter = createAIAdapter(config);
      await adapter.initialize(config);
      await adapter.generate({
        systemPrompt: 'Reply with exactly: OK',
        userPrompt: 'Test',
        maxTokens: 10,
        temperature: 0,
      });
      addToast('Connection successful!');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Connection failed.', 'error');
    } finally {
      setIsTesting(false);
    }
  };

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
    try {
      await FileIOService.exportJSON();
      addToast('Backup exported successfully');
    } catch {
      addToast('Export failed. Please try again.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async () => {
    setIsImporting(true);
    try {
      const envelopes = await FileIOService.importJSON();
      addToast(`Imported ${envelopes.length} records. Reload to see changes.`, 'info');
    } catch {
      addToast('Import failed. Invalid backup file.', 'error');
    } finally {
      setIsImporting(false);
    }
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
      addToast('Reset failed.', 'error');
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

          <div className="flex gap-2 mb-4">
            {([['none', 'None'], ['remote', 'Remote API']] as const).map(([value, label]) => (
              <button
                key={value}
                onClick={() => handleAIProviderChange(value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  aiProvider === value
                    ? 'bg-primary text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {aiProvider === 'none' && (
            <p className="text-sm text-slate-400">
              No AI provider configured. Stories will use demo mode.
            </p>
          )}

          {aiProvider === 'remote' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">API Endpoint</label>
                <input
                  type="text"
                  value={aiEndpoint}
                  onChange={(e) => setAiEndpoint(e.target.value)}
                  placeholder="https://api.openai.com"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">API Key</label>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={aiKey}
                    onChange={(e) => setAiKey(e.target.value)}
                    placeholder="sk-..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 pr-16 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-primary/50 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-200 transition-colors px-1.5 py-0.5"
                  >
                    {showKey ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Model</label>
                <input
                  type="text"
                  value={aiModel}
                  onChange={(e) => setAiModel(e.target.value)}
                  placeholder="gpt-4o-mini"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleSaveRemoteConfig}
                  className="px-4 py-2 bg-primary hover:bg-primary-hover text-slate-950 rounded-lg text-sm font-medium transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => void handleTestConnection()}
                  disabled={isTesting}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {isTesting ? 'Testing...' : 'Test Connection'}
                </button>
              </div>
            </div>
          )}
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
