/**
 * Entry editor page — create or edit a journal entry.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useEntry } from '@presentation/hooks/useEntry';
import { countWords } from '@domain/models/JournalEntry';
import { inferMood } from '@shared/sentiment';
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
  const [searchParams] = useSearchParams();
  const { createEntry, updateEntry, getEntryById } = useEntry();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isEditMode = Boolean(id) && id !== 'new';
  const isFocusMode = searchParams.get('focus') === '1';

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<Mood | undefined>(undefined);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingEntry, setIsLoadingEntry] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Track initial values for dirty detection
  const [initialContent, setInitialContent] = useState('');
  const [initialTitle, setInitialTitle] = useState('');

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
      setInitialTitle(entry.title);
      setInitialContent(entry.content);
      setIsLoadingEntry(false);
    }).catch(() => {
      if (!cancelled) setIsLoadingEntry(false);
    });
    return () => { cancelled = true; };
  }, [id, isEditMode, getEntryById]);

  // Track dirty state
  useEffect(() => {
    const hasChanges = content !== initialContent || title !== initialTitle;
    setIsDirty(hasChanges && (content.trim().length > 0 || title.trim().length > 0));
  }, [content, title, initialContent, initialTitle]);

  // Auto-resize textarea
  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.max(el.scrollHeight, 200)}px`;
  }, []);

  useEffect(() => {
    autoResize();
  }, [content, autoResize]);

  const canSave = content.trim().length > 0 && !isSaving && !isLoadingEntry;

  const handleSave = useCallback(async () => {
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
        const saveMood = isFocusMode ? inferMood(content) : mood;
        await createEntry(title.trim() || 'Untitled', content, saveMood, tags);
      }
      setIsDirty(false);
      if (isFocusMode) {
        sessionStorage.setItem('journly-show-welcome', '1');
        navigate('/', { replace: true });
      } else {
        navigate(-1);
      }
    } catch (err) {
      console.error('[EntryEditorPage] Save failed:', err);
      setIsSaving(false);
    }
  }, [canSave, isEditMode, isFocusMode, id, title, content, mood, tags, updateEntry, createEntry, navigate]);

  // Ctrl+S / Cmd+S keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        void handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  // Unsaved changes warning
  useEffect(() => {
    if (!isDirty) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const handleBack = () => {
    if (isDirty && !window.confirm('You have unsaved changes. Discard them?')) {
      return;
    }
    navigate(-1);
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

  const wordCount = countWords(content);

  if (isLoadingEntry) {
    return (
      <div className="p-4 max-w-2xl mx-auto flex items-center justify-center py-20">
        <p className="text-slate-400">Loading entry...</p>
      </div>
    );
  }

  // Focus mode: distraction-free writing for first-time users
  if (isFocusMode && !isEditMode) {
    return (
      <div className="flex flex-col max-w-2xl mx-auto px-4 pt-8 min-h-[80dvh]">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onInput={autoResize}
          autoFocus
          placeholder="What's on your mind..."
          className="w-full bg-transparent text-lg text-slate-200 placeholder:text-slate-600 outline-none resize-none leading-relaxed flex-1"
          style={{ minHeight: '300px' }}
        />
        <div className="sticky bottom-0 py-4 bg-slate-950 flex items-center justify-between border-t border-slate-800">
          <span className="text-xs text-slate-500">
            {wordCount} {wordCount === 1 ? 'word' : 'words'}
          </span>
          <button
            disabled={!canSave}
            onClick={handleSave}
            className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              canSave
                ? 'bg-primary hover:bg-primary-hover text-white'
                : 'bg-primary text-white opacity-50 cursor-not-allowed'
            }`}
          >
            {isSaving ? 'Saving…' : 'Done'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={handleBack}
          className="text-slate-400 hover:text-slate-200 text-sm transition-colors"
        >
          ← Back
        </button>
        <h2 className="text-lg font-semibold text-slate-200">
          {isEditMode ? 'Edit' : 'New Thought'}
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

      {/* Content textarea — auto-growing */}
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onInput={autoResize}
        placeholder="Write your thoughts..."
        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-4 text-slate-200 placeholder:text-slate-600 outline-none resize-none focus:border-primary transition-colors"
        style={{ minHeight: '200px' }}
      />

      {/* Word count */}
      <div className="flex justify-end mt-1.5 mb-2">
        <span className="text-xs text-slate-500">
          {wordCount} {wordCount === 1 ? 'word' : 'words'}
        </span>
      </div>

      {/* Mood selector */}
      <div className="mt-2">
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
