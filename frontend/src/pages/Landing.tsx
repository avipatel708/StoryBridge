import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { motion } from 'motion/react';
import {
  Sparkles,
  ArrowRight,
  Play,
  Users,
  MessageSquare,
  Sun,
  Moon,
  PenTool,
  UserPlus,
  Calendar,
  Layers,
  Heart,
  Award,
  Zap,
  Shield,
  GitBranch,
  Globe,
  Camera,
  Mail,
  User,
} from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { Star } from 'lucide-react';
import AnimatedNumber from '@/components/ui/AnimatedNumber';





// Background decoration orbs
function LandingBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <div className="feed-mesh-orb absolute -top-40 left-[5%] h-[600px] w-[600px] rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 blur-[130px]" />
      <div className="feed-mesh-orb-delayed absolute top-[30%] -right-24 h-[500px] w-[500px] rounded-full bg-purple-500/10 dark:bg-purple-500/15 blur-[120px]" />
      <div className="absolute bottom-[10%] left-[20%] h-[400px] w-[400px] rounded-full bg-pink-500/5 dark:bg-pink-500/10 blur-[100px]" />
    </div>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const { session } = useAuthStore();
  const { theme, toggleTheme } = useUIStore();

  const scrollToHowItWorks = () => {
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
  };

  const howItWorksSteps = [
  {
    step: '01',
    title: 'Create Your Story',
    description: 'Preserve memories, long-form thoughts, or 24h stories with customized moods and images.',
    icon: PenTool,
    color: 'from-indigo-500 to-cyan-500',
  },
  {
    step: '02',
    title: 'Connect With People',
    description: 'Follow creators, share comments, and celebrate relationships through direct friendship bridges.',
    icon: UserPlus,
    color: 'from-purple-500 to-indigo-5',
  },
  {
    step: '03',
    title: 'Join Communities',
    description: 'Discover interest-driven spaces, collaborate in discussion boards, and meet like-minded people.',
    icon: Users,
    color: 'from-pink-500 to-purple-500',
  },
  {
    step: '04',
    title: 'Build Memories',
    description: 'Watch your milestones automatically assemble into your memory timeline and annual wrapped stories.',
    icon: Calendar,
    color: 'from-amber-500 to-pink-500',
  },
];

  // Testimonials data
  const testimonials = [
    {
      quote: "StoryBridge helped me preserve my family's memories beautifully.",
      author: "Ava Patel",
      role: "Community Member",
      avatar: "https://i.pravatar.cc/60?img=1",
      rating: 5,
    },
    {
      quote: "The timeline feature feels like a personal diary you can share.",
      author: "Liam Chen",
      role: "Content Creator",
      avatar: "https://i.pravatar.cc/60?img=2",
      rating: 4,
    },
    {
      quote: "I love the glassmorphism UI – sleek and premium!",
      author: "Sofia Rossi",
      role: "Designer",
      avatar: "https://i.pravatar.cc/60?img=3",
      rating: 5,
    },
  ];

  const features = [
    {
      id: 'capsules',
      title: 'Story Capsules',
      subtitle: 'Preserve Memories Together',
      description: 'Collect your life’s milestones, trip photos, and daily stories into digital capsules. Share them publicly to inspire others or keep them as personal time capsules.',
      badge: 'Interactive Scrapbook',
      image: '/feature-capsules.png',
      icon: Layers,
      color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 border-indigo-100 dark:border-indigo-900/30',
      gradient: 'from-indigo-500 to-cyan-500',
      reverse: false,
    },
    {
      id: 'timeline',
      title: 'Memory Timeline',
      subtitle: 'Your Life Story, Visualized',
      description: 'A beautiful chronological journey of your life milestones and key moments. From your first post to custom celebrations, your story is preserved in an immersive vertical timeline.',
      badge: 'Visual Archiving',
      image: '/feature-timeline.png',
      icon: Calendar,
      color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/30 border-purple-100 dark:border-purple-900/30',
      gradient: 'from-purple-500 to-pink-500',
      reverse: true,
    },
    {
      id: 'friendship',
      title: 'Friendship Journey',
      subtitle: 'Celebrate Your Connections',
      description: 'Go beyond followers. Explore dedicated friendship spaces that map your shared memories, direct messaging history, comments exchanged, and communities you build together.',
      badge: 'Deep Relations',
      image: '/feature-journey.png',
      icon: Heart,
      color: 'text-pink-500 bg-pink-50 dark:bg-pink-950/30 border-pink-100 dark:border-pink-900/30',
      gradient: 'from-pink-500 to-rose-500',
      reverse: false,
    },
    {
      id: 'communities',
      title: 'Vibrant Communities',
      subtitle: 'Find Your Circle',
      description: 'Join categorized interest spaces to share posts and discuss passions. Whether it is travel photography or tech design, find high-quality spaces built by real creators.',
      badge: 'Interest Groups',
      image: '/feature-communities.png',
      icon: Users,
      color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/30',
      gradient: 'from-amber-500 to-orange-500',
      reverse: true,
    },
    {
      id: 'messaging',
      title: 'Real-time Messaging',
      subtitle: 'Fluid Conversations',
      description: 'Stay connected with a premium messaging panel. Experience real-time typing indicators, online status indicators, and instant read receipts that make chatting feel alive.',
      badge: 'Instant Chat',
      image: '/feature-messaging.png',
      icon: MessageSquare,
      color: 'text-teal-500 bg-teal-50 dark:bg-teal-950/30 border-teal-100 dark:border-teal-900/30',
      gradient: 'from-teal-500 to-emerald-500',
      reverse: false,
    },
  ];

  const stats = [
    { value: '1.2M+', label: 'Stories Shared', desc: 'Memories saved for a lifetime.', icon: Layers },
    { value: '80K+', label: 'Communities Created', desc: 'Vibrant interest-driven circles.', icon: Users },
    { value: '450K+', label: 'Friendships Built', desc: 'Meaningful connections made.', icon: Heart },
    { value: '95M+', label: 'Memories Preserved', desc: 'Total interactions and milestones.', icon: Award },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 font-sans overflow-x-hidden relative transition-colors duration-300">
      <LandingBackground />

      {/* --- STICKY NAVIGATION --- */}
      <nav className="fixed top-0 z-50 w-full border-b border-slate-200/40 dark:border-slate-800/40 bg-white/75 dark:bg-[#0B0F19]/75 backdrop-blur-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Logo variant="full" size="md" />
          <div className="flex items-center gap-4 sm:gap-6">
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-slate-950/45 text-slate-500 dark:text-slate-400 hover:text-indigo-500 transition-colors shadow-sm cursor-pointer"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun className="h-4.5 w-4.5 text-amber-400 animate-spin-slow" /> : <Moon className="h-4.5 w-4.5 text-indigo-500" />}
            </button>
            {session ? (
              <Button
                onClick={() => navigate('/feed')}
                variant="primary"
                size="sm"
                className="rounded-xl px-5 font-bold bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/25 border-none"
              >
                Go to Feed
              </Button>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hidden sm:inline text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  Log in
                </Link>
                <Button
                  onClick={() => navigate('/signup')}
                  variant="primary"
                  size="sm"
                  className="rounded-xl px-5 font-bold bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/25 border-none"
                >
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* --- SECTION 1: HERO --- */}
      <section className="relative pt-36 pb-24 px-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center" id="hero-section">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ type: 'spring', stiffness: 200, damping: 24 }}
          className="lg:col-span-6 flex flex-col gap-6 text-left"
        >
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 dark:bg-indigo-500/20 border border-indigo-500/20 px-4 py-2 rounded-full w-fit">
            <Sparkles className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">
              Not Just Another Social Network
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold font-outfit tracking-tight leading-[1.08]">
            Every Story Has
            <br />
            <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              A Place To Belong
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-500 dark:text-slate-400 max-w-lg leading-relaxed font-sans">
            Share memories, discover interest communities, create friendship bridges, and stay connected through meaningful life experiences. Experience a platform built for genuine human connection.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-2">
            <Button
              onClick={() => navigate(session ? '/feed' : '/signup')}
              variant="primary"
              size="lg"
              className="w-full sm:w-auto rounded-xl px-8 font-bold bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-600/30 border-none flex items-center justify-center gap-2"
              rightIcon={<ArrowRight className="h-4.5 w-4.5" />}
            >
              Get Started
            </Button>
            <Button
              onClick={scrollToHowItWorks}
              variant="outline"
              size="lg"
              className="w-full sm:w-auto rounded-xl px-8 font-bold border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50 flex items-center justify-center gap-2"
              leftIcon={<Play className="h-4.5 w-4.5 fill-current" />}
            >
              How It Works
            </Button>
          </div>

          {/* Quick social proof / trust section */}
          <div className="flex items-center gap-4 mt-6 border-t border-slate-200/50 dark:border-slate-800/50 pt-6">
            <div className="flex -space-x-2">
              {[
                'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=60&h=60&fit=crop',
                'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop',
                'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=60&h=60&fit=crop',
                'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=60&h=60&fit=crop',
              ].map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt=""
                  className="h-8 w-8 rounded-full border-2 border-[#F8FAFC] dark:border-[#0B0F19] object-cover"
                />
              ))}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Join <span className="font-bold text-slate-800 dark:text-slate-200">15,000+ creators</span> sharing life stories.
            </p>
          </div>
        </motion.div>

        {/* Hero image mockup side */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 180, damping: 22 }}
          className="lg:col-span-6 flex items-center justify-center relative"
        >
          {/* Subtle backing gradient glow */}
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 via-purple-500/5 to-pink-500/10 blur-3xl -z-10 rounded-full scale-95" />

          {/* Premium Device Stack Mockup Container */}
          <div className="relative w-full max-w-[500px] select-none landing-float-slow">
            <div className="absolute -inset-0.5 rounded-3xl bg-gradient-to-tr from-indigo-500/30 to-pink-500/30 opacity-70 blur-md -z-10" />
            <div className="rounded-[2.5rem] p-3 border-2 border-white/60 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl shadow-2xl overflow-hidden ring-1 ring-slate-950/5">
              <img
                src="/hero-mockup.png"
                alt="StoryBridge App Screens Preview"
                className="w-full h-auto rounded-[2rem] shadow-lg border border-slate-200/50 dark:border-slate-800/50"
              />
            </div>

            {/* Existing floating card */}
            <div className="absolute -left-6 bottom-16 premium-glass rounded-2xl p-4 flex items-center gap-3 animate-float-phone-1 max-w-[200px]">
              <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                <Heart className="h-5 w-5 fill-indigo-500/20" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-100">Bridges built</p>
                <p className="text-xs font-medium text-slate-400 mt-0.5">+450k connections</p>
              </div>
            </div>

            {/* New floating cards */}
            <div className="absolute -right-8 top-24 premium-glass rounded-2xl p-4 flex flex-col gap-2 animate-float-phone-2 max-w-[180px]">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">New Connection</p>
              </div>
            </div>
            <div className="absolute -left-8 top-48 premium-glass rounded-2xl p-4 flex flex-col gap-2 animate-float-phone-3 max-w-[180px]">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-500" />
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">Story Added</p>
              </div>
            </div>
            <div className="absolute right-12 bottom-20 premium-glass rounded-2xl p-4 flex flex-col gap-2 animate-float-phone-4 max-w-[180px]">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-pink-500" />
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">Memory Created</p>
              </div>
            </div>
            <div className="absolute left-4 bottom-4 premium-glass rounded-2xl p-4 flex flex-col gap-2 animate-float-phone-5 max-w-[180px]">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-yellow-500" />
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">Trending Story</p>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* --- SECTION 2: HOW IT WORKS --- */}
      <section id="how-it-works" className="py-24 bg-white/70 dark:bg-[#121829]/75 border-y border-slate-200/50 dark:border-slate-800/50 px-6 backdrop-blur-sm relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 px-4 py-1.5 rounded-full mb-4">
              <Zap className="h-3.5 w-3.5 text-indigo-500" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-500">Simple Onboarding</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold font-outfit text-slate-900 dark:text-white tracking-tight">
              How StoryBridge Works
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-base mt-4 leading-relaxed font-sans">
              Get started in minutes and begin building a beautiful, organized library of your life stories and connections.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorksSteps.map((stepItem, index) => {
              const Icon = stepItem.icon;
              return (
                <motion.div
                  key={stepItem.step}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ delay: index * 0.1, type: 'spring', stiffness: 180, damping: 20 }}
                  className="group relative rounded-3xl border border-slate-200/40 dark:border-slate-800/40 bg-white dark:bg-slate-950/40 p-6 shadow-md hover:shadow-xl hover:border-indigo-500/30 transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="absolute top-4 right-6 text-4xl sm:text-5xl font-extrabold text-slate-100 dark:text-slate-900 font-outfit select-none transition-colors duration-300 group-hover:text-indigo-500/10">
                    {stepItem.step}
                  </div>
                  <div className={`h-12 w-12 rounded-2xl bg-gradient-to-r ${stepItem.color} flex items-center justify-center text-white shadow-lg shadow-indigo-500/10 mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2 group-hover:text-indigo-500 transition-colors">
                    {stepItem.title}
                  </h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
                    {stepItem.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* --- SECTION 3: FEATURE SHOWCASE (ALT LAYOUTS) --- */}
      <section id="features" className="py-28 px-6 max-w-7xl mx-auto flex flex-col gap-28">
        <div className="text-center max-w-2xl mx-auto mb-4">
          <div className="inline-flex items-center gap-2 bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/40 px-4 py-1.5 rounded-full mb-4">
            <Shield className="h-3.5 w-3.5 text-purple-500" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-purple-500">Core Features</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold font-outfit text-slate-900 dark:text-white tracking-tight">
            Designed for Authentic Storytelling
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-base mt-4 leading-relaxed font-sans">
            Every component is crafted to provide a premium feel, deep user engagement, and a clean, clutter-free browsing experience.
          </p>
        </div>

        {features.map((feature, i) => {
          const Icon = feature.icon;
          return (
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ type: 'spring', stiffness: 150, damping: 22 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center"
            >
              {/* Feature Mockup Column */}
              <div className={`lg:col-span-6 ${feature.reverse ? 'lg:order-2' : ''}`}>
                <div className="relative p-1.5 rounded-3xl premium-glass border border-transparent bg-gradient-to-r from-indigo-500 to-pink-500 shadow-lg">
                  <div className="rounded-[22px] overflow-hidden bg-slate-50 dark:bg-[#121829] p-3 border border-white/60 dark:border-slate-900/50 shadow-md hover:shadow-xl transition-shadow duration-300">
                    <img
                      src={feature.image}
                      alt={feature.title}
                      className="h-auto max-h-[360px] w-full object-cover rounded-2xl shadow-md border border-slate-200/30 dark:border-slate-800/30 hover:scale-[1.01] transition-transform duration-500"
                      loading="lazy"
                    />
                  </div>
                  {/* Floating badge over image */}
                  <div className="absolute -bottom-3 -right-3 bg-white dark:bg-slate-900/90 border border-slate-200/50 dark:border-slate-800/50 py-1.5 px-3.5 rounded-full shadow-lg text-[10px] font-bold text-indigo-500 dark:text-indigo-400">
                    {feature.badge}
                  </div>
                </div>
              </div>

              {/* Feature Text Column */}
              <div className={`lg:col-span-6 flex flex-col gap-4 text-left ${feature.reverse ? 'lg:order-1' : ''} premium-glass backdrop-blur-md border border-transparent bg-gradient-to-r from-indigo-500 to-pink-500 rounded-xl p-8 hover:-translate-y-1 transition-all duration-300`}>
                <div className={`p-3 rounded-2xl border w-fit ${feature.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {feature.subtitle}
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold font-outfit text-slate-900 dark:text-white leading-tight">
                  {feature.title}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed max-w-lg font-sans">
                  {feature.description}
                </p>

                <div className="flex gap-4 mt-2">
                  <button
                    onClick={() => navigate(session ? '/feed' : '/signup')}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors uppercase tracking-widest cursor-pointer"
                  >
                    Try Feature <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </section>

      {/* --- SECTION 4: STATISTICS --- */}
      <section className="py-24 bg-white/70 dark:bg-[#121829]/75 border-y border-slate-200/50 dark:border-slate-800/50 px-6 backdrop-blur-sm relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 bg-pink-50 dark:bg-pink-950/40 border border-pink-100 dark:border-pink-900/40 px-4 py-1.5 rounded-full mb-4">
              <Award className="h-3.5 w-3.5 text-pink-500" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-pink-500">Our Growth</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold font-outfit text-slate-900 dark:text-white tracking-tight">
              Bridging Hearts Globally
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-base mt-4 leading-relaxed font-sans">
              Stories hold our shared history. Here is a look at the milestones built together by the StoryBridge community.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {stats.map((stat, i) => {
              const StatIcon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ delay: i * 0.08, type: 'spring', stiffness: 180, damping: 20 }}
                  className="rounded-3xl border border-slate-200/40 dark:border-slate-800/40 bg-white dark:bg-slate-950/40 p-6 shadow-sm hover:shadow-md hover:scale-105 transition-all duration-300 text-center relative overflow-hidden group"
                >
                  {/* Background overlay accent */}
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />

                  <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                      <StatIcon className="h-5 w-5 text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text" />
                    </div>

                  <p className="text-3xl sm:text-4xl font-extrabold font-outfit bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300 w-fit mx-auto">
                      <AnimatedNumber value={stat.value} />
                    </p>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-2">
                    {stat.label}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-sans">
                    {stat.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

        {/* --- SECTION 4: TESTIMONIALS --- */}
        <section id="testimonials" className="py-24 bg-white/70 dark:bg-[#121829]/75 border-y border-slate-200/50 dark:border-slate-800/50 px-6 backdrop-blur-sm relative">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <div className="inline-flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 px-4 py-1.5 rounded-full mb-4">
                <Star className="h-3.5 w-3.5 text-indigo-500" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-500">Testimonials</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold font-outfit text-slate-900 dark:text-white tracking-tight">What Our Users Say</h2>
              <p className="text-slate-500 dark:text-slate-400 text-base mt-4 leading-relaxed font-sans">Real stories from the StoryBridge community.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {testimonials.map((t, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ delay: i * 0.1, type: 'spring', stiffness: 180, damping: 20 }}
                  className="premium-glass backdrop-blur-md border border-transparent bg-gradient-to-r from-indigo-500 to-pink-500 rounded-xl p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300"
                >
                  <p className="text-sm text-slate-600 dark:text-slate-300 italic mb-4">“{t.quote}”</p>
                  <div className="flex items-center gap-3 mb-2">
                    <img src={t.avatar} alt={t.author} className="h-10 w-10 rounded-full border-2 border-white dark:border-slate-800" />
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{t.author}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{t.role}</p>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Star
                        key={idx}
                        className={`h-4 w-4 ${idx < t.rating ? 'text-yellow-400' : 'text-slate-300'} fill-current`}
                      />
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

      {/* --- FINAL CALL TO ACTION --- */}
      <section className="py-24 px-6 bg-slate-50/50 dark:bg-[#0B0F19]/50 relative overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ type: 'spring', stiffness: 150, damping: 22 }}
          className="max-w-4xl mx-auto rounded-[2rem] border border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-slate-900/60 backdrop-blur-xl px-8 py-16 text-center shadow-xl relative overflow-hidden"
        >
          {/* Gradient bar at top */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

          <h2 className="text-3xl sm:text-4xl font-extrabold font-outfit text-slate-900 dark:text-white tracking-tight">
            Ready to Build Your Bridge?
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-base mt-4 max-w-lg mx-auto font-sans leading-relaxed">
            Join StoryBridge today to start archiving your memories, sharing stories, and connecting deeply with a global community.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              onClick={() => navigate(session ? '/feed' : '/signup')}
              variant="primary"
              size="lg"
              className="w-full sm:w-auto rounded-xl px-10 font-bold bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-600/30 border-none flex items-center justify-center gap-2"
              rightIcon={<ArrowRight className="h-5 w-5" />}
            >
              {session ? 'Go to Feed' : 'Get Started Free'}
            </Button>
          </div>
        </motion.div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="border-t border-slate-200/40 dark:border-slate-800/40 py-12 px-6 bg-white dark:bg-[#0B0F19]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <Logo variant="full" size="md" />
        <nav className="flex flex-wrap gap-4 text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest">
          <a href="#" className="hover:text-indigo-500 transition-colors">About</a>
          <a href="#" className="hover:text-indigo-500 transition-colors">Features</a>
          <a href="#" className="hover:text-indigo-500 transition-colors">Contact</a>
          <a href="#" className="hover:text-indigo-500 transition-colors">Privacy</a>
          <a href="#" className="hover:text-indigo-500 transition-colors">Terms</a>
        </nav>
        <div className="flex gap-4 text-slate-500 dark:text-slate-400">
          <GitBranch className="h-5 w-5 hover:text-indigo-500 transition-colors cursor-pointer" />
          <Globe className="h-5 w-5 hover:text-indigo-500 transition-colors cursor-pointer" />
          <Camera className="h-5 w-5 hover:text-indigo-500 transition-colors cursor-pointer" />
          <Mail className="h-5 w-5 hover:text-indigo-500 transition-colors cursor-pointer" />
        </div>
        <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
          &copy; 2026 StoryBridge. All rights reserved.
        </span>
        </div>
      </footer>
    </div>
  );
}
