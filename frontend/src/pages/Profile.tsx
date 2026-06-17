import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Calendar, Tag, Edit, UserCheck, UserPlus, Grid, Heart, Sparkles, MessageSquare, Image, Award, Info, Link2, Layers, Film, Bookmark } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useProfile } from '@/hooks/useProfile';
import { usePosts } from '@/hooks/usePosts';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { INTEREST_CATEGORIES } from '@/lib/constants';
import { getAvatarUrl, getCoverUrl, getPostImageUrl } from '@/lib/utils';
import { PostCard } from '@/components/feed/PostCard';
import { StoryHighlights } from '@/components/profile/StoryHighlights';
import { MemoryTimeline } from '@/components/profile/MemoryTimeline';
import { AchievementBadges } from '@/components/profile/AchievementBadges';
import { useCapsules } from '@/hooks/useCapsules';
import { CapsuleCard } from '@/components/capsules/CapsuleCard';
import { FriendshipJourneyModal } from '@/components/profile/FriendshipJourneyModal';
import { useReels } from '@/hooks/useReels';
import { useStories } from '@/hooks/useStories';
import { supabaseUrl } from '@/lib/supabase';

function getStoryUrl(path: string) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${supabaseUrl}/storage/v1/object/public/stories/${path}`;
}

function getReelUrl(path: string) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${supabaseUrl}/storage/v1/object/public/reels/${path}`;
}

export default function Profile() {
  const username = useParams<{ username: string }>().username;
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);

  const { useProfileByUsername, useProfileStats, toggleFollow, updateProfile } = useProfile();
  const { useUserPosts } = usePosts();
  const { useUserReels } = useReels();
  const { useArchivedStories } = useStories();

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editInterests, setEditInterests] = useState<string[]>([]);
  const [editAvatar, setEditAvatar] = useState<File | null>(null);
  const [editCover, setEditCover] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState<'timeline' | 'grid' | 'capsules' | 'milestones' | 'badges' | 'reels' | 'archive'>('timeline');
  const [isJourneyModalOpen, setIsJourneyModalOpen] = useState(false);

  // Queries
  const { data: profile, isLoading: profileLoading, isError: profileError } = useProfileByUsername(username || '');
  const { data: stats, isLoading: statsLoading } = useProfileStats(profile?.id || '');
  const { data: posts, isLoading: postsLoading } = useUserPosts(profile?.id || '');
  const { useUserCapsules } = useCapsules(profile?.id);
  const { data: capsules, isLoading: capsulesLoading } = useUserCapsules();
  const { data: userReels, isLoading: reelsLoading } = useUserReels(profile?.id || '');
  const { data: archivedStories, isLoading: archiveLoading } = useArchivedStories();

  const isOwner = currentUser?.id === profile?.id;

  const handleEditOpen = () => {
    if (!profile) return;
    setEditFullName(profile.full_name || '');
    setEditBio(profile.bio || '');
    setEditInterests(profile.interests || []);
    setEditAvatar(null);
    setEditCover(null);
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile.mutateAsync({
        fullName: editFullName,
        bio: editBio,
        interests: editInterests,
        avatarFile: editAvatar,
        coverFile: editCover,
      });
      setEditModalOpen(false);
    } catch (err) {
      // Handled in query hooks
    }
  };

  const handleInterestToggle = (interest: string) => {
    setEditInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const handleFollowToggle = () => {
    if (!profile || !stats) return;
    toggleFollow.mutate({
      targetId: profile.id,
      isFollowing: stats.isFollowing,
    });
  };

  const handleMessageClick = () => {
    if (!profile || !currentUser) return;
    navigate(`/messages?chatWith=${profile.id}`);
  };

  if (profileLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Spinner size="lg" />
        <span className="text-xs font-bold text-slate-400 dark:text-slate-550 tracking-widest uppercase animate-pulse">
          Loading creator profile...
        </span>
      </div>
    );
  }

  if (profileError || !profile) {
    return (
      <EmptyState
        title="Profile not found"
        description="The creator star profile you are trying to reach doesn't exist."
        actionText="Back to Feed"
        onAction={() => navigate('/feed')}
      />
    );
  }

  // Filter posts that have images for the photo grid view
  const imagePosts = posts?.filter((post) => post.image_url) || [];

  // Mock Story Highlights
  const highlights = [
    { id: 1, label: 'Moments', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150' },
    { id: 2, label: 'Travel', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150' },
    { id: 3, label: 'Coffee', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150' }
  ];

  return (
    <div className="flex flex-col gap-8 max-w-2xl mx-auto pb-16">
      
      {/* 1. Large Cover Banner Card */}
      <Card variant="glass" padding="none" className="border border-slate-200/40 dark:border-white/8 bg-white/60 dark:bg-[#0B1020]/75 backdrop-blur-[20px] overflow-hidden relative flex flex-col rounded-2xl premium-shadow-md transition-all duration-300">
        
        {/* Cover Backdrop */}
        <div className="h-48 sm:h-60 w-full bg-slate-100 dark:bg-slate-900 overflow-hidden relative rounded-t-2xl">
          {profile.cover_url ? (
            <img
              src={getCoverUrl(profile.cover_url) || ''}
              alt="Profile cover backdrop"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-indigo-50 dark:from-indigo-950 via-slate-100 dark:via-slate-900 to-pink-50 dark:to-pink-955" />
          )}
        </div>

        {/* Profile Details & Avatar Overlay */}
        <div className="px-6 pb-6 relative flex flex-col sm:flex-row items-center sm:items-end justify-between -mt-14 sm:-mt-16 gap-4">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 text-center sm:text-left">
            <Avatar
              src={getAvatarUrl(profile.avatar_url)}
              name={profile.full_name || profile.username}
              size="2xl"
              className="ring-4 ring-white dark:ring-[#0B1020] shadow-md bg-white dark:bg-[#0B1020] border border-slate-200/40 dark:border-white/8"
            />
            <div className="flex flex-col min-w-0 sm:pb-2">
              <h1 className="text-xl sm:text-2xl font-bold font-outfit text-slate-800 dark:text-slate-150 truncate">
                {profile.full_name || profile.username}
              </h1>
              <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold mt-0.5 uppercase tracking-wider">
                @{profile.username}
              </span>
            </div>
          </div>

          {/* Action buttons (Follow, Message, Edit) */}
          <div className="flex items-center gap-3 sm:pb-2 flex-wrap">
            {isOwner ? (
              <Button
                onClick={handleEditOpen}
                variant="outline"
                size="sm"
                leftIcon={<Edit className="h-4 w-4" />}
                className="rounded-xl border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold text-xs"
              >
                Edit Profile
              </Button>
            ) : currentUser ? (
              <>
                <Button
                  onClick={() => setIsJourneyModalOpen(true)}
                  variant="primary"
                  size="sm"
                  className="rounded-xl bg-gradient-to-r from-[#6C63FF] via-[#A855F7] to-[#EC4899] hover:brightness-110 border-none font-extrabold text-xs text-white hover:text-white shadow-lg shadow-[#6C63FF]/25 hover:shadow-[#6C63FF]/40 hover:-translate-y-0.5 transition-all duration-300 px-4"
                  leftIcon={<Link2 className="h-4 w-4 text-white" />}
                >
                  Journey
                </Button>
                <Button
                  onClick={handleMessageClick}
                  variant="outline"
                  size="sm"
                  className="rounded-xl border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold text-xs"
                  leftIcon={<MessageSquare className="h-4 w-4" />}
                >
                  Message
                </Button>
                <Button
                  onClick={handleFollowToggle}
                  variant={stats?.isFollowing ? 'outline' : 'primary'}
                  size="sm"
                  disabled={toggleFollow.isPending}
                  className={`rounded-xl font-bold px-6 border-none text-xs ${
                    stats?.isFollowing 
                      ? 'bg-transparent border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800' 
                      : 'bg-[#6C63FF] hover:bg-[#6C63FF]/95 text-white shadow-sm'
                  }`}
                  leftIcon={stats?.isFollowing ? <UserCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                >
                  {stats?.isFollowing ? 'Connected' : 'Connect'}
                </Button>
              </>
            ) : null}
          </div>
        </div>

        {/* Counters Stats */}
        <div className="border-t border-slate-100 dark:border-slate-800 px-6 py-4 flex items-center justify-around text-center sm:justify-start sm:gap-12 select-none">
          <div className="flex flex-col sm:flex-row items-center gap-1.5">
            <span className="text-base font-extrabold font-outfit text-slate-800 dark:text-slate-200">
              {stats?.postsCount ?? 0}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">
              Posts
            </span>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-1.5">
            <span className="text-base font-extrabold font-outfit text-slate-800 dark:text-slate-200">
              {stats?.followersCount ?? 0}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">
              Followers
            </span>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-1.5">
            <span className="text-base font-extrabold font-outfit text-slate-800 dark:text-slate-200">
              {stats?.followingCount ?? 0}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">
              Following
            </span>
          </div>
        </div>
      </Card>

      {/* 2. Story Highlights (Instagram Concept) */}
      <div className="border-b border-slate-150 dark:border-slate-800 pb-3 select-none text-left">
        <StoryHighlights userId={profile.id} />
      </div>

      {/* 3. Bio & Resonance Coordinates */}
      <Card variant="glass" padding="md" className="flex flex-col gap-4 border border-slate-200/40 dark:border-white/8 bg-white/60 dark:bg-[#0B1020]/75 backdrop-blur-[20px] rounded-2xl premium-shadow-md transition-all duration-300">
        <div className="flex flex-col gap-1.5 select-text">
          <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
            <Info className="h-4 w-4 text-[#6C63FF] dark:text-[#A855F7]" />
            Creator Info
          </h3>
          <p className="text-slate-650 dark:text-slate-350 text-sm leading-relaxed whitespace-pre-line font-light">
            {profile.bio || 'This creator hasn\'t written a bio description yet.'}
          </p>
        </div>

        {/* Interests */}
        {profile.interests && profile.interests.length > 0 && (
          <div className="flex flex-col gap-2 mt-1 border-t border-slate-100 dark:border-slate-800 pt-4">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase select-none">
              Interests & Focus
            </span>
            <div className="flex flex-wrap gap-2 select-none">
              {profile.interests.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1.5 rounded-full bg-slate-50 dark:bg-slate-850/30 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-350 font-semibold text-xs flex items-center gap-1.5 hover:border-slate-350 dark:hover:border-slate-700 hover:text-slate-800 dark:hover:text-slate-200 transition-all duration-200"
                >
                  <Tag className="h-3 w-3 text-[#6C63FF] dark:text-[#A855F7]" />
                  <span>{tag}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 text-[10px] text-slate-450 dark:text-slate-500 font-bold mt-1 border-t border-slate-100 dark:border-slate-850/60 pt-4 uppercase tracking-widest select-none">
          <Calendar className="h-4 w-4 text-[#6C63FF] dark:text-[#A855F7]" />
          <span>Joined {new Date(profile.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}</span>
        </div>
      </Card>

      {/* 4. Posts Grid vs Timeline Switcher */}
      <div className="flex flex-col gap-4">
        
        {/* Navigation Tabs */}
        <div className="flex items-center gap-5 border-b border-slate-200 dark:border-slate-800 pb-1 select-none overflow-x-auto scrollbar-none text-left">
          <button
            onClick={() => setActiveTab('timeline')}
            className={`pb-2.5 text-xs font-bold tracking-widest uppercase transition-all border-b-2 flex items-center gap-2 cursor-pointer flex-shrink-0 ${
              activeTab === 'timeline' 
                ? 'border-[#6C63FF] dark:border-[#A855F7] text-slate-800 dark:text-slate-150' 
                : 'border-transparent text-slate-400 dark:text-slate-550 hover:text-slate-655 dark:hover:text-slate-300'
            }`}
          >
            <Grid className="h-4 w-4" />
            Stories
          </button>
          <button
            onClick={() => setActiveTab('grid')}
            className={`pb-2.5 text-xs font-bold tracking-widest uppercase transition-all border-b-2 flex items-center gap-2 cursor-pointer flex-shrink-0 ${
              activeTab === 'grid' 
                ? 'border-[#6C63FF] dark:border-[#A855F7] text-slate-800 dark:text-slate-150' 
                : 'border-transparent text-slate-400 dark:text-slate-550 hover:text-slate-655 dark:hover:text-slate-300'
            }`}
          >
            <Image className="h-4 w-4" />
            Photos
          </button>
          <button
            onClick={() => setActiveTab('reels')}
            className={`pb-2.5 text-xs font-bold tracking-widest uppercase transition-all border-b-2 flex items-center gap-2 cursor-pointer flex-shrink-0 ${
              activeTab === 'reels' 
                ? 'border-[#6C63FF] dark:border-[#A855F7] text-slate-800 dark:text-slate-150' 
                : 'border-transparent text-slate-400 dark:text-slate-555 hover:text-slate-655 dark:hover:text-slate-300'
            }`}
          >
            <Film className="h-4 w-4" />
            Reels
          </button>
          <button
            onClick={() => setActiveTab('capsules')}
            className={`pb-2.5 text-xs font-bold tracking-widest uppercase transition-all border-b-2 flex items-center gap-2 cursor-pointer flex-shrink-0 ${
              activeTab === 'capsules' 
                ? 'border-[#6C63FF] dark:border-[#A855F7] text-slate-800 dark:text-slate-150' 
                : 'border-transparent text-slate-400 dark:text-slate-555 hover:text-slate-655 dark:hover:text-slate-300'
            }`}
          >
            <Layers className="h-4 w-4" />
            Capsules
          </button>
          <button
            onClick={() => setActiveTab('milestones')}
            className={`pb-2.5 text-xs font-bold tracking-widest uppercase transition-all border-b-2 flex items-center gap-2 cursor-pointer flex-shrink-0 ${
              activeTab === 'milestones' 
                ? 'border-[#6C63FF] dark:border-[#A855F7] text-slate-800 dark:text-slate-150' 
                : 'border-transparent text-slate-400 dark:text-slate-555 hover:text-slate-655 dark:hover:text-slate-300'
            }`}
          >
            <Calendar className="h-4 w-4" />
            Timeline
          </button>
          <button
            onClick={() => setActiveTab('badges')}
            className={`pb-2.5 text-xs font-bold tracking-widest uppercase transition-all border-b-2 flex items-center gap-2 cursor-pointer flex-shrink-0 ${
              activeTab === 'badges' 
                ? 'border-[#6C63FF] dark:border-[#A855F7] text-slate-800 dark:text-slate-150' 
                : 'border-transparent text-slate-400 dark:text-slate-555 hover:text-slate-655 dark:hover:text-slate-300'
            }`}
          >
            <Award className="h-4 w-4" />
            Badges
          </button>
          {isOwner && (
            <button
              onClick={() => setActiveTab('archive')}
              className={`pb-2.5 text-xs font-bold tracking-widest uppercase transition-all border-b-2 flex items-center gap-2 cursor-pointer flex-shrink-0 ${
                activeTab === 'archive' 
                  ? 'border-[#6C63FF] dark:border-[#A855F7] text-slate-800 dark:text-slate-150' 
                  : 'border-transparent text-slate-400 dark:text-slate-555 hover:text-slate-655 dark:hover:text-slate-300'
              }`}
            >
              <Bookmark className="h-4 w-4" />
              Archive
            </button>
          )}
        </div>
 
        {/* Timeline Post view */}
        {activeTab === 'timeline' && (
          <div className="flex flex-col gap-4">
            {postsLoading ? (
              <div className="flex justify-center py-12">
                <Spinner size="md" />
              </div>
            ) : posts && posts.length > 0 ? (
              posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))
            ) : (
              <EmptyState
                icon={Sparkles}
                title="No memories shared yet"
                description={isOwner ? "Share your first memory with the world." : "This user hasn't posted any stories yet."}
                actionText={isOwner ? "Share Story" : undefined}
                onAction={isOwner ? () => navigate('/feed') : undefined}
              />
            )}
          </div>
        )}
 
        {/* Pinterest/Dribbble Photo Grid view */}
        {activeTab === 'grid' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 animate-fade-in">
            {postsLoading ? (
              <div className="flex justify-center py-12 col-span-full">
                <Spinner size="md" />
              </div>
            ) : imagePosts.length > 0 ? (
              imagePosts.map((post) => (
                <div 
                  key={post.id} 
                  className="relative group rounded-xl overflow-hidden aspect-square border border-slate-200/50 dark:border-slate-800/60 cursor-pointer shadow-sm dark:shadow-none"
                  onClick={() => setActiveTab('timeline')}
                >
                  <img src={getPostImageUrl(post.image_url) || undefined} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white text-xs font-bold font-outfit">
                    <span className="flex items-center gap-1"><Heart className="h-4 w-4 fill-white" /> {post.likes_count}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-16 text-center text-xs text-slate-450 dark:text-slate-550 font-bold uppercase tracking-widest">
                No visual posts available
              </div>
            )}
          </div>
        )}

        {/* Reels Tab */}
        {activeTab === 'reels' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 animate-fade-in text-left">
            {reelsLoading ? (
              <div className="flex justify-center py-12 col-span-full">
                <Spinner size="md" />
              </div>
            ) : userReels && userReels.length > 0 ? (
              userReels.map((reel) => (
                <div 
                  key={reel.id} 
                  className="relative group rounded-xl overflow-hidden aspect-[9/16] border border-slate-200/50 dark:border-slate-800/60 cursor-pointer shadow-sm dark:shadow-none bg-slate-950"
                  onClick={() => navigate(`/reels?id=${reel.id}`)}
                >
                  <video src={getReelUrl(reel.video_url)} className="w-full h-full object-cover" muted playsInline />
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 text-white text-xs font-bold font-outfit p-2">
                    <span className="flex items-center gap-1">❤️ {reel.likes_count}</span>
                    <span className="text-[10px] text-slate-200 truncate px-2 max-w-full font-sans font-normal text-center">{reel.caption}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-16 text-center text-xs text-slate-450 dark:text-slate-550 font-bold uppercase tracking-widest">
                No Reels uploaded yet
              </div>
            )}
          </div>
        )}

        {/* Archive Tab */}
        {activeTab === 'archive' && isOwner && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 animate-fade-in text-left">
            {archiveLoading ? (
              <div className="flex justify-center py-12 col-span-full">
                <Spinner size="md" />
              </div>
            ) : archivedStories && archivedStories.length > 0 ? (
              archivedStories.map((story) => (
                <div 
                  key={story.id} 
                  className="relative group rounded-xl overflow-hidden aspect-[9/16] border border-slate-200/50 dark:border-slate-800/60 shadow-sm dark:shadow-none bg-slate-950"
                >
                  {story.media_type === 'video' ? (
                    <video src={getStoryUrl(story.video_url || '')} className="w-full h-full object-cover" muted playsInline />
                  ) : (
                    <img src={getStoryUrl(story.image_url)} className="w-full h-full object-cover" />
                  )}
                  <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-[2px] px-2 py-0.5 rounded text-[8px] font-bold text-white uppercase tracking-wider">
                    Expired
                  </div>
                  <div className="absolute bottom-2 left-2 right-2 text-center text-[10px] text-white bg-black/40 backdrop-blur-[2px] py-1 rounded">
                    {new Date(story.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-16 text-center text-xs text-slate-450 dark:text-slate-550 font-bold uppercase tracking-widest">
                Your story archive is empty
              </div>
            )}
          </div>
        )}

        {/* Capsules Tab */}
        {activeTab === 'capsules' && (
          <div className="flex flex-col gap-4">
            {capsulesLoading ? (
              <div className="flex justify-center py-12">
                <Spinner size="md" />
              </div>
            ) : capsules && capsules.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {capsules.map((capsule) => (
                  <CapsuleCard key={capsule.id} capsule={capsule} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Layers}
                title="No Memory Capsules"
                description={isOwner ? "Curate your stories into theme capsules." : "This user hasn't created any capsules."}
                actionText={isOwner ? "Create Capsule" : undefined}
                onAction={isOwner ? () => navigate('/capsules') : undefined}
              />
            )}
          </div>
        )}

        {/* Timeline milestones tab */}
        {activeTab === 'milestones' && (
          <div className="border border-slate-200/40 dark:border-slate-800/40 bg-white dark:bg-slate-950/40 rounded-3xl p-6 shadow-sm">
            <MemoryTimeline userId={profile.id} />
          </div>
        )}

        {/* Badges tab */}
        {activeTab === 'badges' && (
          <div className="border border-slate-200/40 dark:border-slate-800/40 bg-white dark:bg-slate-950/40 rounded-3xl p-6 shadow-sm">
            <AchievementBadges userId={profile.id} />
          </div>
        )}

      </div>

      {/* 5. Edit Profile Modal */}
      {isOwner && (
        <Modal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          title="Edit Profile Info"
          size="lg"
        >
          <form onSubmit={handleEditSubmit} className="flex flex-col gap-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ImageUpload
                value={editAvatar}
                onChange={setEditAvatar}
                label="Change Avatar Star"
                aspectRatio="square"
                maxSize={5 * 1024 * 1024}
              />
              <ImageUpload
                value={editCover}
                onChange={setEditCover}
                label="Change Cover Backdrop"
                aspectRatio="video"
                maxSize={10 * 1024 * 1024}
              />
            </div>

            <Input
              type="text"
              label="Display Name"
              value={editFullName}
              onChange={(e) => setEditFullName(e.target.value)}
            />

            <Textarea
              label="Creator Bio"
              value={editBio}
              onChange={(e) => setEditBio(e.target.value)}
              maxLength={160}
              showCharacterCount
            />

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-450 dark:text-slate-455 uppercase tracking-widest">Interest Focus (Choose 3+)</label>
              <div className="flex flex-wrap gap-1.5 max-h-[140px] overflow-y-auto pr-1 border border-slate-200 dark:border-slate-800 rounded-xl p-3 bg-slate-50 dark:bg-[#0E1322]/40 custom-scrollbar select-none">
                {INTEREST_CATEGORIES.map((cat) => {
                  const isSelected = editInterests.includes(cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => handleInterestToggle(cat)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-all duration-150 cursor-pointer ${
                        isSelected
                          ? 'bg-[#6C63FF] dark:bg-[#A855F7] text-white border-[#6C63FF] dark:border-[#A855F7]'
                          : 'bg-white dark:bg-[#121829] text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-850 hover:border-slate-350 dark:hover:border-slate-700'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-150 dark:border-slate-800 pt-4">
              <Button
                onClick={() => setEditModalOpen(false)}
                variant="ghost"
                size="sm"
                className="text-slate-400 hover:text-slate-650"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={updateProfile.isPending}
                disabled={editInterests.length < 3}
                className="bg-gradient-to-r from-[#6C63FF] to-[#A855F7] border-none font-bold text-white rounded-xl px-5"
              >
                Save Details
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {isJourneyModalOpen && (
        <FriendshipJourneyModal
          isOpen={isJourneyModalOpen}
          onClose={() => setIsJourneyModalOpen(false)}
          targetUserId={profile.id}
        />
      )}
    </div>
  );
}
