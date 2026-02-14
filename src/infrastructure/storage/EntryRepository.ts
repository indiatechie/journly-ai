import type { IEntryRepository } from '@domain/interfaces/IEntryRepository';
import type { IStorageAdapter } from '@domain/interfaces/IStorageAdapter';
import type { ICryptoService } from '@domain/interfaces/ICryptoService';
import type { PaginationOptions } from '@domain/interfaces/IStorageAdapter';
import type { JournalEntry, EntryId } from '@domain/models/JournalEntry';
import type { TagId } from '@domain/models/Tag';
import type { EncryptedEnvelope } from '@domain/models/EncryptedEnvelope';
import { VaultLockedError, EntryNotFoundError } from '@domain/errors';
import { nowISO } from '@shared/utils/dateUtils';

export class EntryRepository implements IEntryRepository {
  constructor(
    private storage: IStorageAdapter,
    private crypto: ICryptoService,
    private getKey: () => CryptoKey | null,
  ) {}

  private requireKey(): CryptoKey {
    const key = this.getKey();
    if (!key) throw new VaultLockedError();
    return key;
  }

  private async entryToEnvelope(
    entry: JournalEntry,
    key: CryptoKey,
  ): Promise<EncryptedEnvelope> {
    const { ciphertextBase64, ivBase64 } = await this.crypto.encrypt(entry, key);
    return {
      id: entry.id,
      type: 'entry',
      ciphertextBase64,
      ivBase64,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    };
  }

  private async envelopeToEntry(
    envelope: EncryptedEnvelope,
    key: CryptoKey,
  ): Promise<JournalEntry> {
    return this.crypto.decrypt<JournalEntry>(
      envelope.ciphertextBase64,
      envelope.ivBase64,
      key,
    );
  }

  async save(entry: JournalEntry): Promise<void> {
    const key = this.requireKey();
    const envelope = await this.entryToEnvelope(entry, key);
    await this.storage.put(envelope);
  }

  async findById(id: EntryId): Promise<JournalEntry | undefined> {
    const key = this.requireKey();
    const envelope = await this.storage.get(id);
    if (!envelope) return undefined;
    return this.envelopeToEntry(envelope, key);
  }

  async findAll(options?: PaginationOptions): Promise<JournalEntry[]> {
    const key = this.requireKey();
    const envelopes = await this.storage.listByType('entry', options);
    const entries = await Promise.all(
      envelopes.map((e) => this.envelopeToEntry(e, key)),
    );
    return entries.filter((e) => !e.isDeleted);
  }

  async findByDateRange(start: string, end: string): Promise<JournalEntry[]> {
    const key = this.requireKey();
    // Pre-filter envelopes by plaintext createdAt before decrypting
    const envelopes = await this.storage.listByType('entry', { limit: Number.MAX_SAFE_INTEGER });
    const filtered = envelopes.filter(
      (e) => e.createdAt >= start && e.createdAt <= end,
    );
    const entries = await Promise.all(
      filtered.map((e) => this.envelopeToEntry(e, key)),
    );
    return entries.filter((e) => !e.isDeleted);
  }

  async findByTag(tagId: TagId): Promise<JournalEntry[]> {
    const key = this.requireKey();
    const envelopes = await this.storage.listByType('entry', { limit: Number.MAX_SAFE_INTEGER });
    const entries = await Promise.all(
      envelopes.map((e) => this.envelopeToEntry(e, key)),
    );
    return entries.filter((e) => !e.isDeleted && e.tags.includes(tagId));
  }

  async softDelete(id: EntryId): Promise<void> {
    const entry = await this.findById(id);
    if (!entry) throw new EntryNotFoundError(id);
    entry.isDeleted = true;
    entry.updatedAt = nowISO();
    await this.save(entry);
  }

  async hardDelete(id: EntryId): Promise<void> {
    await this.storage.delete(id);
  }
}
