import React, { useRef, useState, useMemo, useEffect } from 'react';
import {
  Film, Video, X, Sparkles, MapPin, Hash, Camera, Music,
  Upload, Play, Pause, ChevronRight, Check, Clapperboard,
  FileVideo, Clock, Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useReels } from '@/hooks/useReels';
import { toast } from 'sonner';
import { CameraSystem } from '@/components/ui/CameraSystem';
import { MusicPicker } from '@/components/ui/MusicPicker';
import { AudioTrack } from '@/lib/musicLibrary';

/* ------------------------------------------------------------------ */
/*  Animation variants                                                */
/* ------------------------------------------------------------------ */
const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.05 },
  },
};

const fadeSlideUp = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 340, damping: 30 },
  },
};

/* ------------------------------------------------------------------ */
/*  Helper: Format file size                                          */
/* ------------------------------------------------------------------ */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* ------------------------------------------------------------------ */
/*  Helper: Section label                                             */
/* ------------------------------------------------------------------ */
function SectionLabel({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 mb-2">
      <span className="text-indigo-400/80">{icon}</span>
      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.1em] font-outfit">
        {children}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Helper: Character ring SVG                                        */
/* ------------------------------------------------------------------ */
function CharRing({ current, max }: { current: number; max: number }) {
  const pct = Math.min(current / max, 1);
  const r = 9;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct);
  const near = pct > 0.85;
  const full = pct >= 1;
  return (
    <svg width="26" height="26" className="flex-shrink-0">
      <circle cx="13" cy="13" r={r} fill="none" stroke="currentColor" strokeWidth="2.5"
        className="text-slate-700/40" />
      <circle cx="13" cy="13" r={r} fill="none" strokeWidth="2.5"
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        className={full ? 'text-rose-500' : near ? 'text-amber-400' : 'text-indigo-500'}
        style={{ transform: 'rotate(-90deg)', transformOrigin: 'center', transition: 'stroke-dashoffset 0.25s ease' }} />
      {near && (
        <text x="13" y="13" textAnchor="middle" dominantBaseline="central"
          className={`text-[7px] font-bold ${full ? 'fill-rose-500' : 'fill-amber-400'}`}>
          {max - current}
        </text>
      )}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Publish progress overlay                                          */
/* ------------------------------------------------------------------ */
function PublishOverlay({ isActive }: { isActive: boolean }) {
  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-50 bg-black/70 backdrop-blur-md flex flex-col items-center justify-center gap-4 rounded-2xl"
        >
          {/* Spinner ring */}
          <div className="relative h-16 w-16">
            <div className="absolute inset-0 rounded-full border-[3px] border-slate-700/40" />
            <div className="absolute inset-0 rounded-full border-[3px] border-t-indigo-500 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Clapperboard className="h-5 w-5 text-indigo-400" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-white font-outfit">Publishing Reel...</p>
            <p className="text-[11px] text-slate-400 mt-1">Uploading video and saving details</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ================================================================== */
/*  COMPONENT                                                         */
/* ================================================================== */
interface CreateReelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateReelModal({ isOpen, onClose }: CreateReelModalProps) {
  console.log('[StoryBridge] CreateReelModal component render call, isOpen:', isOpen);
  const { createReel } = useReels();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');

  // Camera & Music selection states
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isMusicPickerActive, setIsMusicPickerActive] = useState(false);
  const [activeAudioTrack, setActiveAudioTrack] = useState<AudioTrack | null>(null);
  const [audioStartTime, setAudioStartTime] = useState(0);

  // Drag & video state
  const [isDragOver, setIsDragOver] = useState(false);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  // Video playback progress percentage (0-100)
  const [videoProgress, setVideoProgress] = useState(0);


  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCameraCaptureVideo = (blob: Blob) => {
    setIsCameraActive(false);
    const file = new File([blob], `reel-capture-${Date.now()}.mp4`, { type: 'video/mp4' });
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(blob));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      validateAndSetFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file: File) => {
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    const videoExtensions = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv', 'quicktime'];
    const isVideo = file.type.startsWith('video/') || videoExtensions.includes(extension);

    if (!isVideo) {
      toast.error('Please select a valid video file (mp4, webm).');
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      toast.error('Reel video file size exceeds 25MB limit.');
      return;
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setVideoDuration(null);
    setIsVideoPlaying(false);
  };

  const toggleVideoPlayback = () => {
    const vid = videoPreviewRef.current;
    if (!vid) return;
    if (isVideoPlaying) {
      vid.pause();
      setIsVideoPlaying(false);
    } else {
      vid.play().then(() => setIsVideoPlaying(true)).catch(() => {});
    }
  };

  // Get video duration when metadata loads
  const handleVideoMetadata = () => {
    const vid = videoPreviewRef.current;
    if (vid) {
      setVideoDuration(vid.duration);
      setVideoProgress(0); // reset progress on new video
    }
  };

  // Update video progress as it plays
  const handleVideoTimeUpdate = () => {
    const vid = videoPreviewRef.current;
    if (vid && videoDuration) {
      const progress = (vid.currentTime / videoDuration) * 100;
      setVideoProgress(progress);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    // Auto extract hashtags from caption
    const hashtags = caption.match(/#\w+/g)?.map((tag) => tag.replace('#', '')) || [];

    try {
      await createReel.mutateAsync({
        videoFile: selectedFile,
        caption: caption.trim(),
        location: location.trim(),
        hashtags,
        audioTrackId: activeAudioTrack?.id || undefined,
        audioStartTime: activeAudioTrack ? audioStartTime : undefined,
      });
      // reset
      setSelectedFile(null);
      setPreviewUrl('');
      setCaption('');
      setLocation('');
      setActiveAudioTrack(null);
      setAudioStartTime(0);
      setVideoDuration(null);
      onClose();
    } catch {
      // Handled in query hook
    }
  };

  // Extract hashtags for preview chips
  const hashtags = useMemo(() => {
    return caption.match(/#\w+/g) || [];
  }, [caption]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <span className="flex items-center gap-2.5">
          <span className="inline-flex items-center justify-center h-8 w-8 rounded-xl bg-gradient-to-br from-rose-500 via-fuchsia-500 to-violet-600 shadow-lg shadow-fuchsia-500/25">
            <Film className="h-4 w-4 text-white" />
          </span>
          <span className="bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 dark:from-white dark:via-slate-200 dark:to-white bg-clip-text text-transparent">
            Create New Reel
          </span>
        </span>
      }
      size="md"
    >
      <motion.form
        onSubmit={handleSubmit}
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="relative flex flex-col gap-5 text-left select-none"
      >
        {/* Publish progress overlay */}
        <PublishOverlay isActive={createReel.isPending} />

        {/* ───────── Video Upload / Preview ───────── */}
        <motion.div variants={fadeSlideUp}>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="video/*" className="hidden" />

          <AnimatePresence mode="wait">
            {!previewUrl ? (
              /* ── Upload Drop Zone ── */
              <motion.div
                key="dropzone"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                className="flex flex-col gap-3"
              >
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative w-full aspect-[9/16] max-h-[38vh] rounded-2xl border-2 border-dashed cursor-pointer overflow-hidden flex flex-col items-center justify-center transition-all duration-300 ${
                    isDragOver
                      ? 'border-fuchsia-500 bg-fuchsia-500/5 dark:bg-fuchsia-500/10 scale-[0.99]'
                      : 'border-slate-200 dark:border-slate-700/50 bg-gradient-to-b from-slate-50/50 to-slate-100/30 dark:from-slate-900/30 dark:to-slate-950/40 hover:border-indigo-400/50 dark:hover:border-indigo-500/40 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/15'
                  }`}
                >
                  {/* Animated background orbs */}
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-indigo-500/[0.04] dark:bg-indigo-400/[0.06] rounded-full blur-2xl feed-mesh-orb" />
                    <div className="absolute bottom-1/4 right-1/4 w-28 h-28 bg-fuchsia-500/[0.04] dark:bg-fuchsia-400/[0.06] rounded-full blur-2xl feed-mesh-orb-delayed" />
                  </div>

                  <div className="relative flex flex-col items-center justify-center text-center px-6 py-8 select-none pointer-events-none gap-3">
                    <motion.div
                      animate={isDragOver ? { scale: 1.2, rotate: 8 } : { scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      className="p-4 rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-500/15 dark:to-violet-500/15 shadow-sm"
                    >
                      <FileVideo className="h-8 w-8 text-indigo-500 dark:text-indigo-400" />
                    </motion.div>
                    <div>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-200 font-outfit">
                        {isDragOver ? 'Drop your video here!' : 'Drag & drop your video'}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">
                        or <span className="text-indigo-500 dark:text-indigo-400 font-semibold">browse files</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/60 px-2.5 py-1 rounded-lg">
                        <FileVideo className="h-3 w-3" /> MP4, WebM
                      </span>
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/60 px-2.5 py-1 rounded-lg">
                        <Zap className="h-3 w-3" /> Max 25 MB
                      </span>
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/60 px-2.5 py-1 rounded-lg">
                        <Clock className="h-3 w-3" /> 30s
                      </span>
                    </div>
                  </div>
                </div>

                {/* Camera option */}
                <div className="flex items-center justify-center gap-3">
                  <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800/60" />
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">or</span>
                  <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800/60" />
                </div>
                <motion.button
                  type="button"
                  onClick={() => setIsCameraActive(true)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl border border-slate-200 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-900/40 text-slate-600 dark:text-slate-300 text-sm font-semibold cursor-pointer transition-all hover:border-indigo-400/40 dark:hover:border-indigo-500/40 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/15 hover:text-indigo-600 dark:hover:text-indigo-400"
                >
                  <Camera className="w-4 h-4" />
                  Record with Camera
                </motion.button>
              </motion.div>
            ) : (
              /* ── Video Preview ── */
              <motion.div
                key="preview"
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: 'spring' as const, stiffness: 260, damping: 24 }}
                className="relative w-full aspect-[9/16] max-h-[42vh] rounded-2xl overflow-hidden bg-slate-950 border border-slate-200/20 dark:border-white/[0.06] shadow-2xl shadow-black/30 group"
              >
                <video
                  ref={videoPreviewRef}
                  src={previewUrl}
                  onLoadedMetadata={handleVideoMetadata}
                  onTimeUpdate={handleVideoTimeUpdate}
                  loop
                  playsInline
                  muted
                  className="w-full h-full object-contain"
                />

                {/* Gradient overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/30 pointer-events-none" />
                {/* Video progress bar */}
                <div className="absolute bottom-2 left-0 w-full px-2">
                  <div className="h-1 bg-gray-300 dark:bg-gray-600 rounded overflow-hidden">
                    <div className="h-full bg-indigo-500 transition-width duration-200" style={{ width: `${videoProgress}%` }}></div>
                  </div>
                </div>

                {/* Top bar */}
                <div className="absolute top-0 inset-x-0 p-3 flex items-center justify-between z-10">
                  {/* File info badge */}
                  {selectedFile && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/50 backdrop-blur-sm border border-white/10"
                    >
                      <FileVideo className="h-3 w-3 text-indigo-400" />
                      <span className="text-[10px] font-semibold text-white/80 truncate max-w-[120px]">
                        {selectedFile.name}
                      </span>
                      <span className="text-[9px] text-white/50">
                        {formatFileSize(selectedFile.size)}
                      </span>
                    </motion.div>
                  )}
                  {/* Remove button */}
                  <motion.button
                    type="button"
                    onClick={handleRemoveFile}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2 bg-black/50 backdrop-blur-sm text-white/80 rounded-full hover:bg-rose-500/80 hover:text-white transition-all cursor-pointer border border-white/10"
                  >
                    <X className="h-4 w-4" />
                  </motion.button>
                </div>

                {/* Center play/pause */}
                <AnimatePresence>
                  {!isVideoPlaying && (
                    <motion.button
                      type="button"
                      onClick={toggleVideoPlayback}
                      initial={{ opacity: 0, scale: 0.6 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.6 }}
                      transition={{ type: 'spring' as const, stiffness: 400, damping: 25 }}
                      className="absolute inset-0 flex items-center justify-center z-10 cursor-pointer"
                    >
                      <div className="p-4 rounded-full bg-white/15 backdrop-blur-md border border-white/20 shadow-2xl">
                        <Play className="h-8 w-8 text-white fill-white/90" />
                      </div>
                    </motion.button>
                  )}
                </AnimatePresence>

                {/* Tap to pause overlay — only when playing */}
                {isVideoPlaying && (
                  <button
                    type="button"
                    onClick={toggleVideoPlayback}
                    className="absolute inset-0 z-10 cursor-pointer"
                  />
                )}

                {/* Bottom info bar */}
                <div className="absolute bottom-0 inset-x-0 p-3 flex items-center justify-between z-10">
                  {videoDuration && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-white/70 bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-white/10">
                      <Clock className="h-3 w-3" />
                      {videoDuration.toFixed(1)}s
                    </span>
                  )}
                  {isVideoPlaying && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-1 text-[10px] font-bold text-green-400 bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-white/10"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                      Playing
                    </motion.span>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ───────── Background Music ───────── */}
        <motion.div variants={fadeSlideUp}>
          <SectionLabel icon={<Music className="h-3 w-3" />}>Background Music</SectionLabel>

          <AnimatePresence mode="wait">
            {activeAudioTrack ? (
              <motion.div
                key="track-active"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="relative overflow-hidden rounded-xl border border-indigo-500/20 dark:border-indigo-400/15 bg-gradient-to-r from-indigo-50/60 via-violet-50/30 to-fuchsia-50/40 dark:from-indigo-950/30 dark:via-violet-950/20 dark:to-fuchsia-950/20"
              >
                {/* Animated shimmer */}
                <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent_30%,rgba(99,102,241,0.06)_50%,transparent_70%)] bg-[length:200%_100%] animate-[feed-shimmer_6s_linear_infinite] pointer-events-none" />

                <div className="relative p-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Spinning disc icon */}
                    <div className="relative flex-shrink-0 h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                      <Music className="w-4 h-4 text-white animate-[spin_3s_linear_infinite]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{activeAudioTrack.title}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {activeAudioTrack.artist} · Start at {audioStartTime}s
                      </p>
                    </div>
                  </div>
                  <motion.button
                    type="button"
                    onClick={() => setActiveAudioTrack(null)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="flex-shrink-0 p-1.5 rounded-lg bg-slate-200/60 dark:bg-slate-700/40 text-slate-500 dark:text-slate-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 hover:text-rose-500 transition-all cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </motion.button>
                </div>
              </motion.div>
            ) : (
              <motion.button
                key="track-empty"
                type="button"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                onClick={() => setIsMusicPickerActive(true)}
                whileHover={{ scale: 1.01, y: -1 }}
                whileTap={{ scale: 0.99 }}
                className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-slate-200/70 dark:border-slate-700/50 bg-slate-50/50 dark:bg-white/[0.02] hover:border-indigo-400/40 dark:hover:border-indigo-500/30 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/10 transition-all cursor-pointer group text-left"
              >
                <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center group-hover:from-indigo-100 group-hover:to-violet-100 dark:group-hover:from-indigo-500/15 dark:group-hover:to-violet-500/15 transition-all">
                  <Music className="w-4.5 h-4.5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    Add Background Music
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">
                    Choose from our royalty-free library
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-indigo-400 transition-colors" />
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ───────── Caption Editor ───────── */}
        <motion.div variants={fadeSlideUp}>
          <SectionLabel icon={<Sparkles className="h-3 w-3" />}>Caption & Hashtags</SectionLabel>
          <div className="relative rounded-2xl bg-slate-50/70 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/[0.06] focus-within:border-indigo-400/50 dark:focus-within:border-indigo-500/40 focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all duration-300">
            <textarea
              placeholder="Write a captivating description... Add #hashtags to boost reach"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              maxLength={2200}
              rows={3}
              required
              className="w-full bg-transparent px-4 pt-3.5 pb-1.5 text-[14px] leading-relaxed text-slate-800 dark:text-[#F8FAFC] placeholder:text-slate-400 dark:placeholder:text-slate-600 resize-none focus:outline-none min-h-[80px]"
            />
            {/* Hashtag pills preview */}
            {hashtags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 px-4 pb-2">
                {hashtags.map((tag, i) => (
                  <span
                    key={`${tag}-${i}`}
                    className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 bg-indigo-500/8 dark:bg-indigo-400/10 px-2 py-0.5 rounded-md"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            {/* Bottom bar */}
            <div className="flex items-center justify-between px-4 pb-2.5">
              <div className="flex items-center gap-1.5">
                <Hash className="h-3.5 w-3.5 text-slate-400/60" />
                <span className="text-[10px] text-slate-400 dark:text-slate-500">Auto-extracted from caption</span>
              </div>
                <CharRing current={caption.length} max={2200} />
                <span className="ml-2 text-xs text-slate-400 dark:text-slate-500">{caption.length}/2200</span>
            </div>
          </div>
        </motion.div>

        {/* ───────── Location ───────── */}
        <motion.div variants={fadeSlideUp}>
          <SectionLabel icon={<MapPin className="h-3 w-3" />}>Location</SectionLabel>
          <div className="relative rounded-xl bg-slate-50/70 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/[0.06] focus-within:border-indigo-400/50 dark:focus-within:border-indigo-500/40 focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all duration-300">
            <div className="flex items-center gap-2.5 px-3.5">
              <MapPin className="h-4 w-4 text-slate-400/70 flex-shrink-0" />
              <input
                type="text"
                placeholder="e.g. Mumbai, India"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-transparent py-3 text-sm text-slate-800 dark:text-[#F8FAFC] placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none"
              />
            </div>
          </div>
        </motion.div>

        {/* ───────── Action Bar ───────── */}
        <motion.div
          variants={fadeSlideUp}
          className="flex items-center justify-between gap-3 border-t border-slate-200/60 dark:border-slate-800/50 pt-5"
        >
          {/* Left info chips */}
          <div className="flex items-center gap-2 flex-wrap">
            {selectedFile && (
              <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/8 dark:bg-emerald-400/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold">
                <Check className="h-3 w-3" />
                Video ready
              </span>
            )}
            {activeAudioTrack && (
              <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-violet-500/8 dark:bg-violet-400/10 text-violet-600 dark:text-violet-400 text-[11px] font-semibold">
                <Music className="h-3 w-3" />
                Audio
              </span>
            )}
            {location.trim() && (
              <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-500/8 dark:bg-rose-400/10 text-rose-600 dark:text-rose-400 text-[11px] font-semibold">
                <MapPin className="h-3 w-3" />
                Location
              </span>
            )}
          </div>

          {/* Right buttons */}
          <div className="flex items-center gap-2.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-800 dark:hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={createReel.isPending || !selectedFile}
              isLoading={createReel.isPending}
              className="px-5 bg-gradient-to-r from-rose-500 via-fuchsia-500 to-violet-600 shadow-lg shadow-fuchsia-500/20 border-none"
            >
              Publish Reel
            </Button>
          </div>
        </motion.div>
      </motion.form>

      {/* Camera System Overlay */}
      {isCameraActive && (
        <CameraSystem
          onCaptureImage={() => {}}
          onCaptureVideo={handleCameraCaptureVideo}
          onClose={() => setIsCameraActive(false)}
        />
      )}

      {/* Music Picker Drawer Overlay */}
      <AnimatePresence>
        {isMusicPickerActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex flex-col justify-end"
            onClick={() => setIsMusicPickerActive(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring' as const, damping: 28, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="h-[65vh] w-full max-w-md mx-auto"
            >
              <MusicPicker
                onSelectTrack={(track, start) => {
                  setActiveAudioTrack(track);
                  setAudioStartTime(start);
                  setIsMusicPickerActive(false);
                }}
                onClose={() => setIsMusicPickerActive(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
}
export default CreateReelModal;
