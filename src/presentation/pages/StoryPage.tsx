/**
 * Story page — view AI-generated stories from journal entries.
 *
 * Placeholder implementation for Phase 1.
 */

export function StoryPage() {
  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Stories</h2>

      {/* Empty state */}
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <span className="text-5xl mb-4">✨</span>
        <h3 className="text-lg font-semibold text-slate-300 mb-2">No stories yet</h3>
        <p className="text-slate-400 text-sm max-w-xs">
          Once you have journal entries, you can generate stories
          using AI — either locally on your device or via your own API key.
        </p>
      </div>
    </div>
  );
}
