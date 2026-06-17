import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { MemoryTimelineEvent } from '@/types';
import { toast } from 'sonner';

export function useMemoryTimeline(userId?: string) {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);

  // Fetch all timeline events for a user
  const useTimelineEvents = () => {
    const targetUserId = userId || currentUser?.id;
    return useQuery({
      queryKey: ['timeline', targetUserId],
      queryFn: async () => {
        if (!targetUserId) return [];
        const { data, error } = await supabase
          .from('memory_timeline_events')
          .select('*')
          .eq('user_id', targetUserId)
          .order('event_date', { ascending: false });

        if (error) throw error;
        return data as MemoryTimelineEvent[];
      },
      enabled: !!targetUserId,
    });
  };

  // Create Timeline Event Mutation
  const createTimelineEvent = useMutation({
    mutationFn: async ({
      title,
      description,
      eventDate,
      iconType,
    }: {
      title: string;
      description: string;
      eventDate: string;
      iconType: 'star' | 'pen' | 'heart' | 'users' | 'trophy' | 'camera' | 'milestone' | 'custom';
    }) => {
      if (!currentUser) throw new Error('Must be logged in to add timeline events');

      const { data, error } = await supabase
        .from('memory_timeline_events')
        .insert({
          user_id: currentUser.id,
          title,
          description,
          event_date: eventDate,
          icon_type: iconType,
          is_auto: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data as MemoryTimelineEvent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline', currentUser?.id] });
      toast.success('Timeline milestone added!');
    },
    onError: (err: any) => {
      toast.error(`Failed to add milestone: ${err.message}`);
    },
  });

  // Delete Timeline Event Mutation
  const deleteTimelineEvent = useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await supabase
        .from('memory_timeline_events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;
      return eventId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline', currentUser?.id] });
      toast.success('Milestone removed.');
    },
    onError: (err: any) => {
      toast.error(`Failed to remove milestone: ${err.message}`);
    },
  });

  return {
    useTimelineEvents,
    createTimelineEvent,
    deleteTimelineEvent,
  };
}
