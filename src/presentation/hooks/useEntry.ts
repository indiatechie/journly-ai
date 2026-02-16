/**
 * Hook: useEntry
 *
 * Provides entry CRUD operations to UI components.
 * Entries are encrypted and persisted to IndexedDB via EntryRepository.
 * Falls back to in-memory only if vault is locked.
 */

import { useCallback } from 'react';
import { useEntryStore } from '@application/store/useEntryStore';
import { useSettingsStore } from '@application/store/useSettingsStore';
import { createJournalEntry, countWords } from '@domain/models/JournalEntry';
import type { Mood, EntryId, JournalEntry } from '@domain/models/JournalEntry';
import { generateId } from '@shared/utils/idGenerator';
import { EntryRepository } from '@infrastructure/storage/EntryRepository';
import { cryptoService } from '@infrastructure/crypto';
import { storageAdapter } from '@infrastructure/storage';

function getRepository(): EntryRepository {
  return new EntryRepository(
    storageAdapter,
    cryptoService,
    () => useSettingsStore.getState().cryptoKey,
  );
}

export function useEntry() {
  const entries = useEntryStore((s) => s.entries);
  const entryState = useEntryStore((s) => s.entryState);
  const error = useEntryStore((s) => s.error);

  const loadEntries = useCallback(async () => {
    const store = useEntryStore.getState();
    store.setListState('loading');
    try {
      const repo = getRepository();
      const all = await repo.findAll();
      store.setEntries(all);
    } catch (e) {
      store.setError(e instanceof Error ? e.message : 'Failed to load entries');
      store.setListState('error');
    }
  }, []);

  const getEntryById = useCallback(async (id: EntryId): Promise<JournalEntry | undefined> => {
    const repo = getRepository();
    return repo.findById(id);
  }, []);

  const createEntry = useCallback(async (title: string, content: string, mood?: Mood, tags?: string[]): Promise<EntryId> => {
    const store = useEntryStore.getState();
    store.setEntryState('loading');
    const entry = createJournalEntry({
      id: generateId(),
      title,
      content,
      mood,
      tags,
    });
    try {
      const repo = getRepository();
      await repo.save(entry);
      store.addEntry(entry);
    } catch (e) {
      store.setError(e instanceof Error ? e.message : 'Failed to create entry');
      store.setEntryState('error');
    }
    return entry.id;
  }, []);

  const updateEntry = useCallback(async (id: EntryId, updates: { title?: string; content?: string; mood?: Mood; tags?: string[] }) => {
    const store = useEntryStore.getState();
    store.setEntryState('loading');
    try {
      const repo = getRepository();
      const existing = await repo.findById(id);
      if (!existing) throw new Error('Entry not found');

      if (updates.title !== undefined) existing.title = updates.title;
      if (updates.content !== undefined) {
        existing.content = updates.content;
        existing.wordCount = countWords(updates.content);
      }
      if (updates.mood !== undefined) existing.mood = updates.mood;
      if (updates.tags !== undefined) existing.tags = updates.tags;
      existing.updatedAt = new Date().toISOString();

      await repo.save(existing);
      store.updateEntry(existing);
    } catch (e) {
      store.setError(e instanceof Error ? e.message : 'Failed to update entry');
      store.setEntryState('error');
    }
  }, []);

  const deleteEntry = useCallback(async (id: EntryId) => {
    const store = useEntryStore.getState();
    store.setEntryState('loading');
    try {
      const repo = getRepository();
      await repo.softDelete(id);
      store.removeEntry(id);
    } catch (e) {
      store.setError(e instanceof Error ? e.message : 'Failed to delete entry');
      store.setEntryState('error');
    }
  }, []);

  return {
    entries,
    isLoading: entryState === 'loading',
    error,
    loadEntries,
    getEntryById,
    createEntry,
    updateEntry,
    deleteEntry,
  };
}
