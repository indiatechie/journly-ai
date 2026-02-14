/**
 * Journal page — lists all journal entries.
 *
 * This is the main landing page of the app.
 */

import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useEntry } from '@presentation/hooks/useEntry';
import { useSettingsStore } from '@application/store/useSettingsStore';
import type { Mood } from '@domain/models/JournalEntry';

const MOOD_EMOJI: Record<string, string> = {
  great: '😊',
  good: '🙂',
  neutral: '😐',
  bad: '😟',
  awful: '😢',
};

const MOOD_FILTERS: { emoji: string; value: Mood }[] = [
  { emoji: '😊', value: 'great' },
  { emoji: '🙂', value: 'good' },
  { emoji: '😐', value: 'neutral' },
  { emoji: '😟', value: 'bad' },
  { emoji: '😢', value: 'awful' },
];

export function JournalPage() {
  const { entries, deleteEntry, loadEntries } = useEntry();
  const isVaultUnlocked = useSettingsStore((s) => s.isVaultUnlocked);

  const [searchQuery, setSearchQuery] = useState('');
  const [moodFilter, setMoodFilter] = useState<Mood | null>(null);

  useEffect(() => {
    if (isVaultUnlocked) {
      void loadEntries();
    }
  }, [isVaultUnlocked, loadEntries]);

  // Filter and sort entries
  const visibleEntries = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return entries
      .filter((e) => !e.isDeleted)
      .filter((e) => {
        if (moodFilter && e.mood !== moodFilter) return false;
        if (query) {
          return (
            e.title.toLowerCase().includes(query) ||
            e.content.toLowerCase().includes(query)
          );
        }
        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [entries, searchQuery, moodFilter]);

  return (
    <div className="p-4 max-w-2xl mx-auto">
      {/* Page header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">My Journal</h2>
        <Link
          to="/entry/new"
          className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors"
        >
          <span>+</span>
          <span>New Entry</span>
        </Link>
      </div>

      {/* Search bar */}
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search entries..."
        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 outline-none focus:border-primary transition-colors mb-3"
      />

      {/* Mood filter pills */}
      <div className="flex gap-2 mb-4">
        {MOOD_FILTERS.map(({ emoji, value }) => (
          <button
            key={value}
            onClick={() => setMoodFilter(moodFilter === value ? null : value)}
            className={`text-lg p-1.5 rounded-lg transition-colors ${
              moodFilter === value
                ? 'bg-primary/20 ring-2 ring-primary'
                : 'hover:bg-slate-800'
            }`}
          >
            {emoji}
          </button>
        ))}
        {moodFilter && (
          <button
            onClick={() => setMoodFilter(null)}
            className="text-xs text-slate-400 hover:text-slate-200 ml-1 self-center transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {visibleEntries.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="text-5xl mb-4">📝</span>
          <h3 className="text-lg font-semibold text-slate-300 mb-2">
            {searchQuery || moodFilter ? 'No matching entries' : 'No entries yet'}
          </h3>
          <p className="text-slate-400 text-sm max-w-xs">
            {searchQuery || moodFilter
              ? 'Try adjusting your search or filters.'
              : 'Start your journaling journey by creating your first entry. Everything stays private and encrypted on your device.'}
          </p>
        </div>
      ) : (
        /* Entry list */
        <div className="flex flex-col gap-3">
          {visibleEntries.map((entry) => (
            <div
              key={entry.id}
              className="bg-slate-900 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors"
            >
              <Link
                to={`/entry/${entry.id}`}
                className="block p-4"
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
                    {/* Tag chips */}
                    {entry.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {entry.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 bg-primary/10 text-primary text-[11px] rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
              <div className="flex justify-end px-4 pb-3 -mt-1">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    deleteEntry(entry.id);
                  }}
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
