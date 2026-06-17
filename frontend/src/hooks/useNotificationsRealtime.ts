import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { Notification } from '@/types';
import { toast } from 'sonner';

/**
 * Subscribe once at the layout level — not inside useNotifications(),
 * which is called from Header and LeftSidebar and would double-subscribe.
 */
export function useNotificationsRealtime() {
  const currentUser = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!currentUser) return;

    const channelName = `notifications:${currentUser.id}:${Date.now()}`;

    // Clean up any existing notification channels
    const existingChannels = supabase.getChannels();
    existingChannels.forEach((ch) => {
      if (ch.topic.startsWith(`realtime:notifications:${currentUser.id}`)) {
        supabase.removeChannel(ch);
      }
    });

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${currentUser.id}`,
        },
        async (payload) => {
          const newNotif = payload.new as Notification;
          toast.info(newNotif.message || 'You received a new notification!');
          queryClient.invalidateQueries({ queryKey: ['notifications', currentUser.id] });
        }
      )
      .subscribe((status, err) => {
        if (err) {
          console.warn('[StoryBridge] Notifications subscription error:', err);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser?.id, queryClient]);
}
