/**
 * Storage adapter interface.
 *
 * Abstracts all persistence operations on {@link EncryptedEnvelope} records.
 * The MVP implementation uses Dexie.js over IndexedDB.
 */

import type { EncryptedEnvelope, EnvelopeType } from '../models/EncryptedEnvelope';

export interface PaginationOptions {
  offset?: number;
  limit?: number;
}

export interface IStorageAdapter {
  /** Store or update an encrypted envelope. */
  put(envelope: EncryptedEnvelope): Promise<void>;

  /** Retrieve a single envelope by its plaintext ID. */
  get(id: string): Promise<EncryptedEnvelope | undefined>;

  /** List envelopes filtered by type, ordered by updatedAt descending. */
  listByType(type: EnvelopeType, options?: PaginationOptions): Promise<EncryptedEnvelope[]>;

  /** Permanently delete an envelope by ID. */
  delete(id: string): Promise<void>;

  /** Count envelopes of a given type. */
  count(type: EnvelopeType): Promise<number>;

  /** Export all envelopes (for backup). */
  exportAll(): Promise<EncryptedEnvelope[]>;

  /** Import envelopes (merge: upsert by ID). */
  importAll(envelopes: EncryptedEnvelope[]): Promise<void>;

  /** Delete all data (factory reset). */
  clear(): Promise<void>;
}
