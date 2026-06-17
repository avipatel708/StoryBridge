import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Send, Search, Plus, X, Minimize2, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useChatStore } from '@/stores/chatStore';
import { useUIStore } from '@/stores/uiStore';
import { useMessages } from '@/hooks/useMessages';
import { useProfile } from '@/hooks/useProfile';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { getAvatarUrl, formatDate, cn } from '@/lib/utils';
import { Profile } from '@/types';

// Format message contents to detect and render links
function formatMessageContent(content: string) {
  if (!content) return '';
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = content.split(urlRegex);
  return parts.map((part, i) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="underline text-sky-450 hover:text-indigo-200 break-all font-medium"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      );
    }
    return part;
  });
}

export function MessagesFloatingPanel() {
  const currentUser = useAuthStore((state) => state.user);
  const { messagesPanelOpen, setMessagesPanelOpen, toggleMessagesPanel } = useUIStore();
  const { activeConversation, activeChatPartner, setActiveConversation } = useChatStore();
  const { useConversations, useChatMessages, sendMessage } = useMessages();
  const { useSearchUsers } = useProfile();

  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [userSearchOpen, setUserSearchOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversations, isLoading: convosLoading } = useConversations();
  const { data: chatMessages, isLoading: messagesLoading } = useChatMessages(
    activeChatPartner ? activeConversation?.id || 'active-partner' : null
  );
  const { data: searchResults, isLoading: searchLoading } = useSearchUsers(searchQuery);

  // Typing indicator simulator
  useEffect(() => {
    if (!activeChatPartner || !chatMessages || chatMessages.length === 0) return;
    const lastMsg = chatMessages[chatMessages.length - 1];
    if (lastMsg.sender_id === currentUser?.id) {
      const typingTimer = setTimeout(() => {
        setIsTyping(true);
        const replyTimer = setTimeout(() => {
          setIsTyping(false);
        }, 2200);
        return () => clearTimeout(replyTimer);
      }, 1000);
      return () => clearTimeout(typingTimer);
    }
  }, [chatMessages, activeChatPartner, currentUser?.id]);

  const previewPartners = (conversations || [])
    .map((c) => c.other_participant)
    .filter(Boolean)
    .slice(0, 2) as Profile[];

  useEffect(() => {
    if (messagesPanelOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, messagesPanelOpen]);

  useEffect(() => {
    if (!messagesPanelOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMessagesPanelOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [messagesPanelOpen, setMessagesPanelOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !activeChatPartner) return;
    try {
      await sendMessage.mutateAsync({
        receiverId: activeChatPartner.id,
        content: messageText.trim(),
      });
      setMessageText('');
    } catch {
      // handled in hook
    }
  };

  const handleStartChatWith = (partner: Profile) => {
    const matchingConvo = conversations?.find(
      (c) => c.participant_one === partner.id || c.participant_two === partner.id
    );
    setActiveConversation(matchingConvo || null, partner);
    setUserSearchOpen(false);
    setSearchQuery('');
  };

  if (!currentUser) return null;

  return createPortal(
    <>
      {/* Collapsed pill — Instagram-style */}
      <AnimatePresence>
        {!messagesPanelOpen && (
          <motion.button
            type="button"
            initial={{ opacity: 0, y: 24, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            onClick={toggleMessagesPanel}
            className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-[160] flex items-center gap-3.5 pl-5 pr-4 py-3 rounded-full cursor-pointer min-w-[200px]
              bg-white dark:bg-[#0a0c14]
              border border-slate-200 dark:border-indigo-500/45
              shadow-[0_4px_20px_rgba(0,0,0,0.10),0_1px_4px_rgba(0,0,0,0.06)]
              dark:shadow-[0_8px_32px_rgba(0,0,0,0.45)]
              hover:shadow-[0_6px_28px_rgba(0,0,0,0.14)] hover:scale-[1.02] transition-all"
          >
            <div className="relative flex-shrink-0">
              <MessageSquare
                className="h-[22px] w-[22px] text-slate-900 dark:text-indigo-400"
                strokeWidth={2}
              />
              {conversations && conversations.length > 0 && (
                <span className="absolute -bottom-1 -right-1.5 h-[18px] min-w-[18px] px-1 rounded-full bg-[#FF3040] text-white text-[11px] font-bold flex items-center justify-center leading-none ring-2 ring-white dark:ring-[#0a0c14]">
                  {conversations.length > 9 ? '9+' : conversations.length}
                </span>
              )}
            </div>
            <span className="text-[15px] font-bold text-slate-900 dark:text-white font-outfit tracking-tight">
              Messages
            </span>
            {previewPartners.length > 0 && (
              <div className="flex items-center ml-auto -space-x-2.5 flex-shrink-0">
                {previewPartners.map((p, i) => (
                  <Avatar
                    key={p.id}
                    src={getAvatarUrl(p.avatar_url)}
                    name={p.full_name || p.username}
                    size="xs"
                    className={cn(
                      'ring-2 ring-white dark:ring-[#0a0c14] !h-7 !w-7 !min-h-7 !min-w-7',
                      i === 1 && 'relative z-10'
                    )}
                  />
                ))}
              </div>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Expanded popup panel */}
      <AnimatePresence>
        {messagesPanelOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[170] bg-black/40 backdrop-blur-sm"
              onClick={() => setMessagesPanelOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.88 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.92 }}
              transition={{ type: 'spring', stiffness: 340, damping: 30 }}
              className="fixed z-[180] flex flex-col overflow-hidden
                inset-x-3 bottom-20 top-16 md:inset-auto md:bottom-6 md:right-6 md:top-auto
                md:w-[400px] md:h-[min(560px,calc(100vh-3rem))] rounded-3xl
                bg-gradient-to-b from-white/95 to-slate-50/95 dark:from-[#151c2e]/98 dark:to-[#0d1220]/98
                backdrop-blur-2xl border border-white/60 dark:border-indigo-500/25
                shadow-[0_24px_80px_rgba(99,102,241,0.35),0_8px_32px_rgba(0,0,0,0.25)]
                origin-bottom-right"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Gradient accent top bar */}
              <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 flex-shrink-0" />

              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200/60 dark:border-slate-800/60 flex-shrink-0">
                <div className="flex items-center gap-2">
                  {activeChatPartner ? (
                    <div className="relative">
                      <Avatar src={getAvatarUrl(activeChatPartner.avatar_url)} name={activeChatPartner.full_name || activeChatPartner.username} size="sm" />
                      <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 ring-1 ring-white dark:ring-[#0a0c14]" />
                    </div>
                  ) : (
                    <div className="p-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                      <Sparkles className="h-4 w-4 text-indigo-500" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-sm font-bold font-outfit text-slate-900 dark:text-white leading-none">
                      {activeChatPartner ? activeChatPartner.full_name || activeChatPartner.username : 'Messages'}
                    </h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {activeChatPartner ? 'Online' : 'StoryBridge chat'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {activeChatPartner && (
                    <button
                      type="button"
                      onClick={() => setActiveConversation(null, null)}
                      className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-xs font-semibold"
                    >
                      Back
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setMessagesPanelOpen(false)}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    aria-label="Minimize"
                  >
                    <Minimize2 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setMessagesPanelOpen(false)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                    aria-label="Close"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {!activeChatPartner ? (
                <>
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between flex-shrink-0">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Inbox</span>
                    <button
                      type="button"
                      onClick={() => setUserSearchOpen(!userSearchOpen)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-slate-500"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  {userSearchOpen && (
                    <div className="p-3 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/80 dark:bg-slate-900/40 flex-shrink-0">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search creators..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full bg-white dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div className="mt-2 max-h-28 overflow-y-auto custom-scrollbar">
                        {searchLoading ? (
                          <Spinner size="sm" />
                        ) : (
                          searchResults
                            ?.filter((u) => u.id !== currentUser.id)
                            .map((user) => (
                              <button
                                key={user.id}
                                type="button"
                                onClick={() => handleStartChatWith(user)}
                                className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-white dark:hover:bg-slate-800 cursor-pointer text-left"
                              >
                                <Avatar src={getAvatarUrl(user.avatar_url)} name={user.full_name || user.username} size="sm" />
                                <span className="text-xs font-bold truncate">{user.username}</span>
                              </button>
                            ))
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
                    {convosLoading ? (
                      <div className="flex justify-center py-10"><Spinner size="md" /></div>
                    ) : conversations && conversations.length > 0 ? (
                      conversations.map((convo) => {
                        const partner = convo.other_participant;
                        if (!partner) return null;
                        return (
                          <button
                            key={convo.id}
                            type="button"
                            onClick={() => setActiveConversation(convo, partner)}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 border-b border-slate-100/80 dark:border-slate-800/40 cursor-pointer text-left transition-colors"
                          >
                            <div className="relative flex-shrink-0">
                              <Avatar src={getAvatarUrl(partner.avatar_url)} name={partner.full_name || partner.username} size="md" />
                              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#0a0c14]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold truncate text-slate-800 dark:text-slate-100">{partner.full_name || partner.username}</p>
                              <p className="text-[10px] text-slate-500 truncate">Tap to open chat</p>
                            </div>
                            <span className="text-[9px] text-slate-400">{formatDate(convo.last_message_at)}</span>
                          </button>
                        );
                      })
                    ) : (
                      <p className="text-xs text-slate-500 text-center py-12 px-6">No chats yet. Tap + to find someone.</p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3 min-h-0 custom-scrollbar bg-slate-50/30 dark:bg-slate-950/20">
                    {messagesLoading ? (
                      <Spinner size="md" />
                    ) : chatMessages && chatMessages.length > 0 ? (
                      chatMessages.map((msg) => {
                        const isSent = msg.sender_id === currentUser.id;
                        return (
                          <div key={msg.id} className={`flex flex-col max-w-[85%] ${isSent ? 'self-end items-end' : 'self-start items-start'}`}>
                            <div className={`rounded-2xl px-3.5 py-2 text-sm ${isSent ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-br-sm' : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-sm border border-slate-200/60 dark:border-slate-700'}`}>
                              {formatMessageContent(msg.content)}
                            </div>
                            {isSent && (
                              <span className="text-[8px] text-slate-400 mt-0.5 mr-1 font-bold">
                                {msg.is_read ? 'Read' : 'Delivered'}
                              </span>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-xs text-slate-500 text-center py-8">Say hello to start the conversation.</p>
                    )}
                    
                    {/* Typing Indicator */}
                    {isTyping && (
                      <div className="self-start flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 rounded-2xl px-3.5 py-2.5 max-w-[80%] rounded-bl-sm">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                  <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200/60 dark:border-slate-800/60 flex gap-2 flex-shrink-0">
                    <input
                      type="text"
                      placeholder="Message..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      className="flex-1 bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
                    />
                    <Button type="submit" variant="primary" size="sm" className="rounded-2xl h-10 w-10 p-0" disabled={!messageText.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>,
    document.body
  );
}
