/**
 * Story page — create AI-generated narratives from journal entries.
 *
 * Multi-step flow: idle → theme-input → matching → preview → generating → done
 */

import { useEffect, useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useStory } from '@presentation/hooks/useStory';
import { useEntry } from '@presentation/hooks/useEntry';
import { useSettingsStore } from '@application/store/useSettingsStore';
import { anonymize, repersonalize } from '@shared/anonymize';
import { STORY_THEME_SUGGESTIONS } from '@shared/storyThemes';
import { createAIAdapter } from '@infrastructure/ai/createAIAdapter';
import type { JournalEntry } from '@domain/models/JournalEntry';
import { formatDate } from '@shared/utils/dateUtils';
import { ConfirmDialog } from '@presentation/components/common/ConfirmDialog';
import { useToastStore } from '@application/store/useToastStore';
import type { StoryId } from '@domain/models/Story';

type FlowStep = 'idle' | 'theme-input' | 'matching' | 'preview' | 'generating' | 'done';

// --- Stop words for keyword extraction ---
const STOP_WORDS = new Set([
  'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your',
  'yours', 'yourself', 'he', 'she', 'it', 'its', 'they', 'them', 'their',
  'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those',
  'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing',
  'a', 'an', 'the', 'and', 'but', 'if', 'or', 'because', 'as', 'until',
  'while', 'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between',
  'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from',
  'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under', 'again',
  'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how',
  'all', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such',
  'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very',
  's', 't', 'can', 'will', 'just', 'don', 'should', 'now',
]);

function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

function scoreEntry(entry: JournalEntry, keywords: string[]): number {
  const haystack = `${entry.title} ${entry.content} ${entry.tags.join(' ')}`.toLowerCase();
  return keywords.reduce((score, kw) => {
    const regex = new RegExp(`\\b${kw}`, 'g');
    const matches = haystack.match(regex);
    return score + (matches ? matches.length : 0);
  }, 0);
}

export function StoryPage() {
  const { stories, loadStories, saveStory, deleteStory } = useStory();
  const { entries, loadEntries } = useEntry();
  const isVaultUnlocked = useSettingsStore((s) => s.isVaultUnlocked);
  const aiConfig = useSettingsStore((s) => s.preferences.ai);
  const hasAIProvider = aiConfig.provider === 'remote';

  const [step, setStep] = useState<FlowStep>('idle');
  const [theme, setTheme] = useState('');
  const [matchedEntries, setMatchedEntries] = useState<JournalEntry[]>([]);
  const [anonymizedText, setAnonymizedText] = useState('');
  const [replacements, setReplacements] = useState<Map<string, string>>(new Map());
  const [generatedTitle, setGeneratedTitle] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const addToast = useToastStore((s) => s.addToast);
  const [deleteTarget, setDeleteTarget] = useState<StoryId | null>(null);

  useEffect(() => {
    if (isVaultUnlocked) {
      void loadStories();
      void loadEntries();
    }
  }, [isVaultUnlocked, loadStories, loadEntries]);

  const activeEntries = useMemo(
    () => entries.filter((e) => !e.isDeleted),
    [entries],
  );

  const handleFindEntries = useCallback(() => {
    const keywords = extractKeywords(theme);
    if (keywords.length === 0) {
      // If no meaningful keywords, show all entries as candidates
      setMatchedEntries(activeEntries.slice(0, 10));
    } else {
      const scored = activeEntries
        .map((e) => ({ entry: e, score: scoreEntry(e, keywords) }))
        .filter((s) => s.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);
      setMatchedEntries(scored.map((s) => s.entry));
    }
    setStep('matching');
  }, [theme, activeEntries]);

  const handleContinueToPreview = useCallback(() => {
    const combined = matchedEntries
      .map((e) => e.content)
      .join('\n\n---\n\n');
    const result = anonymize(combined);
    setAnonymizedText(result.cleaned);
    setReplacements(result.replacements);
    setStep('preview');
  }, [matchedEntries]);

  const handleGenerate = useCallback(async () => {
    setStep('generating');
    try {
      const currentAIConfig = useSettingsStore.getState().preferences.ai;
      const adapter = createAIAdapter(currentAIConfig);
      await adapter.initialize(currentAIConfig);
      const response = await adapter.generate({
        systemPrompt: 'You are a reflective narrative writer. Create a thoughtful, first-person story based on the journal entries provided.',
        userPrompt: `${theme}\n\n${anonymizedText}`,
      });
      const repersonalized = repersonalize(response.content, replacements);
      setGeneratedTitle(theme);
      setGeneratedContent(repersonalized);
      setStep('done');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Story generation failed. Try again.', 'error');
      setStep('preview');
    }
  }, [theme, anonymizedText, replacements, addToast]);

  const handleSave = useCallback(async () => {
    await saveStory({
      title: generatedTitle,
      content: generatedContent,
      sourceEntryIds: matchedEntries.map((e) => e.id),
      prompt: theme,
      provider: aiConfig.provider === 'remote' ? 'remote' : 'local',
    });
    addToast('Story saved');
    setStep('idle');
    setTheme('');
    setMatchedEntries([]);
    setAnonymizedText('');
    setGeneratedContent('');
    setGeneratedTitle('');
  }, [generatedTitle, generatedContent, matchedEntries, theme, saveStory, addToast]);

  const handleDiscard = useCallback(() => {
    setStep('idle');
    setTheme('');
    setMatchedEntries([]);
    setAnonymizedText('');
    setGeneratedContent('');
    setGeneratedTitle('');
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (deleteTarget) {
      await deleteStory(deleteTarget);
      setDeleteTarget(null);
      addToast('Story deleted');
    }
  }, [deleteTarget, deleteStory, addToast]);

  // --- Render based on step ---

  if (step === 'theme-input') {
    return (
      <div className="p-4 max-w-2xl mx-auto pb-24">
        <button
          onClick={() => setStep('idle')}
          className="text-slate-400 hover:text-slate-200 text-sm mb-4 transition-colors"
        >
          &larr; Back
        </button>
        <h2 className="text-2xl font-bold text-slate-100 mb-2">What's your story about?</h2>
        <p className="text-sm text-slate-400 mb-6">
          Describe a theme and we'll find relevant journal entries.
        </p>

        <input
          type="text"
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          placeholder="e.g. my semester abroad, overcoming burnout..."
          className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-primary/50 transition-colors mb-4"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter' && theme.trim()) handleFindEntries();
          }}
        />

        <div className="flex flex-wrap gap-2 mb-6">
          {STORY_THEME_SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => setTheme(suggestion)}
              className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                theme === suggestion
                  ? 'bg-primary/15 border-primary/40 text-primary'
                  : 'border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'
              }`}
            >
              {suggestion}
            </button>
          ))}
        </div>

        <button
          onClick={handleFindEntries}
          disabled={!theme.trim()}
          className="bg-primary hover:bg-primary-hover text-slate-950 rounded-lg px-6 py-2.5 font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Find entries
        </button>
      </div>
    );
  }

  if (step === 'matching') {
    return (
      <div className="p-4 max-w-2xl mx-auto pb-24">
        <button
          onClick={() => setStep('theme-input')}
          className="text-slate-400 hover:text-slate-200 text-sm mb-4 transition-colors"
        >
          &larr; Back
        </button>
        <h2 className="text-2xl font-bold text-slate-100 mb-1">Matched entries</h2>
        <p className="text-sm text-slate-400 mb-6">
          {matchedEntries.length === 0
            ? 'No entries matched your theme. Try a different one.'
            : `Found ${matchedEntries.length} ${matchedEntries.length === 1 ? 'entry' : 'entries'} related to "${theme}".`}
        </p>

        {matchedEntries.length === 0 ? (
          <button
            onClick={() => setStep('theme-input')}
            className="bg-primary/15 hover:bg-primary/25 text-primary rounded-lg px-5 py-2 text-sm font-medium transition-colors"
          >
            Try a different theme
          </button>
        ) : (
          <>
            <div className="flex flex-col gap-2.5 mb-6">
              {matchedEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="bg-slate-900/40 rounded-xl p-4"
                >
                  <p className="text-slate-200 text-sm line-clamp-3 leading-relaxed">
                    {entry.content}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                    <span>{formatDate(entry.createdAt)}</span>
                    <span className="text-slate-700">&middot;</span>
                    <span>{entry.wordCount} words</span>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={handleContinueToPreview}
              className="bg-primary hover:bg-primary-hover text-slate-950 rounded-lg px-6 py-2.5 font-medium transition-colors"
            >
              Continue
            </button>
          </>
        )}
      </div>
    );
  }

  if (step === 'preview') {
    return (
      <div className="p-4 max-w-2xl mx-auto pb-24">
        <button
          onClick={() => setStep('matching')}
          className="text-slate-400 hover:text-slate-200 text-sm mb-4 transition-colors"
        >
          &larr; Back
        </button>
        <h2 className="text-2xl font-bold text-slate-100 mb-1">Anonymization preview</h2>
        <p className="text-sm text-slate-400 mb-4">
          Here's what will be shared with AI. Personal details have been removed.
        </p>

        <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-4 mb-4 max-h-80 overflow-y-auto">
          <p className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">
            {anonymizedText}
          </p>
        </div>

        <div className="flex items-start gap-2 bg-emerald-950/30 border border-emerald-900/40 rounded-lg p-3 mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400 shrink-0 mt-0.5">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>
            <path d="m9 12 2 2 4-4"/>
          </svg>
          <p className="text-xs text-emerald-300/80 leading-relaxed">
            Names, places, and personal details are removed before anything leaves your device.
            After the story is generated, originals are restored locally.
          </p>
        </div>

        <button
          onClick={() => void handleGenerate()}
          className="bg-primary hover:bg-primary-hover text-slate-950 rounded-lg px-6 py-2.5 font-medium transition-colors"
        >
          Generate story
        </button>
      </div>
    );
  }

  if (step === 'generating') {
    return (
      <div className="p-4 max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[60dvh]">
        <div className="w-10 h-10 border-3 border-primary/30 border-t-primary rounded-full animate-spin mb-6" />
        <h3 className="text-lg font-semibold text-slate-100 mb-2">Crafting your story...</h3>
        <p className="text-sm text-slate-400 text-center max-w-xs">
          Weaving your journal entries into a narrative. This won't take long.
        </p>
      </div>
    );
  }

  if (step === 'done') {
    return (
      <div className="p-4 max-w-2xl mx-auto pb-24">
        <h2 className="text-2xl font-bold text-slate-100 mb-1">{generatedTitle}</h2>
        <p className="text-xs text-slate-400 mb-6">
          Based on {matchedEntries.length} journal {matchedEntries.length === 1 ? 'entry' : 'entries'}
        </p>

        <div className="bg-slate-900/40 rounded-xl p-5 mb-6">
          <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
            {generatedContent}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => void handleSave()}
            className="bg-primary hover:bg-primary-hover text-slate-950 rounded-lg px-5 py-2.5 font-medium transition-colors"
          >
            Save story
          </button>
          <button
            onClick={() => void handleGenerate()}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg px-5 py-2.5 text-sm transition-colors"
          >
            Regenerate
          </button>
          <button
            onClick={handleDiscard}
            className="text-slate-400 hover:text-slate-200 px-4 py-2.5 text-sm transition-colors"
          >
            Discard
          </button>
        </div>
      </div>
    );
  }

  // --- Idle / list view ---
  const sortedStories = [...stories].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <div className="p-4 max-w-2xl mx-auto pb-24">
      <h2 className="text-2xl font-bold text-slate-100 mb-6">Stories</h2>

      {sortedStories.length === 0 ? (
        !hasAIProvider ? (
          /* Sample story card — sells the feature before setup */
          <div className="rounded-2xl border border-slate-700/60 overflow-hidden">
            <div className="bg-slate-900/70 px-5 pt-5 pb-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-medium text-primary/80 bg-primary/10 border border-primary/20 rounded-full px-2.5 py-0.5">
                  ✦ Example
                </span>
              </div>
              <h3 className="text-lg font-semibold text-slate-100 mb-3">A Life in Motion</h3>
              <p className="text-sm text-slate-400 leading-relaxed line-clamp-5">
                There are seasons that quietly reshape who we are — and most of the time,
                we only recognise them looking back. This one started unremarkably: a Tuesday,
                a restless feeling, a journal entry that trailed off mid-sentence.{'\n\n'}
                But something was shifting. The weeks that followed were marked by small
                decisions that somehow added up. A conversation that stayed. A habit quietly
                dropped. A direction that felt both terrifying and right.{'\n\n'}
                Reading these entries together, a thread emerges that wasn't visible in the
                day-to-day: resilience, disguised as ordinary stubbornness. Growth, dressed up
                as confusion. And beneath it all — an unmistakable sense of someone becoming.
              </p>
            </div>
            <div className="bg-slate-900/40 px-5 py-4 border-t border-slate-800 flex items-center justify-between gap-4">
              <p className="text-xs text-slate-500">
                Journly writes stories like this from your own journal entries.
              </p>
              <Link
                to="/settings"
                className="shrink-0 flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-hover transition-colors"
              >
                Enable
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m9 18 6-6-6-6"/>
                </svg>
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-5xl mb-4">&#x2728;</span>
            <h3 className="text-lg font-semibold text-slate-300 mb-2">No stories yet</h3>
            <p className="text-slate-400 text-sm max-w-xs mb-6">
              Turn your journal entries into meaningful narratives. Your data stays
              private — personal details are anonymized before AI sees anything.
            </p>
            <button
              onClick={() => setStep('theme-input')}
              className="bg-primary hover:bg-primary-hover text-slate-950 rounded-lg px-6 py-2.5 font-medium transition-colors"
            >
              Create a story
            </button>
          </div>
        )
      ) : (
        <>
          <div className="flex flex-col gap-2.5 mb-6">
            {sortedStories.map((story) => (
              <div
                key={story.id}
                className="bg-slate-900/40 rounded-xl hover:bg-slate-900/60 transition-colors group"
              >
                <Link
                  to={`/story/${story.id}`}
                  className="block p-4"
                >
                  <h3 className="text-slate-200 font-medium mb-1">{story.title}</h3>
                  <p className="text-slate-400 text-sm line-clamp-2 leading-relaxed">
                    {story.content}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                    <span>{formatDate(story.createdAt)}</span>
                    <span className="text-slate-700">&middot;</span>
                    <span>{story.sourceEntryIds.length} {story.sourceEntryIds.length === 1 ? 'entry' : 'entries'}</span>
                  </div>
                </Link>
                <div className="flex justify-end px-4 pb-3 -mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setDeleteTarget(story.id);
                    }}
                    className="text-slate-400 hover:text-danger text-xs transition-colors p-1"
                    title="Delete story"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {hasAIProvider ? (
            <button
              onClick={() => setStep('theme-input')}
              className="bg-primary/15 hover:bg-primary/25 text-primary rounded-lg px-5 py-2 text-sm font-medium transition-colors"
            >
              Create another story
            </button>
          ) : (
            <Link
              to="/settings"
              className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary transition-colors"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
              Enable AI Stories to create more
            </Link>
          )}
        </>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete story?"
        message="This can't be undone. The story will be permanently removed."
        confirmLabel="Delete"
        danger
        onConfirm={() => void handleConfirmDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
