import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, 
  PenLine, 
  Film, 
  Sparkles, 
  Wand2, 
  Hash, 
  FileText, 
  PlusSquare, 
  ArrowLeft, 
  X, 
  Check,
  Calendar,
  Music,
  Plus,
  Trash2,
  Sliders,
  Image as ImageIcon
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { Avatar } from '@/components/ui/Avatar';
import { Spinner } from '@/components/ui/Spinner';
import { useAuthStore } from '@/stores/authStore';
import { usePosts } from '@/hooks/usePosts';
import { useStories } from '@/hooks/useStories';
import { useProfile } from '@/hooks/useProfile';
import { getAvatarUrl } from '@/lib/utils';
import { toast } from 'sonner';
import { MOOD_CONFIG, MoodType, Profile } from '@/types';
import {
  generateAICaption,
  generateAIHashtags,
  improveWritingAssistant,
  generatePostSummary,
  isAIConfigured,
} from '@/lib/gemini';

// New Instagram upgrades
import { CameraSystem } from '@/components/ui/CameraSystem';
import { StoryEditor } from '@/components/stories/StoryEditor';
import { MusicPicker } from '@/components/ui/MusicPicker';
import { AudioTrack } from '@/lib/musicLibrary';

export default function CreatePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuthStore();
  const { createPost } = usePosts();
  const { uploadStory, addStoryMention } = useStories();
  const { useSearchUsers } = useProfile();

  // Determine current sub-route based on path
  const isPostRoute = location.pathname === '/create/post' || location.pathname === '/posts/new';
  const isStoryRoute = location.pathname === '/create/story' || location.pathname === '/stories/new';

  // --- UNIVERSAL CAMERA SYSTEM STATE ---
  const [isCameraActive, setIsCameraActive] = useState(false);

  // --- SCHEDULING SYSTEM STATE ---
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<string>('');

  // --- AUDIO SYSTEM STATE ---
  const [isMusicPickerActive, setIsMusicPickerActive] = useState(false);
  const [activeAudioTrack, setActiveAudioTrack] = useState<AudioTrack | null>(null);
  const [audioStartTime, setAudioStartTime] = useState(0);

  // --- POST STATE ---
  const [postContent, setPostContent] = useState('');
  const [postImage, setPostImage] = useState<File | null>(null);
  
  // Carousel Post Support
  const [carouselFiles, setCarouselFiles] = useState<File[]>([]);
  const postFileInputRef = useRef<HTMLInputElement>(null);

  const [postMood, setPostMood] = useState<MoodType | ''>('');
  const [isAILoading, setIsAILoading] = useState(false);

  // --- STORY STATE ---
  const [storyFile, setStoryFile] = useState<File | null>(() => {
    return location.state?.preSelectedFile || null;
  });
  const [storyPreview, setStoryPreview] = useState<string>(() => {
    const file = location.state?.preSelectedFile;
    return file ? URL.createObjectURL(file) : '';
  });
  const [mentionQuery, setMentionQuery] = useState('');
  const [taggedUsers, setTaggedUsers] = useState<Profile[]>([]);
  const [showMentionSearch, setShowMentionSearch] = useState(false);
  
  // Story Editor Overlay State
  const [isStoryEditorActive, setIsStoryEditorActive] = useState(false);

  // Query search results for tags
  const { data: searchResults } = useSearchUsers(mentionQuery);

  // --- AI HANDLERS ---
  const handleGenerateCaption = async () => {
    setIsAILoading(true);
    const toastId = toast.loading('AI generating creative caption...');
    try {
      const result = await generateAICaption(postContent || 'a beautiful story about life', postMood || undefined);
      setPostContent(result);
      toast.success('AI Caption generated!', { id: toastId });
    } catch (err: any) {
      toast.error(`AI failed: ${err.message}`, { id: toastId });
    } finally {
      setIsAILoading(false);
    }
  };

  const handleImproveWriting = async () => {
    if (!postContent.trim()) return;
    setIsAILoading(true);
    const toastId = toast.loading('Story Assistant polishing draft...');
    try {
      const result = await improveWritingAssistant(postContent);
      setPostContent(result);
      toast.success('Story draft refined!', { id: toastId });
    } catch (err: any) {
      toast.error(`AI failed: ${err.message}`, { id: toastId });
    } finally {
      setIsAILoading(false);
    }
  };

  const handleGenerateHashtags = async () => {
    if (!postContent.trim()) return;
    setIsAILoading(true);
    const toastId = toast.loading('Generating relevant hashtags...');
    try {
      const tags = await generateAIHashtags(postContent);
      setPostContent((prev) => `${prev.trim()}\n\n${tags}`);
      toast.success('Hashtags added!', { id: toastId });
    } catch (err: any) {
      toast.error(`AI failed: ${err.message}`, { id: toastId });
    } finally {
      setIsAILoading(false);
    }
  };

  const handleGenerateSummary = async () => {
    if (!postContent.trim()) return;
    setIsAILoading(true);
    const toastId = toast.loading('Summarizing story draft...');
    try {
      const summary = await generatePostSummary(postContent);
      toast.success(`Summary: "${summary}"`, { id: toastId, duration: 6000 });
    } catch (err: any) {
      toast.error(`AI failed: ${err.message}`, { id: toastId });
    } finally {
      setIsAILoading(false);
    }
  };

  // --- CAMERA CAPTURE RESOLVERS ---
  const handleCameraCaptureImage = (dataUrl: string) => {
    setIsCameraActive(false);
    // Convert base64 to File
    fetch(dataUrl)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
        if (isPostRoute) {
          setCarouselFiles(prev => [...prev, file]);
        } else if (isStoryRoute) {
          setStoryFile(file);
          setStoryPreview(dataUrl);
          setIsStoryEditorActive(true); // Auto launch story canvas editor!
        }
      });
  };

  const handleCameraCaptureVideo = (blob: Blob) => {
    setIsCameraActive(false);
    const file = new File([blob], `capture-${Date.now()}.webm`, { type: 'video/webm' });
    if (isPostRoute) {
      setCarouselFiles(prev => [...prev, file]);
    } else if (isStoryRoute) {
      setStoryFile(file);
      setStoryPreview(URL.createObjectURL(blob));
      setIsStoryEditorActive(true);
    }
  };

  // --- SUBMIT HANDLERS ---
  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim() && carouselFiles.length === 0 && !postImage) {
      toast.error('Post content or image is required!');
      return;
    }

    try {
      await createPost.mutateAsync({
        content: postContent,
        imageFile: postImage,
        carouselFiles: carouselFiles,
        mood: postMood || undefined,
        audioTrackId: activeAudioTrack?.id,
        audioStartTime: audioStartTime,
        scheduledAt: isScheduled && scheduledDate ? new Date(scheduledDate) : undefined
      });
      toast.success(isScheduled ? 'Post scheduled successfully!' : 'Post published successfully');
      setPostContent('');
      setPostImage(null);
      setCarouselFiles([]);
      setPostMood('');
      setActiveAudioTrack(null);
      navigate('/feed');
    } catch (err) {
      toast.error('Unable to create post');
    }
  };

  const handleStoryFileChange = (file: File | null) => {
    setStoryFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setStoryPreview(url);
      setIsStoryEditorActive(true); // Launch Story Editor immediately on upload!
    } else {
      setStoryPreview('');
    }
  };

  // Invoked when StoryEditor finishes compositing
  const handlePublishStory = async (
    finalMedia: string | File | Blob, 
    stickersList: any[], 
    audioId?: string, 
    audioStart?: number
  ) => {
    const toastId = toast.loading('Uploading story to bridge...');
    try {
      let blob: File | Blob;
      if (typeof finalMedia === 'string') {
        // Convert composited base64 to Blob
        const res = await fetch(finalMedia);
        blob = await res.blob();
      } else {
        blob = finalMedia;
      }

      const story = await uploadStory.mutateAsync({
        file: blob,
        stickers: stickersList,
        audioTrackId: audioId,
        audioStartTime: audioStart,
        scheduledAt: isScheduled && scheduledDate ? new Date(scheduledDate) : undefined
      });

      // Save tags/mentions
      for (const taggedUser of taggedUsers) {
        await addStoryMention.mutateAsync({ storyId: story.id, userId: taggedUser.id });
      }

      toast.success(isScheduled ? 'Story scheduled successfully!' : 'Story published successfully', { id: toastId });
      setStoryFile(null);
      setStoryPreview('');
      setIsStoryEditorActive(false);
      navigate('/feed');
    } catch (err) {
      toast.error('Unable to create story', { id: toastId });
    }
  };

  const handleSelectMention = (user: Profile) => {
    if (!taggedUsers.some((u) => u.id === user.id)) {
      setTaggedUsers([...taggedUsers, user]);
    }
    setMentionQuery('');
    setShowMentionSearch(false);
  };

  const handleRemoveTagged = (id: string) => {
    setTaggedUsers(taggedUsers.filter((u) => u.id !== id));
  };

  // Carousel Helper
  const handleCarouselFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArr = Array.from(e.target.files);
      setCarouselFiles(prev => [...prev, ...filesArr]);
    }
  };

  const handleRemoveCarouselItem = (index: number) => {
    setCarouselFiles(prev => prev.filter((_, idx) => idx !== index));
  };

  // --- RENDER SELECTION MENU ---
  if (!isPostRoute && !isStoryRoute) {
    return (
      <div className="max-w-xl mx-auto px-4 py-8 select-none text-left">
        <h1 className="text-3xl font-extrabold font-outfit text-slate-900 dark:text-white mb-2 text-center">
          Create Moment
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-8">
          Choose how you want to share your stories with your connections
        </p>

        {isCameraActive ? (
          <CameraSystem 
            onCaptureImage={handleCameraCaptureImage}
            onCaptureVideo={handleCameraCaptureVideo}
            onClose={() => setIsCameraActive(false)}
          />
        ) : (
          <div className="flex flex-col gap-4">
            
            {/* Live Camera System Option */}
            <div 
              onClick={() => setIsCameraActive(true)}
              className="border border-indigo-500/20 bg-indigo-500/5 hover:border-indigo-500 hover:shadow-lg transition-all p-5 rounded-2xl group cursor-pointer text-left"
            >
              <div className="flex items-center gap-4">
                <div className="p-3.5 bg-indigo-600 rounded-2xl text-white group-hover:scale-105 transition-transform shadow-lg shadow-indigo-600/30">
                  <Camera className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white group-hover:text-indigo-500 transition-colors">
                    Open Live Camera
                  </h3>
                  <p className="text-xs text-slate-450 dark:text-slate-500 mt-1">
                    Take high-quality photos, record video clips, use layout grids, or create Boomerang loops.
                  </p>
                </div>
              </div>
            </div>

            {/* Create Post Option */}
            <Link to="/create/post" className="no-underline">
              <Card variant="glass" padding="md" className="hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/5 transition-all group cursor-pointer text-left">
                <div className="flex items-center gap-4">
                  <div className="p-3.5 bg-indigo-500/10 rounded-2xl text-indigo-500 group-hover:scale-105 transition-transform">
                    <PenLine className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white group-hover:text-indigo-500 transition-colors">
                      Create a Post
                    </h3>
                    <p className="text-xs text-slate-450 dark:text-slate-500 mt-1">
                      Share a memory, custom text update, and attach photos to your main feed.
                    </p>
                  </div>
                </div>
              </Card>
            </Link>

            {/* Create Story Option */}
            <Link to="/create/story" className="no-underline">
              <Card variant="glass" padding="md" className="hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/5 transition-all group cursor-pointer text-left">
                <div className="flex items-center gap-4">
                  <div className="p-3.5 bg-indigo-500/10 rounded-2xl text-indigo-500 group-hover:scale-105 transition-transform">
                    <ImageIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white group-hover:text-indigo-500 transition-colors">
                      Create a Story
                    </h3>
                    <p className="text-xs text-slate-450 dark:text-slate-500 mt-1">
                      Post a temporary photo or video story that disappears after 24 hours.
                    </p>
                  </div>
                </div>
              </Card>
            </Link>

            {/* Create Reel Option */}
            <Link to="/reels?create=true" className="no-underline">
              <Card variant="glass" padding="md" className="hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/5 transition-all group cursor-pointer text-left">
                <div className="flex items-center gap-4">
                  <div className="p-3.5 bg-indigo-500/10 rounded-2xl text-indigo-500 group-hover:scale-105 transition-transform">
                    <Film className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white group-hover:text-indigo-500 transition-colors">
                      Publish a Reel
                    </h3>
                    <p className="text-xs text-slate-450 dark:text-slate-500 mt-1">
                      Upload a vertical short-form video to the Reels tab.
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
          </div>
        )}
      </div>
    );
  }

  // --- RENDER POST CREATOR ---
  if (isPostRoute) {
    return (
      <div className="max-w-xl mx-auto px-4 py-6 text-left select-none">
        
        {isCameraActive && (
          <CameraSystem 
            onCaptureImage={handleCameraCaptureImage}
            onCaptureVideo={handleCameraCaptureVideo}
            onClose={() => setIsCameraActive(false)}
          />
        )}

        <Link to="/create" className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-805 dark:hover:text-white mb-6 uppercase tracking-wider no-underline">
          <ArrowLeft className="h-4 w-4" />
          Back to choices
        </Link>

        <Card variant="glass" padding="lg" className="border-slate-200/80 dark:border-slate-800/80">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-extrabold font-outfit text-slate-900 dark:text-white">
              Create a Story Post
            </h2>
            <Button 
              type="button" 
              onClick={() => setIsCameraActive(true)}
              className="flex items-center gap-1.5 text-xs bg-zinc-900 border border-zinc-800 rounded-xl"
            >
              <Camera className="w-3.5 h-3.5" /> Use Camera
            </Button>
          </div>

          <form onSubmit={handlePostSubmit} className="flex flex-col gap-5">
            {profile && (
              <div className="flex items-center gap-3">
                <Avatar
                  src={getAvatarUrl(profile.avatar_url)}
                  name={profile.full_name || profile.username}
                  size="md"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-900 dark:text-[#F8FAFC]">
                    {profile.full_name || profile.username}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    Sharing memories
                  </span>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <Textarea
                placeholder="What memories or stories are you sharing today?"
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                maxLength={2200}
                showCharacterCount
                className="bg-transparent border-0 focus:ring-0 px-0 py-1 placeholder:text-slate-500 min-h-[100px] text-sm"
              />
            </div>

            {/* AI Toolbar */}
            <div className="flex flex-col gap-2 p-3 bg-indigo-500/5 dark:bg-indigo-950/20 border border-indigo-500/10 dark:border-indigo-900/30 rounded-xl select-none">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="h-3 w-3 animate-pulse" />
                  AI Creative Assistant
                </span>
                {!isAIConfigured() && (
                  <span className="text-[9px] font-semibold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
                    Simulated Sandbox Mode
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2 mt-1">
                <button
                  type="button"
                  onClick={handleGenerateCaption}
                  disabled={isAILoading}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-500 dark:hover:text-indigo-400 border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-1.5 cursor-pointer transition-all hover:border-indigo-500/30 disabled:opacity-50"
                >
                  <Wand2 className="h-3.5 w-3.5 text-indigo-500" />
                  Caption
                </button>
                <button
                  type="button"
                  onClick={handleImproveWriting}
                  disabled={isAILoading || !postContent.trim()}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-500 dark:hover:text-indigo-400 border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-1.5 cursor-pointer transition-all hover:border-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                  Story Assistant
                </button>
                <button
                  type="button"
                  onClick={handleGenerateHashtags}
                  disabled={isAILoading || !postContent.trim()}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-500 dark:hover:text-indigo-400 border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-1.5 cursor-pointer transition-all hover:border-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Hash className="h-3.5 w-3.5 text-indigo-500" />
                  Hashtags
                </button>
                <button
                  type="button"
                  onClick={handleGenerateSummary}
                  disabled={isAILoading || !postContent.trim()}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-500 dark:hover:text-indigo-400 border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-1.5 cursor-pointer transition-all hover:border-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FileText className="h-3.5 w-3.5 text-indigo-500" />
                  Summarize
                </button>
              </div>
            </div>

            {/* Carousel Upload layout */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-widest text-left">
                Carousel Slides (Max 10 images)
              </label>
              
              <div className="grid grid-cols-4 gap-2">
                {carouselFiles.map((file, idx) => (
                  <div key={idx} className="relative aspect-square rounded-xl bg-slate-900 border border-slate-800 overflow-hidden group">
                    {file.type.startsWith('video') ? (
                      <div className="w-full h-full flex items-center justify-center bg-slate-950 text-xs font-bold text-indigo-400">Reel Clip</div>
                    ) : (
                      <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" />
                    )}
                    <button 
                      onClick={() => handleRemoveCarouselItem(idx)}
                      className="absolute top-1 right-1 p-1 bg-red-600 hover:bg-red-700 text-white rounded-full opacity-80 group-hover:opacity-100 transition cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                
                {carouselFiles.length < 10 && (
                  <button 
                    type="button"
                    onClick={() => postFileInputRef.current?.click()}
                    className="aspect-square border border-dashed border-zinc-700 rounded-xl flex flex-col items-center justify-center gap-1 text-zinc-500 hover:text-indigo-400 hover:border-indigo-500/45 transition bg-zinc-900/40"
                  >
                    <Plus className="w-5 h-5" />
                    <span className="text-[8px] font-bold uppercase tracking-wider">Slide</span>
                  </button>
                )}
              </div>
              
              <input 
                type="file" 
                ref={postFileInputRef} 
                onChange={handleCarouselFileChange} 
                className="hidden" 
                multiple 
                accept="image/*,video/*" 
              />
            </div>

            {/* Background Music System Option */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-widest text-left">
                Post Audio Track
              </label>
              {activeAudioTrack ? (
                <div className="p-3 bg-indigo-600/10 border border-indigo-500/25 rounded-xl flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Music className="w-4 h-4 text-indigo-400 animate-spin" />
                    <div>
                      <p className="text-xs font-bold">{activeAudioTrack.title}</p>
                      <p className="text-[10px] text-zinc-400">{activeAudioTrack.artist} (Start: {audioStartTime}s)</p>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setActiveAudioTrack(null)}
                    className="p-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-full transition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <Button 
                  type="button" 
                  onClick={() => setIsMusicPickerActive(true)}
                  className="flex items-center gap-1.5 text-xs bg-zinc-900 border border-zinc-800 rounded-xl"
                >
                  <Music className="w-3.5 h-3.5" /> Select Background Music
                </Button>
              )}
            </div>

            {/* Post Scheduling Option */}
            <div className="p-4 bg-zinc-900/40 border border-zinc-850 rounded-xl flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-indigo-400" /> Schedule Release Time
                </span>
                <input 
                  type="checkbox"
                  checked={isScheduled}
                  onChange={(e) => setIsScheduled(e.target.checked)}
                  className="accent-indigo-500 w-4 h-4 cursor-pointer"
                />
              </div>

              {isScheduled && (
                <Input 
                  type="datetime-local"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="bg-zinc-950 border-zinc-800 text-white rounded-xl"
                />
              )}
            </div>

            {/* Mood selector */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-450 dark:text-slate-400 uppercase tracking-widest text-left">
                How are you feeling?
              </label>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(MOOD_CONFIG) as MoodType[]).map((moodType) => {
                  const config = MOOD_CONFIG[moodType];
                  const isSelected = postMood === moodType;
                  return (
                    <button
                      key={moodType}
                      type="button"
                      onClick={() => setPostMood(isSelected ? '' : moodType)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold font-outfit border flex items-center gap-1 cursor-pointer transition-colors ${
                        isSelected
                          ? 'border-transparent text-white'
                          : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:border-slate-450 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
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

            {/* Buttons */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-200/60 dark:border-slate-800/60 pt-4 mt-2">
              <Button
                type="button"
                onClick={() => navigate('/create')}
                variant="ghost"
                size="sm"
                className="text-slate-400 hover:text-slate-900 dark:hover:text-[#F8FAFC]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={createPost.isPending}
              >
                {isScheduled ? 'Schedule Post' : 'Share Post'}
              </Button>
            </div>
          </form>
        </Card>

        {/* Music Picker Modal Drawer */}
        <AnimatePresence>
          {isMusicPickerActive && (
            <div className="fixed inset-0 bg-black/60 z-50 flex flex-col justify-end">
              <div className="h-[60vh] w-full max-w-md mx-auto">
                <MusicPicker 
                  onSelectTrack={(track, start) => {
                    setActiveAudioTrack(track);
                    setAudioStartTime(start);
                    setIsMusicPickerActive(false);
                  }}
                  onClose={() => setIsMusicPickerActive(false)}
                />
              </div>
            </div>
          )}
        </AnimatePresence>

      </div>
    );
  }

  // --- RENDER STORY CREATOR ---
  return (
    <div className="max-w-xl mx-auto px-4 py-6 text-left select-none">
      
      {isCameraActive && (
        <CameraSystem 
          onCaptureImage={handleCameraCaptureImage}
          onCaptureVideo={handleCameraCaptureVideo}
          onClose={() => setIsCameraActive(false)}
        />
      )}

      {isStoryEditorActive && storyPreview && (
        <StoryEditor 
          mediaUrl={storyPreview}
          mediaType={storyFile?.type.startsWith('video') ? 'video' : 'image'}
          originalFile={storyFile}
          onPublish={handlePublishStory}
          onCancel={() => {
            setIsStoryEditorActive(false);
            setStoryFile(null);
            setStoryPreview('');
          }}
        />
      )}

      <Link to="/create" className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-805 dark:hover:text-white mb-6 uppercase tracking-wider no-underline">
        <ArrowLeft className="h-4 w-4" />
        Back to choices
      </Link>

      <Card variant="glass" padding="lg" className="border-slate-200/80 dark:border-slate-800/80">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-extrabold font-outfit text-slate-900 dark:text-white">
            Share new story
          </h2>
          <Button 
            type="button" 
            onClick={() => setIsCameraActive(true)}
            className="flex items-center gap-1.5 text-xs bg-zinc-900 border border-zinc-800 rounded-xl"
          >
            <Camera className="w-3.5 h-3.5" /> Open Camera
          </Button>
        </div>

        <div className="flex flex-col gap-5">
          {/* Media preview or upload */}
          {!storyPreview ? (
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest text-left">
                Select Photo or Video Story
              </label>
              <ImageUpload
                value={storyFile}
                onChange={handleStoryFileChange}
                label="Choose Story Media"
                aspectRatio="any"
                maxSize={25 * 1024 * 1024}
                accept="image/*,video/*"
              />
            </div>
          ) : (
            <div className="flex flex-col gap-4 text-left">
              <div className="w-full aspect-[9/16] max-h-[45vh] rounded-xl overflow-hidden bg-black flex items-center justify-center relative">
                {storyFile?.type.startsWith('video') ? (
                  <video src={storyPreview} controls className="w-full h-full object-contain" />
                ) : (
                  <img src={storyPreview} alt="" className="w-full h-full object-contain" />
                )}
                <button
                  type="button"
                  onClick={() => handleStoryFileChange(null)}
                  className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 hover:bg-black text-white hover:text-red-400 transition-colors"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* Story Scheduling Option */}
              <div className="p-4 bg-zinc-900/40 border border-zinc-850 rounded-xl flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-indigo-400" /> Schedule Release Time
                  </span>
                  <input 
                    type="checkbox"
                    checked={isScheduled}
                    onChange={(e) => setIsScheduled(e.target.checked)}
                    className="accent-indigo-500 w-4 h-4 cursor-pointer"
                  />
                </div>

                {isScheduled && (
                  <Input 
                    type="datetime-local"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="bg-zinc-950 border-zinc-800 text-white rounded-xl"
                  />
                )}
              </div>

              {/* Mentions */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-indigo-400" />
                  <span>Mention creators (@username)</span>
                </label>
                <div className="relative">
                  <Input
                    placeholder="Type username to mention..."
                    value={mentionQuery}
                    onChange={(e) => {
                      setMentionQuery(e.target.value);
                      setShowMentionSearch(true);
                    }}
                    className="rounded-xl"
                  />

                  {/* Autocomplete */}
                  {showMentionSearch && searchResults && searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-50 bg-slate-900 border border-slate-800 rounded-xl mt-1.5 max-h-[140px] overflow-y-auto custom-scrollbar shadow-2xl">
                      {searchResults.map((usr) => (
                        <div
                          key={usr.id}
                          onClick={() => handleSelectMention(usr)}
                          className="flex items-center gap-2.5 p-2.5 hover:bg-slate-850 cursor-pointer transition-colors"
                        >
                          <Avatar src={getAvatarUrl(usr.avatar_url)} name={usr.full_name || usr.username} size="sm" />
                          <div className="flex flex-col text-left">
                            <span className="text-xs font-bold text-white">{usr.full_name || usr.username}</span>
                            <span className="text-[9px] text-slate-450">@{usr.username}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Tagged list */}
                {taggedUsers.length > 0 && (
                  <div className="flex flex-wrap gap-2.5 mt-1">
                    {taggedUsers.map((usr) => (
                      <span
                        key={usr.id}
                        className="inline-flex items-center gap-1 bg-indigo-600/20 text-indigo-400 text-xs px-2.5 py-1 rounded-full border border-indigo-500/10 font-bold"
                      >
                        <span>@{usr.username}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTagged(usr.id)}
                          className="hover:text-white transition-colors cursor-pointer text-[10px]"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleStoryFileChange(null)}
                  className="rounded-xl"
                >
                  Clear Media
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => setIsStoryEditorActive(true)}
                  className="rounded-xl px-6 bg-indigo-600 hover:bg-indigo-500 border-none"
                >
                  Edit and Customize
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
