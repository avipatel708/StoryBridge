import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { Notification } from '@/types';
import { toast } from 'sonner';

export function useNotifications() {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);

  // Fetch notifications
  const useNotificationsList = () => {
    return useQuery({
      queryKey: ['notifications', currentUser?.id],
      queryFn: async () => {
        if (!currentUser) return [];

        const { data, error } = await supabase
          .from('notifications')
          .select('*, actor:actor_id(*)')
          .eq('user_id', currentUser.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data as Notification[];
      },
      enabled: !!currentUser,
    });
  };

  // Mark single notification as read
  const markAsRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ['notifications', currentUser?.id] });
    },
  });

  // Mark all notifications as read
  const markAllAsRead = useMutation({
    mutationFn: async () => {
      if (!currentUser) return;
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', currentUser.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', currentUser?.id] });
      toast.success('All notifications marked as read');
    },
  });

  return {
    useNotificationsList,
    markAsRead,
    markAllAsRead,
  };
}
