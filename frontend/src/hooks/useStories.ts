import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { Story, Profile, StoryView, StoryLike } from '@/types';
import { generateUniqueFileName, isVideoFile, getFileMimeType } from '@/lib/utils';
import { toast } from 'sonner';

export interface UserStoriesGroup {
  user: Profile;
  stories: Story[];
  hasUnseen: boolean;
}

export function useStories() {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);
  const currentProfile = useAuthStore((state) => state.profile);

  // Fetch active stories, grouped by user
  const useActiveStories = () => {
    return useQuery({
      queryKey: ['stories', 'active', currentUser?.id],
      queryFn: async () => {
        const nowStr = new Date().toISOString();

        // Fetch stories that haven't expired
        const { data: stories, error } = await supabase
          .from('stories')
          .select('*, profiles:user_id(*), story_likes(user_id), story_views(viewer_id)')
          .gt('expires_at', nowStr)
          .order('created_at', { ascending: true });

        if (error) throw error;

        // Group by user_id
        const groupsMap = new Map<string, UserStoriesGroup>();

        (stories || []).forEach((story: any) => {
          const author = story.profiles as Profile;
          if (!author) return;

          const storyLikes = story.story_likes || [];
          const storyViews = story.story_views || [];

          // check if seen by current user
          const isSeen = currentUser 
            ? storyViews.some((v: any) => v.viewer_id === currentUser.id)
            : false;

          const storyItem: Story = {
            id: story.id,
            user_id: story.user_id,
            image_url: story.image_url,
            media_type: story.media_type || 'image',
            video_url: story.video_url || '',
            created_at: story.created_at,
            expires_at: story.expires_at,
            profiles: author,
            stickers: story.stickers || [],
            audio_track_id: story.audio_track_id,
            audio_start_time: story.audio_start_time || 0,
            scheduled_at: story.scheduled_at,
          };

          if (!groupsMap.has(story.user_id)) {
            groupsMap.set(story.user_id, {
              user: author,
              stories: [],
              hasUnseen: false,
            });
          }

          const group = groupsMap.get(story.user_id);
          if (group) {
            group.stories.push(storyItem);
            if (!isSeen && story.user_id !== currentUser?.id) {
              group.hasUnseen = true;
            }
          }
        });

        // Pull own user stories to the front, followed by others
        const sortedGroups = Array.from(groupsMap.values());
        if (currentUser) {
          const ownIndex = sortedGroups.findIndex((g) => g.user.id === currentUser.id);
          if (ownIndex > -1) {
            const [ownGroup] = sortedGroups.splice(ownIndex, 1);
            sortedGroups.unshift(ownGroup);
          }
        }

        return sortedGroups;
      },
    });
  };

  // Fetch owner's story archive (expired stories)
  const useArchivedStories = () => {
    return useQuery({
      queryKey: ['stories', 'archive', currentUser?.id],
      queryFn: async () => {
        if (!currentUser) return [];
        const nowStr = new Date().toISOString();

        const { data, error } = await supabase
          .from('stories')
          .select('*, profiles:user_id(*)')
          .eq('user_id', currentUser.id)
          .lte('expires_at', nowStr)
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data as Story[];
      },
      enabled: !!currentUser?.id,
    });
  };

  // Fetch viewers of a story (Only owner can view)
  const useStoryViewers = (storyId: string) => {
    return useQuery({
      queryKey: ['stories', 'viewers', storyId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('story_views')
          .select('*, profiles:viewer_id(*)')
          .eq('story_id', storyId)
          .order('viewed_at', { ascending: false });

        if (error) throw error;
        return (data || []).map((item: any) => ({
          id: item.id,
          story_id: item.story_id,
          viewer_id: item.viewer_id,
          viewed_at: item.viewed_at,
          profiles: item.profiles as Profile,
        })) as StoryView[];
      },
      enabled: !!storyId,
    });
  };

  // Fetch likes count and check if current user liked a story
  const useStoryLikes = (storyId: string) => {
    return useQuery({
      queryKey: ['stories', 'likes', storyId, currentUser?.id],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('story_likes')
          .select('*')
          .eq('story_id', storyId);

        if (error) throw error;
        return {
          likes: data as StoryLike[],
          isLiked: currentUser ? data.some((l: any) => l.user_id === currentUser.id) : false,
        };
      },
      enabled: !!storyId,
    });
  };

  // Record a view on a story
  const recordStoryView = useMutation({
    mutationFn: async (storyId: string) => {
      if (!currentUser) return;
      const { data, error } = await supabase
        .from('story_views')
        .insert({
          story_id: storyId,
          viewer_id: currentUser.id,
        })
        .select()
        .single();

      if (error && !error.message.includes('duplicate key')) throw error;
      return data;
    },
    onSuccess: (_, storyId) => {
      queryClient.invalidateQueries({ queryKey: ['stories', 'active'] });
      queryClient.invalidateQueries({ queryKey: ['stories', 'viewers', storyId] });
    },
  });

  // Upload Story Mutation (supports images, videos, stickers, music, and scheduling)
  const uploadStory = useMutation({
    mutationFn: async ({
      file,
      stickers = [],
      scheduledAt,
      audioTrackId,
      audioStartTime,
    }: {
      file: File | Blob;
      stickers?: any[];
      scheduledAt?: Date;
      audioTrackId?: string;
      audioStartTime?: number;
    }) => {
      if (!currentUser) throw new Error('Must be logged in to share a story');

      const isVideo = isVideoFile(file);
      const mimeType = getFileMimeType(file);

      // 1. Upload file to Supabase Storage (stories bucket)
      const uniqueName = generateUniqueFileName(
        file instanceof File 
          ? file 
          : new File([file], `story-${Date.now()}.${mimeType.split('/')[1] || 'jpg'}`, { type: mimeType })
      );
      const { error: uploadError } = await supabase.storage
        .from('stories')
        .upload(uniqueName, file, { contentType: mimeType });

      if (uploadError) throw uploadError;

      // 2. Insert DB record
      const insertData: any = {
        user_id: currentUser.id,
        media_type: isVideo ? 'video' : 'image',
        stickers: stickers,
        scheduled_at: scheduledAt ? scheduledAt.toISOString() : null,
        audio_track_id: audioTrackId || null,
        audio_start_time: audioStartTime || 0,
      };

      if (isVideo) {
        insertData.image_url = `https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=360`; // placeholder thumbnail
        insertData.video_url = uniqueName;
      } else {
        insertData.image_url = uniqueName;
        insertData.video_url = '';
      }

      const { data, error } = await supabase
        .from('stories')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return data as Story;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories', 'active'] });
      toast.success('Story posted successfully! It will disappear in 24 hours.');
    },
    onError: (err: any) => {
      toast.error(`Story failed to upload: ${err.message}`);
    },
  });

  // Like Story Mutation
  const likeStory = useMutation({
    mutationFn: async ({ storyId, ownerId }: { storyId: string; ownerId: string }) => {
      if (!currentUser) throw new Error('Must be logged in to like a story');

      const { data, error } = await supabase
        .from('story_likes')
        .insert({ story_id: storyId, user_id: currentUser.id })
        .select()
        .single();

      if (error) throw error;

      // Create notification
      if (ownerId !== currentUser.id) {
        await supabase.from('notifications').insert({
          user_id: ownerId,
          actor_id: currentUser.id,
          type: 'like',
          message: `${currentProfile?.username || 'Someone'} liked your story`,
          post_id: null,
        });
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['stories', 'likes', variables.storyId] });
      queryClient.invalidateQueries({ queryKey: ['stories', 'active'] });
    },
  });

  // Unlike Story Mutation
  const unlikeStory = useMutation({
    mutationFn: async (storyId: string) => {
      if (!currentUser) throw new Error('Must be logged in');

      const { error } = await supabase
        .from('story_likes')
        .delete()
        .eq('story_id', storyId)
        .eq('user_id', currentUser.id);

      if (error) throw error;
      return storyId;
    },
    onSuccess: (_, storyId) => {
      queryClient.invalidateQueries({ queryKey: ['stories', 'likes', storyId] });
      queryClient.invalidateQueries({ queryKey: ['stories', 'active'] });
    },
  });

  // Comment on Story Mutation (Replies appear in inbox/chat)
  const commentOnStory = useMutation({
    mutationFn: async ({
      storyId,
      ownerId,
      commentText,
    }: {
      storyId: string;
      ownerId: string;
      commentText: string;
    }) => {
      if (!currentUser) throw new Error('Must be logged in to reply');

      // 1. Insert comment record
      const { data: storyComment, error } = await supabase
        .from('story_comments')
        .insert({
          story_id: storyId,
          user_id: currentUser.id,
          comment_text: commentText,
        })
        .select()
        .single();

      if (error) throw error;

      // 2. Make it appear in the inbox/chat (insert into messages)
      const { error: msgError } = await supabase.from('messages').insert({
        sender_id: currentUser.id,
        receiver_id: ownerId,
        content: `Replied to your story: "${commentText}"`,
        message_type: 'story_share',
        shared_item_id: storyId,
      });

      if (msgError) console.error('Failed to send story reply to chat:', msgError.message);

      // 3. Create notification
      if (ownerId !== currentUser.id) {
        await supabase.from('notifications').insert({
          user_id: ownerId,
          actor_id: currentUser.id,
          type: 'comment',
          message: `${currentProfile?.username || 'Someone'} replied to your story`,
          post_id: null,
        });
      }

      return storyComment;
    },
    onSuccess: () => {
      toast.success('Reply sent to chat!');
    },
    onError: (err: any) => {
      toast.error(`Failed to send reply: ${err.message}`);
    },
  });

  // Add Mention Mutation
  const addStoryMention = useMutation({
    mutationFn: async ({ storyId, userId }: { storyId: string; userId: string }) => {
      const { data, error } = await supabase
        .from('story_mentions')
        .insert({ story_id: storyId, user_id: userId })
        .select()
        .single();

      if (error) throw error;

      // Send mention notification
      if (currentUser) {
        await supabase.from('notifications').insert({
          user_id: userId,
          actor_id: currentUser.id,
          type: 'mention',
          message: `${currentProfile?.username || 'Someone'} mentioned you in a story`,
          post_id: null,
        });
      }

      return data;
    },
  });

  return {
    useActiveStories,
    useArchivedStories,
    useStoryViewers,
    useStoryLikes,
    recordStoryView,
    uploadStory,
    likeStory,
    unlikeStory,
    commentOnStory,
    addStoryMention,
  };
}
