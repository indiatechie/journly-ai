/**
 * User preferences domain model.
 *
 * Stored locally. Encryption config salt is stored in plaintext
 * (it is not secret), but the derived key is never persisted.
 */

export type Theme = 'light' | 'dark' | 'system';
export type FontSize = 'small' | 'medium' | 'large';

export interface UserPreferences {
  theme: Theme;
  fontSize: FontSize;
  encryption: EncryptionConfig;
  ai: AIConfig;
}

export interface EncryptionConfig {
  enabled: boolean;
  keyDerivation: 'PBKDF2'; // Fixed for MVP
  iterations: number; // Default: 600_000
  saltBase64?: string; // Stored in IDB, NOT the key
  testCiphertextBase64?: string; // Encrypted sentinel for passphrase verification
  testIvBase64?: string; // IV for the sentinel
}

export type AIProviderType = 'none' | 'local' | 'remote';

export interface AIConfig {
  provider: AIProviderType;
  remoteEndpoint?: string; // User-provided URL
  remoteApiKey?: string; // Stored encrypted in IDB
  remoteModel?: string;
  localModelId?: string; // e.g. 'Llama-3.2-1B-Instruct-q4f16_1-MLC'
}

/** Default preferences for a fresh installation */
export const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'system',
  fontSize: 'medium',
  encryption: {
    enabled: true,
    keyDerivation: 'PBKDF2',
    iterations: 600_000,
  },
  ai: {
    provider: 'none',
  },
};
