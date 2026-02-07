/**
 * Zustand store for journal entry state.
 *
 * Manages the in-memory list of decrypted entries and CRUD operations.
 * Actual persistence is delegated to {@link IEntryRepository}.
 */

import { create } from 'zustand';
import type { JournalEntry, EntryId } from '@domain/models/JournalEntry';
import type { LoadingState } from '@shared/types/common';

interface EntryState {
  /** Decrypted entries currently loaded in memory. */
  entries: JournalEntry[];
  /** The entry currently being viewed or edited. */
  activeEntry: JournalEntry | null;
  /** Loading state for list operations. */
  listState: LoadingState;
  /** Loading state for single-entry operations. */
  entryState: LoadingState;
  /** Error message if any operation failed. */
  error: string | null;
}

interface EntryActions {
  setEntries: (entries: JournalEntry[]) => void;
  addEntry: (entry: JournalEntry) => void;
  updateEntry: (entry: JournalEntry) => void;
  removeEntry: (id: EntryId) => void;
  setActiveEntry: (entry: JournalEntry | null) => void;
  setListState: (state: LoadingState) => void;
  setEntryState: (state: LoadingState) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState: EntryState = {
  entries: [],
  activeEntry: null,
  listState: 'idle',
  entryState: 'idle',
  error: null,
};

export const useEntryStore = create<EntryState & EntryActions>()((set) => ({
  ...initialState,

  setEntries: (entries) => set({ entries, listState: 'success', error: null }),

  addEntry: (entry) =>
    set((state) => ({
      entries: [entry, ...state.entries],
      entryState: 'success',
      error: null,
    })),

  updateEntry: (entry) =>
    set((state) => ({
      entries: state.entries.map((e) => (e.id === entry.id ? entry : e)),
      activeEntry: state.activeEntry?.id === entry.id ? entry : state.activeEntry,
      entryState: 'success',
      error: null,
    })),

  removeEntry: (id) =>
    set((state) => ({
      entries: state.entries.filter((e) => e.id !== id),
      activeEntry: state.activeEntry?.id === id ? null : state.activeEntry,
    })),

  setActiveEntry: (entry) => set({ activeEntry: entry }),
  setListState: (listState) => set({ listState }),
  setEntryState: (entryState) => set({ entryState }),
  setError: (error) => set({ error }),
  reset: () => set(initialState),
}));
