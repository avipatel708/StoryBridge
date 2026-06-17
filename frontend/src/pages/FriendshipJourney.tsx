import React from 'react';
import { useParams, useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Heart, MessageSquare, Users, Sparkles, ArrowLeft, Calendar } from 'lucide-react';
import { useFriendshipJourney } from '@/hooks/useFriendshipJourney';
import { useAuthStore } from '@/stores/authStore';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Profile } from '@/types';

export default function FriendshipJourney() {
  const { userId: targetUserId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);

  const { useJourneyData } = useFriendshipJourney(targetUserId || '');
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
    enabled: !!targetUserId,
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
    enabled: !!currentUser?.id,
  });

  if (isJourneyLoading || isProfileLoading || isCurrentProfileLoading) {
    return (
      <div className="flex justify-center py-32">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isJourneyError || !targetProfile || !currentProfile) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <EmptyState
          title="Friendship Journey Not Found"
          description="Could not load relationship data between you and this user. Make sure you follow them."
          actionText="Back to Feed"
          onAction={() => navigate('/feed')}
        />
      </div>
    );
  }

  const friendsSinceDate = journey?.friendsSince
    ? new Date(journey.friendsSince).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Recently';

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto pb-16 px-1 sm:px-4">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white uppercase tracking-wider transition-colors mr-auto cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      {/* Connection Header Hero */}
      <div className="relative rounded-[2rem] border border-slate-200/50 dark:border-slate-800/50 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5 dark:from-indigo-950/20 dark:via-purple-950/10 dark:to-pink-950/20 p-8 text-center overflow-hidden">
        {/* Glow rings in background */}
        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 via-purple-500/5 to-pink-500/10 blur-3xl -z-10 rounded-full scale-75" />

        {/* Side-by-side Avatars with Glowing Bridge */}
        <div className="flex items-center justify-center gap-6 sm:gap-12 relative py-4">
          <div className="relative">
            <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full overflow-hidden border-4 border-white dark:border-slate-900 ring-4 ring-indigo-500/20 shadow-xl">
              <img src={currentProfile.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'} alt="" className="h-full w-full object-cover" />
            </div>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-2 truncate max-w-[100px] mx-auto">
              You
            </p>
          </div>

          {/* Animated Bridge Line Connector */}
          <div className="relative flex-1 max-w-[100px] h-1 border-t-2 border-dashed border-indigo-300 dark:border-indigo-800">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 h-8 w-8 rounded-full bg-white dark:bg-slate-950 border border-slate-200/50 dark:border-slate-850 flex items-center justify-center text-pink-500 shadow-md">
              <Heart className="h-4 w-4 fill-pink-500/20 animate-pulse" />
            </div>
          </div>

          <div className="relative">
            <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full overflow-hidden border-4 border-white dark:border-slate-900 ring-4 ring-purple-500/20 shadow-xl">
              <img src={targetProfile.avatar_url || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100'} alt="" className="h-full w-full object-cover" />
            </div>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-2 truncate max-w-[100px] mx-auto">
              {targetProfile.full_name || targetProfile.username}
            </p>
          </div>
        </div>

        <h1 className="text-xl sm:text-2xl font-extrabold font-outfit mt-4 text-slate-900 dark:text-white tracking-tight">
          Your Friendship Journey
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
          Celebrate your shared storytelling history and mutual connections on StoryBridge.
        </p>

        {/* Date milestone tag */}
        <div className="inline-flex items-center gap-1.5 mt-4 bg-indigo-500/10 border border-indigo-500/10 px-4 py-1.5 rounded-full text-indigo-600 dark:text-indigo-400 text-xs font-bold font-outfit">
          <Calendar className="h-3.5 w-3.5" />
          <span>Connected Since {friendsSinceDate}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="border border-slate-200/40 dark:border-slate-800/40 bg-white dark:bg-slate-950/40 rounded-2xl p-4 flex items-center gap-3.5 text-left shadow-sm">
          <div className="p-3 rounded-xl bg-pink-500/10 text-pink-500">
            <Heart className="h-5 w-5 fill-pink-500/20" />
          </div>
          <div>
            <p className="text-xl font-extrabold font-outfit text-slate-850 dark:text-slate-250">
              {journey?.likesExchangedCount || 0}
            </p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Likes Exchanged</p>
          </div>
        </div>

        <div className="border border-slate-200/40 dark:border-slate-800/40 bg-white dark:bg-slate-950/40 rounded-2xl p-4 flex items-center gap-3.5 text-left shadow-sm">
          <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-500">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xl font-extrabold font-outfit text-slate-850 dark:text-slate-250">
              {journey?.commentsExchangedCount || 0}
            </p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Comments Exchanged</p>
          </div>
        </div>
      </div>

      {/* Mutual Friends Section */}
      <div className="border border-slate-200/40 dark:border-slate-800/40 bg-white dark:bg-slate-950/40 rounded-3xl p-6 text-left shadow-sm">
        <h3 className="text-sm font-bold font-outfit text-slate-850 dark:text-slate-200 mb-4 flex items-center gap-2 select-none">
          <Users className="h-4.5 w-4.5 text-indigo-500" />
          Mutual Friends ({journey?.mutualFriends?.length || 0})
        </h3>
        
        {journey?.mutualFriends && journey.mutualFriends.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {journey.mutualFriends.map((friend) => (
              <div
                key={friend.id}
                onClick={() => navigate(`/profile/${friend.username}`)}
                className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-800"
              >
                <div className="h-8 w-8 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                  <img src={friend.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=60'} alt="" className="h-full w-full object-cover" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-855 dark:text-slate-200 truncate leading-none">
                    {friend.full_name || friend.username}
                  </p>
                  <p className="text-[9px] text-slate-400 mt-1 truncate">@{friend.username}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400">No mutual friends found.</p>
        )}
      </div>

      {/* Interactive Comments History Timeline */}
      <div className="border border-slate-200/40 dark:border-slate-800/40 bg-white dark:bg-slate-950/40 rounded-3xl p-6 text-left shadow-sm">
        <h3 className="text-sm font-bold font-outfit text-slate-850 dark:text-slate-200 mb-6 flex items-center gap-2 select-none">
          <MessageSquare className="h-4.5 w-4.5 text-indigo-500" />
          Story Conversations & Comments
        </h3>

        {journey?.comments && journey.comments.length > 0 ? (
          <div className="relative pl-6 border-l border-slate-100 dark:border-slate-800 flex flex-col gap-6 ml-3 py-1">
            {journey.comments.map((comment) => {
              const commenter = comment.profiles as Profile;
              const isCommenterMe = commenter.id === currentUser?.id;
              
              return (
                <div key={comment.id} className="relative text-left">
                  {/* Floating avatar alignment node */}
                  <div className="absolute -left-[35px] top-0.5 h-6.5 w-6.5 rounded-full overflow-hidden ring-2 ring-white dark:ring-[#0B0F19] shadow-sm z-10 bg-slate-100">
                    <img src={commenter.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=60'} alt="" className="h-full w-full object-cover" />
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {isCommenterMe ? 'You' : commenter.full_name || commenter.username}
                      </span>
                      <span className="text-[9px] text-slate-400">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/50 rounded-2xl p-3.5 mt-1 max-w-[95%]">
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                        &ldquo;{comment.content}&rdquo;
                      </p>
                      
                      {comment.posts && (
                        <div className="mt-2.5 pt-2.5 border-t border-slate-200/40 dark:border-slate-800/40 flex flex-col gap-1">
                          <span className="text-[8px] font-bold text-indigo-400 uppercase tracking-wider">On Story Post:</span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 italic truncate max-w-sm">
                            {comment.posts.content || 'Photo Story'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 text-xs text-slate-400">
            No comments exchanged on stories yet. Try interacting on stories in your feed!
          </div>
        )}
      </div>
    </div>
  );
}
