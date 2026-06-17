import React, { useRef, useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Plus, X, ChevronLeft, ChevronRight, Heart, Send, Eye, Download, 
  Volume2, VolumeX, Sparkles, Music, BarChart2, Award, Zap 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStories, UserStoriesGroup } from '@/hooks/useStories';
import { useProfile } from '@/hooks/useProfile';
import { Avatar } from '@/components/ui/Avatar';
import { Spinner } from '@/components/ui/Spinner';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/stores/authStore';
import { Profile, Story } from '@/types';
import { cn, formatDate, getAvatarUrl } from '@/lib/utils';
import { toast } from 'sonner';
import { supabaseUrl } from '@/lib/supabase';
import { ROYALTY_FREE_TRACKS } from '@/lib/musicLibrary';

const SWIPE_THRESHOLD = 60;
const STORY_PERSPECTIVE = 1600;

const CountdownSticker: React.FC<{ title: string; targetDate: string }> = ({ title, targetDate }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTime = () => {
      if (!targetDate) return;
      const targetMs = Date.parse(targetDate.replace(' ', 'T'));
      if (isNaN(targetMs)) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      const difference = targetMs - Date.now();
      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return (
    <div className="p-2.5 bg-zinc-950/90 border border-zinc-800 text-white rounded-xl w-36 shadow-2xl flex flex-col items-center gap-1 select-none pointer-events-auto">
      <p className="text-[7.5px] font-extrabold uppercase tracking-wider text-indigo-400 text-center truncate w-full">{title || 'Countdown'}</p>
      <div className="grid grid-cols-4 gap-0.5 w-full text-center">
        <div className="bg-zinc-900/90 p-1 rounded-md">
          <div className="text-[10px] font-black">{timeLeft.days}</div>
          <div className="text-[5.5px] text-zinc-500 uppercase font-bold">Days</div>
        </div>
        <div className="bg-zinc-900/90 p-1 rounded-md">
          <div className="text-[10px] font-black">{timeLeft.hours}</div>
          <div className="text-[5.5px] text-zinc-500 uppercase font-bold">Hrs</div>
        </div>
        <div className="bg-zinc-900/90 p-1 rounded-md">
          <div className="text-[10px] font-black">{timeLeft.minutes}</div>
          <div className="text-[5.5px] text-zinc-500 uppercase font-bold">Min</div>
        </div>
        <div className="bg-zinc-900/90 p-1 rounded-md">
          <div className="text-[10px] font-black">{timeLeft.seconds}</div>
          <div className="text-[5.5px] text-zinc-500 uppercase font-bold">Sec</div>
        </div>
      </div>
    </div>
  );
};

function preloadImage(url: string) {
  const img = new Image();
  img.src = url;
}

function getStoryUrl(path: string) {
  if (path.startsWith('http')) return path;
  return `${supabaseUrl}/storage/v1/object/public/stories/${path}`;
}

type StoryPreviewProps = {
  group: UserStoriesGroup;
  onClick: () => void;
  align: 'left' | 'right';
};

function StoryPreview({ group, onClick, align }: StoryPreviewProps) {
  const story = group.stories[0];
  if (!story) return null;

  return (
    <motion.button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      initial={{ opacity: 0, scale: 0.65, z: -200 }}
      animate={{ opacity: 0.55, scale: 0.72, z: -140 }}
      whileHover={{ opacity: 0.8, scale: 0.78, z: -80 }}
      className={cn(
        'hidden lg:flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer',
        align === 'left' ? 'origin-right' : 'origin-left'
      )}
    >
      <div className="relative w-[140px] aspect-[9/16] rounded-2xl overflow-hidden bg-slate-900 border border-white/10 shadow-[0_24px_60px_rgba(0,0,0,0.55)]">
        {story.media_type === 'video' ? (
          <video
            src={getStoryUrl(story.video_url || '')}
            muted
            className="absolute inset-0 w-full h-full object-cover opacity-40 blur-[2px] scale-110"
          />
        ) : (
          <img
            src={getStoryUrl(story.image_url)}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-40 blur-[2px] scale-110"
          />
        )}
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-3">
          <Avatar
            src={getAvatarUrl(group.user.avatar_url)}
            name={group.user.full_name || group.user.username}
            size="lg"
            hasStory
            className="ring-2 ring-white/30"
          />
          <span className="text-xs font-semibold text-white truncate max-w-full drop-shadow-md">
            {group.user.username}
          </span>
          <span className="text-[10px] text-slate-350">{formatDate(story.created_at)}</span>
        </div>
      </div>
    </motion.button>
  );
}

type StoryNavArrowProps = {
  direction: 'left' | 'right';
  onClick: () => void;
};

function StoryNavArrow({ direction, onClick }: StoryNavArrowProps) {
  const Icon = direction === 'left' ? ChevronLeft : ChevronRight;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      aria-label={direction === 'left' ? 'Previous story' : 'Next story'}
      className={cn(
        'absolute top-1/2 -translate-y-1/2 z-[210]',
        'flex items-center justify-center',
        'h-9 w-9 rounded-full',
        'bg-black/55 hover:bg-black/75 backdrop-blur-[2px]',
        'border border-white/20',
        'text-slate-300 hover:text-white transition-all cursor-pointer',
        'shadow-[0_2px_12px_rgba(0,0,0,0.45)]',
        direction === 'left' ? '-left-5 sm:-left-6' : '-right-5 sm:-right-6'
      )}
    >
      <Icon className="h-5 w-5" strokeWidth={2.5} />
    </button>
  );
}

// Interactive Sticker Renderer inside Story Viewer
function InteractiveSticker({ sticker }: { sticker: any }) {
  const navigate = useNavigate();
  const [pollVotes, setPollVotes] = useState<number[]>(sticker.data.votes || [0, 0]);
  const [hasVotedPoll, setHasVotedPoll] = useState(false);
  const [quizClicked, setQuizClicked] = useState<number | null>(null);

  const handlePollVote = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasVotedPoll) return;
    const newVotes = [...pollVotes];
    newVotes[idx] += 1;
    setPollVotes(newVotes);
    setHasVotedPoll(true);
    toast.success('Vote recorded!');
  };

  const handleQuizClick = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (quizClicked !== null) return;
    setQuizClicked(idx);
    if (idx === sticker.data.correct) {
      toast.success('Correct answer! 🎉');
    } else {
      toast.error('Wrong answer! 😢');
    }
  };

  const totalPollVotes = pollVotes[0] + pollVotes[1];
  const pollPercentages = totalPollVotes > 0 
    ? [Math.round((pollVotes[0] / totalPollVotes) * 100), Math.round((pollVotes[1] / totalPollVotes) * 100)]
    : [50, 50];

  const isDrawing = sticker.type === 'drawing';

  return (
    <div 
      style={isDrawing ? { left: 0, top: 0, width: '100%', height: '100%' } : { left: `${(sticker.x / 380) * 100}%`, top: `${(sticker.y / 670) * 100}%` }}
      className={cn(
        "absolute pointer-events-auto z-30",
        isDrawing ? "w-full h-full" : "transform -translate-x-1/2 -translate-y-1/2"
      )}
    >
      {sticker.type === 'location' && (
        <div className="flex items-center gap-1 bg-blue-600 text-white font-bold text-[10px] px-2 py-0.5 rounded-full shadow-lg whitespace-nowrap">
          📍 {sticker.data.name}
        </div>
      )}

      {sticker.type === 'mention' && (
        <Link 
          to={`/profile/${sticker.data.username}`}
          className="bg-white text-indigo-900 font-extrabold text-[10px] px-2 py-0.5 rounded-full shadow-lg block no-underline whitespace-nowrap"
        >
          @{sticker.data.username}
        </Link>
      )}

      {sticker.type === 'hashtag' && (
        <span className="bg-orange-500 text-white font-extrabold text-[10px] px-2 py-0.5 rounded-full shadow-lg whitespace-nowrap">
          #{sticker.data.tag}
        </span>
      )}

      {sticker.type === 'link' && (
        <a 
          href={sticker.data.url.startsWith('http') ? sticker.data.url : `https://${sticker.data.url}`} 
          target="_blank" 
          rel="noreferrer"
          className="flex items-center gap-1 bg-white text-cyan-600 font-extrabold text-[10px] px-2 py-0.5 rounded-full shadow-lg no-underline whitespace-nowrap"
        >
          🔗 {sticker.data.text}
        </a>
      )}

      {sticker.type === 'weather' && (
        <div className="flex items-center gap-1 bg-black/60 text-white font-bold text-xs px-2 py-0.5 rounded-lg shadow-lg whitespace-nowrap">
          {sticker.data.icon} {sticker.data.temp}°F
        </div>
      )}

      {sticker.type === 'poll' && (
        <div className="p-2.5 bg-black/80 border border-zinc-800 text-white rounded-xl w-36 shadow-2xl flex flex-col items-center gap-1.5">
          <p className="text-[8px] font-bold text-center text-zinc-400 uppercase tracking-wider">{sticker.data.question}</p>
          <div className="grid grid-cols-2 gap-1 w-full">
            {hasVotedPoll ? (
              <>
                <div className="p-1 bg-indigo-600/80 rounded-md text-center text-[10px] font-bold">{pollPercentages[0]}%</div>
                <div className="p-1 bg-zinc-850 rounded-md text-center text-[10px] font-bold">{pollPercentages[1]}%</div>
              </>
            ) : (
              <>
                <button 
                  onClick={(e) => handlePollVote(0, e)}
                  className="p-1 bg-indigo-600 hover:bg-indigo-500 rounded-md text-center text-[10px] font-bold cursor-pointer border-none"
                >
                  {sticker.data.options[0]}
                </button>
                <button 
                  onClick={(e) => handlePollVote(1, e)}
                  className="p-1 bg-zinc-800 hover:bg-zinc-750 rounded-md text-center text-[10px] font-bold cursor-pointer border-none"
                >
                  {sticker.data.options[1]}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {sticker.type === 'quiz' && (
        <div className="p-2.5 bg-indigo-950/90 border border-indigo-900/60 text-white rounded-xl w-40 shadow-2xl space-y-1.5 text-left">
          <div className="bg-indigo-600 px-1 py-0.2 rounded text-[6px] uppercase font-bold tracking-wider w-max">QUIZ</div>
          <p className="text-[9px] font-bold leading-tight">{sticker.data.question}</p>
          <div className="space-y-0.8">
            {sticker.data.options.map((opt: string, i: number) => {
              const isSelected = quizClicked === i;
              const isCorrect = sticker.data.correct === i;
              
              let bgClass = 'bg-indigo-900/40 border-indigo-800/30';
              if (quizClicked !== null) {
                if (isCorrect) bgClass = 'bg-green-600 text-white border-green-500';
                else if (isSelected) bgClass = 'bg-red-600 text-white border-red-500';
              }

              return (
                <button
                  key={i}
                  onClick={(e) => handleQuizClick(i, e)}
                  className={`w-full text-left p-1 rounded-md text-[8px] font-semibold border transition cursor-pointer ${bgClass}`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {sticker.type === 'gif' && (
        <img src={sticker.data.url} alt="GIF" className="w-16 h-16 object-contain pointer-events-none" />
      )}

      {sticker.type === 'countdown' && (
        <CountdownSticker title={sticker.data.title} targetDate={sticker.data.date} />
      )}

      {sticker.type === 'text' && (
        <div 
          style={{ 
            color: sticker.data.color || '#ffffff', 
            backgroundColor: sticker.data.background || 'transparent',
            fontFamily: 
              sticker.data.font === 'Classic' ? 'Inter, sans-serif' : 
              sticker.data.font === 'Serif' ? '"Playfair Display", Georgia, serif' : 
              sticker.data.font === 'Handwriting' ? '"Dancing Script", cursive' : 
              sticker.data.font === 'Neon' ? '"Monoton", sans-serif' : 'sans-serif',
            textShadow: sticker.data.font === 'Neon' ? `0 0 10px ${sticker.data.color}, 0 0 20px ${sticker.data.color}` : 'none',
            fontSize: `${sticker.data.fontSize || 14}px`
          }}
          className="px-2 py-1 rounded-md whitespace-nowrap select-none font-semibold"
        >
          {sticker.data.text}
        </div>
      )}

      {sticker.type === 'drawing' && (
        <img 
          src={sticker.data.url} 
          alt="Drawing overlay" 
          className="w-full h-full object-contain pointer-events-none" 
        />
      )}
    </div>
  );
}

type StoryViewerProps = {
  viewingGroup: UserStoriesGroup;
  activeStoryIndex: number;
  storyGroups: UserStoriesGroup[];
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  onGoToGroup: (group: UserStoriesGroup, storyIndex?: number) => void;
};

function StoryViewer({
  viewingGroup,
  activeStoryIndex,
  storyGroups,
  onClose,
  onNext,
  onPrev,
  onGoToGroup,
}: StoryViewerProps) {
  const currentUser = useAuthStore((state) => state.user);
  const { 
    recordStoryView, 
    useStoryViewers, 
    useStoryLikes, 
    likeStory, 
    unlikeStory, 
    commentOnStory 
  } = useStories();

  const activeStory = viewingGroup.stories[activeStoryIndex] as Story & { stickers?: any[]; audio_track_id?: string | null; audio_start_time?: number };
  const isOwner = currentUser?.id === viewingGroup.user.id;

  // States for playback timer
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(5000); // default 5s
  const [currentTime, setCurrentTime] = useState(0);

  // Interaction States
  const [commentText, setCommentText] = useState('');
  const [showViewers, setShowViewers] = useState(false);
  const [popHeart, setPopHeart] = useState(false);
  
  // Drawer tab toggles: 'viewers' or 'insights'
  const [drawerTab, setDrawerTab] = useState<'viewers' | 'insights'>('viewers');

  // Queries
  const { data: viewersData } = useStoryViewers(activeStory?.id || '');
  const { data: likesData } = useStoryLikes(activeStory?.id || '');

  const videoRef = useRef<HTMLVideoElement>(null);
  const storyAudioRef = useRef<HTMLAudioElement | null>(null);
  const dragStartX = useRef<number | null>(null);
  const lastActiveStoryIdRef = useRef<string | null>(null);

  const activeAudioTrack = activeStory?.audio_track_id
    ? ROYALTY_FREE_TRACKS.find(t => t.id === activeStory.audio_track_id)
    : null;

  // Record story view when loaded
  useEffect(() => {
    if (activeStory) {
      recordStoryView.mutate(activeStory.id);
      setProgress(0);
      setCurrentTime(0);
      setDuration(activeStory.media_type === 'video' ? 10000 : 5000);
    }
  }, [activeStory?.id]);

  // Sound loop synchronization
  useEffect(() => {
    if (activeAudioTrack) {
      let audioObj = storyAudioRef.current;
      if (!audioObj) {
        audioObj = new Audio(activeAudioTrack.audio_url);
        audioObj.loop = true;
        storyAudioRef.current = audioObj;
      }

      // If the audio track URL itself changed, update the source
      if (audioObj.src !== activeAudioTrack.audio_url) {
        audioObj.src = activeAudioTrack.audio_url;
        audioObj.load();
        lastActiveStoryIdRef.current = null; // force currentTime reset
      }

      // Only set currentTime if the active story changed
      if (lastActiveStoryIdRef.current !== activeStory.id) {
        audioObj.currentTime = activeStory.audio_start_time || 0;
        lastActiveStoryIdRef.current = activeStory.id;
      }

      audioObj.muted = isMuted;

      if (!isPaused) {
        audioObj.play().catch(e => {
          console.warn('[StoryBridge] Audio autoplay blocked. Muting and retrying.', e);
          audioObj.muted = true;
          setIsMuted(true);
          audioObj.play().catch(err => console.error('Audio play failed even when muted:', err));
        });
      } else {
        audioObj.pause();
      }
    } else {
      if (storyAudioRef.current) {
        storyAudioRef.current.pause();
      }
      lastActiveStoryIdRef.current = null;
    }

    return () => {
      if (storyAudioRef.current) {
        storyAudioRef.current.pause();
      }
    };
  }, [activeStory?.id, isMuted, isPaused, activeAudioTrack]);

  // Video loaded metadata handler
  const handleVideoMetadata = () => {
    if (videoRef.current) {
      const vidDuration = videoRef.current.duration * 1000;
      setDuration(vidDuration || 10000);
    }
  };

  // Playback timer ticker
  useEffect(() => {
    if (isPaused) return;

    const intervalTime = 50;
    const timer = setInterval(() => {
      setCurrentTime((prev) => {
        const nextTime = prev + intervalTime;
        if (nextTime >= duration) {
          clearInterval(timer);
          onNext();
          return duration;
        }
        setProgress((nextTime / duration) * 100);
        return nextTime;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [duration, isPaused, activeStory?.id, onNext]);

  const handleHoldStart = () => {
    setIsPaused(true);
    if (videoRef.current) videoRef.current.pause();
  };

  const handleHoldEnd = () => {
    setIsPaused(false);
    if (videoRef.current && activeStory.media_type === 'video') {
      videoRef.current.play().catch(() => {});
    }
  };

  useEffect(() => {
    if (videoRef.current && activeStory?.media_type === 'video') {
      if (isPaused) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {});
      }
    }
  }, [isPaused, activeStory?.id]);

  const handleLikeToggle = () => {
    if (!activeStory) return;
    if (likesData?.isLiked) {
      unlikeStory.mutate(activeStory.id);
    } else {
      likeStory.mutate({ storyId: activeStory.id, ownerId: activeStory.user_id });
      setPopHeart(true);
      setTimeout(() => setPopHeart(false), 800);
    }
  };

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !activeStory) return;

    commentOnStory.mutate({
      storyId: activeStory.id,
      ownerId: activeStory.user_id,
      commentText: commentText.trim(),
    });
    setCommentText('');
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    dragStartX.current = e.touches[0].clientX;
    handleHoldStart();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    handleHoldEnd();
    if (dragStartX.current === null) return;
    const diff = dragStartX.current - e.changedTouches[0].clientX;
    if (diff > SWIPE_THRESHOLD) {
      onNext();
    } else if (diff < -SWIPE_THRESHOLD) {
      onPrev();
    }
    dragStartX.current = null;
  };

  const handleDownloadMedia = async () => {
    try {
      const mediaPath = activeStory.media_type === 'video' ? activeStory.video_url : activeStory.image_url;
      const url = getStoryUrl(mediaPath || '');
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `storybridge-story-${activeStory.id}.${activeStory.media_type === 'video' ? 'mp4' : 'jpg'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Downloaded successfully!');
    } catch (err) {
      toast.error('Download failed.');
    }
  };

  // Mocked Engagement rate and Reach metrics based on actual viewers count
  const reachCount = Math.round((viewersData?.length || 0) * 1.4);
  const completionRate = viewersData && viewersData.length > 0 ? 94 : 0;
  const engagementRate = viewersData && viewersData.length > 0
    ? Math.round((((likesData?.likes?.length || 0) + (viewersData.length * 0.12)) / viewersData.length) * 100)
    : 0;

  const currentGroupIndex = storyGroups.findIndex((g) => g.user.id === viewingGroup.user.id);
  const prevGroup = currentGroupIndex > 0 ? storyGroups[currentGroupIndex - 1] : null;
  const nextGroup = currentGroupIndex < storyGroups.length - 1 ? storyGroups[currentGroupIndex + 1] : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black/98 flex flex-col items-center justify-center select-none"
      onClick={onClose}
    >
      {/* Top action row */}
      <div className="absolute top-4 right-4 z-[220] flex items-center gap-3">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDownloadMedia();
          }}
          title="Save story media"
          className="p-2.5 rounded-full bg-slate-900/80 border border-white/10 text-white hover:bg-slate-800 transition-all cursor-pointer"
        >
          <Download className="h-4.5 w-4.5" />
        </button>
        <button
          onClick={onClose}
          aria-label="Close story viewer"
          className="p-2.5 rounded-full bg-slate-900/80 border border-white/10 text-white hover:bg-red-950/40 hover:border-red-900 transition-all cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div
        className="flex items-center justify-center w-full max-w-6xl px-4 sm:px-10 gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        {prevGroup && (
          <StoryPreview
            group={prevGroup}
            align="left"
            onClick={() => onGoToGroup(prevGroup, prevGroup.stories.length - 1)}
          />
        )}

        {/* Story Slide Display Card */}
        <div className="relative flex-shrink-0 w-full max-w-[380px] aspect-[9/16] max-h-[82vh]">
          <StoryNavArrow direction="left" onClick={onPrev} />

          <div
            className="w-full h-full rounded-2xl overflow-hidden bg-slate-950 border border-white/10 relative shadow-[0_24px_60px_rgba(0,0,0,0.8)] flex flex-col justify-between"
            onMouseDown={handleHoldStart}
            onMouseUp={handleHoldEnd}
            onMouseLeave={handleHoldEnd}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* Top Info overlay */}
            <div className="absolute top-0 inset-x-0 p-3 bg-gradient-to-b from-black/80 to-transparent z-40 pointer-events-none">
              {/* Progress bars strip */}
              <div className="flex gap-1.5 mb-3.5">
                {viewingGroup.stories.map((s, idx) => (
                  <div key={s.id} className="flex-1 h-[2px] bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white rounded-full transition-all duration-75"
                      style={{
                        width:
                          idx < activeStoryIndex
                            ? '100%'
                            : idx === activeStoryIndex
                            ? `${progress}%`
                            : '0%',
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Header profile details */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 pointer-events-auto">
                  <Avatar
                    src={getAvatarUrl(viewingGroup.user.avatar_url)}
                    name={viewingGroup.user.full_name || viewingGroup.user.username}
                    size="sm"
                    className="border border-white/20"
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-white truncate max-w-[125px]">
                      {viewingGroup.user.username}
                    </span>
                    <span className="text-[9px] text-slate-300">
                      {activeStory ? formatDate(activeStory.created_at) : ''}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 pointer-events-auto">
                  {/* Active Audio details indicator */}
                  {activeAudioTrack && (
                    <div className="flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded text-[8px] font-bold text-indigo-400">
                      <Music className="w-2.5 h-2.5 animate-spin" />
                      <span className="truncate max-w-[50px]">{activeAudioTrack.title}</span>
                    </div>
                  )}

                  {(activeStory?.media_type === 'video' || activeAudioTrack) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsMuted(!isMuted);
                      }}
                      className="p-1.5 rounded-lg bg-black/40 hover:bg-black/60 text-white cursor-pointer border-none"
                    >
                      {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Media Box */}
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950">
              {activeStory?.media_type === 'video' ? (
                <video
                  ref={videoRef}
                  src={getStoryUrl(activeStory.video_url || '')}
                  autoPlay
                  playsInline
                  muted={isMuted}
                  onLoadedMetadata={handleVideoMetadata}
                  className="w-full h-full object-contain"
                />
              ) : (
                <img
                  src={getStoryUrl(activeStory?.image_url || '')}
                  alt=""
                  className="w-full h-full object-contain select-none"
                  draggable={false}
                />
              )}

              {/* Dynamic Interactive Stickers Overlay */}
              {activeStory?.stickers && Array.isArray(activeStory.stickers) && (
                <div className="absolute inset-0 z-30 pointer-events-none">
                  {activeStory.stickers.map((stk: any) => (
                    <InteractiveSticker key={stk.id} sticker={stk} />
                  ))}
                </div>
              )}

              {/* Heart Pop Animation */}
              <AnimatePresence>
                {popHeart && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1.3, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    className="absolute z-50 text-white text-6xl drop-shadow-lg"
                  >
                    ❤️
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Bottom Panel interactions */}
            <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent z-40 flex flex-col gap-3">
              {/* Comment inputs & Likes */}
              <div className="flex items-center gap-3">
                <form onSubmit={handleSendComment} className="flex-1 flex gap-2">
                  <input
                    type="text"
                    placeholder="Send a message..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="flex-1 bg-white/10 border border-white/10 rounded-full px-4 py-2 text-xs text-white placeholder:text-slate-350 focus:outline-none focus:border-white/30 focus:bg-white/15"
                  />
                  <button
                    type="submit"
                    disabled={!commentText.trim()}
                    className="p-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-full transition-colors cursor-pointer border-none"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </form>

                <button
                  onClick={handleLikeToggle}
                  className={cn(
                    'p-2 rounded-full border transition-all cursor-pointer',
                    likesData?.isLiked
                      ? 'bg-rose-600 border-rose-600 text-white hover:bg-rose-500'
                      : 'bg-white/10 border-white/10 text-white hover:bg-white/15'
                  )}
                >
                  <Heart className="h-3.5 w-3.5 fill-current" />
                </button>
              </div>

              {/* Views List Trigger (Owner only) */}
              {isOwner && viewersData && (
                <button
                  onClick={() => {
                    setIsPaused(true);
                    setShowViewers(true);
                  }}
                  className="flex items-center justify-center gap-1.5 py-1.5 w-full bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl text-white text-[10px] font-bold tracking-wider uppercase cursor-pointer"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Activity / Analytics ({viewersData.length})</span>
                </button>
              )}
            </div>
          </div>

          <StoryNavArrow direction="right" onClick={onNext} />
        </div>

        {nextGroup && (
          <StoryPreview group={nextGroup} align="right" onClick={() => onGoToGroup(nextGroup, 0)} />
        )}
      </div>

      <p className="mt-4 text-xs text-slate-500 hidden md:block">
        Use ← → arrows to navigate · Space/Hold to pause · Esc to exit
      </p>

      {/* --- OWNER VIEWERS & INSIGHTS LIST DRAWER --- */}
      {showViewers && (
        <div
          className="fixed inset-0 z-[250] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
          onClick={() => {
            setShowViewers(false);
            setIsPaused(false);
          }}
        >
          <div
            className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with tabs */}
            <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/40">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                  <Eye className="h-4.5 w-4.5 text-indigo-400" />
                  <span>Story Activity</span>
                </h4>
                <button
                  onClick={() => {
                    setShowViewers(false);
                    setIsPaused(false);
                  }}
                  className="p-1 rounded-lg text-slate-500 hover:text-white transition-colors cursor-pointer border-none bg-transparent"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* Tab Toggles */}
              <div className="flex gap-4">
                <button
                  onClick={() => setDrawerTab('viewers')}
                  className={`pb-1 text-xs font-semibold border-none bg-transparent transition ${
                    drawerTab === 'viewers' 
                      ? 'text-indigo-400 border-b-2 border-indigo-500' 
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  Viewers ({viewersData?.length || 0})
                </button>
                <button
                  onClick={() => setDrawerTab('insights')}
                  className={`pb-1 text-xs font-semibold border-none bg-transparent transition ${
                    drawerTab === 'insights' 
                      ? 'text-indigo-400 border-b-2 border-indigo-500' 
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  Story Insights
                </button>
              </div>
            </div>

            {/* Tab view panes */}
            <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-3 flex flex-col gap-2 bg-slate-900/60">
              {drawerTab === 'viewers' ? (
                /* Viewers list */
                viewersData && viewersData.length > 0 ? (
                  viewersData.map((vw) => (
                    <div
                      key={vw.id}
                      className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-800/40 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={getAvatarUrl(vw.profiles?.avatar_url)}
                          name={vw.profiles?.full_name || vw.profiles?.username}
                          size="sm"
                        />
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-bold text-slate-200">
                            {vw.profiles?.full_name || vw.profiles?.username}
                          </span>
                          <span className="text-[10px] text-slate-500">@{vw.profiles?.username}</span>
                        </div>
                      </div>
                      <span className="text-[9px] text-slate-500">{formatDate(vw.viewed_at)}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-xs text-slate-500">No views registered yet</div>
                )
              ) : (
                /* Story Insights Dashboard */
                <div className="p-2 space-y-3">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="p-3 bg-slate-950/50 border border-slate-800 rounded-xl flex flex-col">
                      <span className="text-[9px] font-bold text-zinc-550 uppercase tracking-widest">Total Views</span>
                      <span className="text-lg font-bold text-white mt-1">{viewersData?.length || 0}</span>
                    </div>
                    
                    <div className="p-3 bg-slate-950/50 border border-slate-800 rounded-xl flex flex-col">
                      <span className="text-[9px] font-bold text-zinc-550 uppercase tracking-widest">Unique Viewers</span>
                      <span className="text-lg font-bold text-white mt-1">{viewersData?.length || 0}</span>
                    </div>

                    <div className="p-3 bg-slate-950/50 border border-slate-800 rounded-xl flex flex-col">
                      <span className="text-[9px] font-bold text-zinc-550 uppercase tracking-widest">Completion Rate</span>
                      <span className="text-lg font-bold text-emerald-400 mt-1 flex items-center gap-1">
                        <Award className="w-4 h-4" /> {completionRate}%
                      </span>
                    </div>

                    <div className="p-3 bg-slate-950/50 border border-slate-800 rounded-xl flex flex-col">
                      <span className="text-[9px] font-bold text-zinc-550 uppercase tracking-widest">Story Reach</span>
                      <span className="text-lg font-bold text-indigo-400 mt-1 flex items-center gap-1">
                        <Zap className="w-4 h-4" /> {reachCount}
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 bg-indigo-600/10 border border-indigo-500/20 rounded-xl">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">Engagement Rate</p>
                        <p className="text-sm font-semibold mt-0.5">Likes + replies ratio</p>
                      </div>
                      <span className="text-xl font-extrabold text-indigo-400">{engagementRate}%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export function StoriesBar() {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const { useActiveStories, uploadStory, addStoryMention } = useStories();
  const { data: storyGroups, isLoading } = useActiveStories();
  const { useSearchUsers } = useProfile();

  const [viewingGroup, setViewingGroup] = useState<UserStoriesGroup | null>(null);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  const [navDirection, setNavDirection] = useState(0);

  // Upload previews states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedPreview, setSelectedPreview] = useState<string>('');
  const [captionText, setCaptionText] = useState('');
  const [mentionQuery, setMentionQuery] = useState('');
  const [taggedUsers, setTaggedUsers] = useState<Profile[]>([]);
  const [showMentionSearch, setShowMentionSearch] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Query search results for tags
  const { data: searchResults } = useSearchUsers(mentionQuery);

  const currentUserGroup = storyGroups?.find((g) => g.user.id === profile?.id);
  const userHasActiveStory = currentUserGroup && currentUserGroup.stories.length > 0;

  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (el) {
      setShowLeftArrow(el.scrollLeft > 0);
      setShowRightArrow(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
    }
  }, []);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) {
      checkScroll();
      el.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
      const timer = setTimeout(checkScroll, 500);
      return () => {
        el.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
        clearTimeout(timer);
      };
    }
  }, [storyGroups, isLoading, checkScroll]);

  const handleUploadClick = () => {
    navigate('/create/story');
  };

  const handleYourStoryClick = () => {
    if (userHasActiveStory && currentUserGroup) {
      openStoryViewer(currentUserGroup);
    } else {
      handleUploadClick();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.size > 25 * 1024 * 1024) {
        toast.error('File exceeds 25MB maximum limit.');
        return;
      }
      setSelectedFile(file);
      setSelectedPreview(URL.createObjectURL(file));
      setCaptionText('');
      setTaggedUsers([]);
    }
  };

  const handlePublishStory = async () => {
    if (!selectedFile) return;

    const toastId = toast.loading('Uploading story to bridge...');
    try {
      const story = await uploadStory.mutateAsync({ file: selectedFile });

      // Save tags/mentions
      for (const taggedUser of taggedUsers) {
        await addStoryMention.mutateAsync({ storyId: story.id, userId: taggedUser.id });
      }

      toast.dismiss(toastId);
      setSelectedFile(null);
      setSelectedPreview('');
    } catch {
      toast.dismiss(toastId);
    }
  };

  const handleSelectMention = (user: Profile) => {
    if (!taggedUsers.some((u) => u.id === user.id)) {
      setTaggedUsers([...taggedUsers, user]);
    }
    setMentionQuery('');
    setShowMentionSearch(false);
  };

  const handleRemoveTagged = (id: string) => {
    setTaggedUsers(taggedUsers.filter((u) => u.id !== id));
  };

  const openStoryViewer = (group: UserStoriesGroup) => {
    setNavDirection(0);
    setViewingGroup(group);
    setActiveStoryIndex(0);
  };

  const closeStoryViewer = useCallback(() => {
    setViewingGroup(null);
    setActiveStoryIndex(0);
    setNavDirection(0);
  }, []);

  const goToGroup = useCallback((group: UserStoriesGroup, storyIndex = 0) => {
    setViewingGroup(group);
    setActiveStoryIndex(storyIndex);
  }, []);

  const nextStory = useCallback(() => {
    if (!viewingGroup || !storyGroups) return;
    setNavDirection(1);

    if (activeStoryIndex < viewingGroup.stories.length - 1) {
      setActiveStoryIndex((prev) => prev + 1);
      return;
    }

    const currentGroupIndex = storyGroups.findIndex((g) => g.user.id === viewingGroup.user.id);
    if (currentGroupIndex !== -1 && currentGroupIndex < storyGroups.length - 1) {
      const nextGroup = storyGroups[currentGroupIndex + 1];
      setViewingGroup(nextGroup);
      setActiveStoryIndex(0);
    } else {
      closeStoryViewer();
    }
  }, [viewingGroup, storyGroups, activeStoryIndex, closeStoryViewer]);

  const prevStory = useCallback(() => {
    if (!viewingGroup || !storyGroups) return;
    setNavDirection(-1);

    if (activeStoryIndex > 0) {
      setActiveStoryIndex((prev) => prev - 1);
      return;
    }

    const currentGroupIndex = storyGroups.findIndex((g) => g.user.id === viewingGroup.user.id);
    if (currentGroupIndex > 0) {
      const prevGroup = storyGroups[currentGroupIndex - 1];
      setViewingGroup(prevGroup);
      setActiveStoryIndex(prevGroup.stories.length - 1);
    } else {
      closeStoryViewer();
    }
  }, [viewingGroup, storyGroups, activeStoryIndex, closeStoryViewer]);

  useEffect(() => {
    if (!viewingGroup || !storyGroups) return;
    const activeStory = viewingGroup.stories[activeStoryIndex];
    if (activeStory && activeStory.media_type !== 'video') {
      preloadImage(getStoryUrl(activeStory.image_url));
    }
  }, [viewingGroup, storyGroups, activeStoryIndex]);

  // Keyboard navigation listener
  useEffect(() => {
    if (!viewingGroup) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeStoryViewer();
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        nextStory();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        prevStory();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [viewingGroup, closeStoryViewer, nextStory, prevStory]);

  const scrollLeft = () => {
    scrollContainerRef.current?.scrollBy({ left: -200, behavior: 'smooth' });
  };

  const scrollRight = () => {
    scrollContainerRef.current?.scrollBy({ left: 200, behavior: 'smooth' });
  };

  return (
    <div className="relative w-full">
      {showLeftArrow && (
        <button
          onClick={scrollLeft}
          className="absolute left-1 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full bg-white/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/60 text-slate-650 dark:text-white hover:bg-indigo-50 dark:hover:bg-slate-750 transition-colors shadow-md cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}

      <div
        ref={scrollContainerRef}
        className="w-full overflow-x-auto flex gap-4 px-2 py-3 no-scrollbar scroll-smooth custom-scrollbar"
      >
        {/* Upload Button */}
        <div className="flex flex-col items-center gap-1.5 flex-shrink-0 select-none">
          <div className="relative">
            <Avatar
              src={profile ? getAvatarUrl(profile.avatar_url) : null}
              name={profile?.full_name || '?'}
              size="lg"
              onClick={handleYourStoryClick}
              hasStory={userHasActiveStory}
              storySeen={currentUserGroup ? !currentUserGroup.hasUnseen : false}
              className={cn(
                "cursor-pointer",
                !userHasActiveStory && "border-2 border-indigo-500/30 dark:border-slate-700"
              )}
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleUploadClick();
              }}
              disabled={uploadStory.isPending}
              className="absolute bottom-0 right-0 p-1.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white border border-slate-900 shadow-md cursor-pointer flex items-center justify-center z-20 w-6 h-6 sm:w-7 sm:h-7"
            >
              {uploadStory.isPending ? (
                <Spinner size="sm" variant="white" className="h-3 w-3" />
              ) : (
                <Plus className="h-3.5 w-3.5" />
              )}
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*,video/*"
              className="hidden"
            />
          </div>
          <span
            onClick={handleYourStoryClick}
            className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 cursor-pointer hover:text-[#6C63FF] dark:hover:text-[#A855F7] transition-colors"
          >
            Your story
          </span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center px-6">
            <Spinner size="md" />
          </div>
        ) : (
          storyGroups
            ?.filter((group) => group.user.id !== profile?.id)
            ?.map((group) => {
              const hasStories = group.stories.length > 0;
              if (!hasStories) return null;

              return (
                <div
                  key={group.user.id}
                  className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer select-none"
                  onClick={() => openStoryViewer(group)}
                >
                  <Avatar
                    src={getAvatarUrl(group.user.avatar_url)}
                    name={group.user.full_name || group.user.username}
                    size="lg"
                    hasStory={true}
                    storySeen={!group.hasUnseen}
                  />
                  <span className="text-[10px] sm:text-xs font-semibold text-slate-605 dark:text-slate-350 truncate max-w-[70px]">
                    {group.user.username}
                  </span>
                </div>
              );
            })
        )}
      </div>

      {showRightArrow && (
        <button
          onClick={scrollRight}
          className="absolute right-1 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full bg-white/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/60 text-slate-650 dark:text-white hover:bg-indigo-50 dark:hover:bg-slate-750 transition-colors shadow-md cursor-pointer"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}

      {/* --- PREVIEW AND CONFIRM STORY UPLOAD MODAL --- */}
      <Modal
        isOpen={!!selectedPreview}
        onClose={() => {
          setSelectedPreview('');
          setSelectedFile(null);
        }}
        title="Share new story"
        size="md"
      >
        <div className="flex flex-col gap-4 text-left">
          {/* Media Preview Box */}
          <div className="w-full aspect-[9/16] max-h-[45vh] rounded-xl overflow-hidden bg-black flex items-center justify-center relative">
            {selectedFile?.type.startsWith('video') ? (
              <video src={selectedPreview} controls className="w-full h-full object-contain" />
            ) : (
              <img src={selectedPreview} alt="" className="w-full h-full object-contain" />
            )}
          </div>

          {/* Mentions tags field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-indigo-400" />
              <span>Mention creators (@username)</span>
            </label>
            <div className="relative">
              <Input
                placeholder="Type username to mention..."
                value={mentionQuery}
                onChange={(e) => {
                  setMentionQuery(e.target.value);
                  setShowMentionSearch(true);
                }}
                className="rounded-xl"
              />

              {/* Autocomplete popup */}
              {showMentionSearch && searchResults && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-50 bg-[#0B1020]/90 backdrop-blur-xl border border-white/10 rounded-xl mt-1.5 max-h-[140px] overflow-y-auto custom-scrollbar shadow-2xl">
                  {searchResults.map((usr) => (
                    <div
                      key={usr.id}
                      onClick={() => handleSelectMention(usr)}
                      className="flex items-center gap-2.5 p-2.5 hover:bg-white/5 cursor-pointer transition-colors"
                    >
                      <Avatar src={getAvatarUrl(usr.avatar_url)} name={usr.full_name || usr.username} size="sm" />
                      <div className="flex flex-col text-left">
                        <span className="text-xs font-bold text-white">{usr.full_name || usr.username}</span>
                        <span className="text-[9px] text-slate-450">@{usr.username}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* List tagged creators */}
            {taggedUsers.length > 0 && (
              <div className="flex flex-wrap gap-2.5 mt-1">
                {taggedUsers.map((usr) => (
                  <span
                    key={usr.id}
                    className="inline-flex items-center gap-1 bg-[#6C63FF]/20 text-[#6C63FF] text-xs px-2.5 py-1 rounded-full border border-[#6C63FF]/10 font-bold"
                  >
                    <span>@{usr.username}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTagged(usr.id)}
                      className="hover:text-white transition-colors cursor-pointer text-[10px]"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Action trigger panel */}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSelectedPreview('');
                setSelectedFile(null);
              }}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handlePublishStory}
              disabled={uploadStory.isPending}
              className="rounded-xl px-6 bg-gradient-to-r from-[#6C63FF] to-[#A855F7] border-none font-bold"
            >
              {uploadStory.isPending ? 'Publishing...' : 'Share story'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* --- STANDALONE STORIES VIEWER PORTAL --- */}
      {viewingGroup && viewingGroup.stories.length > 0 && storyGroups && (
        createPortal(
          <AnimatePresence>
            <StoryViewer
              key="active-story-viewer"
              viewingGroup={viewingGroup}
              activeStoryIndex={activeStoryIndex}
              storyGroups={storyGroups}
              onClose={closeStoryViewer}
              onNext={nextStory}
              onPrev={prevStory}
              onGoToGroup={goToGroup}
            />
          </AnimatePresence>,
          document.body
        )
      )}
    </div>
  );
}

export default StoriesBar;
