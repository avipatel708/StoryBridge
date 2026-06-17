import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { Heart, Sparkles, Layers, Award, ArrowRight, X, ChevronRight, ChevronLeft } from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { getPostImageUrl } from '@/lib/utils';
import { Post } from '@/types';

interface WrappedStats {
  postsCount: number;
  likesCount: number;
  followersCount: number;
  topPost: Post | null;
}

export default function YearWrapped() {
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);
  
  const [currentSlide, setCurrentSlide] = useState(0);
  const [progress, setProgress] = useState(0);
  const slideDuration = 6000; // 6 seconds per slide

  // 1. Fetch Year Stats
  const { data: stats, isLoading, isError } = useQuery({
    queryKey: ['wrapped-stats', currentUser?.id],
    queryFn: async (): Promise<WrappedStats> => {
      if (!currentUser) throw new Error('Not logged in');

      // Posts count
      const { count: postsCount } = await supabase
        .from('posts')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', currentUser.id);

      // Likes received count
      const { count: likesCount } = await supabase
        .from('likes')
        .select('id, posts!inner(user_id)', { count: 'exact', head: true })
        .eq('posts.user_id', currentUser.id);

      // Followers count
      const { count: followersCount } = await supabase
        .from('followers')
        .select('id', { count: 'exact', head: true })
        .eq('following_id', currentUser.id);

      // Fetch all posts with likes to find the most liked one
      const { data: postsList } = await supabase
        .from('posts')
        .select('*, profiles:user_id(*), likes(user_id)')
        .eq('user_id', currentUser.id);

      let topPost: Post | null = null;
      if (postsList && postsList.length > 0) {
        const sorted = [...postsList]
          .map((post: any) => ({
            ...post,
            likes_count: post.likes?.length || 0,
            comments_count: 0, // Mock for sorting
            is_liked: false,
            is_saved: false,
          }))
          .sort((a, b) => b.likes_count - a.likes_count);
        topPost = sorted[0] as Post;
      }

      return {
        postsCount: postsCount || 0,
        likesCount: likesCount || 0,
        followersCount: followersCount || 0,
        topPost,
      };
    },
    enabled: !!currentUser?.id,
  });

  const totalSlides = 5;

  // Progress Bar / Auto Slide Progression
  useEffect(() => {
    if (isLoading || isError) return;

    setProgress(0);
    const interval = 50; // Update every 50ms
    const step = (interval / slideDuration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          if (currentSlide < totalSlides - 1) {
            setCurrentSlide((c) => c + 1);
          }
          return 100;
        }
        return prev + step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [currentSlide, isLoading, isError]);

  const handleNext = () => {
    if (currentSlide < totalSlides - 1) {
      setCurrentSlide((c) => c + 1);
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide((c) => c - 1);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex flex-col items-center justify-center text-white">
        <Spinner size="lg" variant="primary" />
        <p className="text-xs text-slate-400 mt-4 font-outfit uppercase tracking-widest animate-pulse">
          Crafting Your StoryBridge Wrapped...
        </p>
      </div>
    );
  }

  if (isError || !stats) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center p-4">
        <EmptyState
          title="Could Not Create Wrapped"
          description="Make sure you have logged in and shared stories to generate your Wrapped experience."
          actionText="Back to Feed"
          onAction={() => navigate('/feed')}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#0B0F19] flex flex-col items-center justify-center relative overflow-hidden text-white font-sans select-none">
      {/* Background drifting mesh blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-indigo-500/25 blur-[120px] feed-mesh-orb" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-pink-500/20 blur-[120px] feed-mesh-orb-delayed" />
      </div>

      {/* Progress Bars Indicator Strip */}
      <div className="absolute top-6 left-6 right-6 z-50 flex gap-1.5 max-w-lg mx-auto">
        {Array.from({ length: totalSlides }).map((_, i) => (
          <div key={i} className="flex-1 h-1 rounded-full bg-white/20 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-pink-500 transition-all duration-75"
              style={{
                width: i < currentSlide ? '100%' : i === currentSlide ? `${progress}%` : '0%',
              }}
            />
          </div>
        ))}
      </div>

      {/* Close button */}
      <button
        onClick={() => navigate('/feed')}
        className="absolute top-10 right-6 z-50 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer border border-white/5"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Slide Navigation Zones */}
      <div className="absolute inset-y-0 left-0 w-1/5 z-40 cursor-pointer" onClick={handlePrev} />
      <div className="absolute inset-y-0 right-0 w-1/5 z-40 cursor-pointer" onClick={handleNext} />

      {/* Main Slide Transitions Frame */}
      <div className="relative w-full max-w-md h-[75vh] flex items-center justify-center px-6 z-30">
        <AnimatePresence mode="wait">
          {/* SLIDE 0: Welcome Cover */}
          {currentSlide === 0 && (
            <motion.div
              key="slide0"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="flex flex-col items-center text-center gap-6 justify-center"
            >
              <div className="p-4.5 rounded-3xl bg-gradient-to-tr from-indigo-500 to-pink-500 shadow-xl shadow-indigo-500/25 mb-2">
                <Sparkles className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold font-outfit tracking-tight leading-tight">
                Your Year
                <br />
                On The Bridge
              </h1>
              <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
                Let&apos;s review the stories, milestones, and connections you made in 2026.
              </p>
              <Button
                onClick={handleNext}
                variant="primary"
                className="mt-4 rounded-xl bg-white text-indigo-950 font-bold border-none hover:bg-slate-100 flex items-center gap-2"
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                Let&apos;s Go
              </Button>
            </motion.div>
          )}

          {/* SLIDE 1: Stories Shared */}
          {currentSlide === 1 && (
            <motion.div
              key="slide1"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              className="flex flex-col items-center text-center gap-6"
            >
              <div className="h-16 w-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                <Layers className="h-8 w-8" />
              </div>
              <p className="text-sm font-bold uppercase tracking-widest text-indigo-400">Your Storytelling</p>
              <h2 className="text-4xl font-extrabold font-outfit text-white leading-none">
                <span className="text-6xl bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                  {stats.postsCount}
                </span>
                <br />
                Moments Shared
              </h2>
              <p className="text-sm text-slate-400 max-w-xs leading-relaxed mt-2">
                You archived {stats.postsCount} life experiences, saving beautiful memories in your bridge library for years to come.
              </p>
            </motion.div>
          )}

          {/* SLIDE 2: Likes/Resonations */}
          {currentSlide === 2 && (
            <motion.div
              key="slide2"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              className="flex flex-col items-center text-center gap-6"
            >
              <div className="h-16 w-16 rounded-2xl bg-pink-500/10 flex items-center justify-center text-pink-400 border border-pink-500/20">
                <Heart className="h-8 w-8 fill-pink-500/25" />
              </div>
              <p className="text-sm font-bold uppercase tracking-widest text-pink-400">Your Influence</p>
              <h2 className="text-4xl font-extrabold font-outfit text-white leading-none">
                <span className="text-6xl bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent">
                  {stats.likesCount}
                </span>
                <br />
                Likes Received
              </h2>
              <p className="text-sm text-slate-400 max-w-xs leading-relaxed mt-2">
                Your words, thoughts, and memories resonated deeply, earning {stats.likesCount} direct reactions from friends.
              </p>
            </motion.div>
          )}

          {/* SLIDE 3: Top Post */}
          {currentSlide === 3 && (
            <motion.div
              key="slide3"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="flex flex-col items-center text-center gap-4 w-full"
            >
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-purple-400">Your Top Memory</p>
              <h2 className="text-xl font-bold font-outfit text-white">This post won the year</h2>

              {stats.topPost ? (
                <div className="w-full border border-slate-800 rounded-3xl bg-slate-900/60 p-5 text-left mt-2 flex flex-col gap-3.5 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-pink-500" />
                  
                  <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-400 uppercase">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Most Reacted Story</span>
                  </div>

                  {stats.topPost.image_url && (
                    <div className="h-44 w-full rounded-2xl overflow-hidden bg-slate-800">
                      <img src={getPostImageUrl(stats.topPost.image_url) || ''} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}

                  <p className="text-xs text-slate-350 leading-relaxed font-sans line-clamp-3">
                    &ldquo;{stats.topPost.content}&rdquo;
                  </p>

                  <div className="flex items-center gap-1 text-[10px] text-pink-400 font-bold border-t border-slate-800/80 pt-2.5 mt-1 select-none">
                    <Heart className="h-3.5 w-3.5 fill-pink-500/20" />
                    <span>{(stats.topPost as any).likes_count} Likes received</span>
                  </div>
                </div>
              ) : (
                <div className="p-8 rounded-3xl border border-dashed border-slate-800 text-slate-500 text-xs mt-4">
                  No post history to evaluate.
                </div>
              )}
            </motion.div>
          )}

          {/* SLIDE 4: Summary Card */}
          {currentSlide === 4 && (
            <motion.div
              key="slide4"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center text-center gap-6 w-full"
            >
              <div className="w-full border border-slate-800/60 bg-gradient-to-b from-[#161c30] to-[#0d1222] rounded-[2.5rem] p-6 shadow-2xl relative overflow-hidden text-left">
                {/* Accent line */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-450 uppercase tracking-widest font-mono">StoryBridge // Wrapped</span>
                  <Award className="h-5 w-5 text-indigo-400" />
                </div>

                <h3 className="text-2xl font-bold font-outfit text-white mt-4 tracking-tight leading-tight">
                  Your Year Summary
                </h3>
                <p className="text-[10px] text-slate-500 mt-1">Connecting Lives Through Stories</p>

                {/* Grid stats */}
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="border border-slate-800 bg-[#0B0F19]/60 rounded-2xl p-4 text-left">
                    <p className="text-2xl font-extrabold font-outfit text-indigo-400">{stats.postsCount}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1">Stories Shared</p>
                  </div>

                  <div className="border border-slate-800 bg-[#0B0F19]/60 rounded-2xl p-4 text-left">
                    <p className="text-2xl font-extrabold font-outfit text-pink-400">{stats.likesCount}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1">Likes Earned</p>
                  </div>

                  <div className="border border-slate-800 bg-[#0B0F19]/60 rounded-2xl p-4 text-left col-span-2 flex items-center justify-between">
                    <div>
                      <p className="text-lg font-extrabold font-outfit text-white">
                        +{stats.followersCount}
                      </p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">New Bridges Built</p>
                    </div>
                    <div className="h-8 w-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/15">
                      <Sparkles className="h-4.5 w-4.5" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3.5 w-full max-w-[280px]">
                <Button
                  onClick={() => navigate('/feed')}
                  variant="primary"
                  className="flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold border-none"
                >
                  Return to Feed
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Manual Arrow Controls (Only shown for non-touch desktops or at bottom) */}
      <div className="absolute bottom-10 flex gap-4 z-50">
        <button
          onClick={handlePrev}
          disabled={currentSlide === 0}
          className="p-3 rounded-xl bg-white/5 border border-white/5 text-white hover:bg-white/10 transition-colors disabled:opacity-30 cursor-pointer"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          onClick={handleNext}
          disabled={currentSlide === totalSlides - 1}
          className="p-3 rounded-xl bg-white/5 border border-white/5 text-white hover:bg-white/10 transition-colors disabled:opacity-30 cursor-pointer"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
