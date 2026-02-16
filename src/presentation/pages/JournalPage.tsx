/**
 * Journal page — warm, inviting daily journal experience.
 */

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useEntry } from '@presentation/hooks/useEntry';
import { useSettingsStore } from '@application/store/useSettingsStore';
import { ConfirmDialog } from '@presentation/components/common/ConfirmDialog';
import { getDailyPrompt, getRandomPrompt, getRandomPromptAcrossAll, getActivePack, setActivePack, BUILT_IN_PACKS } from '@shared/prompts';
import type { EntryId } from '@domain/models/JournalEntry';

const FIRST_RUN_KEY = 'journly-first-run-complete';
const PACK_DISCOVERED_KEY = 'journly-pack-discovered';

const MOOD_EMOJI: Record<string, string> = {
  great: '😊',
  good: '🙂',
  neutral: '😐',
  bad: '😟',
  awful: '😢',
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getFormattedDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function getRelativeTime(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function calculateStreak(entries: { createdAt: string; isDeleted?: boolean }[]): number {
  const active = entries.filter((e) => !e.isDeleted);
  if (active.length === 0) return 0;

  const days = new Set(
    active.map((e) => {
      const d = new Date(e.createdAt);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    }),
  );

  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (days.has(key)) {
      streak++;
    } else if (i === 0) {
      // Today doesn't have an entry yet — that's fine, don't break streak
      continue;
    } else {
      break;
    }
  }
  return streak;
}

export function JournalPage() {
  const { entries, deleteEntry, loadEntries } = useEntry();
  const isVaultUnlocked = useSettingsStore((s) => s.isVaultUnlocked);
  const navigate = useNavigate();

  const [activePack, setActivePackState] = useState(getActivePack);
  const [prompt, setPrompt] = useState(getDailyPrompt);
  const [showPackPicker, setShowPackPicker] = useState(false);
  const [packDiscovered, setPackDiscovered] = useState(
    () => !!localStorage.getItem(PACK_DISCOVERED_KEY),
  );
  const [showPackNudge, setShowPackNudge] = useState(false);
  const refreshCountRef = useRef(0);
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

  const activeEntries = entries.filter((e) => !e.isDeleted);
  const streak = useMemo(() => calculateStreak(entries), [entries]);

  // Onboarding — ask what brings them here, pick a pack, start writing
  if (showOnboarding && activeEntries.length === 0) {
    const handlePickPack = (packId: string) => {
      setActivePack(packId);
      const pack = BUILT_IN_PACKS.find((p) => p.id === packId)!;
      setActivePackState(pack);
      localStorage.setItem(PACK_DISCOVERED_KEY, '1');
      setPackDiscovered(true);
      localStorage.setItem(FIRST_RUN_KEY, '1');
      setShowOnboarding(false);
      // Get a prompt from the chosen pack
      const now = new Date();
      const start = new Date(now.getFullYear(), 0, 0);
      const dayOfYear = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      const firstPrompt = pack.prompts[dayOfYear % pack.prompts.length]!;
      navigate(`/entry/new?focus=1&prompt=${encodeURIComponent(firstPrompt)}`);
    };

    return (
      <div className="flex flex-col items-center min-h-[70dvh] px-5 pt-12 pb-8">
        <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-slate-100 max-w-md text-center">
          What brings you here?
        </h2>
        <p className="text-slate-400 text-sm mb-8 max-w-sm text-center">
          Pick a theme to get started. You can always change it later.
        </p>

        <div className="w-full max-w-sm flex flex-col gap-2.5">
          {BUILT_IN_PACKS.map((pack) => (
            <button
              key={pack.id}
              onClick={() => handlePickPack(pack.id)}
              className="flex items-center gap-3 p-4 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-primary/40 transition-all text-left group"
            >
              <span className="text-2xl">{pack.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-100 group-hover:text-primary transition-colors">
                  {pack.name}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">{pack.description}</p>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-700 group-hover:text-primary transition-colors shrink-0">
                <path d="m9 18 6-6-6-6"/>
              </svg>
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            localStorage.setItem(FIRST_RUN_KEY, '1');
            setShowOnboarding(false);
          }}
          className="text-slate-400 hover:text-slate-200 text-sm mt-6 transition-colors"
        >
          I'll just start writing
        </button>
      </div>
    );
  }

  // Post-first-write welcome
  if (showWelcomeBanner && activeEntries.length > 0) {
    const firstEntry = activeEntries[0]!;
    return (
      <div className="p-4 max-w-2xl mx-auto">
        <div className="flex flex-col items-center pt-8 pb-4 text-center">
          <p className="text-sm text-slate-400 mb-6">Encrypted and saved on your device.</p>
          <div className="w-full bg-slate-900/60 rounded-xl p-6 text-left mb-8">
            <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">
              {firstEntry.content}
            </p>
            <p className="text-xs text-slate-400 mt-4">
              {firstEntry.wordCount} words
            </p>
          </div>
          <button
            onClick={() => navigate('/entry/new?focus=1')}
            className="bg-primary hover:bg-primary-hover text-slate-950 rounded-lg px-8 py-3 font-medium transition-colors"
          >
            Write another thought
          </button>
          <button
            onClick={() => setShowWelcomeBanner(false)}
            className="text-slate-400 hover:text-slate-200 text-sm mt-4 transition-colors"
          >
            I'm done for now
          </button>
        </div>
      </div>
    );
  }

  const visibleEntries = activeEntries
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="p-4 max-w-2xl mx-auto pb-24">
      {/* Greeting */}
      <div className="mb-6 pt-2">
        <h2 className="text-2xl font-bold text-slate-100">{getGreeting()}</h2>
        <p className="text-sm text-slate-400 mt-0.5">{getFormattedDate()}</p>
      </div>

      {/* Daily prompt card */}
      <div className={`${activeEntries.length >= 10 ? 'bg-slate-900/30' : 'bg-slate-900/60'} rounded-2xl p-5 mb-5`}>
        {/* Pack chip — inside the card for context */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => {
              if (!packDiscovered) {
                localStorage.setItem(PACK_DISCOVERED_KEY, '1');
                setPackDiscovered(true);
              }
              setShowPackNudge(false);
              setShowPackPicker(true);
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-slate-700 hover:border-primary/50 hover:bg-primary/10 text-sm text-slate-300 hover:text-primary transition-all ${
              !packDiscovered ? 'pack-chip-intro' : ''
            }`}
          >
            <span>{activePack.icon}</span>
            <span>{activePack.name}</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-60">
              <path d="m6 9 6 6 6-6"/>
            </svg>
          </button>
        </div>

        <div className="flex items-start justify-between gap-3">
          <p className={`text-slate-200 ${activeEntries.length >= 10 ? 'text-base' : 'text-lg'} leading-relaxed italic flex-1`}>
            "{prompt}"
          </p>
          <div className="relative shrink-0">
            <button
              onClick={() => {
                setPrompt(getRandomPrompt());
                refreshCountRef.current += 1;
                if (refreshCountRef.current >= 3 && !packDiscovered && !showPackNudge) {
                  setShowPackNudge(true);
                }
              }}
              className="text-slate-400 hover:text-primary transition-colors mt-1"
              title="Different prompt"
              aria-label="Refresh prompt"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                <path d="M3 3v5h5"/>
                <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
                <path d="M16 16h5v5"/>
              </svg>
            </button>
            {/* Nudge tooltip after 3+ refreshes */}
            {showPackNudge && (
              <div className="tooltip-fade-in absolute right-0 top-8 w-44 bg-slate-800 border border-slate-700 rounded-lg p-2.5 shadow-xl z-10">
                <p className="text-xs text-slate-200 leading-relaxed">
                  Want different themes?
                </p>
                <button
                  onClick={() => {
                    setShowPackNudge(false);
                    localStorage.setItem(PACK_DISCOVERED_KEY, '1');
                    setPackDiscovered(true);
                    setShowPackPicker(true);
                  }}
                  className="text-xs text-primary hover:text-primary-hover font-medium mt-1 transition-colors"
                >
                  Try a different theme
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 mt-4">
          <button
            onClick={() => navigate(`/entry/new?focus=1&prompt=${encodeURIComponent(prompt)}`)}
            className="bg-primary/15 hover:bg-primary/25 text-primary rounded-lg px-4 py-2 text-sm font-medium transition-colors"
          >
            Start writing
          </button>
          <button
            onClick={() => {
              const surprise = getRandomPromptAcrossAll();
              navigate(`/entry/new?focus=1&prompt=${encodeURIComponent(surprise)}`);
            }}
            className="bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-slate-100 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
          >
            Surprise me
          </button>
        </div>
      </div>

      {/* Streak badge */}
      {streak >= 2 && (
        <div className="flex items-center gap-2 mb-5 px-1">
          <span className="text-primary text-sm">
            {streak}-day streak
          </span>
        </div>
      )}

      {/* Recent entries */}
      {visibleEntries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-slate-400 text-sm">
            Your entries will appear here.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {visibleEntries.map((entry) => (
            <div
              key={entry.id}
              className="bg-slate-900/40 rounded-xl hover:bg-slate-900/60 transition-colors group"
            >
              <Link
                to={`/entry/${entry.id}`}
                className="block p-4"
              >
                <div className="flex items-start gap-3">
                  {entry.mood && (
                    <span className="text-lg mt-0.5">{MOOD_EMOJI[entry.mood]}</span>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-200 line-clamp-2 leading-relaxed">
                      {entry.content}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                      <span>{getRelativeTime(new Date(entry.createdAt))}</span>
                      <span className="text-slate-700">·</span>
                      <span>{entry.wordCount} words</span>
                    </div>
                  </div>
                </div>
              </Link>
              <div className="flex justify-end px-4 pb-3 -mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setDeleteTarget(entry.id);
                  }}
                  className="text-slate-400 hover:text-danger text-xs transition-colors p-1"
                  title="Delete entry"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Floating write button */}
      <Link
        to="/entry/new?focus=1"
        className="fixed bottom-20 right-5 w-14 h-14 bg-primary hover:bg-primary-hover text-slate-950 rounded-full flex items-center justify-center shadow-lg shadow-primary/20 transition-colors z-10"
        aria-label="Write new entry"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
          <path d="m15 5 4 4"/>
        </svg>
      </Link>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete entry?"
        message="This can't be undone. The entry will be permanently removed."
        confirmLabel="Delete"
        danger
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Pack picker modal */}
      {showPackPicker && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          onClick={() => setShowPackPicker(false)}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-lg bg-slate-900 rounded-t-2xl p-5 pb-8 max-h-[70dvh] overflow-y-auto sheet-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-100">What would you like to reflect on?</h3>
              <button
                onClick={() => setShowPackPicker(false)}
                className="text-slate-400 hover:text-slate-200 transition-colors p-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                </svg>
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {BUILT_IN_PACKS.map((pack) => (
                <button
                  key={pack.id}
                  onClick={() => {
                    setActivePack(pack.id);
                    setActivePackState(pack);
                    if (!packDiscovered) {
                      localStorage.setItem(PACK_DISCOVERED_KEY, '1');
                      setPackDiscovered(true);
                    }
                    setPrompt((() => {
                      const now = new Date();
                      const start = new Date(now.getFullYear(), 0, 0);
                      const dayOfYear = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                      return pack.prompts[dayOfYear % pack.prompts.length]!;
                    })());
                    setShowPackPicker(false);
                  }}
                  className={`flex items-center gap-3 p-3 rounded-xl text-left transition-colors ${
                    activePack.id === pack.id
                      ? 'bg-primary/15 ring-1 ring-primary/30'
                      : 'hover:bg-slate-800/60'
                  }`}
                >
                  <span className="text-2xl shrink-0">{pack.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-100">{pack.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{pack.description}</p>
                  </div>
                  {activePack.id === pack.id && (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary shrink-0">
                      <path d="M20 6 9 17l-5-5"/>
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
