/**
 * Encrypted envelope — the storage-level wrapper for all sensitive data.
 *
 * All {@link JournalEntry} and {@link Story} records are serialized to JSON,
 * encrypted with AES-256-GCM, and stored inside this envelope.
 *
 * Only `id`, `type`, `createdAt`, and `updatedAt` remain in plaintext
 * to enable indexing and sorting without decryption.
 */

export type EnvelopeType = 'entry' | 'story';

export interface EncryptedEnvelope<T extends EnvelopeType = EnvelopeType> {
  /** Plaintext ID for indexing (matches the inner model's ID) */
  id: string;
  /** Discriminator: 'entry' | 'story' */
  type: T;
  /** AES-256-GCM encrypted JSON, base64-encoded */
  ciphertextBase64: string;
  /** 12-byte initialization vector, base64-encoded (unique per record) */
  ivBase64: string;
  /** Plaintext timestamp for sorting */
  createdAt: string;
  /** Plaintext timestamp for sorting */
  updatedAt: string;
}
