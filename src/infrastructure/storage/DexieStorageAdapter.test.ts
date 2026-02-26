import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { DexieStorageAdapter } from './DexieStorageAdapter';
import type { EncryptedEnvelope } from '@domain/models/EncryptedEnvelope';

function makeEnvelope(
  id: string,
  type: 'entry' | 'story' = 'entry',
  updatedAt?: string,
): EncryptedEnvelope {
  return {
    id,
    type,
    ciphertextBase64: btoa(`ciphertext-${id}`),
    ivBase64: btoa(`iv-${id}`),
    createdAt: updatedAt ?? new Date().toISOString(),
    updatedAt: updatedAt ?? new Date().toISOString(),
  };
}

describe('DexieStorageAdapter', () => {
  let adapter: DexieStorageAdapter;

  beforeEach(async () => {
    adapter = new DexieStorageAdapter();
    // fake-indexeddb reuses the same named DB across instances, so wipe before each test
    await adapter.clear();
  });

  describe('put() + get() round-trip', () => {
    it('returns the exact envelope that was stored', async () => {
      const env = makeEnvelope('test-id-1');
      await adapter.put(env);
      const retrieved = await adapter.get('test-id-1');
      expect(retrieved).toEqual(env);
    });
  });

  describe('get() on unknown ID', () => {
    it('returns undefined', async () => {
      const result = await adapter.get('nonexistent-id');
      expect(result).toBeUndefined();
    });
  });

  describe('delete()', () => {
    it('removes the envelope so get() returns undefined', async () => {
      const env = makeEnvelope('to-delete');
      await adapter.put(env);
      await adapter.delete('to-delete');
      const result = await adapter.get('to-delete');
      expect(result).toBeUndefined();
    });
  });

  describe('listByType()', () => {
    it('returns only matching type, newest first', async () => {
      const entry1 = makeEnvelope('e1', 'entry', '2024-01-01T00:00:00.000Z');
      const entry2 = makeEnvelope('e2', 'entry', '2024-03-01T00:00:00.000Z');
      const story1 = makeEnvelope('s1', 'story', '2024-02-01T00:00:00.000Z');

      await adapter.put(entry1);
      await adapter.put(entry2);
      await adapter.put(story1);

      const entries = await adapter.listByType('entry');
      expect(entries).toHaveLength(2);
      expect(entries.map((e) => e.id)).toEqual(['e2', 'e1'] as string[]);

      const stories = await adapter.listByType('story');
      expect(stories).toHaveLength(1);
      expect(stories[0]!.id).toBe('s1');
    });
  });

  describe('count()', () => {
    it('returns the correct count per type', async () => {
      await adapter.put(makeEnvelope('c1', 'entry'));
      await adapter.put(makeEnvelope('c2', 'entry'));
      await adapter.put(makeEnvelope('c3', 'story'));

      expect(await adapter.count('entry')).toBe(2);
      expect(await adapter.count('story')).toBe(1);
    });
  });

  describe('clear()', () => {
    it('removes all records', async () => {
      await adapter.put(makeEnvelope('cl1', 'entry'));
      await adapter.put(makeEnvelope('cl2', 'story'));

      await adapter.clear();

      expect(await adapter.count('entry')).toBe(0);
      expect(await adapter.count('story')).toBe(0);
    });
  });
});
