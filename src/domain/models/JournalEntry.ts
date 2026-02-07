/**
 * Core journal entry domain model.
 *
 * Represents a single journal entry authored by the user.
 * All content is stored encrypted at rest via {@link EncryptedEnvelope}.
 */

export type EntryId = string; // UUIDv4

export const MOODS = ['great', 'good', 'neutral', 'bad', 'awful'] as const;
export type Mood = (typeof MOODS)[number];

export interface JournalEntry {
  readonly id: EntryId;
  readonly createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  title: string;
  content: string; // Markdown plaintext
  mood?: Mood;
  tags: string[]; // TagId[]
  wordCount: number;
  isDeleted: boolean; // Soft delete
}

/** Factory: create a new JournalEntry with sensible defaults */
export function createJournalEntry(
  params: Pick<JournalEntry, 'id' | 'title' | 'content'> &
    Partial<Pick<JournalEntry, 'mood' | 'tags'>>,
): JournalEntry {
  const now = new Date().toISOString();
  return {
    id: params.id,
    createdAt: now,
    updatedAt: now,
    title: params.title,
    content: params.content,
    mood: params.mood,
    tags: params.tags ?? [],
    wordCount: countWords(params.content),
    isDeleted: false,
  };
}

/** Count words in a string (handles multiple whitespace, newlines) */
export function countWords(text: string): number {
  const trimmed = text.trim();
  if (trimmed.length === 0) return 0;
  return trimmed.split(/\s+/).length;
}
