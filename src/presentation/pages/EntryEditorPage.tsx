/**
 * Entry editor page — distraction-free, warm writing experience.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useEntry } from '@presentation/hooks/useEntry';
import { countWords } from '@domain/models/JournalEntry';
import { inferMood } from '@shared/sentiment';
import { getDailyPrompt } from '@shared/prompts';
import { useToastStore } from '@application/store/useToastStore';
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

  const addToast = useToastStore((s) => s.addToast);
  const isEditMode = Boolean(id) && id !== 'new';
  const isFocusMode = searchParams.get('focus') === '1';
  const promptParam = searchParams.get('prompt');

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<Mood | undefined>(undefined);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [showTags, setShowTags] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingEntry, setIsLoadingEntry] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

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
      addToast(isEditMode ? 'Entry updated' : 'Entry saved');
      if (isFocusMode) {
        sessionStorage.setItem('journly-show-welcome', '1');
        navigate('/', { replace: true });
      } else {
        navigate(-1);
      }
    } catch (err) {
      console.error('[EntryEditorPage] Save failed:', err);
      addToast('Failed to save entry', 'error');
      setIsSaving(false);
    }
  }, [canSave, isEditMode, isFocusMode, id, title, content, mood, tags, updateEntry, createEntry, navigate]);

  // Ctrl+S / Cmd+S
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
  const placeholderText = promptParam || getDailyPrompt();

  if (isLoadingEntry) {
    return (
      <div className="p-4 max-w-2xl mx-auto flex items-center justify-center py-20">
        <p className="text-slate-400">Loading entry...</p>
      </div>
    );
  }

  // Focus mode: distraction-free writing — full warm canvas
  if (isFocusMode && !isEditMode) {
    return (
      <div className="flex flex-col min-h-dvh bg-slate-950">
        <div className="flex-1 max-w-2xl w-full mx-auto px-5 pt-12">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onInput={autoResize}
            autoFocus
            placeholder={placeholderText}
            className="w-full bg-transparent text-xl text-slate-200 placeholder:text-slate-700 outline-none resize-none leading-loose"
            style={{ minHeight: '60vh' }}
          />
        </div>
        <div className="sticky bottom-0 px-5 py-4 bg-slate-950/90 backdrop-blur-sm">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <span className="text-xs text-slate-400">
              {wordCount} {wordCount === 1 ? 'word' : 'words'}
            </span>
            <div className="flex items-center gap-1.5">
              {MOOD_OPTIONS.map(({ emoji, value }) => (
                <button
                  key={value}
                  onClick={() => setMood(mood === value ? undefined : value)}
                  className={`text-base p-1 rounded transition-colors ${
                    mood === value
                      ? 'bg-primary/20 ring-1 ring-primary'
                      : 'opacity-50 hover:opacity-100'
                  }`}
                  aria-label={`Mood: ${value}`}
                  aria-pressed={mood === value}
                >
                  {emoji}
                </button>
              ))}
            </div>
            <button
              disabled={!canSave}
              onClick={handleSave}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                canSave
                  ? 'bg-primary hover:bg-primary-hover text-slate-950'
                  : 'bg-primary text-slate-950 opacity-50 cursor-not-allowed'
              }`}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Standard mode — editing existing entries
  return (
    <div className="flex flex-col min-h-dvh bg-slate-950">
      {/* Subtle top bar */}
      <div className="flex items-center justify-between px-4 py-3">
        <button
          onClick={handleBack}
          className="text-slate-400 hover:text-slate-200 text-sm transition-colors"
          aria-label="Go back"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
        </button>
        <button
          disabled={!canSave}
          onClick={handleSave}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            canSave
              ? 'bg-primary hover:bg-primary-hover text-slate-950 cursor-pointer'
              : 'bg-primary text-slate-950 opacity-50 cursor-not-allowed'
          }`}
        >
          {isSaving ? 'Saving...' : 'Save'}
        </button>
      </div>

      <div className="flex-1 max-w-2xl w-full mx-auto px-5">
        {/* Title — borderless */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="w-full bg-transparent text-2xl font-bold text-slate-100 placeholder:text-slate-700 outline-none mb-4"
        />

        {/* Content — borderless, transparent */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onInput={autoResize}
          placeholder={placeholderText}
          className="w-full bg-transparent text-xl text-slate-200 placeholder:text-slate-700 outline-none resize-none leading-loose"
          style={{ minHeight: '200px' }}
        />

        {/* Word count */}
        <div className="flex justify-end mt-1.5 mb-4">
          <span className="text-xs text-slate-400">
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

        {/* Tags — hidden behind icon toggle */}
        <div className="mt-4">
          <button
            onClick={() => setShowTags(!showTags)}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/>
              <path d="M7 7h.01"/>
            </svg>
            Tags {tags.length > 0 && `(${tags.length})`}
          </button>
          {showTags && (
            <div className="mt-3">
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
                      x
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
                  className="flex-1 bg-transparent border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-slate-200 placeholder:text-slate-700 outline-none focus:border-primary transition-colors"
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
          )}
        </div>
      </div>
    </div>
  );
}
