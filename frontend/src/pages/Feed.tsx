import React, { useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import {
  PlusCircle,
  Sparkles,
  Compass,
  Bell,
  Camera,
  PenLine,
  Zap,
  Link2,
} from 'lucide-react';
import { StoriesBar } from '@/components/stories/StoriesBar';
import { PostCard } from '@/components/feed/PostCard';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { usePosts } from '@/hooks/usePosts';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { getAvatarUrl } from '@/lib/utils';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

const PROMPTS = [
  'What moment made you smile today?',
  'Share a story that connects us…',
  'What bridge are you building today?',
  'Drop a memory worth keeping.',
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 320, damping: 28 } },
};

function FeedBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden -z-10" aria-hidden>
      <div className="feed-mesh-orb absolute -top-24 -left-20 h-72 w-72 rounded-full bg-indigo-500/20 blur-[80px] dark:bg-indigo-500/25" />
      <div className="feed-mesh-orb-delayed absolute top-1/3 -right-16 h-64 w-64 rounded-full bg-purple-500/15 blur-[70px] dark:bg-purple-500/20" />
      <div className="feed-mesh-orb absolute bottom-10 left-1/4 h-56 w-56 rounded-full bg-pink-500/10 blur-[60px] dark:bg-pink-500/15" />
      <div className="absolute inset-0 opacity-[0.35] dark:opacity-[0.2] clean-grid dark:dark-clean-grid" />
    </div>
  );
}

function FeedWelcome({
  username,
  fullName,
  avatarUrl,
  postCount,
}: {
  username: string;
  fullName?: string | null;
  avatarUrl: string | null;
  postCount: number;
}) {
  const prompt = useMemo(() => PROMPTS[Math.floor(Date.now() / 86400000) % PROMPTS.length], []);

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 280, damping: 26 }}
      className="relative"
    >
      <div className="relative overflow-hidden rounded-3xl p-[1px]">
        <div className="absolute inset-0 feed-spin-border bg-gradient-to-r from-[#6C63FF] via-[#A855F7] to-[#EC4899] opacity-80" />
        <div className="relative rounded-[23px] bg-white/90 dark:bg-[#0B1020]/90 backdrop-blur-xl px-5 py-5 sm:px-6 sm:py-6">
          <div className="flex items-start gap-4">
            <div className="relative flex-shrink-0">
              <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-[#6C63FF] via-[#A855F7] to-[#EC4899] opacity-60 blur-sm" />
              <Avatar
                src={avatarUrl}
                name={fullName || username}
                size="lg"
                className="relative ring-2 ring-white dark:ring-[#0B1020]"
              />
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#6C63FF] dark:text-[#A855F7]">
                {getGreeting()}
              </p>
              <h1 className="mt-1 text-xl sm:text-2xl font-extrabold font-outfit tracking-tight text-slate-900 dark:text-white truncate">
                Welcome back,{' '}
                <span className="feed-shimmer-text">{fullName?.split(' ')[0] || username}</span>
              </h1>
              <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                {prompt}
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 px-3 py-1.5">
              <Link2 className="h-3.5 w-3.5 text-indigo-500" />
              <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-300">
                {postCount} {postCount === 1 ? 'story' : 'stories'} in your bridge
              </span>
            </div>
            <Link
              to="/explore"
              className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-slate-800/60 px-3 py-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/40 dark:hover:text-indigo-300 transition-colors"
            >
              <Compass className="h-3.5 w-3.5" />
              Explore
            </Link>
            <Link
              to="/notifications"
              className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-slate-800/60 px-3 py-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/40 dark:hover:text-indigo-300 transition-colors"
            >
              <Bell className="h-3.5 w-3.5" />
              Updates
            </Link>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

const COMPOSER_BUTTONS = [
  { icon: Camera, label: 'Photo', to: '/create/post' },
  { icon: PenLine, label: 'Story', to: '/create/story' },
  { icon: Zap, label: 'Moment', to: '/create/post' },
];

function FeedComposer({
  profile,
}: {
  profile: NonNullable<ReturnType<typeof useAuthStore.getState>['profile']>;
}) {
  const navigate = useNavigate();
  const photoInputRef = useRef<HTMLInputElement>(null);
  const storyInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      console.log('[FeedComposer] Photo selected → navigating to /create/post with file', file.name);
      navigate('/create/post', { state: { preSelectedFile: file } });
    }
  };

  const handleStoryFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      console.log('[FeedComposer] Story selected → navigating to /create/story with file', file.name);
      navigate('/create/story', { state: { preSelectedFile: file } });
    }
  };

  const handleButtonClick = (label: string, to: string) => {
    if (label === 'Photo') {
      photoInputRef.current?.click();
    } else if (label === 'Story') {
      storyInputRef.current?.click();
    } else {
      console.log(`[FeedComposer] "${label}" button clicked → navigating to ${to}`);
      navigate(to);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08, type: 'spring', stiffness: 300, damping: 28 }}
      className="group w-full text-left relative overflow-hidden rounded-2xl border border-slate-200/40 dark:border-white/8 bg-white/60 dark:bg-[#0B1020]/75 backdrop-blur-[20px] p-4 sm:p-5 shadow-[0_8px_32px_rgba(108,99,255,0.06)] hover:shadow-[0_12px_40px_rgba(108,99,255,0.12)] hover:border-[#6C63FF]/30 dark:hover:border-[#6C63FF]/30 transition-all"
    >
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#6C63FF] via-[#A855F7] to-[#EC4899] opacity-70 group-hover:opacity-100 transition-opacity" />
      
      {/* Hidden inputs for direct file selection */}
      <input
        type="file"
        ref={photoInputRef}
        onChange={handlePhotoFileChange}
        accept="image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={storyInputRef}
        onChange={handleStoryFileChange}
        accept="image/*,video/*"
        className="hidden"
      />

      <button
        type="button"
        onClick={() => {
          console.log('[FeedComposer] Main area clicked → navigating to /create');
          navigate('/create');
        }}
        className="flex items-center gap-4 w-full text-left cursor-pointer bg-transparent border-none p-0"
      >
        <Avatar
          src={getAvatarUrl(profile.avatar_url)}
          name={profile.full_name || profile.username}
          size="md"
          className="ring-2 ring-indigo-500/20"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            Start a new bridge moment
          </p>
          <p className="text-xs text-slate-450 dark:text-slate-500 mt-0.5 truncate">
            Photo, thought, or memory — your community is listening
          </p>
        </div>
        <div className="flex-shrink-0 p-2.5 rounded-xl bg-gradient-to-br from-[#6C63FF] to-[#A855F7] text-white shadow-lg shadow-[#6C63FF]/25 group-hover:scale-105 transition-transform">
          <PlusCircle className="h-5 w-5" />
        </div>
      </button>
      <div className="mt-4 flex flex-wrap gap-2">
        {COMPOSER_BUTTONS.map(({ icon: Icon, label, to }) => (
          <button
            key={label}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleButtonClick(label, to);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100/90 dark:bg-slate-800/50 hover:bg-indigo-100 dark:hover:bg-indigo-950/40 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors cursor-pointer border-none"
          >
            <Icon className="h-3 w-3" />
            {label}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

export default function Feed() {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const { setSearchQuery } = useUIStore();
  const { useFeed } = usePosts();

  useEffect(() => {
    setSearchQuery('');
  }, [setSearchQuery]);

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError,
    refetch,
  } = useFeed();

  const posts = data?.pages.flatMap((page) => page.posts) || [];

  return (
    <div className="relative flex flex-col gap-7 max-w-2xl mx-auto pb-8">
      <FeedBackground />

      {profile && (
        <FeedWelcome
          username={profile.username}
          fullName={profile.full_name}
          avatarUrl={getAvatarUrl(profile.avatar_url)}
          postCount={posts.length}
        />
      )}

      {/* Stories rail */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06, type: 'spring', stiffness: 300, damping: 28 }}
        className="relative rounded-2xl border border-slate-200/40 dark:border-white/8 bg-white/60 dark:bg-[#0B1020]/75 backdrop-blur-[20px] overflow-hidden shadow-[0_4px_24px_rgba(15,23,42,0.02)] dark:shadow-[0_4px_32px_rgba(0,0,0,0.25)]"
      >
        <div className="flex items-center justify-between px-4 pt-3.5 pb-1">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-gradient-to-r from-[#6C63FF] to-[#EC4899]" />
            </span>
            <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Live Moments
            </h2>
          </div>
          <Sparkles className="h-4 w-4 text-indigo-400/80" />
        </div>
        <div className="px-2 pb-2">
          <StoriesBar />
        </div>
      </motion.section>

      {profile && <FeedComposer profile={profile} />}

      {/* Feed timeline */}
      <section className="flex flex-col gap-1">
        <div className="flex items-center gap-3 px-1 mb-2">
          <h2 className="text-sm font-bold font-outfit text-slate-800 dark:text-white">Your Bridge</h2>
          <div className="flex-1 h-px bg-gradient-to-r from-indigo-500/40 via-purple-500/20 to-transparent" />
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-indigo-500/20 blur-xl animate-pulse" />
              <Spinner size="lg" />
            </div>
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-[0.2em] uppercase">
              Building your feed…
            </span>
          </div>
        ) : isError ? (
          <EmptyState
            title="Could not load feed"
            description="There was an error communicating with the database."
            actionText="Retry"
            onAction={refetch}
          />
        ) : posts.length > 0 ? (
          <motion.div variants={containerVariants} initial="hidden" animate="show" className="flex flex-col">
            {posts.map((post) => (
              <motion.div key={post.id} variants={itemVariants}>
                <PostCard post={post} />
              </motion.div>
            ))}

            {hasNextPage && (
              <motion.div variants={itemVariants} className="flex justify-center mt-2 mb-4">
                <Button
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  variant="outline"
                  size="sm"
                  className="px-8 rounded-full border-indigo-200 dark:border-indigo-900/50 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 font-bold"
                >
                  {isFetchingNextPage ? (
                    <Spinner size="sm" variant="primary" />
                  ) : (
                    'Load more stories'
                  )}
                </Button>
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative rounded-3xl border border-dashed border-indigo-300/50 dark:border-indigo-800/50 bg-white/50 dark:bg-[#121829]/40 p-2"
          >
            <EmptyState
              icon={Sparkles}
              title="Your bridge is quiet"
              description="Follow creators or share your first moment — every great community starts with one story."
              actionText="Share your first post"
              onAction={() => navigate('/create')}
            />
          </motion.div>
        )}
      </section>
    </div>
  );
}
