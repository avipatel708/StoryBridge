import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { Message, Conversation, Profile } from '@/types';
import { useChatStore } from '@/stores/chatStore';
import { generateUniqueFileName, getFileMimeType } from '@/lib/utils';
import { toast } from 'sonner';

export function useMessages() {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);
  const activeConversation = useChatStore((state) => state.activeConversation);
  const activeChatPartner = useChatStore((state) => state.activeChatPartner);

  // Fetch all conversations for current user
  const useConversations = () => {
    return useQuery({
      queryKey: ['conversations', currentUser?.id],
      queryFn: async () => {
        if (!currentUser) return [];

        const { data, error } = await supabase
          .from('conversations')
          .select(`
            *,
            p1_profile:participant_one(*),
            p2_profile:participant_two(*)
          `)
          .or(`participant_one.eq.${currentUser.id},participant_two.eq.${currentUser.id}`)
          .order('last_message_at', { ascending: false });

        if (error) throw error;

        // Map other participant profiles
        return (data || []).map((convo: any) => {
          const other_participant =
            convo.participant_one === currentUser.id
              ? convo.p2_profile
              : convo.p1_profile;
          return {
            ...convo,
            other_participant,
          } as Conversation;
        });
      },
      enabled: !!currentUser,
    });
  };

  // Fetch messages of active conversation
  const useChatMessages = (convoId: string | null) => {
    return useQuery({
      queryKey: ['messages', convoId],
      queryFn: async () => {
        if (!convoId) return [];

        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .or(`sender_id.eq.${currentUser?.id},receiver_id.eq.${currentUser?.id}`)
          .order('created_at', { ascending: true });

        if (error) throw error;

        // Filter messages belonging to current partner
        if (!activeChatPartner) return [];
        return (data || []).filter(
          (m) =>
            (m.sender_id === currentUser?.id && m.receiver_id === activeChatPartner.id) ||
            (m.sender_id === activeChatPartner.id && m.receiver_id === currentUser?.id)
        ) as Message[];
      },
      enabled: !!convoId && !!activeChatPartner && !!currentUser,
    });
  };

  // Send Message Mutation (supports text, media upload, reactions, and shared items)
  const sendMessage = useMutation({
    mutationFn: async ({
      receiverId,
      content,
      messageType = 'text',
      mediaFile,
      sharedItemId,
    }: {
      receiverId: string;
      content: string;
      messageType?: 'text' | 'image' | 'video' | 'voice' | 'story_share' | 'reel_share' | 'post_share';
      mediaFile?: File;
      sharedItemId?: string;
    }) => {
      if (!currentUser) throw new Error('Must be logged in to send messages');

      let mediaUrl = '';

      // 1. Upload media if present
      if (mediaFile) {
        const uniqueName = generateUniqueFileName(mediaFile);
        const mimeType = getFileMimeType(mediaFile);
        const { error: uploadError } = await supabase.storage
          .from('chat_media')
          .upload(uniqueName, mediaFile, { contentType: mimeType });

        if (uploadError) throw uploadError;
        mediaUrl = uniqueName;
      }

      // 2. Build the insert payload — start with basic fields
      const basicPayload: Record<string, any> = {
        sender_id: currentUser.id,
        receiver_id: receiverId,
        content: content,
      };

      // Extended fields (only if migration 004 has been applied)
      const extendedPayload: Record<string, any> = {
        ...basicPayload,
        message_type: messageType,
        media_url: mediaUrl,
        shared_item_id: sharedItemId || null,
      };

      // Try extended insert first, fallback to basic if it fails (e.g. columns don't exist in DB)
      let data: any = null;
      let error: any = null;

      try {
        const result = await supabase
          .from('messages')
          .insert(extendedPayload)
          .select()
          .single();
        
        data = result.data;
        error = result.error;
      } catch (err) {
        error = err;
      }

      // If it fails, retry with basic payload
      if (error) {
        console.warn('[StoryBridge] Extended message columns failed or not found, using basic insert fallback. Error:', error.message || error);
        try {
          const result = await supabase
            .from('messages')
            .insert(basicPayload)
            .select()
            .single();
          data = result.data;
          error = result.error;
        } catch (fallbackErr) {
          error = fallbackErr;
        }
      }

      if (error) throw error;

      // 3. Upsert conversation record to update last_message_at
      const { error: convoError } = await supabase
        .from('conversations')
        .upsert(
          {
            participant_one: currentUser.id < receiverId ? currentUser.id : receiverId,
            participant_two: currentUser.id < receiverId ? receiverId : currentUser.id,
            last_message_at: new Date().toISOString(),
          },
          { onConflict: 'participant_one,participant_two' }
        );

      if (convoError) console.error('Conversation update error:', convoError.message);

      return data as Message;
    },
    onSuccess: (newMessage) => {
      queryClient.invalidateQueries({ queryKey: ['messages', activeConversation?.id] });
      queryClient.invalidateQueries({ queryKey: ['conversations', currentUser?.id] });
    },
    onError: (err: any) => {
      toast.error(`Message failed to send: ${err.message}`);
    },
  });

  // Toggle Reaction on a message
  const toggleReaction = useMutation({
    mutationFn: async ({ messageId, emoji }: { messageId: string; emoji: string }) => {
      if (!currentUser) throw new Error('Must be logged in to react');

      // 1. Fetch current reactions
      const { data: message, error: fetchError } = await supabase
        .from('messages')
        .select('reactions')
        .eq('id', messageId)
        .single();

      if (fetchError) throw fetchError;

      let currentReactions = Array.isArray(message.reactions) ? message.reactions : [];

      // Check if user already reacted with this emoji
      const existingReactionIndex = currentReactions.findIndex(
        (r: any) => r.user_id === currentUser.id && r.emoji === emoji
      );

      if (existingReactionIndex > -1) {
        // Remove reaction
        currentReactions.splice(existingReactionIndex, 1);
      } else {
        // Remove other reactions from same user first (standard DM behavior, or append if multiple allowed)
        currentReactions = currentReactions.filter((r: any) => r.user_id !== currentUser.id);
        // Add new reaction
        currentReactions.push({ user_id: currentUser.id, emoji });
      }

      // 2. Update message reactions
      const { data, error } = await supabase
        .from('messages')
        .update({ reactions: currentReactions })
        .eq('id', messageId)
        .select()
        .single();

      if (error) throw error;
      return data as Message;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', activeConversation?.id] });
    },
  });

  // Mark all unread messages from active partner as seen
  const markMessagesAsSeen = useMutation({
    mutationFn: async () => {
      if (!currentUser || !activeChatPartner) return;

      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('sender_id', activeChatPartner.id)
        .eq('receiver_id', currentUser.id)
        .eq('is_read', false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', activeConversation?.id] });
      queryClient.invalidateQueries({ queryKey: ['conversations', currentUser?.id] });
    },
  });

  // Setup Realtime Chat Listener for Messages (INSERT and UPDATE events)
  useEffect(() => {
    if (!currentUser) return;

    const channelName = `messages:${currentUser.id}:${Date.now()}`;

    // Clean up old channels
    const existingChannels = supabase.getChannels();
    existingChannels.forEach((ch) => {
      if (ch.topic.startsWith(`realtime:messages:${currentUser.id}`)) {
        supabase.removeChannel(ch);
      }
    });

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE to sync reactions and read receipts live!
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const record = (payload.new || payload.old) as Message;
          if (!record) return;

          if (record.sender_id === currentUser.id || record.receiver_id === currentUser.id) {
            const currentActiveConvoId = useChatStore.getState().activeConversation?.id;
            queryClient.invalidateQueries({ queryKey: ['messages', currentActiveConvoId] });
            queryClient.invalidateQueries({ queryKey: ['conversations', currentUser.id] });
          }
        }
      )
      .subscribe((status, err) => {
        if (err) {
          console.warn('[StoryBridge] Realtime messages subscription error:', err);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser?.id, queryClient]);

  return {
    useConversations,
    useChatMessages,
    sendMessage,
    toggleReaction,
    markMessagesAsSeen,
  };
}
