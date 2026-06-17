import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { StoryCapsule, StoryCapsuleItem, Post } from '@/types';
import { generateUniqueFileName, getFileMimeType } from '@/lib/utils';
import { toast } from 'sonner';

export function useCapsules(userId?: string) {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);

  // Fetch capsules for a user
  const useUserCapsules = () => {
    const targetUserId = userId || currentUser?.id;
    return useQuery({
      queryKey: ['capsules', 'user', targetUserId],
      queryFn: async () => {
        if (!targetUserId) return [];
        const { data, error } = await supabase
          .from('story_capsules')
          .select('*, profiles:user_id(*), items:story_capsule_items(id)')
          .eq('user_id', targetUserId)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Map items count manually to match type structure
        return (data || []).map((capsule: any) => ({
          ...capsule,
          items_count: capsule.items?.length || 0,
        })) as StoryCapsule[];
      },
      enabled: !!targetUserId,
    });
  };

  // Fetch a single capsule detail
  const useCapsuleDetails = (capsuleId: string) => {
    return useQuery({
      queryKey: ['capsule', capsuleId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('story_capsules')
          .select('*, profiles:user_id(*)')
          .eq('id', capsuleId)
          .single();

        if (error) throw error;
        return data as StoryCapsule;
      },
      enabled: !!capsuleId,
    });
  };

  // Fetch items inside a capsule (posts)
  const useCapsuleItems = (capsuleId: string) => {
    return useQuery({
      queryKey: ['capsule-items', capsuleId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('story_capsule_items')
          .select('*, posts(*, profiles:user_id(*), likes(user_id), comments(id), saved_posts(user_id))')
          .eq('capsule_id', capsuleId)
          .order('sort_order', { ascending: true });

        if (error) throw error;

        // Process posts data to populate frontend helper fields
        return (data || []).map((item: any) => {
          const post = item.posts;
          if (!post) return item;

          const likes_count = post.likes?.length || 0;
          const comments_count = post.comments?.length || 0;
          const is_liked = currentUser ? (post.likes || []).some((l: any) => l.user_id === currentUser.id) : false;
          const is_saved = currentUser ? (post.saved_posts || []).some((s: any) => s.user_id === currentUser.id) : false;

          return {
            ...item,
            posts: {
              ...post,
              likes_count,
              comments_count,
              is_liked,
              is_saved,
            } as Post,
          } as StoryCapsuleItem;
        });
      },
      enabled: !!capsuleId,
    });
  };

  // Create Capsule Mutation
  const createCapsule = useMutation({
    mutationFn: async ({
      title,
      description,
      isPublic,
      coverFile,
    }: {
      title: string;
      description: string;
      isPublic: boolean;
      coverFile?: File | null;
    }) => {
      if (!currentUser) throw new Error('Must be logged in to create a capsule');

      let coverUrl = '';

      // Upload cover file if provided
      if (coverFile) {
        const fileName = generateUniqueFileName(coverFile);
        const mimeType = getFileMimeType(coverFile);
        const { error: uploadError } = await supabase.storage
          .from('capsules')
          .upload(fileName, coverFile, { contentType: mimeType });

        if (uploadError) throw uploadError;
        coverUrl = fileName;
      }

      const { data, error } = await supabase
        .from('story_capsules')
        .insert({
          user_id: currentUser.id,
          title,
          description,
          is_public: isPublic,
          cover_url: coverUrl,
        })
        .select()
        .single();

      if (error) throw error;
      return data as StoryCapsule;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['capsules', 'user', currentUser?.id] });
      toast.success('Story Capsule created successfully!');
    },
    onError: (err: any) => {
      toast.error(`Failed to create capsule: ${err.message}`);
    },
  });

  // Delete Capsule Mutation
  const deleteCapsule = useMutation({
    mutationFn: async (capsuleId: string) => {
      const { error } = await supabase
        .from('story_capsules')
        .delete()
        .eq('id', capsuleId);

      if (error) throw error;
      return capsuleId;
    },
    onSuccess: (capsuleId) => {
      queryClient.invalidateQueries({ queryKey: ['capsules', 'user', currentUser?.id] });
      queryClient.removeQueries({ queryKey: ['capsule', capsuleId] });
      toast.success('Story Capsule deleted.');
    },
    onError: (err: any) => {
      toast.error(`Failed to delete capsule: ${err.message}`);
    },
  });

  // Add post to Capsule
  const addPostToCapsule = useMutation({
    mutationFn: async ({ capsuleId, postId }: { capsuleId: string; postId: string }) => {
      // Get current max order to append at the end
      const { data: currentItems } = await supabase
        .from('story_capsule_items')
        .select('sort_order')
        .eq('capsule_id', capsuleId);
      
      const maxSortOrder = currentItems && currentItems.length > 0
        ? Math.max(...currentItems.map(i => i.sort_order || 0))
        : -1;

      const { data, error } = await supabase
        .from('story_capsule_items')
        .insert({
          capsule_id: capsuleId,
          post_id: postId,
          sort_order: maxSortOrder + 1,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['capsule-items', variables.capsuleId] });
      queryClient.invalidateQueries({ queryKey: ['capsules', 'user', currentUser?.id] });
      toast.success('Post added to capsule!');
    },
    onError: (err: any) => {
      toast.error(`Already in capsule or error: ${err.message}`);
    },
  });

  // Remove post from Capsule
  const removePostFromCapsule = useMutation({
    mutationFn: async ({ capsuleId, postId }: { capsuleId: string; postId: string }) => {
      const { error } = await supabase
        .from('story_capsule_items')
        .delete()
        .eq('capsule_id', capsuleId)
        .eq('post_id', postId);

      if (error) throw error;
      return { capsuleId, postId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['capsule-items', data.capsuleId] });
      queryClient.invalidateQueries({ queryKey: ['capsules', 'user', currentUser?.id] });
      toast.success('Post removed from capsule.');
    },
    onError: (err: any) => {
      toast.error(`Failed to remove post: ${err.message}`);
    },
  });

  return {
    useUserCapsules,
    useCapsuleDetails,
    useCapsuleItems,
    createCapsule,
    deleteCapsule,
    addPostToCapsule,
    removePostFromCapsule,
  };
}
