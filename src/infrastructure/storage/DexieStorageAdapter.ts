import Dexie from 'dexie';
import type { Table } from 'dexie';
import type { EncryptedEnvelope, EnvelopeType } from '@domain/models/EncryptedEnvelope';
import type { IStorageAdapter, PaginationOptions } from '@domain/interfaces/IStorageAdapter';
import { IDB_DATABASE_NAME, IDB_VERSION, DEFAULT_PAGE_SIZE } from '@shared/constants';

class JournlyDatabase extends Dexie {
  envelopes!: Table<EncryptedEnvelope, string>;

  constructor() {
    super(IDB_DATABASE_NAME);
    this.version(IDB_VERSION).stores({
      envelopes: 'id, type, createdAt, updatedAt, [type+updatedAt]',
    });
  }
}

export class DexieStorageAdapter implements IStorageAdapter {
  private db: JournlyDatabase;

  constructor() {
    this.db = new JournlyDatabase();
  }

  async put(envelope: EncryptedEnvelope): Promise<void> {
    await this.db.envelopes.put(envelope);
  }

  async get(id: string): Promise<EncryptedEnvelope | undefined> {
    return this.db.envelopes.get(id);
  }

  async listByType(
    type: EnvelopeType,
    options?: PaginationOptions,
  ): Promise<EncryptedEnvelope[]> {
    const offset = options?.offset ?? 0;
    const limit = options?.limit ?? DEFAULT_PAGE_SIZE;

    return this.db.envelopes
      .where('[type+updatedAt]')
      .between([type, Dexie.minKey], [type, Dexie.maxKey])
      .reverse()
      .offset(offset)
      .limit(limit)
      .toArray();
  }

  async delete(id: string): Promise<void> {
    await this.db.envelopes.delete(id);
  }

  async count(type: EnvelopeType): Promise<number> {
    return this.db.envelopes.where('type').equals(type).count();
  }

  async exportAll(): Promise<EncryptedEnvelope[]> {
    return this.db.envelopes.toArray();
  }

  async importAll(envelopes: EncryptedEnvelope[]): Promise<void> {
    await this.db.transaction('rw', this.db.envelopes, async () => {
      await this.db.envelopes.bulkPut(envelopes);
    });
  }

  async clear(): Promise<void> {
    await this.db.envelopes.clear();
  }
}

export const storageAdapter = new DexieStorageAdapter();
