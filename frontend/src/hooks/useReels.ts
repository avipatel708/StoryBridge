import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { Reel, ReelComment, Profile } from '@/types';
import { generateUniqueFileName, getFileMimeType } from '@/lib/utils';
import { toast } from 'sonner';

export function useReels() {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);

  // Helper to map and calculate stats for a reel record
  const mapReelStats = (reel: any, currentUserId: string | undefined): Reel => {
    const likes = reel.reel_likes || [];
    const comments = reel.reel_comments || [];
    const saves = reel.reel_saves || [];

    return {
      id: reel.id,
      user_id: reel.user_id,
      video_url: reel.video_url,
      cover_url: reel.cover_url,
      caption: reel.caption,
      hashtags: reel.hashtags || [],
      location: reel.location,
      created_at: reel.created_at,
      updated_at: reel.updated_at,
      profiles: reel.profiles as Profile,
      likes_count: likes.length,
      comments_count: comments.length,
      is_liked: currentUserId ? likes.some((l: any) => l.user_id === currentUserId) : false,
      is_saved: currentUserId ? saves.some((s: any) => s.user_id === currentUserId) : false,
      audio_track_id: reel.audio_track_id,
      audio_start_time: reel.audio_start_time || 0,
      scheduled_at: reel.scheduled_at,
    };
  };

  // Fetch all reels
  const useReelsList = () => {
    return useQuery({
      queryKey: ['reels', 'list', currentUser?.id],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('reels')
          .select(`
            *,
            profiles:user_id(*),
            reel_likes(user_id),
            reel_comments(id),
            reel_saves(user_id)
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;
        return (data || []).map((reel: any) => mapReelStats(reel, currentUser?.id));
      },
    });
  };

  // Fetch reels for a specific user
  const useUserReels = (targetUserId: string) => {
    return useQuery({
      queryKey: ['reels', 'user', targetUserId, currentUser?.id],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('reels')
          .select(`
            *,
            profiles:user_id(*),
            reel_likes(user_id),
            reel_comments(id),
            reel_saves(user_id)
          `)
          .eq('user_id', targetUserId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        return (data || []).map((reel: any) => mapReelStats(reel, currentUser?.id));
      },
      enabled: !!targetUserId,
    });
  };

  // Fetch saved reels for the current user
  const useSavedReelsList = () => {
    return useQuery({
      queryKey: ['reels', 'saved', currentUser?.id],
      queryFn: async () => {
        if (!currentUser) return [];

        // 1. Get saved reels items
        const { data: saves, error: savesError } = await supabase
          .from('reel_saves')
          .select('reel_id')
          .eq('user_id', currentUser.id);

        if (savesError) throw savesError;
        const reelIds = (saves || []).map((s) => s.reel_id);
        if (reelIds.length === 0) return [];

        // 2. Fetch the corresponding reels
        const { data, error } = await supabase
          .from('reels')
          .select(`
            *,
            profiles:user_id(*),
            reel_likes(user_id),
            reel_comments(id),
            reel_saves(user_id)
          `)
          .in('id', reelIds)
          .order('created_at', { ascending: false });

        if (error) throw error;
        return (data || []).map((reel: any) => mapReelStats(reel, currentUser?.id));
      },
      enabled: !!currentUser?.id,
    });
  };

  // Fetch comments for a specific reel
  const useReelCommentsList = (reelId: string) => {
    return useQuery({
      queryKey: ['reels', 'comments', reelId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('reel_comments')
          .select('*, profiles:user_id(*)')
          .eq('reel_id', reelId)
          .order('created_at', { ascending: true });

        if (error) throw error;
        return data as ReelComment[];
      },
      enabled: !!reelId,
    });
  };

  // Create Reel Mutation
  const createReel = useMutation({
    mutationFn: async ({
      videoFile,
      caption,
      location,
      hashtags = [],
      audioTrackId,
      audioStartTime,
      scheduledAt,
    }: {
      videoFile: File;
      caption: string;
      location?: string;
      hashtags?: string[];
      audioTrackId?: string;
      audioStartTime?: number;
      scheduledAt?: Date;
    }) => {
      if (!currentUser) throw new Error('Must be logged in to upload a reel');

      // 1. Upload video file to Supabase Storage
      const uniqueName = generateUniqueFileName(videoFile);
      const mimeType = getFileMimeType(videoFile);
      const { error: uploadError } = await supabase.storage
        .from('reels')
        .upload(uniqueName, videoFile, { contentType: mimeType });

      if (uploadError) throw uploadError;

      // 2. Generate cover_url or placeholder
      const coverUrl = `https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=360`;

      // 3. Insert record in reels table
      const { data, error } = await supabase
        .from('reels')
        .insert({
          user_id: currentUser.id,
          video_url: uniqueName,
          cover_url: coverUrl,
          caption,
          hashtags,
          location,
          audio_track_id: audioTrackId || null,
          audio_start_time: audioStartTime || 0,
          scheduled_at: scheduledAt ? scheduledAt.toISOString() : null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reels'] });
      toast.success('Your Reel has been uploaded successfully!');
    },
    onError: (err: any) => {
      toast.error(`Reel upload failed: ${err.message}`);
    },
  });

  // Like Reel Mutation
  const likeReel = useMutation({
    mutationFn: async (reelId: string) => {
      if (!currentUser) throw new Error('Must be logged in to like a reel');

      const { data, error } = await supabase
        .from('reel_likes')
        .insert({ reel_id: reelId, user_id: currentUser.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, reelId) => {
      queryClient.invalidateQueries({ queryKey: ['reels'] });
      queryClient.invalidateQueries({ queryKey: ['reels', 'comments', reelId] });
    },
  });

  // Unlike Reel Mutation
  const unlikeReel = useMutation({
    mutationFn: async (reelId: string) => {
      if (!currentUser) throw new Error('Must be logged in to unlike a reel');

      const { error } = await supabase
        .from('reel_likes')
        .delete()
        .eq('reel_id', reelId)
        .eq('user_id', currentUser.id);

      if (error) throw error;
      return reelId;
    },
    onSuccess: (_, reelId) => {
      queryClient.invalidateQueries({ queryKey: ['reels'] });
      queryClient.invalidateQueries({ queryKey: ['reels', 'comments', reelId] });
    },
  });

  // Comment on Reel Mutation
  const commentOnReel = useMutation({
    mutationFn: async ({ reelId, commentText }: { reelId: string; commentText: string }) => {
      if (!currentUser) throw new Error('Must be logged in to comment');

      const { data, error } = await supabase
        .from('reel_comments')
        .insert({
          reel_id: reelId,
          user_id: currentUser.id,
          comment_text: commentText,
        })
        .select('*, profiles:user_id(*)')
        .single();

      if (error) throw error;
      return data as ReelComment;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reels', 'comments', variables.reelId] });
      queryClient.invalidateQueries({ queryKey: ['reels'] });
    },
    onError: (err: any) => {
      toast.error(`Comment failed: ${err.message}`);
    },
  });

  // Save Reel Mutation
  const saveReel = useMutation({
    mutationFn: async (reelId: string) => {
      if (!currentUser) throw new Error('Must be logged in to save a reel');

      const { data, error } = await supabase
        .from('reel_saves')
        .insert({ reel_id: reelId, user_id: currentUser.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reels'] });
      queryClient.invalidateQueries({ queryKey: ['reels', 'saved', currentUser?.id] });
      toast.success('Saved to collection!');
    },
  });

  // Unsave Reel Mutation
  const unsaveReel = useMutation({
    mutationFn: async (reelId: string) => {
      if (!currentUser) throw new Error('Must be logged in to unsave a reel');

      const { error } = await supabase
        .from('reel_saves')
        .delete()
        .eq('reel_id', reelId)
        .eq('user_id', currentUser.id);

      if (error) throw error;
      return reelId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reels'] });
      queryClient.invalidateQueries({ queryKey: ['reels', 'saved', currentUser?.id] });
      toast.success('Removed from saved.');
    },
  });

  // Delete Reel Mutation
  const deleteReel = useMutation({
    mutationFn: async (reel: { id: string; video_url: string }) => {
      if (!currentUser) throw new Error('Must be logged in to delete a reel');

      // 1. Delete the video file from storage (ignore error if file already gone)
      if (reel.video_url && !reel.video_url.startsWith('http')) {
        await supabase.storage.from('reels').remove([reel.video_url]);
      }

      // 2. Delete the database record
      const { error } = await supabase
        .from('reels')
        .delete()
        .eq('id', reel.id)
        .eq('user_id', currentUser.id);

      if (error) throw error;
      return reel.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reels'] });
      queryClient.invalidateQueries({ queryKey: ['reels', 'saved', currentUser?.id] });
      toast.success('Reel deleted successfully.');
    },
    onError: (err: any) => {
      toast.error(`Failed to delete reel: ${err.message}`);
    },
  });

  return {
    useReelsList,
    useUserReels,
    useSavedReelsList,
    useReelCommentsList,
    createReel,
    deleteReel,
    likeReel,
    unlikeReel,
    commentOnReel,
    saveReel,
    unsaveReel,
  };
}
