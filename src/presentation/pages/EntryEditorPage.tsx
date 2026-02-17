/**
 * Entry editor page — distraction-free, warm writing experience.
 * Auto-saves as you type. No save button.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useEntry } from '@presentation/hooks/useEntry';
import { countWords } from '@domain/models/JournalEntry';
import { inferMood } from '@shared/sentiment';
import { getDailyPrompt, getWorkReflectionTemplate } from '@shared/prompts';
import { useToastStore } from '@application/store/useToastStore';
import { hapticSuccess } from '@shared/haptics';
import type { Mood, EntryId } from '@domain/models/JournalEntry';

const MOOD_OPTIONS: { emoji: string; value: Mood }[] = [
  { emoji: '😊', value: 'great' },
  { emoji: '🙂', value: 'good' },
  { emoji: '😐', value: 'neutral' },
  { emoji: '😟', value: 'bad' },
  { emoji: '😢', value: 'awful' },
];

const AUTOSAVE_DELAY = 1500;

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
  const templateParam = searchParams.get('template');

  const [title, setTitle] = useState('');
  const [content, setContent] = useState(() => {
    if (templateParam === 'work-reflection') {
      return getWorkReflectionTemplate();
    }
    const draft = sessionStorage.getItem('journly-draft');
    if (draft) sessionStorage.removeItem('journly-draft');
    return draft || '';
  });

  // Place cursor at end when starting from a journal-page draft
  useEffect(() => {
    const el = textareaRef.current;
    if (el && content.length > 0 && el.selectionStart === 0) {
      el.setSelectionRange(content.length, content.length);
    }
    // Only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [mood, setMood] = useState<Mood | undefined>(undefined);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [showTags, setShowTags] = useState(false);
  const [isLoadingEntry, setIsLoadingEntry] = useState(false);

  // Auto-save tracking
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [entryId, setEntryId] = useState<EntryId | null>(isEditMode && id ? id : null);
  const hasShownToastRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const isSavingRef = useRef(false);

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
      setEntryId(entry.id);
      hasShownToastRef.current = true; // Don't show toast for existing entries
      setIsLoadingEntry(false);
    }).catch(() => {
      if (!cancelled) setIsLoadingEntry(false);
    });
    return () => { cancelled = true; };
  }, [id, isEditMode, getEntryById]);

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

  // Core save function
  const doSave = useCallback(async () => {
    if (content.trim().length === 0 || isSavingRef.current) return;
    isSavingRef.current = true;
    setSaveStatus('saving');
    try {
      if (entryId) {
        await updateEntry(entryId, {
          title: title.trim() || 'Untitled',
          content,
          mood: isFocusMode ? inferMood(content) : mood,
          tags,
        });
      } else {
        const newId = await createEntry(
          title.trim() || 'Untitled',
          content,
          isFocusMode ? inferMood(content) : mood,
          tags,
        );
        setEntryId(newId);
      }
      setSaveStatus('saved');
      if (!hasShownToastRef.current) {
        hasShownToastRef.current = true;
        void hapticSuccess();
        addToast('Saved privately \u2713', 'success', 'You can let this go now.');
      }
    } catch (err) {
      console.error('[EntryEditorPage] Auto-save failed:', err);
      setSaveStatus('idle');
    } finally {
      isSavingRef.current = false;
    }
  }, [content, title, mood, tags, entryId, isFocusMode, updateEntry, createEntry, addToast]);

  // Debounced auto-save on content/title/mood/tags change
  useEffect(() => {
    if (content.trim().length === 0 && !entryId) return;
    if (isLoadingEntry) return;

    setSaveStatus('idle');
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      void doSave();
    }, AUTOSAVE_DELAY);

    return () => clearTimeout(saveTimerRef.current);
  }, [content, title, mood, tags, doSave, entryId, isLoadingEntry]);

  // Ctrl+S / Cmd+S — instant save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        clearTimeout(saveTimerRef.current);
        void doSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [doSave]);

  // Flush save before unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      clearTimeout(saveTimerRef.current);
      // Can't await async in beforeunload, but trigger it
      if (content.trim().length > 0) void doSave();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [doSave, content]);

  const handleBack = () => {
    // Flush any pending save immediately
    clearTimeout(saveTimerRef.current);
    if (content.trim().length > 0 && !isSavingRef.current) {
      void doSave().then(() => navigate('/', { replace: true }));
    } else {
      navigate('/', { replace: true });
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

  const wordCount = countWords(content);
  const placeholderText = promptParam || getDailyPrompt();

  // Save status indicator
  const statusText = saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved \u2713' : null;

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
      <div className="flex flex-col flex-1 min-h-0 bg-slate-950">
        <div className="flex-1 min-h-0 overflow-y-auto max-w-2xl w-full mx-auto px-5 pt-12">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onInput={autoResize}
            autoFocus
            placeholder={placeholderText}
            className="w-full bg-transparent text-xl text-slate-200 placeholder:text-slate-700 outline-none resize-none leading-loose"
            style={{ minHeight: '200px' }}
          />
        </div>
        <div className="sticky bottom-0 px-5 py-4 bg-slate-950/90 backdrop-blur-sm pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="max-w-2xl mx-auto flex items-center justify-between gap-2">
            <span className="text-xs text-slate-400">
              {wordCount > 0 && <>{wordCount} {wordCount === 1 ? 'word' : 'words'}</>}
              {wordCount > 0 && statusText && <span className="text-slate-600 mx-1.5">&middot;</span>}
              {statusText && <span className="text-slate-500">{statusText}</span>}
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
              onClick={handleBack}
              className="text-slate-300 hover:text-slate-100 bg-slate-800/60 hover:bg-slate-800 px-4 py-2.5 rounded-xl text-base font-medium transition-colors"
              aria-label="Done"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Standard mode — editing existing entries
  return (
    <div className="flex flex-col flex-1 min-h-0 bg-slate-950">
      {/* Subtle top bar */}
      <div className="flex items-center justify-between px-4 py-3">
        {statusText ? (
          <span className="text-xs text-slate-500">{statusText}</span>
        ) : (
          <span />
        )}
        <button
          onClick={handleBack}
          className="text-slate-300 hover:text-slate-100 bg-slate-800/60 hover:bg-slate-800 px-4 py-2.5 rounded-xl text-base font-medium transition-colors"
          aria-label="Done"
        >
          Done
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto max-w-2xl w-full mx-auto px-5">
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
