import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { Profile } from '@/types';
import { generateUniqueFileName, getFileMimeType } from '@/lib/utils';
import { toast } from 'sonner';

export function useProfile(profileId?: string) {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);
  const setProfile = useAuthStore((state) => state.setProfile);

  // Fetch single profile details by ID
  const useProfileById = (id: string) => {
    return useQuery({
      queryKey: ['profile', id],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        return data as Profile;
      },
      enabled: !!id,
    });
  };

  // Fetch profile by username
  const useProfileByUsername = (username: string) => {
    return useQuery({
      queryKey: ['profile', 'username', username],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('username', username)
          .single();

        if (error) throw error;
        return data as Profile;
      },
      enabled: !!username,
    });
  };

  // Fetch user stats (follower/following count)
  const useProfileStats = (id: string) => {
    return useQuery({
      queryKey: ['profile', 'stats', id],
      queryFn: async () => {
        // Fetch follower count
        const { count: followersCount, error: followersError } = await supabase
          .from('followers')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', id);

        if (followersError) throw followersError;

        // Fetch following count
        const { count: followingCount, error: followingError } = await supabase
          .from('followers')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', id);

        if (followingError) throw followingError;

        // Fetch posts count
        const { count: postsCount, error: postsError } = await supabase
          .from('posts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', id);

        if (postsError) throw postsError;

        // Check if current user is following this profile
        let isFollowing = false;
        if (currentUser && currentUser.id !== id) {
          const { data, error } = await supabase
            .from('followers')
            .select('id')
            .eq('follower_id', currentUser.id)
            .eq('following_id', id)
            .maybeSingle();

          if (!error && data) {
            isFollowing = true;
          }
        }

        return {
          followersCount: followersCount || 0,
          followingCount: followingCount || 0,
          postsCount: postsCount || 0,
          isFollowing,
        };
      },
      enabled: !!id,
    });
  };

  // Fetch Followers list
  const useFollowersList = (id: string) => {
    return useQuery({
      queryKey: ['profile', 'followers', id],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('followers')
          .select('profiles:follower_id(*)')
          .eq('following_id', id);

        if (error) throw error;
        return (data || []).map((f) => f.profiles) as unknown as Profile[];
      },
      enabled: !!id,
    });
  };

  // Fetch Following list
  const useFollowingList = (id: string) => {
    return useQuery({
      queryKey: ['profile', 'following', id],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('followers')
          .select('profiles:following_id(*)')
          .eq('follower_id', id);

        if (error) throw error;
        return (data || []).map((f) => f.profiles) as unknown as Profile[];
      },
      enabled: !!id,
    });
  };

  // Follow/Unfollow user Mutation
  const toggleFollow = useMutation({
    mutationFn: async ({ targetId, isFollowing }: { targetId: string; isFollowing: boolean }) => {
      if (!currentUser) throw new Error('Must be logged in to follow users');

      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('followers')
          .delete()
          .eq('follower_id', currentUser.id)
          .eq('following_id', targetId);

        if (error) throw error;
        return { targetId, following: false };
      } else {
        // Follow
        const { error } = await supabase
          .from('followers')
          .insert({
            follower_id: currentUser.id,
            following_id: targetId,
          });

        if (error) throw error;
        return { targetId, following: true };
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['profile', 'stats', data.targetId] });
      queryClient.invalidateQueries({ queryKey: ['profile', 'stats', currentUser?.id] });
      queryClient.invalidateQueries({ queryKey: ['profile', 'followers', data.targetId] });
      queryClient.invalidateQueries({ queryKey: ['profile', 'following', currentUser?.id] });
      queryClient.invalidateQueries({ queryKey: ['posts', 'feed'] }); // Feed changed because of follow changes
      queryClient.invalidateQueries({ queryKey: ['users', 'suggested'] });
    },
    onError: (err: any) => {
      toast.error(`Follow operation failed: ${err.message}`);
    },
  });

  // Update Profile Mutation
  const updateProfile = useMutation({
    mutationFn: async ({
      username,
      fullName,
      bio,
      interests,
      avatarFile,
      coverFile,
      isOnboarded = true,
    }: {
      username?: string;
      fullName?: string;
      bio?: string;
      interests?: string[];
      avatarFile?: File | null;
      coverFile?: File | null;
      isOnboarded?: boolean;
    }) => {
      if (!currentUser) throw new Error('Must be logged in to update profile');

      const updates: Record<string, unknown> = {
        id: currentUser.id,
      };
      if (username !== undefined) updates.username = username;
      if (fullName !== undefined) updates.full_name = fullName;
      if (bio !== undefined) updates.bio = bio;
      if (interests !== undefined) updates.interests = interests;
      updates.is_onboarded = isOnboarded;

      // Handle avatar file upload
      if (avatarFile) {
        const uniqueName = generateUniqueFileName(avatarFile);
        const mimeType = getFileMimeType(avatarFile);
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(uniqueName, avatarFile, { upsert: true, contentType: mimeType });

        if (uploadError) {
          console.warn('Avatar upload skipped:', uploadError.message);
        } else {
          updates.avatar_url = uniqueName;
        }
      }

      // Handle cover file upload
      if (coverFile) {
        const uniqueName = generateUniqueFileName(coverFile);
        const mimeType = getFileMimeType(coverFile);
        const { error: uploadError } = await supabase.storage
          .from('covers')
          .upload(uniqueName, coverFile, { upsert: true, contentType: mimeType });

        if (uploadError) {
          console.warn('Cover upload skipped:', uploadError.message);
        } else {
          updates.cover_url = uniqueName;
        }
      }

      const { data, error } = await supabase
        .from('profiles')
        .upsert(updates, { onConflict: 'id' })
        .select()
        .single();

      if (error) throw error;
      return data as Profile;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['profile', currentUser?.id] });
      queryClient.invalidateQueries({ queryKey: ['profile', 'username', data.username] });
      setProfile(data); // Sync Zustand auth profile
      toast.success('Profile updated successfully!');
    },
    onError: (err: any) => {
      toast.error(`Failed to update profile: ${err.message}`);
    },
  });

  // Fetch suggested users (who to follow)
  const useSuggestedUsers = (limit = 5) => {
    return useQuery({
      queryKey: ['users', 'suggested', currentUser?.id, limit],
      queryFn: async () => {
        if (!currentUser) return [];

        // 1. Fetch users already following
        const { data: followed } = await supabase
          .from('followers')
          .select('following_id')
          .eq('follower_id', currentUser.id);

        const followedIds = followed?.map((f) => f.following_id) || [];
        const excludeIds = [currentUser.id, ...followedIds];

        // 2. Fetch random/top other profiles
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('*')
          .not('id', 'in', `(${excludeIds.join(',')})`)
          .eq('is_onboarded', true)
          .limit(limit);

        if (error) {
          // If in query error due to empty exclude list or malformed SQL, handle it
          const { data: fallbackProfiles, error: fallbackError } = await supabase
            .from('profiles')
            .select('*')
            .neq('id', currentUser.id)
            .eq('is_onboarded', true)
            .limit(limit);
          
          if (fallbackError) throw fallbackError;
          return fallbackProfiles as Profile[];
        }

        return profiles as Profile[];
      },
      enabled: !!currentUser,
    });
  };

  // Search users by username or display name
  const useSearchUsers = (query: string) => {
    const trimmed = query.trim();

    return useQuery({
      queryKey: ['users', 'search', trimmed],
      queryFn: async () => {
        if (!trimmed) return [];

        const pattern = `%${trimmed}%`;

        const [byUsername, byName] = await Promise.all([
          supabase
            .from('profiles')
            .select('*')
            .ilike('username', pattern)
            .eq('is_onboarded', true)
            .limit(20),
          supabase
            .from('profiles')
            .select('*')
            .ilike('full_name', pattern)
            .eq('is_onboarded', true)
            .limit(20),
        ]);

        if (byUsername.error) throw byUsername.error;
        if (byName.error) throw byName.error;

        const merged = new Map<string, Profile>();
        [...(byUsername.data || []), ...(byName.data || [])].forEach((row) => {
          merged.set(row.id, row as Profile);
        });

        return Array.from(merged.values()).slice(0, 20);
      },
      enabled: trimmed.length > 0,
      staleTime: 30_000,
    });
  };

  return {
    useProfileById,
    useProfileByUsername,
    useProfileStats,
    useFollowersList,
    useFollowingList,
    toggleFollow,
    updateProfile,
    useSuggestedUsers,
    useSearchUsers,
  };
}
