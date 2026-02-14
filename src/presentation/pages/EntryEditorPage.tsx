/**
 * Entry editor page — create or edit a journal entry.
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  const { id } = useParams<{ id: string }>();
  const { createEntry, updateEntry, getEntryById } = useEntry();

  const isEditMode = Boolean(id) && id !== 'new';

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<Mood | undefined>(undefined);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingEntry, setIsLoadingEntry] = useState(false);

  // Load existing entry in edit mode
  useEffect(() => {
    if (!isEditMode || !id) return;
    let cancelled = false;
    setIsLoadingEntry(true);
    getEntryById(id).then((entry) => {
      if (cancelled || !entry) return;
      setTitle(entry.title);
      setContent(entry.content);
      setMood(entry.mood);
      setTags(entry.tags);
      setIsLoadingEntry(false);
    }).catch(() => {
      if (!cancelled) setIsLoadingEntry(false);
    });
    return () => { cancelled = true; };
  }, [id, isEditMode, getEntryById]);

  const canSave = content.trim().length > 0 && !isSaving && !isLoadingEntry;

  const handleSave = async () => {
    if (!canSave) return;
    setIsSaving(true);
    try {
      if (isEditMode && id) {
        await updateEntry(id, {
          title: title.trim() || 'Untitled',
          content,
          mood,
          tags,
        });
      } else {
        await createEntry(title.trim() || 'Untitled', content, mood, tags);
      }
      navigate(-1);
    } catch (err) {
      console.error('[EntryEditorPage] Save failed:', err);
      setIsSaving(false);
    }
  };

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  if (isLoadingEntry) {
    return (
      <div className="p-4 max-w-2xl mx-auto flex items-center justify-center py-20">
        <p className="text-slate-400">Loading entry...</p>
      </div>
    );
  }

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
        <h2 className="text-lg font-semibold text-slate-200">
          {isEditMode ? 'Edit Entry' : 'New Entry'}
        </h2>
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

      {/* Tags */}
      <div className="mt-4">
        <p className="text-sm text-slate-400 mb-2">Tags</p>
        <div className="flex flex-wrap gap-2 mb-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/15 text-primary text-xs rounded-full"
            >
              {tag}
              <button
                onClick={() => handleRemoveTag(tag)}
                className="hover:text-danger transition-colors ml-0.5"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            placeholder="Add a tag..."
            className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:border-primary transition-colors"
          />
          <button
            onClick={handleAddTag}
            disabled={!tagInput.trim()}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
