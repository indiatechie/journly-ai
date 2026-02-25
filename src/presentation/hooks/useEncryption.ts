/**
 * Hook: useEncryption
 *
 * Provides vault lock/unlock/setup operations to UI components.
 * Bridges CryptoService with Zustand settings store.
 */

import { useSettingsStore } from '@application/store/useSettingsStore';
import { useEntryStore } from '@application/store/useEntryStore';
import { cryptoService } from '@infrastructure/crypto';
import { PBKDF2_ITERATIONS, PREFERENCES_STORAGE_KEY } from '@shared/constants';
import type { UserPreferences } from '@domain/models/UserPreferences';
import { DEFAULT_PREFERENCES } from '@domain/models/UserPreferences';

const VAULT_SENTINEL = 'journly-vault-check';

function loadPreferences(): UserPreferences {
  try {
    const raw = localStorage.getItem(PREFERENCES_STORAGE_KEY);
    if (raw) return JSON.parse(raw) as UserPreferences;
  } catch {
    // Corrupted preferences — fall back to defaults
  }
  return DEFAULT_PREFERENCES;
}

function savePreferences(prefs: UserPreferences): void {
  localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(prefs));
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

function hasExistingVault(): boolean {
  const prefs = loadPreferences();
  return Boolean(prefs.encryption.saltBase64);
}

export function useEncryption() {
  const isUnlocked = useSettingsStore((s) => s.isVaultUnlocked);

  // Determine first launch by checking if a vault has been set up
  const isFirstLaunch = !hasExistingVault();

  const setupVault = async (passphrase: string): Promise<boolean> => {
    try {
      const salt = cryptoService.generateSalt();
      const key = await cryptoService.deriveKey(passphrase, salt, PBKDF2_ITERATIONS);

      // Encrypt a sentinel value for future passphrase verification
      const testEncrypt = await cryptoService.encrypt({ verify: VAULT_SENTINEL }, key);

      const prefs = loadPreferences();
      const updatedPrefs: UserPreferences = {
        ...prefs,
        encryption: {
          ...prefs.encryption,
          enabled: true,
          iterations: PBKDF2_ITERATIONS,
          saltBase64: uint8ArrayToBase64(salt),
          testCiphertextBase64: testEncrypt.ciphertextBase64,
          testIvBase64: testEncrypt.ivBase64,
        },
      };

      savePreferences(updatedPrefs);

      const store = useSettingsStore.getState();
      store.setPreferences(updatedPrefs);
      store.unlockVault(key);
      store.setFirstLaunch(false);

      return true;
    } catch {
      return false;
    }
  };

  const unlockVault = async (passphrase: string): Promise<boolean> => {
    try {
      const prefs = loadPreferences();
      const { saltBase64, testCiphertextBase64, testIvBase64, iterations } = prefs.encryption;

      if (!saltBase64 || !testCiphertextBase64 || !testIvBase64) {
        return false;
      }

      const salt = base64ToUint8Array(saltBase64);
      const isValid = await cryptoService.verifyPassphrase(
        passphrase,
        salt,
        iterations,
        testCiphertextBase64,
        testIvBase64,
      );

      if (!isValid) return false;

      const key = await cryptoService.deriveKey(passphrase, salt, iterations);

      // Decrypt the AI API key from the vault, or migrate a legacy plaintext key.
      let aiConfig = prefs.ai;
      if (prefs.ai.remoteApiKeyCiphertext && prefs.ai.remoteApiKeyIv) {
        try {
          const apiKey = await cryptoService.decrypt<string>(
            prefs.ai.remoteApiKeyCiphertext,
            prefs.ai.remoteApiKeyIv,
            key,
          );
          aiConfig = { ...prefs.ai, remoteApiKey: apiKey };
        } catch {
          // Decryption failed — treat as unconfigured
          aiConfig = { ...prefs.ai, remoteApiKey: undefined };
        }
      } else if (prefs.ai.remoteApiKey) {
        // Migration: plaintext key found — encrypt it and save back
        try {
          const encrypted = await cryptoService.encrypt(prefs.ai.remoteApiKey, key);
          savePreferences({
            ...prefs,
            ai: {
              ...prefs.ai,
              remoteApiKey: undefined,
              remoteApiKeyCiphertext: encrypted.ciphertextBase64,
              remoteApiKeyIv: encrypted.ivBase64,
            },
          });
        } catch {
          // Migration failed silently — plaintext key used for this session only
        }
      }

      const store = useSettingsStore.getState();
      store.setPreferences({ ...prefs, ai: aiConfig });
      store.unlockVault(key);
      store.setFirstLaunch(false);

      return true;
    } catch {
      return false;
    }
  };

  const lockVault = (): void => {
    useSettingsStore.getState().lockVault();
    useEntryStore.getState().reset();
  };

  return {
    isUnlocked,
    isFirstLaunch,
    unlockVault,
    lockVault,
    setupVault,
  };
}
