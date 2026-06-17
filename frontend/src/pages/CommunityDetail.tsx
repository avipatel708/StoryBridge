import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  Users,
  ArrowLeft,
  PlusCircle,
  Camera,
  Layers,
  Globe,
  Lock,
  MessageSquare,
  Sparkles,
  Check,
  X,
  Compass,
} from 'lucide-react';
import { useCommunities } from '@/hooks/useCommunities';
import { PostCard } from '@/components/feed/PostCard';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { getCommunityCoverUrl, getAvatarUrl } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { MOOD_CONFIG, MoodType } from '@/types';

export default function CommunityDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);

  const {
    useCommunityDetails,
    useCommunityFeed,
    useCommunityMembers,
    joinCommunity,
    leaveCommunity,
    createCommunityPost,
  } = useCommunities();

  // 1. Fetch Community details
  const {
    data: community,
    isLoading: isCommunityLoading,
    isError: isCommunityError,
  } = useCommunityDetails(slug || '');

  // 2. Fetch Community Posts
  const {
    data: posts,
    isLoading: isFeedLoading,
    isError: isFeedError,
  } = useCommunityFeed(community?.id || '');

  // 3. Fetch Community Members
  const {
    data: members,
    isLoading: isMembersLoading,
  } = useCommunityMembers(community?.id || '');

  // Local state for Composer
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [selectedMood, setSelectedMood] = useState<MoodType | ''>('');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview('');
  };

  const handlePostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!community || !content.trim()) return;

    createCommunityPost.mutate(
      {
        communityId: community.id,
        content: content.trim(),
        imageFile,
        mood: selectedMood || undefined,
      },
      {
        onSuccess: () => {
          setContent('');
          setImageFile(null);
          setImagePreview('');
          setSelectedMood('');
          setIsExpanded(false);
        },
      }
    );
  };

  const handleJoinToggle = () => {
    if (!community) return;
    if (community.is_member) {
      if (confirm(`Leave ${community.name}?`)) {
        leaveCommunity.mutate(community.id);
      }
    } else {
      joinCommunity.mutate(community.id);
    }
  };

  if (isCommunityLoading) {
    return (
      <div className="flex justify-center py-32">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isCommunityError || !community) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <EmptyState
          icon={Compass}
          title="Community Not Found"
          description="This community does not exist or you do not have permission to view it."
          actionText="Back to Communities"
          onAction={() => navigate('/communities')}
        />
      </div>
    );
  }

  const coverUrl = getCommunityCoverUrl(community.cover_url) || 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=800';

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-16 px-1 sm:px-4 text-left">
      {/* Back button */}
      <button
        onClick={() => navigate('/communities')}
        className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white uppercase tracking-wider transition-colors mr-auto cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Communities
      </button>

      {/* Community Header Banner */}
      <div className="relative h-56 sm:h-64 w-full rounded-[2rem] overflow-hidden border border-slate-205/50 dark:border-slate-800/50 shadow-md">
        <img src={coverUrl} alt={community.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

        {/* Category tag */}
        <span className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-white/95 dark:bg-slate-900/90 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 shadow shadow-slate-950/5 border border-slate-100/10">
          {community.category}
        </span>

        {/* Title details at bottom */}
        <div className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-extrabold font-outfit text-white tracking-tight leading-none truncate">
              {community.name}
            </h1>
            <p className="text-xs text-indigo-200 mt-2 font-bold font-sans flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              <span>{community.member_count} Members</span>
            </p>
          </div>

          <Button
            onClick={handleJoinToggle}
            variant={community.is_member ? 'outline' : 'primary'}
            size="sm"
            className={`rounded-xl px-6 font-bold border-none ${
              community.is_member
                ? 'bg-white/20 hover:bg-red-500/80 text-white backdrop-blur-md hover:text-white border border-white/10'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20'
            }`}
            disabled={joinCommunity.isPending || leaveCommunity.isPending}
          >
            {community.is_member ? (
              <span className="flex items-center gap-1.5">
                <Check className="h-4 w-4" /> Joined
              </span>
            ) : (
              'Join Community'
            )}
          </Button>
        </div>
      </div>

      {/* Main columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-2 items-start">
        {/* Left column: Publisher & Posts */}
        <div className="lg:col-span-8 flex flex-col gap-5">
          {/* Post publisher (only for members) */}
          {community.is_member ? (
            <div className="rounded-2xl border border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-[#121829] p-4 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500 to-purple-500" />
              
              <form onSubmit={handlePostSubmit} className="flex flex-col gap-3">
                <div className="flex gap-3">
                  <div className="h-9 w-9 rounded-full overflow-hidden bg-slate-100 flex-shrink-0">
                    <img src={currentUser?.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=60'} alt="" className="h-full w-full object-cover" />
                  </div>
                  
                  <div className="flex-1">
                    <Textarea
                      placeholder="Share a story or post in this community..."
                      value={content}
                      onChange={(e) => {
                        setContent(e.target.value);
                        if (!isExpanded) setIsExpanded(true);
                      }}
                      onFocus={() => setIsExpanded(true)}
                      className="w-full border-none bg-transparent p-0 text-sm focus:ring-0 text-slate-800 dark:text-slate-100 placeholder-slate-450 resize-none min-h-[44px]"
                      rows={isExpanded ? 3 : 1}
                      required
                    />
                  </div>
                </div>

                {/* Expanded Fields: Image Upload & Mood Selector */}
                {isExpanded && (
                  <div className="flex flex-col gap-3.5 border-t border-slate-100 dark:border-slate-800/60 pt-3 mt-1">
                    {/* Image Preview */}
                    {imagePreview && (
                      <div className="relative h-32 w-32 rounded-xl overflow-hidden shadow-inner border border-slate-200/50 dark:border-slate-800/50">
                        <img src={imagePreview} alt="Upload preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={removeImage}
                          className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-black/60 text-white hover:bg-black/80 transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}

                    {/* Mood Selector row */}
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Share Your Mood</span>
                      <div className="flex flex-wrap gap-1.5">
                        {(Object.keys(MOOD_CONFIG) as MoodType[]).map((moodType) => {
                          const config = MOOD_CONFIG[moodType];
                          const isSelected = selectedMood === moodType;
                          return (
                            <button
                              key={moodType}
                              type="button"
                              onClick={() => setSelectedMood(isSelected ? '' : moodType)}
                              className={`px-3 py-1 rounded-full text-xs font-bold font-outfit border flex items-center gap-1 cursor-pointer transition-colors ${
                                isSelected
                                  ? 'border-transparent text-white'
                                  : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:border-slate-350 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                              }`}
                              style={isSelected ? { backgroundColor: config.color } : undefined}
                            >
                              <span>{config.emoji}</span>
                              <span>{config.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Bottom action row */}
                    <div className="flex items-center justify-between">
                      {/* Image Picker Trigger */}
                      <label className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 text-slate-500 hover:text-indigo-500 hover:border-indigo-500/30 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold font-outfit">
                        <Camera className="h-4 w-4" />
                        <span>Add Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </label>

                      {/* Action buttons */}
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setContent('');
                            setImageFile(null);
                            setImagePreview('');
                            setSelectedMood('');
                            setIsExpanded(false);
                          }}
                          className="rounded-xl border-slate-200 dark:border-slate-800"
                        >
                          Cancel
                        </Button>
                        
                        <Button
                          type="submit"
                          variant="primary"
                          size="sm"
                          className="rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/10 font-bold border-none px-5"
                          disabled={createCommunityPost.isPending || !content.trim()}
                        >
                          {createCommunityPost.isPending ? 'Posting...' : 'Post Story'}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </form>
            </div>
          ) : (
            <div className="p-5 border border-slate-200/50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl text-center select-none">
              <Lock className="h-5 w-5 mx-auto text-slate-400 mb-2" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">You are viewing this community as a guest.</p>
              <button
                onClick={handleJoinToggle}
                className="text-[10px] font-bold text-indigo-500 hover:text-indigo-700 uppercase tracking-widest mt-1.5 cursor-pointer"
              >
                Join Community to Participate
              </button>
            </div>
          )}

          {/* Posts Feed list */}
          <div className="flex flex-col gap-5">
            {isFeedLoading ? (
              <div className="flex justify-center py-12">
                <Spinner size="md" />
              </div>
            ) : isFeedError ? (
              <div className="text-center py-6 text-xs text-red-400">Failed to load posts.</div>
            ) : posts && posts.length > 0 ? (
              posts.map((post) => <PostCard key={post.id} post={post} />)
            ) : (
              <EmptyState
                icon={MessageSquare}
                title="No Posts Yet"
                description="This community feed is currently empty. Be the first to start a conversation!"
              />
            )}
          </div>
        </div>

        {/* Right column: Sidebar Details & Members */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          {/* About Box */}
          <div className="border border-slate-200/40 dark:border-slate-800/40 bg-white dark:bg-slate-950/40 rounded-2xl p-5 flex flex-col gap-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">About Community</h3>
            <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed font-sans">
              {community.description || 'Welcome to this StoryBridge community space. Follow along to read stories and share moments.'}
            </p>
            
            <div className="flex flex-col gap-2 border-t border-slate-100 dark:border-slate-800/60 pt-3.5 mt-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Creator:</span>
                <span className="font-bold text-slate-700 dark:text-slate-250">
                  {community.profiles?.full_name || community.profiles?.username || 'System'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Created:</span>
                <span className="font-bold text-slate-700 dark:text-slate-250">
                  {new Date(community.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Category:</span>
                <span className="font-bold text-indigo-500">{community.category}</span>
              </div>
            </div>
          </div>

          {/* Members Sidebar Box */}
          <div className="border border-slate-200/40 dark:border-slate-800/40 bg-white dark:bg-slate-950/40 rounded-2xl p-5 flex flex-col gap-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Members ({members?.length || 0})
            </h3>
            
            {members && members.length > 0 ? (
              <div className="flex flex-col gap-3.5">
                {members.slice(0, 8).map((member) => {
                  const mProfile = member.profiles as any;
                  if (!mProfile) return null;
                  
                  return (
                    <div
                      key={member.id}
                      onClick={() => navigate(`/profile/${mProfile.username}`)}
                      className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition-opacity"
                    >
                      <div className="h-7 w-7 rounded-full overflow-hidden bg-slate-100">
                        <img
                          src={mProfile.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=60'}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate leading-none">
                          {mProfile.full_name || mProfile.username}
                        </p>
                        <p className="text-[9px] text-slate-400 mt-1 truncate">@{mProfile.username}</p>
                      </div>
                      {member.role === 'admin' && (
                        <span className="ml-auto text-[8px] bg-indigo-500/10 text-indigo-500 px-1.5 py-0.5 rounded font-bold uppercase">
                          ADMIN
                        </span>
                      )}
                    </div>
                  );
                })}
                
                {members.length > 8 && (
                  <p className="text-[10px] text-slate-450 italic text-center border-t border-slate-100 dark:border-slate-800/60 pt-2.5">
                    And {members.length - 8} more members
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400">No members found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
