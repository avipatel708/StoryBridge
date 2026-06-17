import React, { useState } from 'react';
import { Plus, X, Film, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { useStoryHighlights } from '@/hooks/useStoryHighlights';
import { useAuthStore } from '@/stores/authStore';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { StoryHighlight, Story } from '@/types';

import { supabaseUrl } from '@/lib/supabase';

// Stories are stored in the 'stories' bucket, not 'posts'
function getStoryMediaUrl(path?: string) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${supabaseUrl}/storage/v1/object/public/stories/${path}`;
}

interface StoryHighlightsProps {
  userId: string;
}

const EMOJI_OPTIONS = ['⭐', '✈️', '❤️', '🎓', '💼', '🏕️', '📸', '🏠', '🍕', '🎉', '🌟', '🍀'];

export function StoryHighlights({ userId }: StoryHighlightsProps) {
  const currentUser = useAuthStore((state) => state.user);
  const isOwner = currentUser?.id === userId;

  const {
    useUserHighlights,
    useUserAllStories,
    createHighlight,
    deleteHighlight,
  } = useStoryHighlights(userId);

  const { data: highlights, isLoading } = useUserHighlights();
  const { data: allStories } = useUserAllStories();

  // Create highlight modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('⭐');
  const [selectedStoryIds, setSelectedStoryIds] = useState<string[]>([]);

  // Story Viewer Modal State
  const [activeHighlight, setActiveHighlight] = useState<StoryHighlight | null>(null);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);

  const toggleStorySelection = (storyId: string) => {
    setSelectedStoryIds((prev) =>
      prev.includes(storyId) ? prev.filter((id) => id !== storyId) : [...prev, storyId]
    );
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || selectedStoryIds.length === 0) return;

    createHighlight.mutate(
      {
        title: title.trim(),
        icon: selectedEmoji,
        storyIds: selectedStoryIds,
      },
      {
        onSuccess: () => {
          setTitle('');
          setSelectedEmoji('⭐');
          setSelectedStoryIds([]);
          setIsCreateOpen(false);
        },
      }
    );
  };

  const handleDeleteHighlight = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this story highlight folder?')) {
      deleteHighlight.mutate(id);
    }
  };

  const handleOpenHighlight = (hl: StoryHighlight) => {
    if (!hl.items || hl.items.length === 0) return;
    setActiveHighlight(hl);
    setActiveStoryIndex(0);
  };

  const handleNextStory = () => {
    if (!activeHighlight || !activeHighlight.items) return;
    if (activeStoryIndex < activeHighlight.items.length - 1) {
      setActiveStoryIndex((prev) => prev + 1);
    } else {
      setActiveHighlight(null);
    }
  };

  const handlePrevStory = () => {
    if (activeStoryIndex > 0) {
      setActiveStoryIndex((prev) => prev - 1);
    }
  };

  if (isLoading) {
    return <div className="text-center py-2 text-xs text-slate-450">Loading highlights...</div>;
  }

  return (
    <div className="w-full text-left">
      {/* Horizontal List Strip */}
      <div className="flex gap-4 overflow-x-auto py-2 scrollbar-none select-none items-center">
        {/* Creator '+' Icon node */}
        {isOwner && (
          <div className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer" onClick={() => setIsCreateOpen(true)}>
            <div className="h-14 w-14 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-800 flex items-center justify-center text-slate-500 hover:text-indigo-500 hover:border-indigo-500 transition-colors">
              <Plus className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-bold text-slate-500">New Highlight</span>
          </div>
        )}

        {/* Existing highlights listing */}
        {highlights && highlights.length > 0 ? (
          highlights.map((hl) => (
            <div
              key={hl.id}
              onClick={() => handleOpenHighlight(hl)}
              className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer group relative"
            >
              {/* Highlight Circle Avatar */}
              <div className="relative p-0.5 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500">
                <div className="h-14 w-14 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center text-2xl border-2 border-white dark:border-slate-950">
                  {hl.icon}
                </div>
              </div>
              
              <span className="text-[10px] font-bold text-slate-700 dark:text-slate-350 line-clamp-1 max-w-[64px]">
                {hl.title}
              </span>

              {/* Quick Hover Delete */}
              {isOwner && (
                <button
                  onClick={(e) => handleDeleteHighlight(hl.id, e)}
                  disabled={deleteHighlight.isPending}
                  className="absolute -top-1 -right-1 p-0.5 bg-red-500 rounded-full text-white scale-0 group-hover:scale-100 transition-transform shadow duration-200 cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))
        ) : (
          !isOwner && <p className="text-xs text-slate-400">No highlights added by the creator.</p>
        )}
      </div>

      {/* --- CREATE HIGHLIGHT MODAL --- */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="New Highlight" size="md">
        <form onSubmit={handleCreateSubmit} className="flex flex-col gap-5 text-left">
          {/* Highlight Title */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-widest">
              Highlight Title
            </label>
            <Input
              placeholder="e.g. Paris 2026, Summer Vibe"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="rounded-xl border-slate-200 dark:border-slate-800"
              maxLength={15}
            />
          </div>

          {/* Icon/Emoji Picker */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-widest">
              Choose Icon Emoji ({selectedEmoji})
            </label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setSelectedEmoji(emoji)}
                  className={`h-9 w-9 rounded-xl border flex items-center justify-center text-lg cursor-pointer transition-colors ${
                    selectedEmoji === emoji
                      ? 'border-indigo-500 bg-indigo-500/10'
                      : 'border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Select Stories Checklist */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-widest">
              Select Stories ({selectedStoryIds.length} chosen)
            </label>

            {allStories && allStories.length > 0 ? (
              <div className="grid grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1">
                {allStories.map((story) => {
                  const isChecked = selectedStoryIds.includes(story.id);
                  const storyUrl = getStoryMediaUrl(story.image_url);

                  return (
                    <div
                      key={story.id}
                      onClick={() => toggleStorySelection(story.id)}
                      className={`relative h-24 rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                        isChecked ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-transparent'
                      }`}
                    >
                      <img src={storyUrl || ''} alt="" className="h-full w-full object-cover" />
                      
                      {/* Checkmark overlay */}
                      <div className={`absolute inset-0 bg-indigo-600/20 flex items-center justify-center transition-opacity ${isChecked ? 'opacity-100' : 'opacity-0'}`}>
                        <div className="h-5 w-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">
                          ✓
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center text-xs text-slate-400">
                You have not shared any story photos yet.
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2.5 border-t border-slate-100 dark:border-slate-800/60 pt-4 mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateOpen(false)}
              className="rounded-xl border-slate-250"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/10 font-bold border-none px-6"
              disabled={createHighlight.isPending || !title.trim() || selectedStoryIds.length === 0}
            >
              {createHighlight.isPending ? 'Creating...' : 'Create Folder'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* --- STORIES VIEWER MODAL OVERLAY --- */}
      {activeHighlight && activeHighlight.items && activeHighlight.items.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-95 text-white p-4">
          <button
            onClick={() => setActiveHighlight(null)}
            className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white z-50 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Left / Right Zone Triggers */}
          <div className="absolute inset-y-0 left-0 w-1/4 z-30 cursor-pointer" onClick={handlePrevStory} />
          <div className="absolute inset-y-0 right-0 w-1/4 z-30 cursor-pointer" onClick={handleNextStory} />

          {/* Stories frame */}
          <div className="relative w-full max-w-sm h-[75vh] flex flex-col justify-between items-center z-20">
            {/* Top progress bars */}
            <div className="absolute top-2 left-4 right-4 flex gap-1 z-40">
              {activeHighlight.items.map((_, idx) => (
                <div key={idx} className="flex-1 h-0.5 rounded bg-white/30 overflow-hidden">
                  <div
                    className="h-full bg-white transition-all duration-300"
                    style={{
                      width: idx < activeStoryIndex ? '100%' : idx === activeStoryIndex ? '100%' : '0%',
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Story Image */}
            <div className="w-full h-full rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl relative">
              {activeHighlight.items[activeStoryIndex]?.stories ? (
                <>
                  {activeHighlight.items[activeStoryIndex].stories.media_type === 'video' ? (
                    <video
                      src={getStoryMediaUrl(activeHighlight.items[activeStoryIndex].stories.video_url)}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src={getStoryMediaUrl(activeHighlight.items[activeStoryIndex].stories.image_url) || ''}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  )}
                  
                  {/* Top user badge */}
                  <div className="absolute top-6 left-4 flex items-center gap-2 text-left z-35">
                    <div className="h-7 w-7 rounded-full overflow-hidden bg-slate-50 border border-white/20">
                      <img src={activeHighlight.profiles?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=60'} alt="" className="h-full w-full object-cover" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-white leading-none">
                        {activeHighlight.profiles?.full_name || activeHighlight.profiles?.username}
                      </p>
                      <p className="text-[9px] text-slate-300 mt-1">
                        Highlight: {activeHighlight.title}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-6 text-slate-500">
                  <Film className="h-8 w-8" />
                  <p className="text-xs">Story media has been removed.</p>
                </div>
              )}
            </div>

            {/* Control arrow triggers */}
            <div className="absolute bottom-[-60px] flex gap-4 z-40">
              <button
                onClick={handlePrevStory}
                disabled={activeStoryIndex === 0}
                className="p-2.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all disabled:opacity-20 cursor-pointer"
              >
                <ChevronLeft className="h-4.5 w-4.5" />
              </button>
              <button
                onClick={handleNextStory}
                className="p-2.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all cursor-pointer"
              >
                <ChevronRight className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
