/**
 * Hook: useEntry
 *
 * Provides entry CRUD operations to UI components.
 * Bridges Zustand store with the EntryService (to be implemented in Phase 3).
 *
 * Phase 1 — stores entries in Zustand (in-memory).
 * Phase 3 — will be wired to EntryService for encrypted persistence.
 */

import { useEntryStore } from '@application/store/useEntryStore';
import { createJournalEntry } from '@domain/models/JournalEntry';
import type { Mood, EntryId } from '@domain/models/JournalEntry';
import { generateId } from '@shared/utils/idGenerator';

export function useEntry() {
  const entries = useEntryStore((s) => s.entries);
  const addEntry = useEntryStore((s) => s.addEntry);
  const removeEntry = useEntryStore((s) => s.removeEntry);
  const entryState = useEntryStore((s) => s.entryState);
  const error = useEntryStore((s) => s.error);

  const createEntry = async (title: string, content: string, mood?: Mood) => {
    const entry = createJournalEntry({
      id: generateId(),
      title,
      content,
      mood,
    });
    addEntry(entry);
  };

  const deleteEntry = async (id: EntryId) => {
    removeEntry(id);
  };

  return {
    entries,
    isLoading: entryState === 'loading',
    error,
    createEntry,
    deleteEntry,
  };
}
