/**
 * Zustand store for user preferences and vault state.
 *
 * Manages theme, font size, encryption config, and the vault lock state.
 * The CryptoKey is held in memory here — it is NEVER persisted.
 */

import { create } from 'zustand';
import type { UserPreferences, Theme, FontSize, AIConfig } from '@domain/models/UserPreferences';
import { DEFAULT_PREFERENCES } from '@domain/models/UserPreferences';

interface SettingsState {
  /** Current user preferences. */
  preferences: UserPreferences;
  /** Whether the encryption vault is currently unlocked. */
  isVaultUnlocked: boolean;
  /** The derived CryptoKey — only exists in memory while unlocked. */
  cryptoKey: CryptoKey | null;
  /** Whether this is the first time the app is being used (no vault exists). */
  isFirstLaunch: boolean;
}

interface SettingsActions {
  setPreferences: (prefs: UserPreferences) => void;
  setTheme: (theme: Theme) => void;
  setFontSize: (fontSize: FontSize) => void;
  setAIConfig: (config: AIConfig) => void;
  unlockVault: (key: CryptoKey) => void;
  lockVault: () => void;
  setFirstLaunch: (value: boolean) => void;
  reset: () => void;
}

const initialState: SettingsState = {
  preferences: DEFAULT_PREFERENCES,
  isVaultUnlocked: false,
  cryptoKey: null,
  isFirstLaunch: true,
};

export const useSettingsStore = create<SettingsState & SettingsActions>()((set) => ({
  ...initialState,

  setPreferences: (preferences) => set({ preferences }),

  setTheme: (theme) =>
    set((state) => ({
      preferences: { ...state.preferences, theme },
    })),

  setFontSize: (fontSize) =>
    set((state) => ({
      preferences: { ...state.preferences, fontSize },
    })),

  setAIConfig: (config) =>
    set((state) => ({
      preferences: { ...state.preferences, ai: config },
    })),

  unlockVault: (cryptoKey) =>
    set({ isVaultUnlocked: true, cryptoKey }),

  lockVault: () =>
    set({ isVaultUnlocked: false, cryptoKey: null }),

  setFirstLaunch: (isFirstLaunch) => set({ isFirstLaunch }),

  reset: () => set(initialState),
}));
