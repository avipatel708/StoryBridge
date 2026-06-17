import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Heart, MessageSquare, Users, Sparkles, Calendar, Zap, Award } from 'lucide-react';
import { useFriendshipJourney } from '@/hooks/useFriendshipJourney';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Spinner } from '@/components/ui/Spinner';
import { getAvatarUrl } from '@/lib/utils';
import { Profile } from '@/types';
import { useAuthStore } from '@/stores/authStore';

interface FriendshipJourneyModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUserId: string;
}

export function FriendshipJourneyModal({ isOpen, onClose, targetUserId }: FriendshipJourneyModalProps) {
  const currentUser = useAuthStore((state) => state.user);
  const [activeSubTab, setActiveSubTab] = useState<'conversations' | 'mutuals'>('conversations');

  const { useJourneyData } = useFriendshipJourney(targetUserId);
  const { data: journey, isLoading: isJourneyLoading, isError: isJourneyError } = useJourneyData();

  // Fetch target user profile
  const { data: targetProfile, isLoading: isProfileLoading } = useQuery({
    queryKey: ['profile-simple', targetUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetUserId)
        .single();
      
      if (error) throw error;
      return data as Profile;
    },
    enabled: !!targetUserId && isOpen,
  });

  // Fetch current user profile details
  const { data: currentProfile, isLoading: isCurrentProfileLoading } = useQuery({
    queryKey: ['profile-simple', currentUser?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser?.id)
        .single();
      
      if (error) throw error;
      return data as Profile;
    },
    enabled: !!currentUser?.id && isOpen,
  });

  if (!isOpen) return null;

  const isLoading = isJourneyLoading || isProfileLoading || isCurrentProfileLoading;
  const isError = isJourneyError || !targetProfile || !currentProfile;

  // Calculate resonance stats
  const likesCount = journey?.likesExchangedCount || 0;
  const commentsCount = journey?.commentsExchangedCount || 0;
  
  // Calculate a gamified "Resonance Score"
  const resonanceScore = (likesCount * 12) + (commentsCount * 28);
  
  // Determine connection level and tier description
  let connectionTier = 'Seedling';
  let tierColor = 'from-green-400 to-emerald-500';
  let badgeLabel = 'New Connection';

  if (resonanceScore >= 350) {
    connectionTier = 'Soul Connection';
    tierColor = 'from-indigo-400 via-purple-400 to-pink-400';
    badgeLabel = 'Twin Flames';
  } else if (resonanceScore >= 180) {
    connectionTier = 'Resonant Companions';
    tierColor = 'from-indigo-400 to-purple-500';
    badgeLabel = 'Close Friends';
  } else if (resonanceScore >= 60) {
    connectionTier = 'Warm Acquaintances';
    tierColor = 'from-pink-400 to-rose-500';
    badgeLabel = 'Frequent Collaborators';
  } else if (resonanceScore > 0) {
    connectionTier = 'Kindred Sparks';
    tierColor = 'from-orange-400 to-amber-500';
    badgeLabel = 'Active Bond';
  }

  const friendsSinceDate = journey?.friendsSince
    ? new Date(journey.friendsSince).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Recently';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Dark glass backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
        />

        {/* Modal Card Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative w-full max-w-lg bg-[#0d1222]/95 border border-slate-800/80 dark:border-indigo-500/20 rounded-[2.5rem] p-6 sm:p-7 shadow-2xl shadow-indigo-950/40 overflow-hidden text-white"
        >
          {/* Decorative floating cosmic background blobs */}
          <div className="absolute -top-20 -left-20 h-44 w-44 rounded-full bg-indigo-500/10 blur-[80px] pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 h-44 w-44 rounded-full bg-pink-500/10 blur-[80px] pointer-events-none" />

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer border border-slate-800/80 shadow-md z-50"
          >
            <X className="h-4.5 w-4.5" />
          </button>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Spinner size="lg" variant="primary" />
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest animate-pulse">
                Mapping friendship coordinates...
              </span>
            </div>
          ) : isError ? (
            <div className="py-10 text-center flex flex-col items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold font-outfit">Failed to load connection data</h3>
              <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                We couldn&apos;t load the journey coordinates. Ensure you both follow each other.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-6 text-left relative z-10">
              {/* Monogram branding indicator */}
              <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
                <Sparkles className="h-4.5 w-4.5 text-indigo-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest font-mono text-indigo-400">
                  StoryBridge Connection Journey
                </span>
              </div>

              {/* Side-by-side Avatars with Glowing Beams */}
              <div className="flex items-center justify-center gap-4 relative py-2">
                {/* Current User */}
                <div className="flex flex-col items-center text-center">
                  <div className="relative p-0.5 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 shadow-lg shadow-indigo-500/10">
                    <div className="h-16 w-16 sm:h-18 sm:w-18 rounded-full overflow-hidden border-2 border-[#0d1222] bg-slate-900">
                      <img src={currentProfile.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'} alt="" className="h-full w-full object-cover" />
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 truncate max-w-[80px] mt-1.5 block">
                    You
                  </span>
                </div>

                {/* Animated Bridge Energy Stream */}
                <div className="flex-1 max-w-[120px] flex flex-col items-center justify-center relative">
                  {/* Energy Bridge Line SVG */}
                  <svg className="w-full h-8 overflow-visible" viewBox="0 0 100 20">
                    <defs>
                      <linearGradient id="bridgeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="50%" stopColor="#a855f7" />
                        <stop offset="100%" stopColor="#ec4899" />
                      </linearGradient>
                    </defs>
                    {/* Background path line */}
                    <path d="M 0,10 Q 50,20 100,10" fill="none" stroke="rgba(99, 102, 241, 0.15)" strokeWidth="3" />
                    {/* Animated stream path line */}
                    <path
                      d="M 0,10 Q 50,20 100,10"
                      fill="none"
                      stroke="url(#bridgeGrad)"
                      strokeWidth="3.5"
                      strokeDasharray="6, 6"
                      strokeDashoffset="12"
                      className="animate-[dash_10s_linear_infinite]"
                      style={{
                        animation: 'bridge-flow 2s linear infinite'
                      }}
                    />
                  </svg>
                  <div className="h-7 w-7 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-pink-500 shadow shadow-pink-500/10 -mt-1 z-10">
                    <Heart className="h-3 w-3 fill-pink-500/20 animate-pulse" />
                  </div>
                </div>

                {/* Target User */}
                <div className="flex flex-col items-center text-center">
                  <div className="relative p-0.5 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 shadow-lg shadow-pink-500/10">
                    <div className="h-16 w-16 sm:h-18 sm:w-18 rounded-full overflow-hidden border-2 border-[#0d1222] bg-slate-900">
                      <img src={targetProfile.avatar_url || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100'} alt="" className="h-full w-full object-cover" />
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-slate-200 truncate max-w-[90px] mt-1.5 block">
                    {targetProfile.full_name || targetProfile.username}
                  </span>
                </div>
              </div>

              {/* Relationship Tier & Custom Level Meter */}
              <div className="bg-slate-950/40 border border-slate-850 p-4.5 rounded-3xl relative overflow-hidden flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Friendship Resonance</span>
                    <span className={`text-base font-extrabold bg-gradient-to-r ${tierColor} bg-clip-text text-transparent`}>
                      {connectionTier}
                    </span>
                  </div>
                  <div className="px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[9px] font-bold text-indigo-400 flex items-center gap-1 uppercase">
                    <Award className="h-3 w-3" />
                    {badgeLabel}
                  </div>
                </div>

                {/* Custom Glowing Progress Bar */}
                <div className="h-2 w-full rounded-full bg-slate-900 border border-slate-850 overflow-hidden relative">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (resonanceScore / 400) * 100)}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className={`h-full bg-gradient-to-r ${tierColor} rounded-full`}
                  />
                </div>

                <div className="flex items-center justify-between text-[9px] font-bold text-slate-500 uppercase">
                  <span>Score: {resonanceScore} pts</span>
                  <span>Target: 400 pts</span>
                </div>
              </div>

              {/* Date & Core stats row */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-950/20 border border-slate-850 rounded-2xl p-3 flex flex-col gap-1 items-center text-center">
                  <Calendar className="h-4.5 w-4.5 text-indigo-400" />
                  <span className="text-slate-500 text-[8px] font-bold uppercase mt-1">FRIENDS SINCE</span>
                  <span className="text-[10px] font-bold text-slate-200 truncate max-w-full">
                    {friendsSinceDate}
                  </span>
                </div>

                <div className="bg-slate-950/20 border border-slate-850 rounded-2xl p-3 flex flex-col gap-1 items-center text-center">
                  <Heart className="h-4.5 w-4.5 text-pink-500 fill-pink-500/10" />
                  <span className="text-slate-500 text-[8px] font-bold uppercase mt-1">LIKES</span>
                  <span className="text-xs font-extrabold text-slate-200">
                    {likesCount}
                  </span>
                </div>

                <div className="bg-slate-950/20 border border-slate-850 rounded-2xl p-3 flex flex-col gap-1 items-center text-center">
                  <MessageSquare className="h-4.5 w-4.5 text-cyan-400" />
                  <span className="text-slate-500 text-[8px] font-bold uppercase mt-1">COMMENTS</span>
                  <span className="text-xs font-extrabold text-slate-200">
                    {commentsCount}
                  </span>
                </div>
              </div>

              {/* Tab Selector inside Modal */}
              <div className="flex border-b border-slate-850 text-xs font-bold font-outfit select-none">
                <button
                  type="button"
                  onClick={() => setActiveSubTab('conversations')}
                  className={`flex-1 pb-2 border-b-2 text-center transition-colors cursor-pointer ${
                    activeSubTab === 'conversations'
                      ? 'border-indigo-500 text-indigo-400'
                      : 'border-transparent text-slate-450 hover:text-slate-200'
                  }`}
                >
                  Story Exchanges ({journey?.comments?.length || 0})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSubTab('mutuals')}
                  className={`flex-1 pb-2 border-b-2 text-center transition-colors cursor-pointer ${
                    activeSubTab === 'mutuals'
                      ? 'border-indigo-500 text-indigo-400'
                      : 'border-transparent text-slate-450 hover:text-slate-200'
                  }`}
                >
                  Mutual Connections ({journey?.mutualFriends?.length || 0})
                </button>
              </div>

              {/* Tab Panels */}
              <div className="max-h-52 overflow-y-auto pr-1">
                {activeSubTab === 'conversations' && (
                  <div className="flex flex-col gap-3.5 pl-3 border-l border-slate-850 py-1">
                    {journey?.comments && journey.comments.length > 0 ? (
                      journey.comments.map((comment) => {
                        const commenterName = comment.profiles?.id === currentUser?.id ? 'You' : comment.profiles?.full_name || comment.profiles?.username;
                        
                        return (
                          <div key={comment.id} className="relative text-xs flex flex-col gap-1">
                            {/* Marker dot */}
                            <div className="absolute -left-[17px] top-1.5 h-2 w-2 rounded-full bg-indigo-500 ring-4 ring-indigo-950/40" />

                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-200">{commenterName}</span>
                              <span className="text-[9px] text-slate-500">
                                {new Date(comment.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-slate-400 italic font-sans leading-relaxed">
                              &ldquo;{comment.content}&rdquo;
                            </p>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-xs text-slate-550 italic text-center py-6">
                        No comment stories shared yet.
                      </p>
                    )}
                  </div>
                )}

                {activeSubTab === 'mutuals' && (
                  <div className="grid grid-cols-2 gap-3.5">
                    {journey?.mutualFriends && journey.mutualFriends.length > 0 ? (
                      journey.mutualFriends.map((friend) => (
                        <div key={friend.id} className="flex items-center gap-2.5 bg-slate-950/15 border border-slate-900 p-2 rounded-xl">
                          <div className="h-7 w-7 rounded-full overflow-hidden bg-slate-800">
                            <img src={friend.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=60'} alt="" className="w-full h-full object-cover" />
                          </div>
                          <div className="min-w-0 text-left">
                            <p className="text-xs font-bold text-slate-200 truncate leading-none">
                              {friend.full_name || friend.username}
                            </p>
                            <p className="text-[9px] text-slate-500 mt-1 truncate">@{friend.username}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-550 italic text-center col-span-2 py-6">
                        No mutual friends found.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Inject bridge-flow styles to support smooth animation flow */}
      <style>{`
        @keyframes bridge-flow {
          0% {
            stroke-dashoffset: 24;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </AnimatePresence>
  );
}
