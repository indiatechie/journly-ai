/**
 * Journal page — lists all journal entries.
 *
 * This is the main landing page of the app.
 */

import { Link } from 'react-router-dom';
import { useEntry } from '@presentation/hooks/useEntry';

const MOOD_EMOJI: Record<string, string> = {
  great: '😊',
  good: '🙂',
  neutral: '😐',
  bad: '😟',
  awful: '😢',
};

export function JournalPage() {
  const { entries, deleteEntry } = useEntry();

  // Only show non-deleted entries, sorted newest first
  const visibleEntries = entries
    .filter((e) => !e.isDeleted)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="p-4 max-w-2xl mx-auto">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">My Journal</h2>
        <Link
          to="/entry/new"
          className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors"
        >
          <span>+</span>
          <span>New Entry</span>
        </Link>
      </div>

      {visibleEntries.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="text-5xl mb-4">📝</span>
          <h3 className="text-lg font-semibold text-slate-300 mb-2">No entries yet</h3>
          <p className="text-slate-400 text-sm max-w-xs">
            Start your journaling journey by creating your first entry.
            Everything stays private and encrypted on your device.
          </p>
        </div>
      ) : (
        /* Entry list */
        <div className="flex flex-col gap-3">
          {visibleEntries.map((entry) => (
            <div
              key={entry.id}
              className="bg-slate-900 border border-slate-800 rounded-lg p-4 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {entry.mood && (
                      <span className="text-lg">{MOOD_EMOJI[entry.mood]}</span>
                    )}
                    <h3 className="font-semibold text-slate-200 truncate">
                      {entry.title}
                    </h3>
                  </div>
                  <p className="text-sm text-slate-400 line-clamp-2 mb-2">
                    {entry.content}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span>
                      {new Date(entry.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                    <span>·</span>
                    <span>{entry.wordCount} words</span>
                  </div>
                </div>
                <button
                  onClick={() => deleteEntry(entry.id)}
                  className="text-slate-500 hover:text-danger text-sm transition-colors p-1"
                  title="Delete entry"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
