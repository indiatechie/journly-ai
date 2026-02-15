/**
 * Journal page — lists all journal entries.
 *
 * This is the main landing page of the app.
 */

import { useEffect, useState, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useEntry } from '@presentation/hooks/useEntry';
import { useSettingsStore } from '@application/store/useSettingsStore';
import { ConfirmDialog } from '@presentation/components/common/ConfirmDialog';
import type { Mood, EntryId } from '@domain/models/JournalEntry';

const FIRST_RUN_KEY = 'journly-first-run-complete';

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
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [moodFilter, setMoodFilter] = useState<Mood | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(
    () => !localStorage.getItem(FIRST_RUN_KEY),
  );
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(() => {
    if (sessionStorage.getItem('journly-show-welcome')) {
      sessionStorage.removeItem('journly-show-welcome');
      return true;
    }
    return false;
  });
  const [deleteTarget, setDeleteTarget] = useState<EntryId | null>(null);

  const handleConfirmDelete = useCallback(async () => {
    if (deleteTarget) {
      await deleteEntry(deleteTarget);
      setDeleteTarget(null);
    }
  }, [deleteTarget, deleteEntry]);

  useEffect(() => {
    if (isVaultUnlocked) {
      void loadEntries();
    }
  }, [isVaultUnlocked, loadEntries]);

  // Show onboarding only when: no entries exist AND user hasn't dismissed it before
  const activeEntries = entries.filter((e) => !e.isDeleted);
  if (showOnboarding && activeEntries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70dvh] px-6 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold mb-3 max-w-md">
          What's taking up space in your head right now?
        </h2>
        <p className="text-slate-400 text-sm mb-8 max-w-sm">
          No rules. No format. Just dump whatever's on your mind.
        </p>
        <button
          onClick={() => {
            localStorage.setItem(FIRST_RUN_KEY, '1');
            setShowOnboarding(false);
            navigate('/entry/new?focus=1');
          }}
          className="bg-primary hover:bg-primary-hover text-white rounded-lg px-8 py-3 font-medium transition-colors"
        >
          Start writing
        </button>
        <button
          onClick={() => {
            localStorage.setItem(FIRST_RUN_KEY, '1');
            setShowOnboarding(false);
          }}
          className="text-slate-500 hover:text-slate-300 text-sm mt-4 transition-colors"
        >
          Skip, I'll look around first
        </button>
      </div>
    );
  }

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

  // Post-first-write view: show what they wrote + one clear next step
  if (showWelcomeBanner && activeEntries.length > 0) {
    const firstEntry = activeEntries[0]!;
    return (
      <div className="p-4 max-w-2xl mx-auto">
        <div className="flex flex-col items-center pt-8 pb-4 text-center">
          <p className="text-sm text-slate-500 mb-6">Encrypted and saved on your device.</p>
          <div className="w-full bg-slate-900 border border-slate-800 rounded-xl p-6 text-left mb-8">
            <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">
              {firstEntry.content}
            </p>
            <p className="text-xs text-slate-500 mt-4">
              {firstEntry.wordCount} words
            </p>
          </div>
          <button
            onClick={() => navigate('/entry/new?focus=1')}
            className="bg-primary hover:bg-primary-hover text-white rounded-lg px-8 py-3 font-medium transition-colors"
          >
            Write another thought
          </button>
          <button
            onClick={() => setShowWelcomeBanner(false)}
            className="text-slate-500 hover:text-slate-300 text-sm mt-4 transition-colors"
          >
            I'm done for now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      {/* Page header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Thoughts</h2>
        <Link
          to="/entry/new?focus=1"
          className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors"
        >
          <span>+</span>
          <span>Write</span>
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
              : 'Tap Write above to capture what\'s on your mind.'}
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
                    setDeleteTarget(entry.id);
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

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete entry?"
        message="This can't be undone. The entry will be permanently removed."
        confirmLabel="Delete"
        danger
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
