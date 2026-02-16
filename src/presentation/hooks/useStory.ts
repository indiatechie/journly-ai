import { useCallback } from 'react';
import { useStoryStore } from '@application/store/useStoryStore';
import { useSettingsStore } from '@application/store/useSettingsStore';
import { createStory } from '@domain/models/Story';
import type { StoryId, AIProvider } from '@domain/models/Story';
import type { EntryId } from '@domain/models/JournalEntry';
import { generateId } from '@shared/utils/idGenerator';
import { StoryRepository } from '@infrastructure/storage/StoryRepository';
import { cryptoService } from '@infrastructure/crypto';
import { storageAdapter } from '@infrastructure/storage';

function getRepository(): StoryRepository {
  return new StoryRepository(
    storageAdapter,
    cryptoService,
    () => useSettingsStore.getState().cryptoKey,
  );
}

export function useStory() {
  const stories = useStoryStore((s) => s.stories);
  const listState = useStoryStore((s) => s.listState);
  const error = useStoryStore((s) => s.error);

  const loadStories = useCallback(async () => {
    const store = useStoryStore.getState();
    store.setListState('loading');
    try {
      const repo = getRepository();
      const all = await repo.findAll();
      store.setStories(all);
    } catch (e) {
      store.setError(e instanceof Error ? e.message : 'Failed to load stories');
      store.setListState('error');
    }
  }, []);

  const getStoryById = useCallback(async (id: StoryId) => {
    const repo = getRepository();
    return repo.findById(id);
  }, []);

  const saveStory = useCallback(
    async (params: {
      title: string;
      content: string;
      sourceEntryIds: EntryId[];
      prompt: string;
      provider: AIProvider;
    }) => {
      const store = useStoryStore.getState();
      try {
        const story = createStory({
          id: generateId(),
          ...params,
        });
        const repo = getRepository();
        await repo.save(story);
        store.addStory(story);
        return story;
      } catch (e) {
        store.setError(e instanceof Error ? e.message : 'Failed to save story');
        throw e;
      }
    },
    [],
  );

  const deleteStory = useCallback(async (id: StoryId) => {
    const store = useStoryStore.getState();
    try {
      const repo = getRepository();
      await repo.delete(id);
      store.removeStory(id);
    } catch (e) {
      store.setError(e instanceof Error ? e.message : 'Failed to delete story');
    }
  }, []);

  return {
    stories,
    isLoading: listState === 'loading',
    error,
    loadStories,
    getStoryById,
    saveStory,
    deleteStory,
  };
}
