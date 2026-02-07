/**
 * Entry repository interface.
 *
 * Domain-level query interface for journal entries.
 * Implementations handle encryption/decryption transparently —
 * callers work with plaintext {@link JournalEntry} objects.
 */

import type { JournalEntry, EntryId } from '../models/JournalEntry';
import type { TagId } from '../models/Tag';
import type { PaginationOptions } from './IStorageAdapter';

export interface IEntryRepository {
  /** Encrypt and persist a journal entry. */
  save(entry: JournalEntry): Promise<void>;

  /** Retrieve and decrypt a single entry by ID. Returns undefined if not found. */
  findById(id: EntryId): Promise<JournalEntry | undefined>;

  /** Retrieve and decrypt all non-deleted entries, newest first. */
  findAll(options?: PaginationOptions): Promise<JournalEntry[]>;

  /** Retrieve entries within a date range (inclusive, ISO 8601 strings). */
  findByDateRange(start: string, end: string): Promise<JournalEntry[]>;

  /** Retrieve entries that contain a specific tag. */
  findByTag(tagId: TagId): Promise<JournalEntry[]>;

  /** Soft-delete an entry (sets isDeleted = true). */
  softDelete(id: EntryId): Promise<void>;

  /** Permanently delete an entry from storage. */
  hardDelete(id: EntryId): Promise<void>;
}
