import { create } from 'zustand';
import type { Story, StoryId } from '@domain/models/Story';
import type { LoadingState } from '@shared/types/common';

interface StoryState {
  stories: Story[];
  listState: LoadingState;
  error: string | null;
}

interface StoryActions {
  setStories: (stories: Story[]) => void;
  addStory: (story: Story) => void;
  removeStory: (id: StoryId) => void;
  setListState: (state: LoadingState) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState: StoryState = {
  stories: [],
  listState: 'idle',
  error: null,
};

export const useStoryStore = create<StoryState & StoryActions>()((set) => ({
  ...initialState,

  setStories: (stories) => set({ stories, listState: 'success', error: null }),

  addStory: (story) =>
    set((state) => ({
      stories: [story, ...state.stories],
      listState: 'success',
      error: null,
    })),

  removeStory: (id) =>
    set((state) => ({
      stories: state.stories.filter((s) => s.id !== id),
    })),

  setListState: (listState) => set({ listState }),
  setError: (error) => set({ error }),
  reset: () => set(initialState),
}));
