/**
 * Story view page — read a saved story.
 *
 * Route: /story/:id
 */

import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStory } from '@presentation/hooks/useStory';
import { useSettingsStore } from '@application/store/useSettingsStore';
import { formatDate } from '@shared/utils/dateUtils';
import { ConfirmDialog } from '@presentation/components/common/ConfirmDialog';
import type { Story } from '@domain/models/Story';

export function StoryViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getStoryById, deleteStory } = useStory();
  const isVaultUnlocked = useSettingsStore((s) => s.isVaultUnlocked);

  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    if (!isVaultUnlocked || !id) return;
    setLoading(true);
    void getStoryById(id).then((s) => {
      setStory(s ?? null);
      setLoading(false);
    });
  }, [isVaultUnlocked, id, getStoryById]);

  const handleDelete = useCallback(async () => {
    if (!id) return;
    await deleteStory(id);
    navigate('/story');
  }, [id, deleteStory, navigate]);

  if (loading) {
    return (
      <div className="p-4 max-w-2xl mx-auto flex items-center justify-center min-h-[60dvh]">
        <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!story) {
    return (
      <div className="p-4 max-w-2xl mx-auto text-center py-20">
        <p className="text-slate-400 mb-4">Story not found.</p>
        <button
          onClick={() => navigate('/story')}
          className="text-primary hover:text-primary-hover text-sm transition-colors"
        >
          Back to stories
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-2xl mx-auto pb-24">
      <button
        onClick={() => navigate('/story')}
        className="text-slate-400 hover:text-slate-200 text-sm mb-4 transition-colors"
      >
        &larr; All stories
      </button>

      <h1 className="text-2xl font-bold text-slate-100 mb-1">{story.title}</h1>
      <div className="flex items-center gap-3 text-xs text-slate-500 mb-6">
        <span>{formatDate(story.createdAt)}</span>
        <span className="text-slate-700">&middot;</span>
        <span>
          {story.sourceEntryIds.length} source {story.sourceEntryIds.length === 1 ? 'entry' : 'entries'}
        </span>
      </div>

      <div className="bg-slate-900/40 rounded-xl p-5 mb-6">
        <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
          {story.content}
        </p>
      </div>

      <button
        onClick={() => setShowDelete(true)}
        className="text-slate-400 hover:text-danger text-sm transition-colors"
      >
        Delete story
      </button>

      <ConfirmDialog
        open={showDelete}
        title="Delete story?"
        message="This can't be undone. The story will be permanently removed."
        confirmLabel="Delete"
        danger
        onConfirm={() => void handleDelete()}
        onCancel={() => setShowDelete(false)}
      />
    </div>
  );
}
