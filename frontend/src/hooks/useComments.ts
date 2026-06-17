import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { Comment, Profile } from '@/types';
import { toast } from 'sonner';

export interface UpgradedComment extends Comment {
  parent_id?: string | null;
  is_pinned: boolean;
  likes_count: number;
  is_liked: boolean;
  replies?: UpgradedComment[];
}

export function useComments(postId: string) {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);

  // Fetch comments for a post
  const usePostComments = () => {
    return useQuery({
      queryKey: ['comments', postId, currentUser?.id],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('comments')
          .select(`
            *,
            profiles:user_id(*),
            comment_likes(user_id)
          `)
          .eq('post_id', postId)
          .order('is_pinned', { ascending: false })
          .order('created_at', { ascending: true });

        if (error) throw error;

        // Map stats
        const flatComments: UpgradedComment[] = (data || []).map((c: any) => ({
          id: c.id,
          post_id: c.post_id,
          user_id: c.user_id,
          content: c.content,
          created_at: c.created_at,
          profiles: c.profiles as Profile,
          parent_id: c.parent_id,
          is_pinned: c.is_pinned || false,
          likes_count: c.comment_likes?.length || 0,
          is_liked: currentUser?.id ? c.comment_likes?.some((l: any) => l.user_id === currentUser.id) : false,
          replies: []
        }));

        // Build replies tree
        const commentMap: Record<string, UpgradedComment> = {};
        const rootComments: UpgradedComment[] = [];

        flatComments.forEach(comment => {
          commentMap[comment.id] = comment;
        });

        flatComments.forEach(comment => {
          if (comment.parent_id) {
            const parent = commentMap[comment.parent_id];
            if (parent) {
              parent.replies = parent.replies || [];
              parent.replies.push(comment);
            } else {
              // fallback if parent is missing
              rootComments.push(comment);
            }
          } else {
            rootComments.push(comment);
          }
        });

        return rootComments;
      },
      enabled: !!postId,
    });
  };

  // Add Comment Mutation (supports replying)
  const addComment = useMutation({
    mutationFn: async ({ content, parentId }: { content: string; parentId?: string }) => {
      if (!currentUser) throw new Error('Must be logged in to comment');
      if (!content.trim()) throw new Error('Comment cannot be empty');

      const { data, error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: currentUser.id,
          content: content.trim(),
          parent_id: parentId || null
        })
        .select('*, profiles:user_id(*)')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      queryClient.invalidateQueries({ queryKey: ['posts'] }); 
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
      toast.success('Comment added successfully!');
    },
    onError: (err: any) => {
      toast.error(`Failed to add comment: ${err.message}`);
    },
  });

  // Delete Comment Mutation
  const deleteComment = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
      return commentId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
      toast.success('Comment deleted successfully');
    },
    onError: (err: any) => {
      toast.error(`Failed to delete comment: ${err.message}`);
    },
  });

  // Like Comment Mutation
  const likeComment = useMutation({
    mutationFn: async (commentId: string) => {
      if (!currentUser) throw new Error('Must be logged in to like comments');

      const { data, error } = await supabase
        .from('comment_likes')
        .insert({
          comment_id: commentId,
          user_id: currentUser.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
    },
    onError: (err: any) => {
      toast.error(`Failed to like comment: ${err.message}`);
    },
  });

  // Unlike Comment Mutation
  const unlikeComment = useMutation({
    mutationFn: async (commentId: string) => {
      if (!currentUser) throw new Error('Must be logged in to unlike comments');

      const { error } = await supabase
        .from('comment_likes')
        .delete()
        .eq('comment_id', commentId)
        .eq('user_id', currentUser.id);

      if (error) throw error;
      return commentId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
    },
    onError: (err: any) => {
      toast.error(`Failed to unlike comment: ${err.message}`);
    },
  });

  // Pin/Unpin Comment Mutation (for post owners)
  const togglePinComment = useMutation({
    mutationFn: async ({ commentId, isPinned }: { commentId: string; isPinned: boolean }) => {
      const { data, error } = await supabase
        .from('comments')
        .update({ is_pinned: isPinned })
        .eq('id', commentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      toast.success('Comment pin state updated');
    },
    onError: (err: any) => {
      toast.error(`Pin operation failed: ${err.message}`);
    },
  });

  return {
    usePostComments,
    addComment,
    deleteComment,
    likeComment,
    unlikeComment,
    togglePinComment
  };
}
