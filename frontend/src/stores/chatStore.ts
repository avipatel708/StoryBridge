import { create } from 'zustand';
import { Conversation, Profile } from '@/types';

interface ChatState {
  activeConversation: Conversation | null;
  activeChatPartner: Profile | null;
  onlineUsers: Set<string>;
  typingUsers: Record<string, boolean>; // userId -> isTyping
  setActiveConversation: (convo: Conversation | null, partner: Profile | null) => void;
  setOnlineUsers: (userIds: string[]) => void;
  addOnlineUser: (userId: string) => void;
  removeOnlineUser: (userId: string) => void;
  setTyping: (userId: string, isTyping: boolean) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  activeConversation: null,
  activeChatPartner: null,
  onlineUsers: new Set<string>(),
  typingUsers: {},
  setActiveConversation: (convo, partner) => set({ activeConversation: convo, activeChatPartner: partner }),
  setOnlineUsers: (userIds) => set({ onlineUsers: new Set(userIds) }),
  addOnlineUser: (userId) => set((state) => {
    const updated = new Set(state.onlineUsers);
    updated.add(userId);
    return { onlineUsers: updated };
  }),
  removeOnlineUser: (userId) => set((state) => {
    const updated = new Set(state.onlineUsers);
    updated.delete(userId);
    return { onlineUsers: updated };
  }),
  setTyping: (userId, isTyping) => set((state) => ({
    typingUsers: { ...state.typingUsers, [userId]: isTyping }
  })),
}));
