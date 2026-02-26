import { describe, it, expect } from 'vitest';
import { CryptoService } from './CryptoService';
import { DecryptionError } from '@domain/errors';
import { PBKDF2_ITERATIONS, SALT_BYTE_LENGTH } from '@shared/constants';

describe('CryptoService', () => {
  const service = new CryptoService();

  describe('generateSalt()', () => {
    it('returns a Uint8Array of exactly 16 bytes', () => {
      const salt = service.generateSalt();
      expect(salt).toBeInstanceOf(Uint8Array);
      expect(salt.byteLength).toBe(SALT_BYTE_LENGTH);
    });

    it('returns a different value each call', () => {
      const a = service.generateSalt();
      const b = service.generateSalt();
      expect(Buffer.from(a).toString('hex')).not.toBe(Buffer.from(b).toString('hex'));
    });
  });

  describe('encrypt() + decrypt() round-trip', () => {
    it('recovers the original object', async () => {
      const salt = service.generateSalt();
      const key = await service.deriveKey('test-passphrase', salt, PBKDF2_ITERATIONS);
      const payload = { hello: 'world', count: 42 };

      const { ciphertextBase64, ivBase64 } = await service.encrypt(payload, key);
      const recovered = await service.decrypt<typeof payload>(ciphertextBase64, ivBase64, key);

      expect(recovered).toEqual(payload);
    });

    it('ciphertext is different from the plaintext JSON', async () => {
      const salt = service.generateSalt();
      const key = await service.deriveKey('passphrase', salt, PBKDF2_ITERATIONS);
      const payload = { secret: 'data' };

      const { ciphertextBase64 } = await service.encrypt(payload, key);
      expect(ciphertextBase64).not.toContain('secret');
    });
  });

  describe('decrypt() with wrong key', () => {
    it('throws DecryptionError', async () => {
      const salt = service.generateSalt();
      const goodKey = await service.deriveKey('correct-passphrase', salt, PBKDF2_ITERATIONS);
      const badKey = await service.deriveKey('wrong-passphrase', salt, PBKDF2_ITERATIONS);

      const { ciphertextBase64, ivBase64 } = await service.encrypt({ data: 'secret' }, goodKey);

      await expect(
        service.decrypt(ciphertextBase64, ivBase64, badKey),
      ).rejects.toBeInstanceOf(DecryptionError);
    });
  });

  describe('verifyPassphrase()', () => {
    it('returns true with the correct passphrase', async () => {
      const salt = service.generateSalt();
      const key = await service.deriveKey('my-passphrase', salt, PBKDF2_ITERATIONS);
      const { ciphertextBase64, ivBase64 } = await service.encrypt({ verify: true }, key);

      const result = await service.verifyPassphrase(
        'my-passphrase',
        salt,
        PBKDF2_ITERATIONS,
        ciphertextBase64,
        ivBase64,
      );
      expect(result).toBe(true);
    });

    it('returns false with the wrong passphrase', async () => {
      const salt = service.generateSalt();
      const key = await service.deriveKey('correct-pass', salt, PBKDF2_ITERATIONS);
      const { ciphertextBase64, ivBase64 } = await service.encrypt({ verify: true }, key);

      const result = await service.verifyPassphrase(
        'wrong-pass',
        salt,
        PBKDF2_ITERATIONS,
        ciphertextBase64,
        ivBase64,
      );
      expect(result).toBe(false);
    });
  });
});
