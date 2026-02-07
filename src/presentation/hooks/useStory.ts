/**
 * Hook: useStory
 *
 * Provides story generation and listing to UI components.
 * Bridges Zustand store with the StoryService (to be implemented in Phase 4).
 *
 * Placeholder for Phase 1.
 */

export function useStory() {
  // TODO: Phase 4 — wire to StoryService + useAIStore
  return {
    stories: [],
    isGenerating: false,
    error: null,
    generateStory: async (_entryIds: string[], _promptHint?: string) => {
      console.warn('[useStory] generateStory not implemented yet');
    },
  };
}
