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
import type { Theme, AIConfig } from '@domain/models/UserPreferences';

const THEMES: { label: string; value: Theme }[] = [
  { label: 'System', value: 'system' },
  { label: 'Dark', value: 'dark' },
  { label: 'Light', value: 'light' },
];

// UI-level concept — maps to provider: 'remote' under the hood
type AIMode = 'off' | 'openai' | 'custom';
type ModelQuality = 'fast' | 'smart';

const OPENAI_ENDPOINT = 'https://api.openai.com/v1';
const MODEL_MAP: Record<ModelQuality, string> = {
  fast: 'gpt-4o-mini',
  smart: 'gpt-4o',
};

function getInitialMode(config: AIConfig): AIMode {
  if (config.provider === 'none') return 'off';
  if (!config.remoteEndpoint || config.remoteEndpoint.includes('openai.com')) return 'openai';
  return 'custom';
}

function getInitialQuality(config: AIConfig): ModelQuality {
  return config.remoteModel === 'gpt-4o' ? 'smart' : 'fast';
}

function getStatusText(config: AIConfig): string | null {
  if (config.provider === 'none') return null;
  if (!config.remoteEndpoint || config.remoteEndpoint.includes('openai.com')) {
    const quality = config.remoteModel === 'gpt-4o' ? 'Smart model' : 'Fast model';
    return `AI stories on · OpenAI · ${quality}`;
  }
  return 'AI stories on · Custom endpoint';
}

export function SettingsPage() {
  const { lockVault } = useEncryption();
  const addToast = useToastStore((s) => s.addToast);
  const theme = useSettingsStore((s) => s.preferences.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);

  const aiConfig = useSettingsStore((s) => s.preferences.ai);
  const setAIConfig = useSettingsStore((s) => s.setAIConfig);

  const [aiMode, setAiMode] = useState<AIMode>(() => getInitialMode(aiConfig));
  const [modelQuality, setModelQuality] = useState<ModelQuality>(() => getInitialQuality(aiConfig));
  const [aiKey, setAiKey] = useState(aiConfig.remoteApiKey ?? '');
  const [aiEndpoint, setAiEndpoint] = useState(aiConfig.remoteEndpoint ?? '');
  const [aiModel, setAiModel] = useState(aiConfig.remoteModel ?? '');
  const [showKey, setShowKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const aiStatusText = getStatusText(aiConfig);

  const persistAIConfig = (config: AIConfig) => {
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

  const handleAIModeChange = (mode: AIMode) => {
    setAiMode(mode);
    if (mode === 'off') {
      persistAIConfig({ provider: 'none' });
      setAiKey('');
      setAiEndpoint('');
      setAiModel('');
    }
  };

  const handleSaveOpenAI = () => {
    if (!aiKey.trim()) {
      addToast('OpenAI API key is required.', 'error');
      return;
    }
    persistAIConfig({
      provider: 'remote',
      remoteEndpoint: OPENAI_ENDPOINT,
      remoteApiKey: aiKey.trim(),
      remoteModel: MODEL_MAP[modelQuality],
    });
    addToast('AI stories enabled', 'success', `Using OpenAI · ${modelQuality === 'fast' ? 'Fast model' : 'Smart model'}`);
  };

  const handleSaveCustom = () => {
    if (!aiEndpoint.trim() || !aiKey.trim()) {
      addToast('Server URL and API key are required.', 'error');
      return;
    }
    persistAIConfig({
      provider: 'remote',
      remoteEndpoint: aiEndpoint.trim(),
      remoteApiKey: aiKey.trim(),
      remoteModel: aiModel.trim() || undefined,
    });
    addToast('AI stories enabled', 'success', 'Custom endpoint saved.');
  };

  const handleTestConnection = async () => {
    const endpoint = aiMode === 'openai' ? OPENAI_ENDPOINT : aiEndpoint;
    const model = aiMode === 'openai' ? MODEL_MAP[modelQuality] : (aiModel || undefined);
    if (!endpoint || !aiKey.trim()) {
      addToast('API key is required.', 'error');
      return;
    }
    setIsTesting(true);
    try {
      const config = {
        provider: 'remote' as const,
        remoteEndpoint: endpoint,
        remoteApiKey: aiKey.trim(),
        remoteModel: model,
      };
      const adapter = createAIAdapter(config);
      await adapter.initialize(config);
      await adapter.generate({
        systemPrompt: 'Reply with exactly: OK',
        userPrompt: 'Test',
        maxTokens: 10,
        temperature: 0,
      });
      addToast('Connection successful!', 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Connection failed.', 'error');
    } finally {
      setIsTesting(false);
    }
  };

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
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
      window.location.reload();
    } catch {
      addToast('Reset failed.', 'error');
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto pb-8">
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
                    ? 'bg-primary text-slate-950'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        {/* AI Stories */}
        <section className="bg-slate-900 rounded-xl p-4 border border-slate-800">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-1">
            AI Stories
          </h3>
          <p className="text-sm text-slate-500 mb-4">
            Let AI turn your journal entries into beautifully crafted stories.
          </p>

          {/* Mode tabs */}
          <div className="flex gap-2 mb-5">
            {([
              { value: 'off', label: 'Off' },
              { value: 'openai', label: 'OpenAI' },
              { value: 'custom', label: 'Custom' },
            ] as const).map(({ value, label }) => (
              <button
                key={value}
                onClick={() => handleAIModeChange(value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  aiMode === value
                    ? 'bg-primary text-slate-950'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Off */}
          {aiMode === 'off' && (
            <p className="text-sm text-slate-500">
              AI stories are off. Enable OpenAI or a custom server to generate stories from your entries.
            </p>
          )}

          {/* OpenAI */}
          {aiMode === 'openai' && (
            <div className="space-y-5">
              {/* API Key */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  OpenAI API Key
                </label>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={aiKey}
                    onChange={(e) => setAiKey(e.target.value)}
                    placeholder="sk-..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 pr-16 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-primary/50 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-200 transition-colors px-1.5 py-0.5"
                  >
                    {showKey ? 'Hide' : 'Show'}
                  </button>
                </div>
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary/70 hover:text-primary mt-1.5 transition-colors"
                >
                  Get your key at platform.openai.com
                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                  </svg>
                </a>
              </div>

              {/* Model quality */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Model quality
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setModelQuality('fast')}
                    className={`py-3 px-4 rounded-xl text-sm font-medium transition-all border text-left ${
                      modelQuality === 'fast'
                        ? 'bg-primary/10 border-primary/40 text-primary'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700/60'
                    }`}
                  >
                    <div className="font-semibold mb-0.5">Fast</div>
                    <div className={`text-xs ${modelQuality === 'fast' ? 'text-primary/70' : 'text-slate-500'}`}>
                      gpt-4o-mini · Recommended
                    </div>
                  </button>
                  <button
                    onClick={() => setModelQuality('smart')}
                    className={`py-3 px-4 rounded-xl text-sm font-medium transition-all border text-left ${
                      modelQuality === 'smart'
                        ? 'bg-primary/10 border-primary/40 text-primary'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700/60'
                    }`}
                  >
                    <div className="font-semibold mb-0.5">Smart</div>
                    <div className={`text-xs ${modelQuality === 'smart' ? 'text-primary/70' : 'text-slate-500'}`}>
                      gpt-4o · More creative
                    </div>
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-4">
                <button
                  onClick={handleSaveOpenAI}
                  className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-slate-950 rounded-lg text-sm font-medium transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => void handleTestConnection()}
                  disabled={isTesting}
                  className="text-xs text-slate-500 hover:text-slate-300 transition-colors disabled:opacity-40"
                >
                  {isTesting ? 'Testing...' : 'Test connection'}
                </button>
              </div>
            </div>
          )}

          {/* Custom */}
          {aiMode === 'custom' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500 -mt-1">
                For advanced users running a local or self-hosted AI server.
              </p>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Server URL</label>
                <input
                  type="text"
                  value={aiEndpoint}
                  onChange={(e) => setAiEndpoint(e.target.value)}
                  placeholder="https://api.openai.com/v1"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">API Key</label>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={aiKey}
                    onChange={(e) => setAiKey(e.target.value)}
                    placeholder="sk-..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 pr-16 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-primary/50 transition-colors"
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
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Model
                  <span className="text-slate-600 font-normal ml-1.5">optional</span>
                </label>
                <input
                  type="text"
                  value={aiModel}
                  onChange={(e) => setAiModel(e.target.value)}
                  placeholder="gpt-4o-mini"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={handleSaveCustom}
                  className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-slate-950 rounded-lg text-sm font-medium transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => void handleTestConnection()}
                  disabled={isTesting}
                  className="text-xs text-slate-500 hover:text-slate-300 transition-colors disabled:opacity-40"
                >
                  {isTesting ? 'Testing...' : 'Test connection'}
                </button>
              </div>
            </div>
          )}

          {/* Persistent status line */}
          {aiStatusText && (
            <div className="flex items-center gap-2 mt-5 pt-4 border-t border-slate-800">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
              <span className="text-xs text-slate-400">{aiStatusText}</span>
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
        <div className="text-center text-xs text-slate-600 pt-4 pb-4">
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
