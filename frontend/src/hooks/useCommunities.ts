import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { Community, CommunityMember, Post } from '@/types';
import { generateUniqueFileName, getFileMimeType } from '@/lib/utils';
import { toast } from 'sonner';

export function useCommunities() {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);

  // Fetch all communities (with search & category filters)
  const useBrowseCommunities = (category?: string, search?: string) => {
    return useQuery({
      queryKey: ['communities', 'browse', category, search, currentUser?.id],
      queryFn: async () => {
        let query = supabase.from('communities').select('*, profiles:creator_id(*)');

        if (category && category !== 'All') {
          query = query.eq('category', category);
        }

        if (search && search.trim()) {
          query = query.ilike('name', `%${search.trim()}%`);
        }

        const { data, error } = await query.order('member_count', { ascending: false });
        if (error) throw error;

        // Check membership for each community
        if (currentUser && data && data.length > 0) {
          const { data: memberships } = await supabase
            .from('community_members')
            .select('community_id')
            .eq('user_id', currentUser.id);

          const joinedIds = new Set(memberships?.map((m) => m.community_id) || []);
          return (data || []).map((comm: any) => ({
            ...comm,
            is_member: joinedIds.has(comm.id),
          })) as Community[];
        }

        return (data || []).map((c) => ({ ...c, is_member: false })) as Community[];
      },
    });
  };

  // Fetch a single community by slug
  const useCommunityDetails = (slug: string) => {
    return useQuery({
      queryKey: ['community', slug, currentUser?.id],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('communities')
          .select('*, profiles:creator_id(*)')
          .eq('slug', slug)
          .single();

        if (error) throw error;

        let isMember = false;
        if (currentUser) {
          const { data: memberRecord } = await supabase
            .from('community_members')
            .select('id')
            .eq('community_id', data.id)
            .eq('user_id', currentUser.id)
            .maybeSingle();

          isMember = !!memberRecord;
        }

        return {
          ...data,
          is_member: isMember,
        } as Community;
      },
      enabled: !!slug,
    });
  };

  // Fetch posts for a community
  const useCommunityFeed = (communityId: string) => {
    return useQuery({
      queryKey: ['community-posts', communityId, currentUser?.id],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('community_posts')
          .select('*, posts(*, profiles:user_id(*), likes(user_id), comments(id), saved_posts(user_id))')
          .eq('community_id', communityId)
          .order('created_at', { ascending: false });

        if (error) throw error;

        return (data || [])
          .map((item: any) => {
            const post = item.posts;
            if (!post) return null;

            const likes_count = post.likes?.length || 0;
            const comments_count = post.comments?.length || 0;
            const is_liked = currentUser ? (post.likes || []).some((l: any) => l.user_id === currentUser.id) : false;
            const is_saved = currentUser ? (post.saved_posts || []).some((s: any) => s.user_id === currentUser.id) : false;

            return {
              ...post,
              likes_count,
              comments_count,
              is_liked,
              is_saved,
            } as Post;
          })
          .filter(Boolean) as Post[];
      },
      enabled: !!communityId,
    });
  };

  // Fetch members of a community
  const useCommunityMembers = (communityId: string) => {
    return useQuery({
      queryKey: ['community-members', communityId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('community_members')
          .select('*, profiles:user_id(*)')
          .eq('community_id', communityId);

        if (error) throw error;
        return data as unknown as CommunityMember[];
      },
      enabled: !!communityId,
    });
  };

  // Create Community Mutation
  const createCommunity = useMutation({
    mutationFn: async ({
      name,
      description,
      category,
      isPublic,
      coverFile,
      iconFile,
    }: {
      name: string;
      description: string;
      category: string;
      isPublic: boolean;
      coverFile?: File | null;
      iconFile?: File | null;
    }) => {
      if (!currentUser) throw new Error('Must be logged in to create a community');

      // Create slug from name
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      // Check slug uniqueness
      const { data: existing } = await supabase
        .from('communities')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();

      if (existing) {
        throw new Error('A community with a similar name already exists.');
      }

      let coverUrl = '';
      let iconUrl = '';

      // Upload Cover
      if (coverFile) {
        const fileName = generateUniqueFileName(coverFile);
        const mimeType = getFileMimeType(coverFile);
        const { error: uploadError } = await supabase.storage
          .from('communities')
          .upload(fileName, coverFile, { contentType: mimeType });

        if (uploadError) throw uploadError;
        coverUrl = fileName;
      }

      // Upload Icon
      if (iconFile) {
        const fileName = generateUniqueFileName(iconFile);
        const mimeType = getFileMimeType(iconFile);
        const { error: uploadError } = await supabase.storage
          .from('communities')
          .upload(fileName, iconFile, { contentType: mimeType });

        if (uploadError) throw uploadError;
        iconUrl = fileName;
      }

      // Create community record
      const { data: newComm, error } = await supabase
        .from('communities')
        .insert({
          name,
          slug,
          description,
          category,
          is_public: isPublic,
          cover_url: coverUrl,
          icon_url: iconUrl,
          creator_id: currentUser.id,
          member_count: 1, // Start with creator as member
        })
        .select()
        .single();

      if (error) throw error;

      // Join the community automatically as creator (role: admin)
      const { error: joinError } = await supabase
        .from('community_members')
        .insert({
          community_id: newComm.id,
          user_id: currentUser.id,
          role: 'admin',
        });

      if (joinError) throw joinError;

      return newComm as Community;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['communities', 'browse'] });
      toast.success(`Community "${data.name}" created successfully!`);
    },
    onError: (err: any) => {
      toast.error(`Failed to create community: ${err.message}`);
    },
  });

  // Join Community Mutation
  const joinCommunity = useMutation({
    mutationFn: async (communityId: string) => {
      if (!currentUser) throw new Error('Must be logged in to join communities');

      const { data, error } = await supabase
        .from('community_members')
        .insert({
          community_id: communityId,
          user_id: currentUser.id,
          role: 'member',
        })
        .select()
        .single();

      if (error) throw error;
      return { communityId, data };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['communities', 'browse'] });
      queryClient.invalidateQueries({ queryKey: ['community-members', data.communityId] });
      queryClient.invalidateQueries({ queryKey: ['community'] });
      toast.success('Joined community!');
    },
    onError: (err: any) => {
      toast.error(`Failed to join community: ${err.message}`);
    },
  });

  // Leave Community Mutation
  const leaveCommunity = useMutation({
    mutationFn: async (communityId: string) => {
      if (!currentUser) throw new Error('Must be logged in to leave communities');

      const { error } = await supabase
        .from('community_members')
        .delete()
        .eq('community_id', communityId)
        .eq('user_id', currentUser.id);

      if (error) throw error;
      return communityId;
    },
    onSuccess: (communityId) => {
      queryClient.invalidateQueries({ queryKey: ['communities', 'browse'] });
      queryClient.invalidateQueries({ queryKey: ['community-members', communityId] });
      queryClient.invalidateQueries({ queryKey: ['community'] });
      toast.success('Left community.');
    },
    onError: (err: any) => {
      toast.error(`Failed to leave community: ${err.message}`);
    },
  });

  // Post in Community Mutation
  const createCommunityPost = useMutation({
    mutationFn: async ({
      communityId,
      content,
      imageFile,
      mood,
    }: {
      communityId: string;
      content: string;
      imageFile: File | null;
      mood?: string;
    }) => {
      if (!currentUser) throw new Error('Must be logged in to post');

      let image_url = '';

      if (imageFile) {
        const uniqueName = generateUniqueFileName(imageFile);
        const mimeType = getFileMimeType(imageFile);
        const { error: uploadError } = await supabase.storage
          .from('posts')
          .upload(uniqueName, imageFile, { contentType: mimeType });

        if (uploadError) throw uploadError;
        image_url = uniqueName;
      }

      // 1. Insert post into standard posts table
      const { data: newPost, error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: currentUser.id,
          content,
          image_url,
          mood,
        })
        .select()
        .single();

      if (postError) throw postError;

      // 2. Link post to community in community_posts
      const { error: linkError } = await supabase
        .from('community_posts')
        .insert({
          community_id: communityId,
          post_id: newPost.id,
        });

      if (linkError) {
        // Rollback standard post delete
        await supabase.from('posts').delete().eq('id', newPost.id);
        throw linkError;
      }

      return newPost;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['community-posts', variables.communityId] });
      toast.success('Posted in community successfully!');
    },
    onError: (err: any) => {
      toast.error(`Failed to post: ${err.message}`);
    },
  });

  return {
    useBrowseCommunities,
    useCommunityDetails,
    useCommunityFeed,
    useCommunityMembers,
    createCommunity,
    joinCommunity,
    leaveCommunity,
    createCommunityPost,
  };
}
