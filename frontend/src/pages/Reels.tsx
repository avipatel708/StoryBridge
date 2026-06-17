import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import { Film, Video, Plus, Heart, MessageSquare, Bookmark, Send, Volume2, VolumeX, MapPin, X, ArrowLeft, UserPlus, UserCheck, Trash2, Music } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReels } from '@/hooks/useReels';
import { useMessages } from '@/hooks/useMessages';
import { useProfile } from '@/hooks/useProfile';
import { Avatar } from '@/components/ui/Avatar';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { cn, getAvatarUrl, formatDate } from '@/lib/utils';
import { CreateReelModal } from '@/components/reels/CreateReelModal';
import { toast } from 'sonner';
import { supabaseUrl } from '@/lib/supabase';
import { ROYALTY_FREE_TRACKS } from '@/lib/musicLibrary';

// Helper to format reels URLs
function getReelUrl(path: string) {
  if (path.startsWith('http')) return path;
  return `${supabaseUrl}/storage/v1/object/public/reels/${path}`;
}

// Individual Reel Card Component
interface ReelCardProps {
  reel: any;
  activeId: string;
  isMuted: boolean;
  onToggleMute: () => void;
}

function ReelCard({ reel, activeId, isMuted, onToggleMute }: ReelCardProps) {
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);
  const isActive = activeId === reel.id;

  const { likeReel, unlikeReel, commentOnReel, saveReel, unsaveReel, deleteReel, useReelCommentsList } = useReels();
  const { toggleFollow, useProfileStats } = useProfile();
  const { useConversations, sendMessage } = useMessages();

  // Queries
  const { data: comments } = useReelCommentsList(reel.id);
  const { data: stats } = useProfileStats(reel.user_id);
  const { data: conversations } = useConversations();

  // Resolve the audio track from the local music library
  const audioTrack = reel.audio_track_id
    ? ROYALTY_FREE_TRACKS.find((t) => t.id === reel.audio_track_id) || null
    : null;

  // Local States
  const [isPlaying, setIsPlaying] = useState(false);
  const [commentOpen, setCommentOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [doubleTapHeart, setDoubleTapHeart] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const lastTapRef = useRef<number>(0);

  // Sync play state with active state from feed page observer
  useEffect(() => {
    if (videoRef.current) {
      if (isActive) {
        videoRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
        // Start background music in sync
        if (audioRef.current && audioTrack) {
          audioRef.current.currentTime = reel.audio_start_time || 0;
          audioRef.current.play().catch(() => {});
        }
      } else {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
        setIsPlaying(false);
        // Pause background music
        if (audioRef.current) {
          audioRef.current.pause();
        }
      }
    }
  }, [isActive, audioTrack, reel.audio_start_time]);

  // Sync audio mute with video mute
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const handleVideoClick = () => {
    // Check for double tap
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      handleDoubleTap();
    } else {
      // Single tap -> Toggle Play/Pause
      if (videoRef.current) {
        if (isPlaying) {
          videoRef.current.pause();
          setIsPlaying(false);
        } else {
          videoRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
        }
      }
    }
    lastTapRef.current = now;
  };

  const handleDoubleTap = () => {
    if (!reel.is_liked) {
      likeReel.mutate(reel.id);
    }
    setDoubleTapHeart(true);
    setTimeout(() => setDoubleTapHeart(false), 800);
  };

  const handleLikeToggle = () => {
    if (reel.is_liked) {
      unlikeReel.mutate(reel.id);
    } else {
      likeReel.mutate(reel.id);
    }
  };

  const handleSaveToggle = () => {
    if (reel.is_saved) {
      unsaveReel.mutate(reel.id);
    } else {
      saveReel.mutate(reel.id);
    }
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    commentOnReel.mutate({ reelId: reel.id, commentText: commentText.trim() });
    setCommentText('');
  };

  const handleShareToFriend = async (convo: any) => {
    const friend = convo.other_participant;
    if (!friend) return;

    try {
      await sendMessage.mutateAsync({
        receiverId: friend.id,
        content: `Shared a Reel: "${reel.caption}"`,
        messageType: 'reel_share',
        sharedItemId: reel.id,
      });
      toast.success(`Sent to ${friend.full_name || friend.username}`);
    } catch {
      // Handled
    }
  };

  const handleDeleteReel = () => {
    deleteReel.mutate({ id: reel.id, video_url: reel.video_url });
    setShowDeleteConfirm(false);
  };

  const handleFollowClick = () => {
    if (!stats) return;
    toggleFollow.mutate({
      targetId: reel.user_id,
      isFollowing: stats.isFollowing,
    });
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative snap-start bg-slate-950">
      
      {/* Container Frame */}
      <div className="w-full max-w-[400px] aspect-[9/16] h-full max-h-[100vh] relative shadow-[0_12px_40px_rgba(0,0,0,0.8)] overflow-hidden flex items-center bg-black border border-white/5 sm:rounded-2xl">
        
        {/* Video Node */}
        <video
          ref={videoRef}
          src={getReelUrl(reel.video_url)}
          onClick={handleVideoClick}
          loop
          playsInline
          muted={isMuted}
          className="w-full h-full object-cover cursor-pointer"
        />

        {/* Hidden audio element for background music */}
        {audioTrack && (
          <audio
            ref={audioRef}
            src={audioTrack.audio_url}
            loop
            muted={isMuted}
            preload="auto"
          />
        )}

        {/* Muted/Volume indicator flash overlay */}
        <div className="absolute top-4 left-4 z-20 pointer-events-auto">
          <button
            onClick={onToggleMute}
            className="p-2.5 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-[2px] transition-all cursor-pointer border border-white/10"
          >
            {isMuted ? <VolumeX className="h-4.5 w-4.5" /> : <Volume2 className="h-4.5 w-4.5" />}
          </button>
        </div>

        {/* Double Tap Heart Pop */}
        <AnimatePresence>
          {doubleTapHeart && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1.4, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none text-white text-7xl drop-shadow-xl"
            >
              ❤️
            </motion.div>
          )}
        </AnimatePresence>

        {/* Right side floating interactions bar */}
        <div className="absolute right-2 bottom-28 z-20 flex flex-col items-center gap-4.5 text-white px-2 py-3.5 rounded-full bg-black/35 backdrop-blur-md border border-white/10">
          {/* Creator Avatar with follow toggle */}
          <div className="flex flex-col items-center relative select-none">
            <Avatar
              src={getAvatarUrl(reel.profiles?.avatar_url)}
              name={reel.profiles?.full_name || reel.profiles?.username}
              size="md"
              onClick={() => navigate(`/profile/${reel.profiles?.username}`)}
              className="border-2 border-white cursor-pointer shadow-md"
            />
            {currentUser?.id !== reel.user_id && stats && (
              <button
                onClick={handleFollowClick}
                disabled={toggleFollow.isPending}
                className={cn(
                  'absolute -bottom-1.5 p-0.5 rounded-full text-white shadow-md transition-colors cursor-pointer border border-black',
                  stats.isFollowing ? 'bg-slate-700/80 hover:bg-slate-700' : 'bg-gradient-to-r from-[#6C63FF] to-[#A855F7]'
                )}
              >
                {stats.isFollowing ? <UserCheck className="h-2.5 w-2.5" /> : <UserPlus className="h-2.5 w-2.5" />}
              </button>
            )}
          </div>

          {/* Likes */}
          <button onClick={handleLikeToggle} className="flex flex-col items-center gap-1 cursor-pointer group select-none">
            <Heart
              className={cn(
                'h-7 w-7 transition-transform duration-200 group-active:scale-130',
                reel.is_liked ? 'text-rose-500 fill-rose-500' : 'text-white hover:text-rose-400'
              )}
            />
            <span className="text-[10px] font-bold drop-shadow-md">{reel.likes_count}</span>
          </button>

          {/* Comments */}
          <button onClick={() => setCommentOpen(true)} className="flex flex-col items-center gap-1 cursor-pointer select-none">
            <MessageSquare className="h-7 w-7 text-white hover:text-indigo-400 transition-colors" />
            <span className="text-[10px] font-bold drop-shadow-md">{reel.comments_count}</span>
          </button>

          {/* Save Bookmark */}
          <button onClick={handleSaveToggle} className="flex flex-col items-center gap-1 cursor-pointer select-none">
            <Bookmark
              className={cn(
                'h-7 w-7 transition-colors',
                reel.is_saved ? 'text-yellow-500 fill-yellow-500' : 'text-white hover:text-yellow-400'
              )}
            />
            <span className="text-[10px] font-bold drop-shadow-md">Save</span>
          </button>

          {/* Share / Send */}
          <button onClick={() => setShareOpen(true)} className="flex flex-col items-center gap-1 cursor-pointer select-none">
            <Send className="h-7 w-7 text-white hover:text-indigo-400 transition-colors" />
            <span className="text-[10px] font-bold drop-shadow-md">Share</span>
          </button>

          {/* Delete (only for reel owner) */}
          {currentUser?.id === reel.user_id && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex flex-col items-center gap-1 cursor-pointer select-none"
            >
              <Trash2 className="h-6 w-6 text-white hover:text-red-400 transition-colors" />
              <span className="text-[10px] font-bold drop-shadow-md">Delete</span>
            </button>
          )}
        </div>

        {/* Bottom Details Overlay */}
        <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/95 via-black/40 to-transparent z-10 text-white flex flex-col gap-2 pointer-events-auto">
          {/* Creator tag */}
          <div className="flex items-center gap-2 select-text">
            <span
              onClick={() => navigate(`/profile/${reel.profiles?.username}`)}
              className="text-sm font-bold font-outfit hover:underline cursor-pointer"
            >
              {reel.profiles?.username}
            </span>
          </div>

          {/* Caption text */}
          <p className="text-xs leading-relaxed font-light text-slate-100 select-text line-clamp-2 pr-16">
            {reel.caption}
          </p>

          {/* Location tag */}
          {reel.location && (
            <div className="flex items-center gap-1 text-[10px] font-semibold text-[#A855F7] drop-shadow-md select-none">
              <MapPin className="h-3 w-3" />
              <span>{reel.location}</span>
            </div>
          )}

          {/* Audio Track tag */}
          {audioTrack && (
            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[#EC4899] drop-shadow-md select-none mt-0.5">
              <Music className="h-3 w-3 animate-spin" style={{ animationDuration: '3s' }} />
              <span className="truncate max-w-[200px]">{audioTrack.title} — {audioTrack.artist}</span>
            </div>
          )}

          {/* Hashtags */}
          {reel.hashtags && reel.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 select-none">
              {reel.hashtags.map((tag: string) => (
                <span
                  key={tag}
                  onClick={() => navigate(`/explore?q=%23${tag}`)}
                  className="text-[10px] font-bold text-slate-350 hover:text-indigo-300 cursor-pointer"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* --- COMMENTS BOTTOM DRAWER OVERLAY --- */}
      <AnimatePresence>
        {commentOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCommentOpen(false)}
            className="absolute inset-0 z-50 bg-black/60 backdrop-blur-[2px] flex items-end justify-center"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-[400px] h-[60%] bg-[#0B1020]/95 backdrop-blur-2xl border-t border-white/10 rounded-t-3xl flex flex-col overflow-hidden text-left"
            >
              <div className="px-5 py-4 border-b border-white/5 flex justify-between items-center bg-white/2 select-none">
                <span className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                  <MessageSquare className="h-4.5 w-4.5 text-[#6C63FF]" />
                  Comments ({comments?.length || 0})
                </span>
                <button
                  onClick={() => setCommentOpen(false)}
                  className="p-1 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* Comments list box */}
              <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3 custom-scrollbar">
                {comments && comments.length > 0 ? (
                  comments.map((c) => (
                    <div key={c.id} className="flex gap-3 items-start select-text p-1.5 rounded-xl hover:bg-slate-800/10">
                      <Avatar
                        src={getAvatarUrl(c.profiles?.avatar_url)}
                        name={c.profiles?.full_name || c.profiles?.username}
                        size="sm"
                      />
                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 select-none">
                          <span className="text-xs font-bold text-white leading-none">
                            {c.profiles?.username}
                          </span>
                          <span className="text-[9px] text-slate-500">
                            {formatDate(c.created_at)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">{c.comment_text}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 py-12 select-none">
                    <MessageSquare className="h-8 w-8 text-slate-600 mb-2" />
                    <p className="text-xs">No comments posted yet.</p>
                    <p className="text-[10px] text-slate-600 mt-0.5">Be the first to share your thoughts!</p>
                  </div>
                )}
              </div>

              {/* comment box input */}
              <form
                onSubmit={handleCommentSubmit}
                className="p-3 border-t border-white/5 flex gap-2 bg-white/5 select-none"
              >
                <input
                  type="text"
                  placeholder="Post comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-[#6C63FF] focus:ring-1 focus:ring-[#6C63FF]/20"
                />
                <button
                  type="submit"
                  disabled={!commentText.trim()}
                  className="p-2 bg-gradient-to-r from-[#6C63FF] to-[#A855F7] disabled:opacity-40 text-white rounded-full transition-all cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- DIRECT MESSAGE SHARING OVERLAY --- */}
      <AnimatePresence>
        {shareOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShareOpen(false)}
            className="absolute inset-0 z-50 bg-black/60 backdrop-blur-[2px] flex items-end justify-center"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-[400px] h-[55%] bg-[#0B1020]/95 backdrop-blur-2xl border-t border-white/10 rounded-t-3xl flex flex-col overflow-hidden text-left"
            >
              <div className="px-5 py-4 border-b border-white/5 flex justify-between items-center bg-white/2 select-none">
                <span className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                  <Send className="h-4.5 w-4.5 text-[#6C63FF]" />
                  Share with Connections
                </span>
                <button
                  onClick={() => setShareOpen(false)}
                  className="p-1 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* Connections DM list */}
              <div className="flex-1 overflow-y-auto px-5 py-3 flex flex-col gap-2 bg-slate-900/60 custom-scrollbar select-none">
                {conversations && conversations.length > 0 ? (
                  conversations.map((convo) => {
                    const friend = convo.other_participant;
                    if (!friend) return null;

                    return (
                      <div
                        key={convo.id}
                        className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-800/40 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar
                            src={getAvatarUrl(friend.avatar_url)}
                            name={friend.full_name || friend.username}
                            size="sm"
                          />
                          <div className="flex flex-col min-w-0 text-left">
                            <span className="text-xs font-bold text-slate-200">
                              {friend.full_name || friend.username}
                            </span>
                            <span className="text-[10px] text-slate-500">@{friend.username}</span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleShareToFriend(convo)}
                          className="rounded-full px-4 py-1 h-7 text-[10px] bg-gradient-to-r from-[#6C63FF] to-[#A855F7] border-none font-bold"
                        >
                          Send
                        </Button>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12 text-xs text-slate-500">
                    No active chat channels. Start messaging from the sidebar.
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- DELETE CONFIRMATION OVERLAY --- */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowDeleteConfirm(false)}
            className="absolute inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: 'spring', damping: 22 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0B1020]/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-6 max-w-[320px] w-full mx-4 text-center shadow-2xl"
            >
              <div className="p-3 bg-red-500/10 rounded-full w-fit mx-auto mb-3">
                <Trash2 className="h-6 w-6 text-red-400" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1">Delete this Reel?</h3>
              <p className="text-xs text-slate-400 mb-5 leading-relaxed">
                This action is permanent. The reel video and all associated likes, comments and saves will be removed.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2 text-xs font-bold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteReel}
                  disabled={deleteReel.isPending}
                  className="flex-1 py-2 text-xs font-bold rounded-xl bg-red-600 hover:bg-red-500 text-white transition-colors cursor-pointer disabled:opacity-50"
                >
                  {deleteReel.isPending ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Main Reels Feed Component
export default function Reels() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const targetReelId = searchParams.get('id');

  const { useReelsList } = useReels();
  const { data: reelsList, isLoading } = useReelsList();

  const [activeReelId, setActiveReelId] = useState<string>('');
  const [isMuted, setIsMuted] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Auto open upload dialog if query parameter ?create=true is passed
  useEffect(() => {
    if (searchParams.get('create') === 'true') {
      setIsUploadOpen(true);
    }
  }, [searchParams]);

  const containerRef = useRef<HTMLDivElement>(null);

  // Auto detect active reel card based on viewport intersections
  useEffect(() => {
    if (!reelsList || reelsList.length === 0) return;

    // Default to query reel if specified, or first reel
    if (targetReelId) {
      setActiveReelId(targetReelId);
    } else {
      setActiveReelId(reelsList[0].id);
    }

    const observerOptions = {
      root: containerRef.current,
      rootMargin: '0px',
      threshold: 0.7, // Must be 70% visible
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('data-id');
          if (id) {
            setActiveReelId(id);
          }
        }
      });
    }, observerOptions);

    // Give react time to mount video components
    const timer = setTimeout(() => {
      const cards = containerRef.current?.querySelectorAll('[data-reel-card="true"]');
      cards?.forEach((card) => observer.observe(card));
    }, 400);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [reelsList, targetReelId]);

  // Handle auto-scroll to query reel when direct linked
  useEffect(() => {
    if (targetReelId && reelsList && reelsList.length > 0) {
      const activeCard = containerRef.current?.querySelector(`[data-id="${targetReelId}"]`);
      if (activeCard) {
        activeCard.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [targetReelId, reelsList]);

  const toggleMuteGlobal = () => {
    setIsMuted((prev) => !prev);
  };

  if (isLoading) {
    return (
      <div className="h-screen w-full bg-[#0B0F19] flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" />
        <span className="text-xs font-bold text-slate-400 tracking-wider uppercase animate-pulse">
          Opening Reels Feed...
        </span>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-120px)] w-full flex flex-col items-center justify-center relative bg-slate-950 sm:p-4 rounded-3xl overflow-hidden">
      
      {/* Main Snap Scrolling container */}
      <div
        ref={containerRef}
        className="w-full h-full overflow-y-scroll snap-y snap-mandatory no-scrollbar flex flex-col items-center custom-scrollbar"
        style={{ scrollBehavior: 'smooth' }}
      >
        {reelsList && reelsList.length > 0 ? (
          reelsList.map((reel) => (
            <div
              key={reel.id}
              data-id={reel.id}
              data-reel-card="true"
              className="w-full h-full snap-start flex-shrink-0 flex items-center justify-center"
            >
              <ReelCard
                reel={reel}
                activeId={activeReelId}
                isMuted={isMuted}
                onToggleMute={toggleMuteGlobal}
              />
            </div>
          ))
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-center text-slate-500 p-6 select-none">
            <Video className="h-12 w-12 text-slate-650 mb-3" />
            <h4 className="text-sm font-bold text-white">No Reels Shared Yet</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed mb-4">
              Be the first creator to share your story reels with the world! Click below to upload.
            </p>
            <Button
              onClick={() => {
                console.log('[StoryBridge] Empty state click, setting isUploadOpen to true');
                setIsUploadOpen(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold py-2 px-6 shadow-lg shadow-indigo-600/20 pointer-events-auto"
            >
              Upload a Reel
            </Button>
          </div>
        )}
      </div>

      {/* Top action row */}
      <div className="absolute top-4 inset-x-4 z-50 flex items-center justify-between select-none px-2.5 pointer-events-none">
        <button
          onClick={() => navigate(-1)}
          className="p-2.5 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-[2px] cursor-pointer border border-white/10 pointer-events-auto"
        >
          <ArrowLeft className="h-4.5 w-4.5" />
        </button>
        <h3 className="text-sm font-bold font-outfit text-white drop-shadow-md flex items-center gap-1.5 pointer-events-auto">
          <Film className="h-4 w-4 text-indigo-400" />
          <span>StoryBridge Reels</span>
        </h3>
        <button
          onClick={() => {
            console.log('[StoryBridge] Plus button clicked, setting isUploadOpen to true');
            setIsUploadOpen(true);
          }}
          className="p-2.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 cursor-pointer hover:scale-105 transition-transform z-[60] pointer-events-auto"
        >
          <Plus className="h-4.5 w-4.5" />
        </button>
      </div>

      {/* --- CREATE REEL POPUP MODAL --- */}
      <CreateReelModal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} />
    </div>
  );
}
