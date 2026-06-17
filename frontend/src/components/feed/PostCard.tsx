import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  Heart, MessageCircle, Bookmark, Share2, MoreHorizontal, Trash2, 
  ChevronLeft, ChevronRight, Music, Volume2, VolumeX, Pin, 
  MessageSquare, CornerDownRight, ThumbsUp 
} from 'lucide-react';
import { Post, MOOD_CONFIG, Profile } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { Dropdown } from '@/components/ui/Dropdown';
import { useAuthStore } from '@/stores/authStore';
import { usePosts } from '@/hooks/usePosts';
import { useComments, UpgradedComment } from '@/hooks/useComments';
import { getAvatarUrl, getPostImageUrl, formatDate, formatNumber } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { ROYALTY_FREE_TRACKS } from '@/lib/musicLibrary';

interface PostCardProps {
  post: Post & { post_media?: any[]; audio_track_id?: string | null; audio_start_time?: number };
}

export function PostCard({ post }: PostCardProps) {
  const { user, profile } = useAuthStore();
  const { toggleLike, toggleSave, deletePost } = usePosts();
  const { 
    usePostComments, 
    addComment, 
    deleteComment, 
    likeComment, 
    unlikeComment, 
    togglePinComment 
  } = useComments(post.id);
  
  const { data: comments, isLoading: commentsLoading } = usePostComments() as { data: UpgradedComment[] | undefined; isLoading: boolean };

  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  
  // Replying state
  const [replyingTo, setReplyingTo] = useState<UpgradedComment | null>(null);

  // Carousel slide index
  const [activeSlide, setActiveSlide] = useState(0);

  // Background Audio State
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const isOwner = user?.id === post.user_id;

  const audioTrack = post.audio_track_id 
    ? ROYALTY_FREE_TRACKS.find(t => t.id === post.audio_track_id)
    : null;

  useEffect(() => {
    if (audioTrack && isPlayingAudio) {
      if (!audioRef.current) {
        audioRef.current = new Audio(audioTrack.audio_url);
        audioRef.current.loop = true;
      }
      audioRef.current.currentTime = post.audio_start_time || 0;
      audioRef.current.play().catch(e => console.error(e));
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [isPlayingAudio, audioTrack]);

  const handleLikeToggle = () => {
    toggleLike.mutate({
      postId: post.id,
      isLiked: post.is_liked,
    });
  };

  const handleSaveToggle = () => {
    toggleSave.mutate({
      postId: post.id,
      isSaved: post.is_saved,
    });
  };

  const handleShare = () => {
    const postUrl = `${window.location.origin}/post/${post.id}`;
    navigator.clipboard.writeText(postUrl);
    toast.success('Post link copied to clipboard!');
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this post?')) {
      deletePost.mutate(post.id);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      await addComment.mutateAsync({
        content: commentText.trim(),
        parentId: replyingTo?.id
      });
      setCommentText('');
      setReplyingTo(null);
    } catch (err) {
      // Handled in query hook
    }
  };

  const startReply = (comment: UpgradedComment) => {
    setReplyingTo(comment);
    setCommentText(`@${comment.profiles?.username} `);
    // Focus comment input
    const inputEl = document.getElementById(`comment-input-${post.id}`);
    if (inputEl) inputEl.focus();
  };

  const handleCommentLikeToggle = (comment: UpgradedComment) => {
    if (comment.is_liked) {
      unlikeComment.mutate(comment.id);
    } else {
      likeComment.mutate(comment.id);
    }
  };

  const handleCommentPinToggle = (comment: UpgradedComment) => {
    togglePinComment.mutate({
      commentId: comment.id,
      isPinned: !comment.is_pinned
    });
  };

  const menuItems: any[] = [];
  if (isOwner) {
    menuItems.push({
      label: 'Delete Post',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: handleDelete,
      variant: 'danger',
    });
  }

  // Carousel rendering arrays
  const mediaList = post.post_media && post.post_media.length > 0
    ? post.post_media
    : post.image_url 
      ? [{ media_url: post.image_url, media_type: 'image' }]
      : [];

  const handleNextSlide = () => {
    setActiveSlide((prev) => (prev + 1) % mediaList.length);
  };

  const handlePrevSlide = () => {
    setActiveSlide((prev) => (prev - 1 + mediaList.length) % mediaList.length);
  };

  // Render a comment list recursively to show nested replies
  const renderCommentItem = (comment: UpgradedComment, isReply = false) => {
    return (
      <div key={comment.id} className={`flex flex-col gap-2 ${isReply ? 'pl-8 border-l border-zinc-800/40 ml-4 mt-2' : 'mt-3'}`}>
        <div className="flex gap-3">
          {comment.profiles && (
            <Link to={`/profile/${comment.profiles.username}`}>
              <Avatar
                src={getAvatarUrl(comment.profiles.avatar_url)}
                name={comment.profiles.full_name || comment.profiles.username}
                size="xs"
                className="border border-slate-100 dark:border-slate-850"
              />
            </Link>
          )}
          
          <div className="flex-1 bg-white dark:bg-[#1C253B] border border-slate-150 dark:border-slate-800/60 rounded-xl px-4 py-2.5 text-sm select-text flex flex-col shadow-sm dark:shadow-none">
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center gap-1.5">
                {comment.profiles && (
                  <Link
                    to={`/profile/${comment.profiles.username}`}
                    className="font-bold font-outfit text-[11px] text-slate-700 dark:text-slate-200 hover:text-[#6366F1] dark:hover:text-[#8B5CF6]"
                  >
                    {comment.profiles.full_name || comment.profiles.username}
                  </Link>
                )}
                {comment.is_pinned && (
                  <span className="text-[10px] text-indigo-400 flex items-center gap-0.5 font-bold uppercase tracking-wider">
                    <Pin className="w-2.5 h-2.5 fill-indigo-400 rotate-45" /> Pinned
                  </span>
                )}
              </div>
              <span className="text-[9px] text-slate-450 dark:text-slate-500 font-semibold select-none">
                {formatDate(comment.created_at)}
              </span>
            </div>
            <p className="text-slate-650 dark:text-slate-350 text-xs leading-relaxed whitespace-pre-line select-text">
              {comment.content}
            </p>

            {/* Comment Interactions (Like, Reply, Pin) */}
            <div className="flex items-center gap-4 mt-2 pt-1.5 border-t border-zinc-800/10 dark:border-zinc-800/20 text-[10px] text-zinc-400 font-bold select-none">
              <button 
                onClick={() => handleCommentLikeToggle(comment)}
                className={`flex items-center gap-1 hover:text-pink-500 transition-colors ${comment.is_liked ? 'text-pink-500' : ''}`}
              >
                <Heart className={`w-3 h-3 ${comment.is_liked ? 'fill-pink-500' : ''}`} />
                <span>{comment.likes_count} likes</span>
              </button>

              <button 
                onClick={() => startReply(comment)}
                className="flex items-center gap-1 hover:text-indigo-400 transition-colors"
              >
                <CornerDownRight className="w-3 h-3" /> Reply
              </button>

              {isOwner && (
                <button 
                  onClick={() => handleCommentPinToggle(comment)}
                  className={`flex items-center gap-1 transition-colors ${comment.is_pinned ? 'text-indigo-400' : 'hover:text-white'}`}
                >
                  <Pin className="w-3 h-3" />
                  <span>{comment.is_pinned ? 'Unpin' : 'Pin'}</span>
                </button>
              )}
            </div>
          </div>

          {(user?.id === comment.user_id || isOwner) && (
            <button
              onClick={() => {
                if (confirm('Delete comment?')) deleteComment.mutate(comment.id);
              }}
              className="p-1 text-slate-400 hover:text-rose-500 self-center cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Render replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="flex flex-col gap-1.5">
            {comment.replies.map(reply => renderCommentItem(reply, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card variant="glass" padding="none" className="flex flex-col border border-slate-200/40 dark:border-white/8 bg-white/60 dark:bg-[#0B1020]/75 backdrop-blur-[20px] hover:border-[#6C63FF]/30 dark:hover:border-[#6C63FF]/30 hover:shadow-[0_12px_40px_rgba(108,99,255,0.12)] transition-all duration-300 mb-6 overflow-visible rounded-2xl">
      {/* 1. Header (User Info) */}
      <div className="flex justify-between items-center px-5 py-4">
        <div className="flex items-center gap-3">
          {post.profiles && (
            <Link to={`/profile/${post.profiles.username}`}>
              <Avatar
                src={getAvatarUrl(post.profiles.avatar_url)}
                name={post.profiles.full_name || post.profiles.username}
                size="md"
                className="border border-slate-100 dark:border-slate-850"
              />
            </Link>
          )}
          <div className="flex flex-col min-w-0">
            {post.profiles && (
              <div className="flex items-center gap-2">
                <Link
                  to={`/profile/${post.profiles.username}`}
                  className="text-sm font-bold font-outfit text-slate-800 dark:text-slate-200 hover:text-[#6C63FF] dark:hover:text-[#A855F7] truncate"
                >
                  {post.profiles.full_name || post.profiles.username}
                </Link>
                {post.mood && MOOD_CONFIG[post.mood] && (
                  <span
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold text-white shadow-sm"
                    style={{ backgroundColor: MOOD_CONFIG[post.mood].color }}
                    title={`Feeling ${MOOD_CONFIG[post.mood].label}`}
                  >
                    <span>{MOOD_CONFIG[post.mood].emoji}</span>
                    <span className="hidden sm:inline">{MOOD_CONFIG[post.mood].label}</span>
                  </span>
                )}
              </div>
            )}
            <span className="text-[10px] text-slate-450 dark:text-slate-500 font-semibold mt-0.5 uppercase tracking-wider">
              {formatDate(post.created_at)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Post Music status indicator */}
          {audioTrack && (
            <button 
              onClick={() => setIsPlayingAudio(!isPlayingAudio)}
              className={`p-2 rounded-full transition flex items-center gap-1 ${
                isPlayingAudio ? 'bg-[#6C63FF]/20 text-[#6C63FF] animate-pulse' : 'bg-slate-100 dark:bg-slate-800/80 text-zinc-400 hover:text-white'
              }`}
            >
              <Music className={`w-3.5 h-3.5 ${isPlayingAudio ? 'animate-spin' : ''}`} />
              <span className="text-[9px] font-bold uppercase tracking-wider hidden md:inline">{audioTrack.title}</span>
            </button>
          )}

          {menuItems.length > 0 && (
            <Dropdown
              trigger={
                <button className="p-1.5 rounded-lg text-slate-400 dark:text-slate-550 hover:text-slate-750 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer">
                  <MoreHorizontal className="h-5 w-5" />
                </button>
              }
              items={menuItems}
              align="right"
            />
          )}
        </div>
      </div>

      {/* 2. Text Content */}
      <div className="px-5 pb-3">
        <p className="text-slate-650 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-line select-text">
          {post.content}
        </p>
      </div>

      {/* 3. Carousel Media Slides Viewer */}
      {mediaList.length > 0 && (
        <div className="w-full aspect-video md:max-h-[450px] overflow-hidden bg-slate-50 dark:bg-slate-900/30 relative border-y border-slate-100 dark:border-slate-800/60 select-none group">
          {/* Media Content */}
          <div className="w-full h-full flex items-center justify-center">
            {mediaList[activeSlide].media_type === 'video' ? (
              <video 
                src={getPostImageUrl(mediaList[activeSlide].media_url) || ''} 
                className="w-full h-full object-contain max-h-[450px]" 
                controls 
              />
            ) : (
              <img
                src={getPostImageUrl(mediaList[activeSlide].media_url) || ''}
                alt={`Slide ${activeSlide + 1}`}
                className="w-full h-full object-cover max-h-[450px]"
              />
            )}
          </div>

          {/* Left/Right Slides controls */}
          {mediaList.length > 1 && (
            <>
              <button 
                onClick={handlePrevSlide}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition shadow-lg"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                onClick={handleNextSlide}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition shadow-lg"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* Dots indicators */}
              <div className="absolute bottom-4 inset-x-0 flex justify-center gap-1.5">
                {mediaList.map((_, idx) => (
                  <span 
                    key={idx}
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                      activeSlide === idx ? 'bg-indigo-500 w-3' : 'bg-white/55'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* 4. Action Counts */}
      <div className="flex justify-between items-center px-5 py-2.5 text-xs text-slate-450 dark:text-slate-500 font-bold border-b border-slate-100 dark:border-slate-800/60 select-none">
        <div className="flex items-center gap-1.5">
          <Heart className="h-3.5 w-3.5 text-[#EC4899] fill-[#EC4899]" />
          <span>{formatNumber(post.likes_count)} likes</span>
        </div>
        <div className="flex items-center gap-3">
          <span>{comments?.length || 0} comments</span>
        </div>
      </div>

      {/* 5. Action Buttons Panel */}
      <div className="flex items-center justify-between px-3 py-1.5 select-none border-t border-slate-50 dark:border-slate-800/30">
        <button
          onClick={handleLikeToggle}
          className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
            post.is_liked
              ? 'text-[#EC4899] hover:bg-pink-50/50 dark:hover:bg-pink-950/10'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40'
          }`}
        >
          <Heart className={`h-4.5 w-4.5 ${post.is_liked ? 'fill-[#EC4899]' : ''}`} />
          <span className="hidden sm:inline">Like</span>
        </button>

        <button
          onClick={() => setCommentsOpen(!commentsOpen)}
          className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
            commentsOpen
              ? 'text-[#6C63FF] dark:text-[#A855F7] hover:bg-[#6C63FF]/10 dark:hover:bg-[#6C63FF]/15'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40'
          }`}
        >
          <MessageCircle className="h-4.5 w-4.5" />
          <span className="hidden sm:inline">Comment</span>
        </button>

        <button
          onClick={handleSaveToggle}
          className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
            post.is_saved
              ? 'text-[#6C63FF] dark:text-[#A855F7] hover:bg-[#6C63FF]/10 dark:hover:bg-[#6C63FF]/15'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40'
          }`}
        >
          <Bookmark className={`h-4.5 w-4.5 ${post.is_saved ? 'fill-[#6C63FF]' : ''}`} />
          <span className="hidden sm:inline">Save</span>
        </button>

        <button
          onClick={handleShare}
          className="flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all cursor-pointer"
        >
          <Share2 className="h-4.5 w-4.5" />
          <span className="hidden sm:inline">Share</span>
        </button>
      </div>

      {/* 6. Comment Thread Panel */}
      {commentsOpen && (
        <div className="px-5 pb-5 pt-3 border-t border-slate-100/70 dark:border-white/8 flex flex-col gap-4 bg-slate-50/20 dark:bg-white/2 rounded-b-2xl">
          
          {/* Active Reply Header */}
          {replyingTo && (
            <div className="flex justify-between items-center px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 text-xs rounded-lg select-none">
              <span>Replying to <strong>@{replyingTo.profiles?.username}</strong></span>
              <button 
                onClick={() => { setReplyingTo(null); setCommentText(''); }}
                className="text-zinc-400 hover:text-white"
              >
                ✕ Cancel
              </button>
            </div>
          )}

          {/* Comments list */}
          <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
            {commentsLoading ? (
              <p className="text-xs text-slate-450 dark:text-slate-500 text-center py-2">Loading comments...</p>
            ) : comments && comments.length > 0 ? (
              comments.map((comment) => renderCommentItem(comment))
            ) : (
              <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-2 select-none font-semibold">No comments yet. Write the first response!</p>
            )}
          </div>

          {/* Add Comment Input Form */}
          {user && (
            <form onSubmit={handleCommentSubmit} className="flex items-center gap-3 mt-2">
              <Avatar
                src={getAvatarUrl(profile?.avatar_url)}
                name={profile?.full_name || '?'}
                size="xs"
                className="border border-slate-100 dark:border-slate-850"
              />
              <input
                id={`comment-input-${post.id}`}
                type="text"
                placeholder={replyingTo ? `Write reply to @${replyingTo.profiles?.username}...` : "Write a comment..."}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="flex-1 bg-white/70 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs text-[#0F172A] dark:text-[#F8FAFC] placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-[#6C63FF] focus:ring-2 focus:ring-[#6C63FF]/10 transition-colors"
                disabled={addComment.isPending}
              />
              <Button
                type="submit"
                variant="primary"
                size="sm"
                className="rounded-xl h-9 text-xs px-4 bg-gradient-to-r from-[#6C63FF] to-[#A855F7] text-white border-none font-bold"
                disabled={!commentText.trim()}
                isLoading={addComment.isPending}
              >
                Post
              </Button>
            </form>
          )}
        </div>
      )}
    </Card>
  );
}
