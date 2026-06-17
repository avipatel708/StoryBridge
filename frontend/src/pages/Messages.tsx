import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import { MessageSquare, Send, Search, Plus, X, ArrowLeft, Check, CheckCheck, Smile, Paperclip, Mic, Square, Play, Pause, Film, Image } from 'lucide-react';
import { supabase, supabaseUrl } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useChatStore } from '@/stores/chatStore';
import { useMessages } from '@/hooks/useMessages';
import { useProfile } from '@/hooks/useProfile';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { cn, getAvatarUrl, formatDate } from '@/lib/utils';
import { Profile, Message } from '@/types';
import { toast } from 'sonner';

// Helper to get chat media files
function getChatMediaUrl(path?: string) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${supabaseUrl}/storage/v1/object/public/chat_media/${path}`;
}

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
          className="underline text-sky-400 dark:text-sky-300 hover:text-indigo-200 break-all font-medium"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      );
    }
    return part;
  });
}

export default function Messages() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const chatWithId = searchParams.get('chatWith');

  const currentUser = useAuthStore((state) => state.user);
  const currentProfile = useAuthStore((state) => state.profile);

  const { activeConversation, activeChatPartner, setActiveConversation } = useChatStore();
  const { useConversations, useChatMessages, sendMessage, toggleReaction, markMessagesAsSeen } = useMessages();
  const { useProfileById, useSearchUsers } = useProfile();

  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [userSearchOpen, setUserSearchOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Attachment & Voice Recording States
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileType, setSelectedFileType] = useState<'image' | 'video' | 'voice' | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Typing States
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const typingTimeoutRef = useRef<number | null>(null);

  // Reactions UI state
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);

  // Queries
  const { data: conversations, isLoading: convosLoading } = useConversations();
  const { data: chatMessages, isLoading: messagesLoading } = useChatMessages(
    activeConversation?.id || 'active-partner'
  );
  
  // Search other users
  const { data: searchResults, isLoading: searchLoading } = useSearchUsers(searchQuery);

  // Fetch partner profile if redirected with query param
  const { data: directPartner } = useProfileById(chatWithId || '');

  // Auto-scroll chats
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isPartnerTyping]);

  // Sync active partner if redirected
  useEffect(() => {
    if (directPartner) {
      const matchingConvo = conversations?.find(
        (c) => c.participant_one === directPartner.id || c.participant_two === directPartner.id
      );
      setActiveConversation(matchingConvo || null, directPartner);
      setUserSearchOpen(false);
    }
  }, [directPartner, conversations, setActiveConversation]);

  // Auto-mark messages as read when active conversation opens or messages load
  useEffect(() => {
    if (activeChatPartner) {
      markMessagesAsSeen.mutate();
    }
  }, [activeChatPartner?.id, chatMessages?.length]);

  // Realtime Typing Indicator setup
  useEffect(() => {
    if (!currentUser || !activeConversation) return;

    const channelName = `typing:${activeConversation.id}`;
    const channel = supabase.channel(channelName);

    // Subscribe to typing indicators broadcast by partner
    channel
      .on('broadcast', { event: 'typing' }, (payload) => {
        if (payload.payload.userId === activeChatPartner?.id) {
          setIsPartnerTyping(payload.payload.isTyping);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser?.id, activeConversation?.id, activeChatPartner?.id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageText(e.target.value);

    // Broadcast "typing" event
    if (currentUser && activeConversation) {
      const channel = supabase.channel(`typing:${activeConversation.id}`);
      channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId: currentUser.id, isTyping: true },
      });

      // Clear typing indicator after 2s of no input
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = window.setTimeout(() => {
        channel.send({
          type: 'broadcast',
          event: 'typing',
          payload: { userId: currentUser.id, isTyping: false },
        });
      }, 2000);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() && !selectedFile) return;

    try {
      await sendMessage.mutateAsync({
        receiverId: activeChatPartner!.id,
        content: messageText.trim() || (selectedFileType === 'voice' ? 'Voice Message' : `Shared ${selectedFileType}`),
        messageType: selectedFileType || 'text',
        mediaFile: selectedFile || undefined,
      });

      // reset states
      setMessageText('');
      setSelectedFile(null);
      setSelectedFileType(null);
    } catch {
      // Handled
    }
  };

  // Attach files handler
  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const isImg = file.type.startsWith('image/');
      const isVid = file.type.startsWith('video/');

      if (!isImg && !isVid) {
        toast.error('Only images and video attachments are supported.');
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        toast.error('Attachment size exceeds 20MB.');
        return;
      }

      setSelectedFile(file);
      setSelectedFileType(isImg ? 'image' : 'video');
    }
  };

  // Voice Recording functions
  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp3' });
        const audioFile = new File([audioBlob], 'voice-note.mp3', { type: 'audio/mp3' });
        setSelectedFile(audioFile);
        setSelectedFileType('voice');
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      recordingTimerRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      toast.error('Microphone access denied or audio recording failed.');
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
  };

  const handleCancelAttachment = () => {
    setSelectedFile(null);
    setSelectedFileType(null);
  };

  const handleStartChatWith = (partner: Profile) => {
    const matchingConvo = conversations?.find(
      (c) => c.participant_one === partner.id || c.participant_two === partner.id
    );
    setActiveConversation(matchingConvo || null, partner);
    setUserSearchOpen(false);
    setSearchQuery('');
    navigate('/messages', { replace: true });
  };

  const EMOJIS = ['❤️', '👍', '😂', '😮', '😢', '🔥', '👏'];

  return (
    <div className="h-[calc(100vh-140px)] flex bg-white/60 dark:bg-[#0B1020]/75 border border-slate-200/40 dark:border-white/8 rounded-2xl overflow-hidden backdrop-blur-[20px] transition-all duration-300 shadow-xl">
      
      {/* 1. Left Panel (Conversations) */}
      <div className={`w-full md:w-80 border-r border-slate-200 dark:border-slate-800 flex flex-col ${activeChatPartner ? 'hidden md:flex' : 'flex'}`}>
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between select-none">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-850 cursor-pointer"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h3 className="text-base font-bold font-outfit text-slate-800 dark:text-slate-200">Chats</h3>
          </div>
          <button
            onClick={() => setUserSearchOpen(!userSearchOpen)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-850 cursor-pointer"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>

        {/* User Search Panel */}
        {userSearchOpen && (
          <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex flex-col gap-2 bg-slate-50/50 dark:bg-slate-900/40 select-none">
            <div className="relative flex items-center">
              <Search className="absolute left-3 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white dark:bg-slate-950 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex flex-col max-h-[160px] overflow-y-auto custom-scrollbar">
              {searchLoading ? (
                <div className="flex justify-center py-2"><Spinner size="sm" /></div>
              ) : searchResults && searchResults.length > 0 ? (
                searchResults
                  .filter((u) => u.id !== currentUser?.id)
                  .map((user) => (
                    <div
                      key={user.id}
                      onClick={() => handleStartChatWith(user)}
                      className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer transition-colors"
                    >
                      <Avatar src={getAvatarUrl(user.avatar_url)} name={user.full_name || user.username} size="sm" />
                      <div className="flex flex-col text-left">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{user.full_name || user.username}</span>
                        <span className="text-[10px] text-slate-500">@{user.username}</span>
                      </div>
                    </div>
                  ))
              ) : searchQuery ? (
                <span className="text-[10px] text-slate-500 text-center py-2">No creators found</span>
              ) : null}
            </div>
          </div>
        )}

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar select-none">
          {convosLoading ? (
            <div className="flex justify-center py-12"><Spinner size="md" /></div>
          ) : conversations && conversations.length > 0 ? (
            <div className="flex flex-col">
              {conversations.map((convo) => {
                const partner = convo.other_participant;
                if (!partner) return null;
                const isActive = activeChatPartner?.id === partner.id;

                return (
                  <div
                    key={convo.id}
                    onClick={() => setActiveConversation(convo, partner)}
                    className={`flex items-center gap-3.5 px-5 py-4 border-b border-slate-100 dark:border-slate-900/60 cursor-pointer transition-colors ${
                      isActive ? 'bg-gradient-to-r from-[#6C63FF]/10 to-[#A855F7]/5 dark:from-[#6C63FF]/20 dark:to-[#A855F7]/10 border-r-2 border-r-[#6C63FF]' : 'hover:bg-slate-50 dark:hover:bg-white/2'
                    }`}
                  >
                    <Avatar src={getAvatarUrl(partner.avatar_url)} name={partner.full_name || partner.username} size="md" />
                    <div className="flex-1 min-w-0 flex flex-col text-left">
                      <div className="flex justify-between items-center mb-0.5">
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200 font-outfit truncate">{partner.full_name || partner.username}</span>
                        <span className="text-[9px] text-slate-500">{formatDate(convo.last_message_at)}</span>
                      </div>
                      <span className="text-xs text-slate-500 truncate">Connected. Click to chat.</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-slate-500 mt-12 leading-relaxed">
              No chat channels. Click the plus button above to connect with a creator.
            </div>
          )}
        </div>
      </div>

      {/* 2. Right Panel (Active Messages) */}
      <div className={`flex-1 flex flex-col h-full ${!activeChatPartner ? 'hidden md:flex' : 'flex'}`}>
        {activeChatPartner ? (
          <>
            {/* Header detail */}
            <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between select-none">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveConversation(null, null)}
                  className="md:hidden p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-850 mr-1 cursor-pointer"
                >
                  <ArrowLeft className="h-4.5 w-4.5" />
                </button>
                <Avatar src={getAvatarUrl(activeChatPartner.avatar_url)} name={activeChatPartner.full_name || activeChatPartner.username} size="md" />
                <div className="flex flex-col text-left">
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-205 font-outfit truncate">
                    {activeChatPartner.full_name || activeChatPartner.username}
                  </span>
                  <span className="text-[10px] text-slate-500">@{activeChatPartner.username}</span>
                </div>
              </div>
              <button
                onClick={() => setActiveConversation(null, null)}
                className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrolling Chat messages box */}
            <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4 bg-slate-50/50 dark:bg-slate-950/20 custom-scrollbar select-text">
              {messagesLoading ? (
                <div className="flex justify-center py-6"><Spinner size="md" /></div>
              ) : chatMessages && chatMessages.length > 0 ? (
                chatMessages.map((msg) => {
                  const isSentByMe = msg.sender_id === currentUser?.id;
                  const hasReactions = msg.reactions && msg.reactions.length > 0;

                  return (
                    <div
                      key={msg.id}
                      onMouseEnter={() => setHoveredMessageId(msg.id)}
                      onMouseLeave={() => setHoveredMessageId(null)}
                      className={`flex flex-col max-w-[70%] relative group ${
                        isSentByMe ? 'self-end items-end' : 'self-start items-start'
                      }`}
                    >
                      {/* Emoji reaction selector popup on hover */}
                      {hoveredMessageId === msg.id && (
                        <div
                          className={cn(
                            'absolute top-[-34px] z-30 bg-slate-900 border border-slate-800 rounded-full px-2 py-1 flex gap-1.5 shadow-lg select-none',
                            isSentByMe ? 'right-2' : 'left-2'
                          )}
                        >
                          {EMOJIS.map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => toggleReaction.mutate({ messageId: msg.id, emoji })}
                              className="text-xs hover:scale-130 transition-transform cursor-pointer"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Bubble rendering based on message type */}
                      <div
                        className={`rounded-2xl px-4 py-2.5 text-sm sm:text-base leading-relaxed ${
                          isSentByMe
                            ? 'bg-gradient-to-r from-[#6C63FF] to-[#A855F7] text-white rounded-br-none shadow-md shadow-[#6C63FF]/15'
                            : 'bg-slate-100 dark:bg-white/5 text-slate-800 dark:text-slate-200 rounded-bl-none border border-slate-200/50 dark:border-white/10 shadow-sm'
                        }`}
                      >
                        {/* 1. Image attachment message */}
                        {msg.message_type === 'image' && msg.media_url && (
                          <div className="max-w-[200px] sm:max-w-[280px] rounded-lg overflow-hidden mb-1.5 bg-black/15">
                            <img
                              src={getChatMediaUrl(msg.media_url)}
                              alt="Uploaded attachment"
                              className="w-full h-auto object-cover max-h-[220px]"
                            />
                          </div>
                        )}

                        {/* 2. Video attachment message */}
                        {msg.message_type === 'video' && msg.media_url && (
                          <div className="max-w-[200px] sm:max-w-[280px] rounded-lg overflow-hidden mb-1.5 bg-black/20">
                            <video
                              src={getChatMediaUrl(msg.media_url)}
                              controls
                              className="w-full h-auto max-h-[220px]"
                            />
                          </div>
                        )}

                        {/* 3. Voice audio note message */}
                        {msg.message_type === 'voice' && msg.media_url && (
                          <div className="flex items-center gap-2 py-1 select-none">
                            <audio
                              src={getChatMediaUrl(msg.media_url)}
                              controls
                              className="max-w-[190px] sm:max-w-[240px] text-xs h-9"
                            />
                          </div>
                        )}

                        {/* 4. Story sharing card preview */}
                        {msg.message_type === 'story_share' && msg.shared_item_id && (
                          <div
                            onClick={() => navigate('/feed')}
                            className="flex flex-col gap-1.5 p-2.5 rounded-xl bg-black/20 hover:bg-black/35 cursor-pointer text-left border border-white/5 select-none max-w-[220px] mb-1"
                          >
                            <span className="text-[9px] font-extrabold uppercase text-indigo-400 tracking-wider flex items-center gap-1">
                              <Smile className="h-3 w-3" />
                              <span>Shared Story</span>
                            </span>
                            <span className="text-xs font-semibold text-slate-200 line-clamp-1 italic">{msg.content}</span>
                          </div>
                        )}

                        {/* 5. Reels sharing card preview */}
                        {msg.message_type === 'reel_share' && msg.shared_item_id && (
                          <div
                            onClick={() => navigate(`/reels?id=${msg.shared_item_id}`)}
                            className="flex flex-col gap-1.5 p-2.5 rounded-xl bg-black/20 hover:bg-black/35 cursor-pointer text-left border border-white/5 select-none max-w-[220px] mb-1"
                          >
                            <span className="text-[9px] font-extrabold uppercase text-indigo-400 tracking-wider flex items-center gap-1">
                              <Film className="h-3 w-3" />
                              <span>Shared Reel</span>
                            </span>
                            <span className="text-xs font-semibold text-slate-200 line-clamp-1 italic">{msg.content}</span>
                          </div>
                        )}

                        {/* Message body text */}
                        {(msg.message_type === 'text' || !msg.message_type) && <span>{formatMessageContent(msg.content)}</span>}
                      </div>

                      {/* Display attached reactions badge */}
                      {hasReactions && (
                        <div className="flex gap-1 bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded-full text-xs -mt-2.5 ml-2 border border-white dark:border-slate-900 select-none shadow">
                          {msg.reactions!.map((r, idx) => (
                            <span key={idx} title={r.user_id === currentUser?.id ? 'You' : 'Friend'}>
                              {r.emoji}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Info line (Timestamp + Read receipts checkmarks) */}
                      <div className="flex items-center gap-1.5 mt-1 select-none">
                        <span className="text-[9px] text-slate-450">{formatDate(msg.created_at)}</span>
                        {isSentByMe && (
                          <span className="flex items-center">
                            {msg.is_read ? (
                              <CheckCheck className="h-3.5 w-3.5 text-sky-450" />
                            ) : (
                              <Check className="h-3.5 w-3.5 text-slate-450" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-slate-450 text-center py-12">
                  This is the start of your message log. Be warm, make relationships.
                </p>
              )}

              {/* Typing display */}
              {isPartnerTyping && (
                <div className="flex items-center gap-2 self-start select-none">
                  <Avatar src={getAvatarUrl(activeChatPartner.avatar_url)} name={activeChatPartner.username} size="sm" />
                  <div className="flex gap-1 items-center bg-slate-100 dark:bg-slate-800 rounded-full px-3 py-1.5 text-xs text-slate-400">
                    <span className="font-bold text-slate-300">@{activeChatPartner.username} is writing</span>
                    <span className="animate-bounce">.</span>
                    <span className="animate-bounce delay-150">.</span>
                    <span className="animate-bounce delay-300">.</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Attachment preview banner */}
            {selectedFile && (
              <div className="px-5 py-2.5 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center select-none text-left">
                <div className="flex items-center gap-2">
                  {selectedFileType === 'image' && <Image className="h-4.5 w-4.5 text-indigo-400" />}
                  {selectedFileType === 'video' && <Film className="h-4.5 w-4.5 text-indigo-400" />}
                  {selectedFileType === 'voice' && <Mic className="h-4.5 w-4.5 text-indigo-400" />}
                  <span className="text-xs text-slate-300 font-bold truncate max-w-[200px]">
                    {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCancelAttachment}
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-white cursor-pointer text-xs"
                >
                  Remove
                </button>
              </div>
            )}

            {/* Voice Recording Active screen overlay */}
            {isRecording && (
              <div className="px-5 py-3.5 bg-[#EF4444]/10 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center select-none text-left animate-pulse">
                <div className="flex items-center gap-2">
                  <Mic className="h-4.5 w-4.5 text-red-500 animate-pulse" />
                  <span className="text-xs text-red-400 font-bold">
                    Recording Audio... {recordingSeconds}s
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleStopRecording}
                  className="px-3.5 py-1.5 rounded-full bg-red-600 hover:bg-red-550 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow"
                >
                  <Square className="h-3.5 w-3.5 fill-current" />
                  <span>Stop & Attach</span>
                </button>
              </div>
            )}

            {/* Input controller row */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-200 dark:border-slate-800/60 flex items-center gap-2 bg-white dark:bg-[#0B1020]/80 backdrop-blur-md select-none">
              
              {/* Media attach trigger */}
              <button
                type="button"
                onClick={handleFileClick}
                title="Attach media file"
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-400 hover:text-[#6C63FF] hover:border-[#6C63FF] transition-colors cursor-pointer"
              >
                <Paperclip className="h-4.5 w-4.5" />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*,video/*"
                className="hidden"
              />

              {/* Voice record trigger */}
              {!isRecording && (
                <button
                  type="button"
                  onClick={handleStartRecording}
                  title="Record audio message"
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-400 hover:text-[#6C63FF] hover:border-[#6C63FF] transition-colors cursor-pointer"
                >
                  <Mic className="h-4.5 w-4.5" />
                </button>
              )}

              {/* Message text input */}
              <input
                type="text"
                placeholder="Write a message..."
                value={messageText}
                onChange={handleInputChange}
                className="flex-1 bg-white/70 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-[#6C63FF] transition-colors"
                disabled={sendMessage.isPending || isRecording}
              />

              <Button
                type="submit"
                variant="primary"
                className="rounded-xl h-11 w-11 flex items-center justify-center p-0 flex-shrink-0"
                disabled={(!messageText.trim() && !selectedFile) || isRecording}
                isLoading={sendMessage.isPending}
              >
                {!sendMessage.isPending && <Send className="h-4.5 w-4.5" />}
              </Button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 select-none">
            <MessageSquare className="h-10 w-10 text-slate-400 dark:text-slate-600 mb-3" />
            <h4 className="text-lg font-bold font-outfit text-slate-800 dark:text-slate-300">Your Chat Window</h4>
            <p className="text-xs text-slate-500 max-w-xs mt-1 leading-relaxed">
              Select a conversation from the panel list, or search a username to initiate chats.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
