import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';

export interface Collection {
  id: string;
  user_id: string;
  name: string;
  cover_url: string;
  created_at: string;
  updated_at: string;
  items_count?: number;
}

export interface CollectionItem {
  id: string;
  collection_id: string;
  post_id?: string;
  reel_id?: string;
  created_at: string;
  posts?: any;
  reels?: any;
}

export function useCollections() {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);

  // Fetch all collections for the current user
  const useUserCollections = () => {
    return useQuery({
      queryKey: ['collections', currentUser?.id],
      queryFn: async () => {
        if (!currentUser) return [];

        const { data, error } = await supabase
          .from('collections')
          .select(`
            *,
            collection_items(id)
          `)
          .eq('user_id', currentUser.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        return (data || []).map((col: any) => ({
          ...col,
          items_count: col.collection_items?.length || 0,
        })) as Collection[];
      },
      enabled: !!currentUser?.id,
    });
  };

  // Fetch all items in a collection
  const useCollectionItems = (collectionId: string) => {
    return useQuery({
      queryKey: ['collections', 'items', collectionId],
      queryFn: async () => {
        if (!collectionId) return [];

        const { data, error } = await supabase
          .from('collection_items')
          .select(`
            *,
            posts:post_id(*, profiles:user_id(*), likes(user_id), comments(id), saved_posts(user_id)),
            reels:reel_id(*, profiles:user_id(*), reel_likes(user_id), reel_comments(id), reel_saves(user_id))
          `)
          .eq('collection_id', collectionId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data as CollectionItem[];
      },
      enabled: !!collectionId,
    });
  };

  // Create Collection
  const createCollection = useMutation({
    mutationFn: async ({ name, coverUrl }: { name: string; coverUrl?: string }) => {
      if (!currentUser) throw new Error('Must be logged in');

      const { data, error } = await supabase
        .from('collections')
        .insert({
          user_id: currentUser.id,
          name: name.trim(),
          cover_url: coverUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=360'
        })
        .select()
        .single();

      if (error) throw error;
      return data as Collection;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      toast.success('Collection created successfully!');
    },
    onError: (err: any) => {
      toast.error(`Failed to create collection: ${err.message}`);
    },
  });

  // Delete Collection
  const deleteCollection = useMutation({
    mutationFn: async (collectionId: string) => {
      const { error } = await supabase
        .from('collections')
        .delete()
        .eq('id', collectionId);

      if (error) throw error;
      return collectionId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      toast.success('Collection deleted');
    },
    onError: (err: any) => {
      toast.error(`Delete failed: ${err.message}`);
    },
  });

  // Add Item (Post or Reel) to Collection
  const addItemToCollection = useMutation({
    mutationFn: async ({ collectionId, postId, reelId }: { collectionId: string; postId?: string; reelId?: string }) => {
      if (!postId && !reelId) throw new Error('Must specify postId or reelId');

      const { data, error } = await supabase
        .from('collection_items')
        .insert({
          collection_id: collectionId,
          post_id: postId || null,
          reel_id: reelId || null
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      queryClient.invalidateQueries({ queryKey: ['collections', 'items', variables.collectionId] });
      toast.success('Saved to collection!');
    },
    onError: (err: any) => {
      toast.error(`Save failed: ${err.message}`);
    },
  });

  // Remove Item from Collection
  const removeItemFromCollection = useMutation({
    mutationFn: async ({ collectionId, postId, reelId }: { collectionId: string; postId?: string; reelId?: string }) => {
      let query = supabase.from('collection_items').delete().eq('collection_id', collectionId);

      if (postId) {
        query = query.eq('post_id', postId);
      } else if (reelId) {
        query = query.eq('reel_id', reelId);
      }

      const { error } = await query;
      if (error) throw error;
      return { collectionId, postId, reelId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      queryClient.invalidateQueries({ queryKey: ['collections', 'items', data.collectionId] });
      toast.success('Removed from collection');
    },
    onError: (err: any) => {
      toast.error(`Remove failed: ${err.message}`);
    },
  });

  return {
    useUserCollections,
    useCollectionItems,
    createCollection,
    deleteCollection,
    addItemToCollection,
    removeItemFromCollection,
  };
}
