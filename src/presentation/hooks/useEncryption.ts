/**
 * Hook: useEncryption
 *
 * Provides vault lock/unlock operations to UI components.
 * Bridges Zustand store with the CryptoService (to be implemented in Phase 2).
 *
 * Placeholder for Phase 1.
 */

export function useEncryption() {
  // TODO: Phase 2 — wire to CryptoService + useSettingsStore
  return {
    isUnlocked: false,
    isFirstLaunch: true,
    unlockVault: async (_passphrase: string) => {
      console.warn('[useEncryption] unlockVault not implemented yet');
      return false;
    },
    lockVault: () => {
      console.warn('[useEncryption] lockVault not implemented yet');
    },
    setupVault: async (_passphrase: string) => {
      console.warn('[useEncryption] setupVault not implemented yet');
      return false;
    },
  };
}
