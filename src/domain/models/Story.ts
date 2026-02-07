/**
 * Story domain model.
 *
 * Represents an AI-generated narrative derived from one or more journal entries.
 */

import type { EntryId } from './JournalEntry';

export type StoryId = string; // UUIDv4

export type AIProvider = 'local' | 'remote';

export interface Story {
  readonly id: StoryId;
  readonly createdAt: string; // ISO 8601
  title: string;
  content: string; // AI-generated narrative
  sourceEntryIds: EntryId[]; // Entries used to generate this story
  prompt: string; // The prompt that was used
  provider: AIProvider;
}

/** Factory: create a new Story */
export function createStory(
  params: Pick<Story, 'id' | 'title' | 'content' | 'sourceEntryIds' | 'prompt' | 'provider'>,
): Story {
  return {
    id: params.id,
    createdAt: new Date().toISOString(),
    title: params.title,
    content: params.content,
    sourceEntryIds: params.sourceEntryIds,
    prompt: params.prompt,
    provider: params.provider,
  };
}
