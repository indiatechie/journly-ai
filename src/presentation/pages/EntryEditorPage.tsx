/**
 * Entry editor page — create or edit a journal entry.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEntry } from '@presentation/hooks/useEntry';
import type { Mood } from '@domain/models/JournalEntry';

const MOOD_OPTIONS: { emoji: string; value: Mood }[] = [
  { emoji: '😊', value: 'great' },
  { emoji: '🙂', value: 'good' },
  { emoji: '😐', value: 'neutral' },
  { emoji: '😟', value: 'bad' },
  { emoji: '😢', value: 'awful' },
];

export function EntryEditorPage() {
  const navigate = useNavigate();
  const { createEntry } = useEntry();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<Mood | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);

  const canSave = content.trim().length > 0 && !isSaving;

  const handleSave = async () => {
    if (!canSave) return;
    setIsSaving(true);
    try {
      await createEntry(title.trim() || 'Untitled', content, mood);
      navigate(-1);
    } catch (err) {
      console.error('[EntryEditorPage] Save failed:', err);
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate(-1)}
          className="text-slate-400 hover:text-slate-200 text-sm transition-colors"
        >
          ← Back
        </button>
        <button
          disabled={!canSave}
          onClick={handleSave}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            canSave
              ? 'bg-primary hover:bg-primary-hover text-white cursor-pointer'
              : 'bg-primary text-white opacity-50 cursor-not-allowed'
          }`}
        >
          {isSaving ? 'Saving…' : 'Save'}
        </button>
      </div>

      {/* Title input */}
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Entry title..."
        className="w-full bg-transparent text-xl font-bold placeholder:text-slate-600 outline-none mb-4"
      />

      {/* Content textarea */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write your thoughts..."
        rows={12}
        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-4 text-slate-200 placeholder:text-slate-600 outline-none resize-none focus:border-primary transition-colors"
      />

      {/* Mood selector */}
      <div className="mt-4">
        <p className="text-sm text-slate-400 mb-2">How are you feeling?</p>
        <div className="flex gap-3">
          {MOOD_OPTIONS.map(({ emoji, value }) => (
            <button
              key={value}
              onClick={() => setMood(mood === value ? undefined : value)}
              className={`text-2xl p-2 rounded-lg transition-colors ${
                mood === value
                  ? 'bg-primary/20 ring-2 ring-primary'
                  : 'hover:bg-slate-800'
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
