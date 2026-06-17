import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { Profile } from '@/types';

export interface FriendshipJourneyStats {
  friendsSince: string | null;
  mutualFriends: Profile[];
  commentsExchangedCount: number;
  likesExchangedCount: number;
  comments: any[];
}

export function useFriendshipJourney(targetUserId: string) {
  const currentUser = useAuthStore((state) => state.user);

  const useJourneyData = () => {
    return useQuery({
      queryKey: ['friendship-journey', currentUser?.id, targetUserId],
      queryFn: async (): Promise<FriendshipJourneyStats> => {
        if (!currentUser || !targetUserId) {
          return {
            friendsSince: null,
            mutualFriends: [],
            commentsExchangedCount: 0,
            likesExchangedCount: 0,
            comments: [],
          };
        }

        // 1. Friends Since (Follow date)
        const { data: follow1 } = await supabase
          .from('followers')
          .select('created_at')
          .eq('follower_id', currentUser.id)
          .eq('following_id', targetUserId)
          .maybeSingle();

        const { data: follow2 } = await supabase
          .from('followers')
          .select('created_at')
          .eq('follower_id', targetUserId)
          .eq('following_id', currentUser.id)
          .maybeSingle();

        let friendsSince: string | null = null;
        if (follow1 && follow2) {
          // Both follow each other - mutual follow date
          const date1 = new Date(follow1.created_at);
          const date2 = new Date(follow2.created_at);
          friendsSince = (date1 < date2 ? date1 : date2).toISOString();
        } else if (follow1) {
          friendsSince = follow1.created_at;
        } else if (follow2) {
          friendsSince = follow2.created_at;
        }

        // 2. Mutual Friends
        // Profiles followed by current user
        const { data: followingCurrent } = await supabase
          .from('followers')
          .select('following_id, profiles:following_id(*)')
          .eq('follower_id', currentUser.id);

        // Profiles followed by target user
        const { data: followingTarget } = await supabase
          .from('followers')
          .select('following_id, profiles:following_id(*)')
          .eq('follower_id', targetUserId);

        const currentFollowingIds = new Set(followingCurrent?.map((f) => f.following_id) || []);
        const mutualFriends: Profile[] = [];

        (followingTarget || []).forEach((item) => {
          if (item.following_id !== currentUser.id && item.following_id !== targetUserId && currentFollowingIds.has(item.following_id)) {
            if (item.profiles) {
              mutualFriends.push(item.profiles as unknown as Profile);
            }
          }
        });

        // 3. Comments Exchanged
        // Current user comments on target user's posts
        const { data: commentsA } = await supabase
          .from('comments')
          .select('*, posts!inner(user_id, content), profiles:user_id(*)')
          .eq('user_id', currentUser.id)
          .eq('posts.user_id', targetUserId);

        // Target user comments on current user's posts
        const { data: commentsB } = await supabase
          .from('comments')
          .select('*, posts!inner(user_id, content), profiles:user_id(*)')
          .eq('user_id', targetUserId)
          .eq('posts.user_id', currentUser.id);

        const comments = [...(commentsA || []), ...(commentsB || [])].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        // 4. Likes Exchanged
        const { count: likesA } = await supabase
          .from('likes')
          .select('id, posts!inner(user_id)', { count: 'exact', head: true })
          .eq('user_id', currentUser.id)
          .eq('posts.user_id', targetUserId);

        const { count: likesB } = await supabase
          .from('likes')
          .select('id, posts!inner(user_id)', { count: 'exact', head: true })
          .eq('user_id', targetUserId)
          .eq('posts.user_id', currentUser.id);

        const likesExchangedCount = (likesA || 0) + (likesB || 0);

        return {
          friendsSince,
          mutualFriends,
          commentsExchangedCount: comments.length,
          likesExchangedCount,
          comments,
        };
      },
      enabled: !!currentUser?.id && !!targetUserId,
    });
  };

  return {
    useJourneyData,
  };
}
