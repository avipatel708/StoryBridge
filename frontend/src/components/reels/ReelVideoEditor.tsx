import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Scissors, Sparkles, Filter, Check, X, Sliders } from 'lucide-react';
import { Button } from '../ui/Button';

interface ReelVideoEditorProps {
  videoFile: File;
  onSave: (editedVideoBlob: Blob, trimStart: number, trimEnd: number, speed: number) => void;
  onCancel: () => void;
}

type VideoFilterType = 'normal' | 'vintage' | 'grayscale' | 'cinematic' | 'warm' | 'cool';

export const ReelVideoEditor: React.FC<ReelVideoEditorProps> = ({
  videoFile,
  onSave,
  onCancel
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [videoUrl, setVideoUrl] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);

  // Trim settings
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(15); // default 15s max/initial

  // Speed and Filter parameters
  const [videoSpeed, setVideoSpeed] = useState<number>(1);
  const [selectedFilter, setSelectedFilter] = useState<VideoFilterType>('normal');

  // Transcoding state
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);

  useEffect(() => {
    const url = URL.createObjectURL(videoFile);
    setVideoUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [videoFile]);

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (!video) return;
    setDuration(video.duration);
    setTrimEnd(Math.min(video.duration, 15)); // Cap at 15s initially
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    
    // Loop playback within trim range
    if (video.currentTime >= trimEnd) {
      video.currentTime = trimStart;
      if (!isPlaying) {
        video.pause();
      }
    }
    if (video.currentTime < trimStart) {
      video.currentTime = trimStart;
    }
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      if (video.currentTime >= trimEnd) {
        video.currentTime = trimStart;
      }
      video.playbackRate = videoSpeed;
      video.play()
        .then(() => setIsPlaying(true))
        .catch(err => console.error(err));
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.playbackRate = videoSpeed;
    }
  }, [videoSpeed]);

  const handleTrimStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    const start = Math.min(val, trimEnd - 1); // Ensure at least 1s difference
    setTrimStart(start);
    if (videoRef.current) {
      videoRef.current.currentTime = start;
    }
  };

  const handleTrimEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    const end = Math.max(val, trimStart + 1);
    setTrimEnd(end);
    if (videoRef.current) {
      videoRef.current.currentTime = trimStart;
    }
  };

  // Convert/Transcode video via Canvas + MediaRecorder at targeted rate & speed
  const processVideo = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    setIsProcessing(true);
    setProcessingProgress(10);

    // Pause current preview
    video.pause();
    setIsPlaying(false);

    // Setup canvas size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsProcessing(false);
      return;
    }

    // Capture canvas stream at 30 FPS
    const stream = canvas.captureStream(30);
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
    const chunks: Blob[] = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      const finalBlob = new Blob(chunks, { type: 'video/webm' });
      setIsProcessing(false);
      onSave(finalBlob, trimStart, trimEnd, videoSpeed);
    };

    // Prepare transcoding loop
    // Set video playhead back to trim start
    video.currentTime = trimStart;
    video.playbackRate = videoSpeed;
    
    // Play sound on final video only if speed is 1x and mic is active
    // Canvas streams do not automatically capture audio tracks. So we capture canvas only.
    // That keeps video render clean and standard.

    await new Promise<void>((resolvePlay) => {
      video.onseeked = () => {
        resolvePlay();
      };
    });

    recorder.start();
    video.play();

    const checkInterval = 100; // ms
    const totalDuration = (trimEnd - trimStart) / videoSpeed;

    const renderLoop = setInterval(() => {
      if (video.paused || video.ended || video.currentTime >= trimEnd) {
        clearInterval(renderLoop);
        video.pause();
        recorder.stop();
      } else {
        // Draw frame onto transcoding canvas with applied filter
        ctx.save();
        applyFilterToContext(ctx, selectedFilter);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        ctx.restore();

        // Update progress percentage
        const elapsed = (video.currentTime - trimStart) / videoSpeed;
        const pct = Math.min(Math.round((elapsed / totalDuration) * 90) + 10, 100);
        setProcessingProgress(pct);
      }
    }, 33); // ~30 FPS draw cycle
  };

  const applyFilterToContext = (ctx: CanvasRenderingContext2D, filter: VideoFilterType) => {
    switch (filter) {
      case 'vintage':
        ctx.filter = 'sepia(0.6) contrast(1.1) brightness(0.9)';
        break;
      case 'grayscale':
        ctx.filter = 'grayscale(1)';
        break;
      case 'cinematic':
        ctx.filter = 'contrast(1.3) saturate(0.8)';
        break;
      case 'warm':
        ctx.filter = 'saturate(1.2) sepia(0.2)';
        break;
      case 'cool':
        ctx.filter = 'hue-rotate(15deg) saturate(1.1)';
        break;
      default:
        ctx.filter = 'none';
    }
  };

  const getVideoFilterClass = (): string => {
    switch (selectedFilter) {
      case 'vintage': return 'sepia(0.6) contrast(1.1) brightness(0.9)';
      case 'grayscale': return 'grayscale(1)';
      case 'cinematic': return 'contrast(1.3) saturate(0.8)';
      case 'warm': return 'saturate(1.2) sepia(0.2)';
      case 'cool': return 'hue-rotate(15deg) saturate(1.1)';
      default: return 'none';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-zinc-950 text-white select-none">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-zinc-900 bg-gradient-to-b from-black/80 to-transparent">
        <button onClick={onCancel} className="p-2 hover:bg-zinc-900 rounded-full text-zinc-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>
        <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-1.5">
          <Scissors className="w-4 h-4 text-indigo-400" /> Reel Video Cutter
        </h3>
        <button 
          onClick={processVideo}
          disabled={isProcessing}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-full font-bold text-xs tracking-wider"
        >
          <Check className="w-4 h-4" /> Save
        </button>
      </div>

      {/* Main video canvas view */}
      <div className="flex-1 flex items-center justify-center bg-black p-4 relative">
        {isProcessing ? (
          <div className="flex flex-col items-center gap-3 text-center max-w-xs">
            <div className="w-12 h-12 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
            <p className="font-semibold text-sm">Processing Video...</p>
            <p className="text-xs text-zinc-400">{processingProgress}% finished</p>
          </div>
        ) : (
          <div className="relative w-full h-full max-h-[70vh] rounded-2xl overflow-hidden bg-zinc-900 flex items-center justify-center">
            {videoUrl && (
              <video
                ref={videoRef}
                src={videoUrl}
                onLoadedMetadata={handleLoadedMetadata}
                onTimeUpdate={handleTimeUpdate}
                onClick={togglePlay}
                style={{ filter: getVideoFilterClass() }}
                className="max-w-full max-h-full object-contain cursor-pointer"
              />
            )}

            {/* Play overlay button */}
            {!isPlaying && (
              <button 
                onClick={togglePlay}
                className="absolute p-5 bg-black/60 hover:bg-black/70 rounded-full text-white backdrop-blur-[2px] transition scale-110"
              >
                <Play className="w-8 h-8 fill-white" />
              </button>
            )}
          </div>
        )}

        {/* Transcode hidden canvas */}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Trim slider timeline + filters */}
      <div className="bg-zinc-950 border-t border-zinc-900 p-6 flex flex-col gap-5">
        
        {/* Timeline Sliders */}
        <div className="space-y-3">
          <div className="flex justify-between text-xs text-zinc-400 font-bold uppercase tracking-wider">
            <span>Trim Start: {trimStart.toFixed(1)}s</span>
            <span>Trim End: {trimEnd.toFixed(1)}s</span>
            <span>Duration: {(trimEnd - trimStart).toFixed(1)}s</span>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase">Start Cutter</label>
              <input
                type="range"
                min="0"
                max={Math.max(0, duration - 1)}
                step="0.1"
                value={trimStart}
                onChange={handleTrimStartChange}
                className="w-full accent-indigo-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase">End Cutter</label>
              <input
                type="range"
                min="1"
                max={duration || 10}
                step="0.1"
                value={trimEnd}
                onChange={handleTrimEndChange}
                className="w-full accent-indigo-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Speed selectors */}
        <div className="flex items-center gap-3 bg-zinc-900 p-1.5 rounded-xl justify-between px-4">
          <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5" /> Video Speed
          </span>
          <div className="flex gap-1.5">
            {([0.5, 1, 2, 3] as const).map((spd) => (
              <button
                key={spd}
                onClick={() => setVideoSpeed(spd)}
                className={`px-3 py-1 text-xs rounded-lg font-bold transition ${
                  videoSpeed === spd ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>

        {/* Video Filters selector */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-zinc-400 uppercase px-1">Applied Shaders</p>
          <div className="flex gap-3 overflow-x-auto py-1">
            {(['normal', 'vintage', 'grayscale', 'cinematic', 'warm', 'cool'] as VideoFilterType[]).map((f) => (
              <button
                key={f}
                onClick={() => setSelectedFilter(f)}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl transition flex-shrink-0 ${
                  selectedFilter === f ? 'bg-zinc-900 border border-indigo-500/30' : 'hover:bg-zinc-900/60'
                }`}
              >
                <div className="w-10 h-12 rounded bg-zinc-800 relative border border-zinc-700 overflow-hidden" />
                <span className="text-[10px] capitalize font-medium">{f}</span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
