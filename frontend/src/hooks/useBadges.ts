import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { UserBadge } from '@/types';
import { toast } from 'sonner';

export const BADGE_DETAILS = {
  early_adopter: {
    label: 'Early Adopter',
    desc: 'Joined StoryBridge in its pioneering days.',
    emoji: '🚀',
    color: 'from-blue-500 to-cyan-500',
  },
  story_writer: {
    label: 'Story Writer',
    desc: 'Shared 3 or more stories on the platform.',
    emoji: '✍️',
    color: 'from-indigo-500 to-purple-500',
  },
  community_builder: {
    label: 'Community Builder',
    desc: 'Founded at least one interest community.',
    emoji: '🏰',
    color: 'from-pink-500 to-rose-500',
  },
  photographer: {
    label: 'Photographer',
    desc: 'Posted stories containing visual photos.',
    emoji: '📸',
    color: 'from-teal-500 to-emerald-500',
  },
  social_butterfly: {
    label: 'Social Butterfly',
    desc: 'Built bridges by following 3 or more people.',
    emoji: '🦋',
    color: 'from-amber-500 to-orange-500',
  },
  top_creator: {
    label: 'Top Creator',
    desc: 'Earned by generating premium content.',
    emoji: '👑',
    color: 'from-yellow-400 to-amber-500',
  },
  explorer: {
    label: 'Explorer',
    desc: 'Active in exploring diverse stories.',
    emoji: '🧭',
    color: 'from-violet-500 to-fuchsia-500',
  },
  milestone_100: {
    label: 'Centurion',
    desc: 'Received 100 or more post likes.',
    emoji: '💯',
    color: 'from-red-500 to-pink-500',
  },
  milestone_1000: {
    label: 'Legend',
    desc: 'An inspiring veteran on the bridge.',
    emoji: '🌟',
    color: 'from-yellow-500 to-amber-600',
  },
} as const;

export function useBadges(userId?: string) {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);

  // 1. Fetch earned badges
  const useUserBadges = () => {
    const targetUserId = userId || currentUser?.id;
    return useQuery({
      queryKey: ['badges', targetUserId],
      queryFn: async () => {
        if (!targetUserId) return [];
        const { data, error } = await supabase
          .from('user_badges')
          .select('*')
          .eq('user_id', targetUserId)
          .order('earned_at', { ascending: true });

        if (error) throw error;
        return data as UserBadge[];
      },
      enabled: !!targetUserId,
    });
  };

  // 2. Award Badge Mutation
  const awardBadge = useMutation({
    mutationFn: async (badgeType: keyof typeof BADGE_DETAILS) => {
      if (!currentUser) throw new Error('Must be logged in to earn badges');

      // Check if already exists in DB to prevent duplicates
      const { data: existing } = await supabase
        .from('user_badges')
        .select('id')
        .eq('user_id', currentUser.id)
        .eq('badge_type', badgeType)
        .maybeSingle();

      if (existing) return null;

      const { data, error } = await supabase
        .from('user_badges')
        .insert({
          user_id: currentUser.id,
          badge_type: badgeType,
        })
        .select()
        .single();

      if (error) throw error;
      return data as UserBadge;
    },
    onSuccess: (data) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: ['badges', currentUser?.id] });
        const details = BADGE_DETAILS[data.badge_type as keyof typeof BADGE_DETAILS];
        toast(`🏆 Badge Earned: ${details.label}!`, {
          description: details.desc,
        });
      }
    },
  });

  // 3. Dynamic check & auto-award helper
  const checkAndAwardBadges = async () => {
    if (!currentUser || userId && userId !== currentUser.id) return;

    try {
      // Load current badges to check which ones are already earned
      const { data: currentBadges } = await supabase
        .from('user_badges')
        .select('badge_type')
        .eq('user_id', currentUser.id);

      const earnedSet = new Set(currentBadges?.map((b) => b.badge_type) || []);

      // a. Early adopter check (automatic)
      if (!earnedSet.has('early_adopter')) {
        await awardBadge.mutateAsync('early_adopter');
      }

      // b. Story writer check (>=3 posts)
      if (!earnedSet.has('story_writer')) {
        const { count } = await supabase
          .from('posts')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', currentUser.id);

        if (count !== null && count >= 3) {
          await awardBadge.mutateAsync('story_writer');
        }
      }

      // c. Photographer check (>=2 image posts)
      if (!earnedSet.has('photographer')) {
        const { count } = await supabase
          .from('posts')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', currentUser.id)
          .neq('image_url', '');

        if (count !== null && count >= 2) {
          await awardBadge.mutateAsync('photographer');
        }
      }

      // d. Community builder check (>=1 created community)
      if (!earnedSet.has('community_builder')) {
        const { count } = await supabase
          .from('communities')
          .select('id', { count: 'exact', head: true })
          .eq('creator_id', currentUser.id);

        if (count !== null && count >= 1) {
          await awardBadge.mutateAsync('community_builder');
        }
      }

      // e. Social Butterfly check (>=3 following)
      if (!earnedSet.has('social_butterfly')) {
        const { count } = await supabase
          .from('followers')
          .select('id', { count: 'exact', head: true })
          .eq('follower_id', currentUser.id);

        if (count !== null && count >= 3) {
          await awardBadge.mutateAsync('social_butterfly');
        }
      }
    } catch (err) {
      console.error('Error auto-awarding badges:', err);
    }
  };

  return {
    useUserBadges,
    awardBadge,
    checkAndAwardBadges,
  };
}
