/**
 * Crypto service interface.
 *
 * Abstracts AES-256-GCM encryption/decryption and PBKDF2 key derivation.
 * The implementation MUST use the WebCrypto API — no third-party crypto libs.
 */

export interface ICryptoService {
  /**
   * Derive an AES-256-GCM CryptoKey from a user passphrase.
   *
   * @param passphrase - User-provided passphrase (UTF-8 string)
   * @param salt - Random 16-byte salt (stored in IDB, not secret)
   * @param iterations - PBKDF2 iteration count (recommended: 600,000+)
   * @returns A non-extractable CryptoKey for AES-256-GCM
   */
  deriveKey(passphrase: string, salt: Uint8Array, iterations: number): Promise<CryptoKey>;

  /**
   * Encrypt a plaintext object to base64 ciphertext + IV.
   *
   * @param data - Arbitrary serializable object
   * @param key - AES-256-GCM CryptoKey from {@link deriveKey}
   * @returns Base64-encoded ciphertext and IV
   */
  encrypt<T>(data: T, key: CryptoKey): Promise<EncryptResult>;

  /**
   * Decrypt base64 ciphertext + IV back to a plaintext object.
   *
   * @param ciphertextBase64 - Base64-encoded AES-256-GCM ciphertext
   * @param ivBase64 - Base64-encoded 12-byte IV
   * @param key - AES-256-GCM CryptoKey
   * @returns The original plaintext object
   * @throws {DecryptionError} if the key is wrong or data is corrupt
   */
  decrypt<T>(ciphertextBase64: string, ivBase64: string, key: CryptoKey): Promise<T>;

  /**
   * Generate a cryptographically random 16-byte salt.
   */
  generateSalt(): Uint8Array;

  /**
   * Verify that a passphrase can decrypt a known test envelope.
   * Used during the "unlock vault" flow.
   */
  verifyPassphrase(
    passphrase: string,
    salt: Uint8Array,
    iterations: number,
    testCiphertextBase64: string,
    testIvBase64: string,
  ): Promise<boolean>;
}

export interface EncryptResult {
  ciphertextBase64: string;
  ivBase64: string;
}
