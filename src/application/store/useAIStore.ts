/**
 * Zustand store for AI state.
 *
 * Tracks model loading, generation progress, and results.
 */

import { create } from 'zustand';
import type { Story } from '@domain/models/Story';
import type { LoadingState } from '@shared/types/common';

interface AIState {
  /** Whether the AI model is loaded and ready. */
  isModelReady: boolean;
  /** Loading state for model initialization. */
  modelLoadState: LoadingState;
  /** Progress percentage for model loading (0-100). */
  modelLoadProgress: number;
  /** Loading state for story generation. */
  generateState: LoadingState;
  /** The most recently generated story. */
  lastGeneratedStory: Story | null;
  /** Error message if any AI operation failed. */
  error: string | null;
}

interface AIActions {
  setModelReady: (ready: boolean) => void;
  setModelLoadState: (state: LoadingState) => void;
  setModelLoadProgress: (progress: number) => void;
  setGenerateState: (state: LoadingState) => void;
  setLastGeneratedStory: (story: Story | null) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState: AIState = {
  isModelReady: false,
  modelLoadState: 'idle',
  modelLoadProgress: 0,
  generateState: 'idle',
  lastGeneratedStory: null,
  error: null,
};

export const useAIStore = create<AIState & AIActions>()((set) => ({
  ...initialState,

  setModelReady: (isModelReady) => set({ isModelReady }),
  setModelLoadState: (modelLoadState) => set({ modelLoadState }),
  setModelLoadProgress: (modelLoadProgress) => set({ modelLoadProgress }),
  setGenerateState: (generateState) => set({ generateState }),
  setLastGeneratedStory: (lastGeneratedStory) => set({ lastGeneratedStory }),
  setError: (error) => set({ error }),
  reset: () => set(initialState),
}));
