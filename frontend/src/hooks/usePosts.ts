import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { Post } from '@/types';
import { generateUniqueFileName, isVideoFile, getFileMimeType } from '@/lib/utils';
import { toast } from 'sonner';

export function usePosts(userId?: string) {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);

  // Helper to attach stats (likes_count, comments_count, is_liked, is_saved, carousel post_media)
  const mapPostStats = (post: any, currentUserId: string | undefined): Post & { post_media?: any[] } => {
    const likes = post.likes || [];
    const comments = post.comments || [];
    const saved = post.saved_posts || [];
    const media = post.post_media || [];

    return {
      ...post,
      likes_count: likes.length,
      comments_count: comments.length,
      is_liked: currentUserId ? likes.some((l: any) => l.user_id === currentUserId) : false,
      is_saved: currentUserId ? saved.some((s: any) => s.user_id === currentUserId) : false,
      post_media: media.sort((a: any, b: any) => a.sort_order - b.sort_order),
    };
  };

  // Fetch Infinite Feed Posts (mix of followed users and own posts)
  const useFeed = () => {
    return useInfiniteQuery({
      queryKey: ['posts', 'feed', currentUser?.id],
      queryFn: async ({ pageParam = 0 }) => {
        if (!currentUser) return { posts: [], nextCursor: null };

        // 1. Get followed user IDs
        const { data: followingData } = await supabase
          .from('followers')
          .select('following_id')
          .eq('follower_id', currentUser.id);

        const followingIds = followingData?.map((f) => f.following_id) || [];
        const allowedUserIds = [currentUser.id, ...followingIds];

        // 2. Fetch posts from allowed users
        const { data: posts, error } = await supabase
          .from('posts')
          .select(`
            *,
            profiles:user_id(*),
            likes(user_id),
            comments(id),
            saved_posts(user_id),
            post_media(*)
          `)
          .in('user_id', allowedUserIds)
          // Hide scheduled posts that are not yet active
          .or(`scheduled_at.is.null,scheduled_at.lte.${new Date().toISOString()}`)
          .order('created_at', { ascending: false })
          .range(pageParam, pageParam + 9);

        if (error) {
          console.error('Error fetching feed posts:', error);
          throw error;
        }

        const mappedPosts = (posts || []).map((post) => mapPostStats(post, currentUser.id));
        const nextCursor = posts.length === 10 ? pageParam + 10 : null;

        return {
          posts: mappedPosts,
          nextCursor,
        };
      },
      initialPageParam: 0,
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      enabled: !!currentUser,
    });
  };

  // Fetch Profile / User Posts
  const useUserPosts = (profileId: string) => {
    return useQuery({
      queryKey: ['posts', 'user', profileId, currentUser?.id],
      queryFn: async () => {
        const { data: posts, error } = await supabase
          .from('posts')
          .select(`
            *,
            profiles:user_id(*),
            likes(user_id),
            comments(id),
            saved_posts(user_id),
            post_media(*)
          `)
          .eq('user_id', profileId)
          .order('created_at', { ascending: false });

        if (error) throw error;

        return (posts || []).map((post) => mapPostStats(post, currentUser?.id));
      },
      enabled: !!profileId,
    });
  };

  // Fetch Bookmarked / Saved Posts
  const useSavedPosts = () => {
    return useQuery({
      queryKey: ['posts', 'saved', currentUser?.id],
      queryFn: async () => {
        if (!currentUser) return [];

        const { data: savedData, error } = await supabase
          .from('saved_posts')
          .select(`
            post_id,
            posts(
              *,
              profiles:user_id(*),
              likes(user_id),
              comments(id),
              saved_posts(user_id),
              post_media(*)
            )
          `)
          .eq('user_id', currentUser.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const posts = (savedData || [])
          .map((item) => item.posts)
          .filter(Boolean);

        return posts.map((post) => mapPostStats(post, currentUser.id));
      },
      enabled: !!currentUser,
    });
  };

  // Fetch Single Post Detail
  const usePost = (postId: string) => {
    return useQuery({
      queryKey: ['post', postId, currentUser?.id],
      queryFn: async () => {
        const { data: post, error } = await supabase
          .from('posts')
          .select(`
            *,
            profiles:user_id(*),
            likes(user_id),
            comments(id),
            saved_posts(user_id),
            post_media(*)
          `)
          .eq('id', postId)
          .single();

        if (error) throw error;

        return mapPostStats(post, currentUser?.id);
      },
      enabled: !!postId,
    });
  };

  // Create Post Mutation (supports single image upload OR multi-media carousels)
  const createPost = useMutation({
    mutationFn: async ({ 
      content, 
      imageFile, 
      carouselFiles = [],
      mood,
      audioTrackId,
      audioStartTime,
      scheduledAt
    }: { 
      content: string; 
      imageFile: File | null; 
      carouselFiles?: File[];
      mood?: string;
      audioTrackId?: string;
      audioStartTime?: number;
      scheduledAt?: Date;
    }) => {
      if (!currentUser) throw new Error('Must be logged in to create a post');

      let primary_image_url = '';

      // Upload primary image file if present
      if (imageFile) {
        const uniqueName = generateUniqueFileName(imageFile);
        const mimeType = getFileMimeType(imageFile);
        const { error: uploadError } = await supabase.storage
          .from('posts')
          .upload(uniqueName, imageFile, { contentType: mimeType });

        if (uploadError) throw uploadError;
        primary_image_url = uniqueName;
      } else if (carouselFiles.length > 0) {
        // If carousel, make first file the primary post fallback cover
        const uniqueName = generateUniqueFileName(carouselFiles[0]);
        const mimeType = getFileMimeType(carouselFiles[0]);
        const { error: uploadError } = await supabase.storage
          .from('posts')
          .upload(uniqueName, carouselFiles[0], { contentType: mimeType });

        if (uploadError) throw uploadError;
        primary_image_url = uniqueName;
      }

      // 1. Insert post record
      const { data: newPost, error } = await supabase
        .from('posts')
        .insert({
          user_id: currentUser.id,
          content,
          image_url: primary_image_url,
          mood,
          audio_track_id: audioTrackId || null,
          audio_start_time: audioStartTime || 0,
          scheduled_at: scheduledAt ? scheduledAt.toISOString() : null,
        })
        .select(`
          *,
          profiles:user_id(*),
          likes(user_id),
          comments(id),
          saved_posts(user_id)
        `)
        .single();

      if (error) throw error;

      // 2. Upload and record all carousel media in post_media table
      if (carouselFiles.length > 0) {
        const mediaPromises = carouselFiles.map(async (file, index) => {
          const uniqueName = generateUniqueFileName(file);
          const mimeType = getFileMimeType(file);
          const { error: uploadError } = await supabase.storage
            .from('posts')
            .upload(uniqueName, file, { contentType: mimeType });

          if (uploadError) throw uploadError;

          const isVideo = isVideoFile(file);

          await supabase.from('post_media').insert({
            post_id: newPost.id,
            media_url: uniqueName,
            media_type: isVideo ? 'video' : 'image',
            sort_order: index,
          });
        });

        await Promise.all(mediaPromises);
      }

      return mapPostStats(newPost, currentUser.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts', 'feed'] });
      queryClient.invalidateQueries({ queryKey: ['posts', 'user', currentUser?.id] });
      toast.success('Post created successfully!');
    },
    onError: (err: any) => {
      toast.error(`Failed to create post: ${err.message}`);
    },
  });

  // Delete Post Mutation
  const deletePost = useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase.from('posts').delete().eq('id', postId);
      if (error) throw error;
      return postId;
    },
    onSuccess: (postId) => {
      queryClient.invalidateQueries({ queryKey: ['posts', 'feed'] });
      queryClient.invalidateQueries({ queryKey: ['posts', 'user', currentUser?.id] });
      toast.success('Post deleted successfully');
    },
    onError: (err: any) => {
      toast.error(`Failed to delete post: ${err.message}`);
    },
  });

  // Toggle Like Mutation
  const toggleLike = useMutation({
    mutationFn: async ({ postId, isLiked }: { postId: string; isLiked: boolean }) => {
      if (!currentUser) throw new Error('Must be logged in to like posts');

      if (isLiked) {
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', currentUser.id);

        if (error) throw error;
        return { postId, liked: false };
      } else {
        const { error } = await supabase
          .from('likes')
          .insert({
            post_id: postId,
            user_id: currentUser.id,
          });

        if (error) throw error;
        return { postId, liked: true };
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['posts', 'feed'] });
      queryClient.invalidateQueries({ queryKey: ['posts', 'user'] });
      queryClient.invalidateQueries({ queryKey: ['post', data.postId] });
      queryClient.invalidateQueries({ queryKey: ['posts', 'saved'] });
    },
    onError: (err: any) => {
      toast.error(`Failed to update like: ${err.message}`);
    },
  });

  // Toggle Save / Bookmark Mutation
  const toggleSave = useMutation({
    mutationFn: async ({ postId, isSaved }: { postId: string; isSaved: boolean }) => {
      if (!currentUser) throw new Error('Must be logged in to bookmark posts');

      if (isSaved) {
        const { error } = await supabase
          .from('saved_posts')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', currentUser.id);

        if (error) throw error;
        return { postId, saved: false };
      } else {
        const { error } = await supabase
          .from('saved_posts')
          .insert({
            post_id: postId,
            user_id: currentUser.id,
          });

        if (error) throw error;
        return { postId, saved: true };
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['posts', 'feed'] });
      queryClient.invalidateQueries({ queryKey: ['posts', 'user'] });
      queryClient.invalidateQueries({ queryKey: ['post', data.postId] });
      queryClient.invalidateQueries({ queryKey: ['posts', 'saved'] });
      toast.success(data.saved ? 'Post saved to bookmarks' : 'Post removed from bookmarks');
    },
    onError: (err: any) => {
      toast.error(`Failed to save post: ${err.message}`);
    },
  });

  return {
    useFeed,
    useUserPosts,
    useSavedPosts,
    usePost,
    createPost,
    deletePost,
    toggleLike,
    toggleSave,
  };
}
