import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { StoryHighlight, StoryHighlightItem, Story, Profile } from '@/types';
import { toast } from 'sonner';

export function useStoryHighlights(userId?: string) {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);

  // Fetch highlights for a user
  const useUserHighlights = () => {
    const targetUserId = userId || currentUser?.id;
    return useQuery({
      queryKey: ['highlights', targetUserId],
      queryFn: async () => {
        if (!targetUserId) return [];
        // Fetch highlights
        const { data: highlights, error } = await supabase
          .from('story_highlights')
          .select('*')
          .eq('user_id', targetUserId)
          .order('sort_order', { ascending: true });

        if (error) throw error;

        // Fetch highlight items for each highlight
        const highlightsWithItems: StoryHighlight[] = [];

        // Fetch creator profile
        let creatorProfile: Profile | null = null;
        if (highlights && highlights.length > 0) {
          try {
            const { data: prof } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', targetUserId)
              .single();
            creatorProfile = prof as Profile | null;
          } catch (e) {
            console.error('[StoryBridge] Failed to fetch creator profile:', e);
          }
        }

        for (const highlight of (highlights || [])) {
          // Check if cover_url contains serialized stories metadata (JSON array)
          let parsedStories: any[] = [];
          if (highlight.cover_url && highlight.cover_url.trim().startsWith('[')) {
            try {
              parsedStories = JSON.parse(highlight.cover_url);
            } catch (e) {
              console.warn('[StoryBridge] Failed to parse highlight cover_url JSON:', e);
            }
          }

          if (parsedStories && parsedStories.length > 0) {
            // Build items list using the serialized data! This bypasses the stories table RLS completely
            highlightsWithItems.push({
              ...highlight,
              profiles: creatorProfile || undefined,
              items: parsedStories.map((storyData: any, idx: number) => ({
                id: storyData.id || `${highlight.id}-item-${idx}`,
                highlight_id: highlight.id,
                story_id: storyData.id,
                sort_order: idx,
                created_at: storyData.created_at || new Date().toISOString(),
                stories: {
                  id: storyData.id,
                  user_id: storyData.user_id || targetUserId,
                  media_type: storyData.media_type || 'image',
                  image_url: storyData.image_url || '',
                  video_url: storyData.video_url || '',
                  created_at: storyData.created_at || new Date().toISOString(),
                } as Story
              })) as StoryHighlightItem[]
            });
          } else {
            // Fallback: standard query
            const { data: items, error: itemsError } = await supabase
              .from('story_highlight_items')
              .select('*')
              .eq('highlight_id', highlight.id)
              .order('sort_order', { ascending: true });

            if (itemsError) throw itemsError;

            // Collect all story IDs from highlight items
            const storyIds = (items || []).map((item: any) => item.story_id).filter(Boolean);

            let storiesMap: Record<string, Story> = {};
            if (storyIds.length > 0) {
              const { data: storiesData } = await supabase
                .from('stories')
                .select('*')
                .in('id', storyIds);

              if (storiesData) {
                for (const s of storiesData) {
                  storiesMap[s.id] = s as Story;
                }
              }
            }

            highlightsWithItems.push({
              ...highlight,
              profiles: creatorProfile || undefined,
              items: (items || []).map((item: any) => ({
                id: item.id,
                highlight_id: item.highlight_id,
                story_id: item.story_id,
                sort_order: item.sort_order,
                created_at: item.created_at,
                stories: storiesMap[item.story_id] || null,
              })) as StoryHighlightItem[],
            });
          }
        }

        return highlightsWithItems;
      },
      enabled: !!targetUserId,
    });
  };

  // Fetch user's history of all stories (to choose which ones to put in highlights)
  const useUserAllStories = () => {
    return useQuery({
      queryKey: ['stories', 'all-history', currentUser?.id],
      queryFn: async () => {
        if (!currentUser) return [];
        const { data, error } = await supabase
          .from('stories')
          .select('*')
          .eq('user_id', currentUser.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data as Story[];
      },
      enabled: !!currentUser?.id,
    });
  };

  // Create Highlight Mutation
  const createHighlight = useMutation({
    mutationFn: async ({
      title,
      icon,
      storyIds,
    }: {
      title: string;
      icon: string;
      storyIds: string[];
    }) => {
      if (!currentUser) throw new Error('Must be logged in to create highlights');

      // 1. Fetch details of selected stories to serialize them
      let serializedMetadata = '';
      if (storyIds.length > 0) {
        const { data: selectedStories, error: fetchStoriesError } = await supabase
          .from('stories')
          .select('*')
          .in('id', storyIds);

        if (fetchStoriesError) throw fetchStoriesError;

        // Sort stories to match selected order
        const sortedStories = storyIds
          .map(id => selectedStories.find(s => s.id === id))
          .filter(Boolean);

        const storyMetadata = sortedStories.map(s => ({
          id: s.id,
          media_type: s.media_type || 'image',
          image_url: s.image_url || '',
          video_url: s.video_url || '',
          user_id: s.user_id,
          created_at: s.created_at,
        }));

        serializedMetadata = JSON.stringify(storyMetadata);
      }

      // 2. Create story highlight parent record, storing serialized metadata in cover_url
      const { data: highlight, error: hlError } = await supabase
        .from('story_highlights')
        .insert({
          user_id: currentUser.id,
          title,
          icon,
          cover_url: serializedMetadata,
        })
        .select()
        .single();

      if (hlError) throw hlError;

      // 3. Link selected stories to highlight
      if (storyIds.length > 0) {
        const itemInserts = storyIds.map((storyId, index) => ({
          highlight_id: highlight.id,
          story_id: storyId,
          sort_order: index,
        }));

        const { error: itemsError } = await supabase
          .from('story_highlight_items')
          .insert(itemInserts);

        if (itemsError) throw itemsError;
      }

      return highlight as StoryHighlight;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['highlights', currentUser?.id] });
      toast.success('Story Highlight created successfully!');
    },
    onError: (err: any) => {
      toast.error(`Failed to create highlight: ${err.message}`);
    },
  });

  // Delete Highlight Mutation
  const deleteHighlight = useMutation({
    mutationFn: async (highlightId: string) => {
      const { error } = await supabase
        .from('story_highlights')
        .delete()
        .eq('id', highlightId);

      if (error) throw error;
      return highlightId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['highlights', currentUser?.id] });
      toast.success('Highlight deleted.');
    },
    onError: (err: any) => {
      toast.error(`Failed to delete highlight: ${err.message}`);
    },
  });

  return {
    useUserHighlights,
    useUserAllStories,
    createHighlight,
    deleteHighlight,
  };
}
