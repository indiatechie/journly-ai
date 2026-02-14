import type { ICryptoService, EncryptResult } from '@domain/interfaces/ICryptoService';
import { DecryptionError } from '@domain/errors';
import {
  SALT_BYTE_LENGTH,
  IV_BYTE_LENGTH,
  AES_KEY_LENGTH,
} from '@shared/constants';

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  // Process in chunks to avoid call stack overflow on large buffers
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export class CryptoService implements ICryptoService {
  async deriveKey(
    passphrase: string,
    salt: Uint8Array,
    iterations: number,
  ): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(passphrase),
      'PBKDF2',
      false,
      ['deriveKey'],
    );

    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
      keyMaterial,
      { name: 'AES-GCM', length: AES_KEY_LENGTH },
      false, // non-extractable
      ['encrypt', 'decrypt'],
    );
  }

  async encrypt<T>(data: T, key: CryptoKey): Promise<EncryptResult> {
    const encoder = new TextEncoder();
    const plaintext = encoder.encode(JSON.stringify(data));
    const iv = crypto.getRandomValues(new Uint8Array(IV_BYTE_LENGTH));

    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      plaintext,
    );

    return {
      ciphertextBase64: arrayBufferToBase64(ciphertext),
      ivBase64: arrayBufferToBase64(iv),
    };
  }

  async decrypt<T>(
    ciphertextBase64: string,
    ivBase64: string,
    key: CryptoKey,
  ): Promise<T> {
    try {
      const ciphertext = base64ToUint8Array(ciphertextBase64);
      const iv = base64ToUint8Array(ivBase64);

      const plaintext = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        ciphertext,
      );

      const decoder = new TextDecoder();
      return JSON.parse(decoder.decode(plaintext)) as T;
    } catch (error) {
      if (error instanceof DecryptionError) throw error;
      throw new DecryptionError();
    }
  }

  generateSalt(): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(SALT_BYTE_LENGTH));
  }

  async verifyPassphrase(
    passphrase: string,
    salt: Uint8Array,
    iterations: number,
    testCiphertextBase64: string,
    testIvBase64: string,
  ): Promise<boolean> {
    try {
      const key = await this.deriveKey(passphrase, salt, iterations);
      await this.decrypt(testCiphertextBase64, testIvBase64, key);
      return true;
    } catch (error) {
      if (error instanceof DecryptionError) return false;
      throw error;
    }
  }
}

export const cryptoService = new CryptoService();
