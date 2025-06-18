// src/lib/db/journal.ts
import { Dexie, type Table } from 'dexie'; // ✅ use this with v4+

export interface JournalEntry {
  id: string;
  text: string;
  date: string;
}

class JournlyDB extends Dexie {
  journal!: Table<JournalEntry, string>;

  constructor() {
    super('journly-db');
    this.version(1).stores({
      journal: 'id, date'
    });
  }
}

export const db = new JournlyDB();
