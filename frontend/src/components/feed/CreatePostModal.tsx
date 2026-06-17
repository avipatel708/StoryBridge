import React, { useState, useRef, useMemo } from 'react';
import { Image, X, Sparkles, Wand2, Hash, FileText, Upload, ImagePlus, Type, MapPin, Music, Smile } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { usePosts } from '@/hooks/usePosts';
import { getAvatarUrl } from '@/lib/utils';
import { toast } from 'sonner';
import { MOOD_CONFIG, MoodType } from '@/types';
import {
  generateAICaption,
  generateAIHashtags,
  improveWritingAssistant,
  generatePostSummary,
  isAIConfigured,
} from '@/lib/gemini';

/* ------------------------------------------------------------------ */
/*  Stagger entrance variants                                         */
/* ------------------------------------------------------------------ */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 320, damping: 28 } },
};

/* ------------------------------------------------------------------ */
/*  Character-count ring (SVG arc)                                    */
/* ------------------------------------------------------------------ */
function CharRing({ current, max }: { current: number; max: number }) {
  const pct = Math.min(current / max, 1);
  const r = 9;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct);
  const nearLimit = pct > 0.85;
  const atLimit = pct >= 1;
  return (
    <svg width="28" height="28" className="flex-shrink-0">
      <circle cx="14" cy="14" r={r} fill="none" stroke="currentColor" strokeWidth="2.5"
        className="text-slate-200 dark:text-slate-700/60" />
      <circle cx="14" cy="14" r={r} fill="none" strokeWidth="2.5"
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        className={atLimit ? 'text-rose-500' : nearLimit ? 'text-amber-400' : 'text-indigo-500'}
        style={{ transform: 'rotate(-90deg)', transformOrigin: 'center', transition: 'stroke-dashoffset 0.25s ease' }} />
      {nearLimit && (
        <text x="14" y="14" textAnchor="middle" dominantBaseline="central"
          className={`text-[7px] font-bold ${atLimit ? 'fill-rose-500' : 'fill-amber-500'}`}>
          {max - current}
        </text>
      )}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Section label helper                                              */
/* ------------------------------------------------------------------ */
function SectionLabel({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 mb-2.5">
      <span className="text-indigo-400/70 dark:text-indigo-500/80">{icon}</span>
      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.1em] font-outfit">
        {children}
      </span>
    </div>
  );
}

/* ================================================================== */
/*  COMPONENT                                                         */
/* ================================================================== */
export function CreatePostModal() {
  const { profile } = useAuthStore();
  const { createPostOpen, setCreatePostOpen } = useUIStore();
  const { createPost } = usePosts();

  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [mood, setMood] = useState<MoodType | ''>('');
  const [isAILoading, setIsAILoading] = useState(false);

  // Image upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const previewUrl = useMemo(() => {
    if (!imageFile) return null;
    return URL.createObjectURL(imageFile);
  }, [imageFile]);

  /* ---- AI handlers (unchanged logic) ---- */
  const handleGenerateCaption = async () => {
    setIsAILoading(true);
    const toastId = toast.loading('AI generating creative caption...');
    try {
      const result = await generateAICaption(content || 'a beautiful story about life', mood || undefined);
      setContent(result);
      toast.success('AI Caption generated!', { id: toastId });
    } catch (err: any) {
      toast.error(`AI failed: ${err.message}`, { id: toastId });
    } finally {
      setIsAILoading(false);
    }
  };

  const handleImproveWriting = async () => {
    if (!content.trim()) return;
    setIsAILoading(true);
    const toastId = toast.loading('Story Assistant polishing draft...');
    try {
      const result = await improveWritingAssistant(content);
      setContent(result);
      toast.success('Story draft refined!', { id: toastId });
    } catch (err: any) {
      toast.error(`AI failed: ${err.message}`, { id: toastId });
    } finally {
      setIsAILoading(false);
    }
  };

  const handleGenerateHashtags = async () => {
    if (!content.trim()) return;
    setIsAILoading(true);
    const toastId = toast.loading('Generating relevant hashtags...');
    try {
      const tags = await generateAIHashtags(content);
      setContent((prev) => `${prev.trim()}\n\n${tags}`);
      toast.success('Hashtags added!', { id: toastId });
    } catch (err: any) {
      toast.error(`AI failed: ${err.message}`, { id: toastId });
    } finally {
      setIsAILoading(false);
    }
  };

  const handleGenerateSummary = async () => {
    if (!content.trim()) return;
    setIsAILoading(true);
    const toastId = toast.loading('Summarizing story draft...');
    try {
      const summary = await generatePostSummary(content);
      toast.success(`Summary: "${summary}"`, { id: toastId, duration: 6000 });
    } catch (err: any) {
      toast.error(`AI failed: ${err.message}`, { id: toastId });
    } finally {
      setIsAILoading(false);
    }
  };

  /* ---- File handling ---- */
  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are allowed.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File is too large! Maximum 10 MB.');
      return;
    }
    setImageFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) processFile(e.target.files[0]);
  };

  const clearImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImageFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  /* ---- Submit ---- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !imageFile) {
      toast.error('Post content or image is required!');
      return;
    }

    try {
      await createPost.mutateAsync({
        content,
        imageFile,
        mood: mood || undefined,
      });
      // Clear inputs and close
      setContent('');
      setImageFile(null);
      setMood('');
      setCreatePostOpen(false);
    } catch (err) {
      // Handled in mutation hook
    }
  };

  /* ---- AI tool button configs ---- */
  const aiTools = [
    {
      label: 'Caption',
      icon: <Wand2 className="h-3.5 w-3.5" />,
      onClick: handleGenerateCaption,
      disabled: isAILoading,
      gradient: 'from-violet-500 to-indigo-500',
    },
    {
      label: 'Enhance',
      icon: <Sparkles className="h-3.5 w-3.5" />,
      onClick: handleImproveWriting,
      disabled: isAILoading || !content.trim(),
      gradient: 'from-indigo-500 to-cyan-400',
    },
    {
      label: 'Hashtags',
      icon: <Hash className="h-3.5 w-3.5" />,
      onClick: handleGenerateHashtags,
      disabled: isAILoading || !content.trim(),
      gradient: 'from-fuchsia-500 to-pink-500',
    },
    {
      label: 'Summarize',
      icon: <FileText className="h-3.5 w-3.5" />,
      onClick: handleGenerateSummary,
      disabled: isAILoading || !content.trim(),
      gradient: 'from-amber-400 to-orange-500',
    },
  ];

  return (
    <Modal
      isOpen={createPostOpen}
      onClose={() => setCreatePostOpen(false)}
      title={
        <span className="flex items-center gap-2.5">
          <span className="inline-flex items-center justify-center h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25">
            <Type className="h-4 w-4 text-white" />
          </span>
          <span className="bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 dark:from-white dark:via-slate-200 dark:to-white bg-clip-text text-transparent">
            Create a Story Post
          </span>
        </span>
      }
      size="md"
    >
      <motion.form
        onSubmit={handleSubmit}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-col gap-6"
      >
        {/* ───────── Author Header ───────── */}
        {profile && (
          <motion.div variants={itemVariants} className="flex items-center gap-3">
            <div className="relative">
              <Avatar
                src={getAvatarUrl(profile.avatar_url)}
                name={profile.full_name || profile.username}
                size="md"
              />
              {/* online-style green dot */}
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-white dark:border-[#121829]" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-900 dark:text-[#F8FAFC] leading-tight">
                {profile.full_name || profile.username}
              </span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                Sharing memories ✨
              </span>
            </div>
          </motion.div>
        )}

        {/* ───────── Caption Editor ───────── */}
        <motion.div variants={itemVariants} className="flex flex-col gap-1">
          <div className="relative rounded-2xl bg-slate-50/70 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/[0.06] focus-within:border-indigo-400/50 dark:focus-within:border-indigo-500/40 focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all duration-300">
            <textarea
              placeholder="What memories or stories are you sharing today?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={2200}
              rows={4}
              className="w-full bg-transparent px-4 pt-4 pb-2 text-[15px] leading-relaxed text-slate-800 dark:text-[#F8FAFC] placeholder:text-slate-400 dark:placeholder:text-slate-600 resize-none focus:outline-none min-h-[120px]"
            />
            {/* Bottom bar inside the editor */}
            <div className="flex items-center justify-between px-4 pb-3">
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => fileInputRef.current?.click()}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-indigo-500/10 transition-colors cursor-pointer"
                  title="Add image">
                  <ImagePlus className="h-4 w-4" />
                </button>
                <button type="button" className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-indigo-500/10 transition-colors cursor-pointer" title="Location">
                  <MapPin className="h-4 w-4" />
                </button>
                <button type="button" className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-indigo-500/10 transition-colors cursor-pointer" title="Music">
                  <Music className="h-4 w-4" />
                </button>
              </div>
              <CharRing current={content.length} max={2200} />
            </div>
          </div>
        </motion.div>

        {/* ───────── AI Creative Toolbar ───────── */}
        <motion.div variants={itemVariants}>
          <div className="relative overflow-hidden rounded-2xl border border-indigo-500/10 dark:border-indigo-400/10 bg-gradient-to-br from-indigo-50/80 via-violet-50/40 to-purple-50/60 dark:from-indigo-950/30 dark:via-violet-950/20 dark:to-purple-950/25">
            {/* Decorative background shimmer */}
            <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent_30%,rgba(99,102,241,0.06)_50%,transparent_70%)] bg-[length:200%_100%] animate-[feed-shimmer_8s_linear_infinite] pointer-events-none" />

            <div className="relative p-3.5">
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.12em] flex items-center gap-1.5 font-outfit">
                  <span className="inline-flex items-center justify-center h-5 w-5 rounded-md bg-indigo-500/15 dark:bg-indigo-400/15">
                    <Sparkles className="h-3 w-3 animate-pulse" />
                  </span>
                  AI Creative Studio
                </span>
                {!isAIConfigured() && (
                  <span className="text-[9px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-500/15 dark:border-amber-400/15">
                    Sandbox Mode
                  </span>
                )}
              </div>

              {/* Tool Buttons */}
              <div className="flex flex-wrap gap-2">
                {aiTools.map((tool) => (
                  <motion.button
                    key={tool.label}
                    type="button"
                    onClick={tool.onClick}
                    disabled={tool.disabled}
                    whileHover={tool.disabled ? undefined : { scale: 1.04, y: -1 }}
                    whileTap={tool.disabled ? undefined : { scale: 0.97 }}
                    className={`group relative px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-200/80 dark:border-slate-700/60 bg-white dark:bg-slate-900/80 text-slate-600 dark:text-slate-300 hover:text-white dark:hover:text-white overflow-hidden shadow-sm hover:shadow-md`}
                  >
                    {/* Hover gradient fill */}
                    <span className={`absolute inset-0 bg-gradient-to-r ${tool.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                    <span className="relative z-10 flex items-center gap-1.5">
                      {tool.icon}
                      {tool.label}
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* ───────── Image Upload / Preview ───────── */}
        <motion.div variants={itemVariants}>
          <SectionLabel icon={<Image className="h-3 w-3" />}>Media Attachment</SectionLabel>

          <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" className="hidden" />

          <AnimatePresence mode="wait">
            {previewUrl ? (
              /* ── Preview ── */
              <motion.div
                key="preview"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="relative group rounded-2xl overflow-hidden border border-slate-200/70 dark:border-white/[0.06] bg-slate-950"
              >
                <img src={previewUrl} alt="Upload preview"
                  className="w-full max-h-[280px] object-contain" />
                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-between p-4">
                  <span className="text-xs text-white/80 font-medium truncate max-w-[60%]">
                    {imageFile?.name}
                  </span>
                  <motion.button
                    type="button"
                    onClick={clearImage}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/90 hover:bg-rose-500 text-white text-xs font-semibold cursor-pointer transition-colors shadow-lg"
                  >
                    <X className="h-3.5 w-3.5" />
                    Remove
                  </motion.button>
                </div>
              </motion.div>
            ) : (
              /* ── Drop Zone ── */
              <motion.div
                key="dropzone"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false); }}
                onDrop={handleDrop}
                className={`relative w-full rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-300 overflow-hidden ${
                  isDragOver
                    ? 'border-indigo-500 bg-indigo-500/5 dark:bg-indigo-500/10 scale-[0.99]'
                    : 'border-slate-200 dark:border-slate-700/60 bg-slate-50/50 dark:bg-white/[0.02] hover:border-indigo-400/50 dark:hover:border-indigo-500/40 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/15'
                }`}
              >
                <div className="flex flex-col items-center justify-center text-center py-10 px-6 select-none pointer-events-none">
                  <motion.div
                    animate={isDragOver ? { scale: 1.15, rotate: 5 } : { scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-500/15 dark:to-violet-500/15 text-indigo-500 dark:text-indigo-400 mb-3 shadow-sm"
                  >
                    <Upload className="h-6 w-6" />
                  </motion.div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 font-outfit mb-1">
                    {isDragOver ? 'Drop it here!' : 'Drag & drop your image'}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    or <span className="text-indigo-500 dark:text-indigo-400 font-semibold">browse files</span> · JPEG, PNG, WEBP, GIF up to 10 MB
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ───────── Mood Selector ───────── */}
        <motion.div variants={itemVariants}>
          <SectionLabel icon={<Smile className="h-3 w-3" />}>How are you feeling?</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(MOOD_CONFIG) as MoodType[]).map((moodType) => {
              const config = MOOD_CONFIG[moodType];
              const isSelected = mood === moodType;
              return (
                <motion.button
                  key={moodType}
                  type="button"
                  onClick={() => setMood(isSelected ? '' : moodType)}
                  whileHover={{ scale: 1.06, y: -1 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold font-outfit border flex items-center gap-1.5 cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? 'border-transparent text-white shadow-lg'
                      : 'border-slate-200/80 dark:border-slate-700/60 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-900/70'
                  }`}
                  style={
                    isSelected
                      ? { backgroundColor: config.color, boxShadow: `0 4px 14px ${config.color}40` }
                      : undefined
                  }
                >
                  <span className="text-sm">{config.emoji}</span>
                  <span>{config.label}</span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* ───────── Action Bar ───────── */}
        <motion.div
          variants={itemVariants}
          className="flex items-center justify-between gap-3 border-t border-slate-200/60 dark:border-slate-800/50 pt-5"
        >
          {/* Left: quick info */}
          <div className="flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500 font-medium select-none">
            {imageFile && (
              <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-500/8 dark:bg-indigo-400/10 text-indigo-500 dark:text-indigo-400 font-semibold">
                <Image className="h-3 w-3" />
                1 image
              </span>
            )}
            {mood && (
              <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/60 font-semibold">
                {MOOD_CONFIG[mood].emoji} {MOOD_CONFIG[mood].label}
              </span>
            )}
          </div>

          {/* Right: Buttons */}
          <div className="flex items-center gap-2.5">
            <Button
              onClick={() => setCreatePostOpen(false)}
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-slate-800 dark:hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={createPost.isPending}
              disabled={!content.trim() && !imageFile}
              className="px-5 shadow-lg shadow-indigo-500/20"
            >
              Share Post
            </Button>
          </div>
        </motion.div>
      </motion.form>
    </Modal>
  );
}
