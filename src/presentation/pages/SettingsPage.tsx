/**
 * Settings page — manage encryption, AI config, and preferences.
 *
 * Placeholder implementation for Phase 1.
 */

import { APP_NAME, APP_VERSION } from '@shared/constants';

export function SettingsPage() {
  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Settings</h2>

      {/* Sections */}
      <div className="space-y-6">
        {/* Encryption */}
        <section className="bg-slate-900 rounded-xl p-4 border border-slate-800">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
            🔒 Encryption
          </h3>
          <p className="text-sm text-slate-400">
            AES-256-GCM encryption is enabled. All journal data is encrypted on your device.
          </p>
        </section>

        {/* AI Configuration */}
        <section className="bg-slate-900 rounded-xl p-4 border border-slate-800">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
            🤖 AI Provider
          </h3>
          <p className="text-sm text-slate-400">
            No AI provider configured. You can use a local model (runs in your browser)
            or connect your own OpenAI-compatible API.
          </p>
        </section>

        {/* Appearance */}
        <section className="bg-slate-900 rounded-xl p-4 border border-slate-800">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
            🎨 Appearance
          </h3>
          <p className="text-sm text-slate-400">
            Theme: System • Font size: Medium
          </p>
        </section>

        {/* Data */}
        <section className="bg-slate-900 rounded-xl p-4 border border-slate-800">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
            💾 Data
          </h3>
          <div className="flex gap-3">
            <button className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-sm hover:bg-slate-700 transition-colors">
              Export Backup
            </button>
            <button className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-sm hover:bg-slate-700 transition-colors">
              Import Backup
            </button>
          </div>
        </section>

        {/* About */}
        <div className="text-center text-xs text-slate-600 pt-4">
          {APP_NAME} v{APP_VERSION} • Privacy-first • No tracking • No cloud
        </div>
      </div>
    </div>
  );
}
