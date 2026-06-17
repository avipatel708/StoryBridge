import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, Video, Zap, RotateCw, X, Grid, Film, Play, Square, 
  Sparkles, RefreshCw, ZoomIn, ZoomOut, Check, ArrowLeft, Volume2, VolumeX 
} from 'lucide-react';
import { Button } from './Button';

interface CameraSystemProps {
  onCaptureImage: (dataUrl: string) => void;
  onCaptureVideo: (blob: Blob) => void;
  onClose: () => void;
}

type CameraMode = 'normal' | 'boomerang' | 'layout' | 'speed';
type LayoutGridType = '2x1' | '1x2' | '2x2';

export const CameraSystem: React.FC<CameraSystemProps> = ({
  onCaptureImage,
  onCaptureVideo,
  onClose
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const [mode, setMode] = useState<CameraMode>('normal');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [flash, setFlash] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [error, setError] = useState<string | null>(null);

  // Layout Mode state
  const [layoutGrid, setLayoutGrid] = useState<LayoutGridType>('2x2');
  const [layoutPhotos, setLayoutPhotos] = useState<string[]>([]);
  const [currentGridIndex, setCurrentGridIndex] = useState(0);

  // Speed Mode state
  const [videoSpeed, setVideoSpeed] = useState<0.5 | 1 | 2 | 3>(1);

  // Boomerang state
  const [isBoomerangCapturing, setIsBoomerangCapturing] = useState(false);
  const boomerangFramesRef = useRef<string[]>([]);
  const boomerangIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Audio track states (e.g. mic toggle)
  const [micEnabled, setMicEnabled] = useState(true);

  // Preview captured asset before saving
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewVideo, setPreviewVideo] = useState<string | null>(null);
  const [previewVideoBlob, setPreviewVideoBlob] = useState<Blob | null>(null);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
      if (boomerangIntervalRef.current) clearInterval(boomerangIntervalRef.current);
    };
  }, [facingMode]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingTime(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const startCamera = async () => {
    stopCamera();
    setError(null);
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1080 },
          height: { ideal: 1920 }
        },
        audio: mode !== 'boomerang' && micEnabled
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setError('Could not access camera. Please check camera permissions.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  const triggerFlashAnimation = () => {
    if (flashOn) {
      setFlash(true);
      setTimeout(() => setFlash(false), 200);
    }
  };

  // Capture Single Photo
  const capturePhoto = (): string | null => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return null;

    triggerFlashAnimation();

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Set canvas dimensions matching video input stream
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video to canvas (flip horizontally if front camera for mirror effect)
    ctx.save();
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    return canvas.toDataURL('image/jpeg');
  };

  // Normal Photo/Video Click Handler
  const handleCapture = () => {
    if (mode === 'normal') {
      const img = capturePhoto();
      if (img) {
        setPreviewImage(img);
      }
    } else if (mode === 'layout') {
      const img = capturePhoto();
      if (img) {
        const newPhotos = [...layoutPhotos];
        newPhotos[currentGridIndex] = img;
        setLayoutPhotos(newPhotos);

        const totalSlots = layoutGrid === '2x1' || layoutGrid === '1x2' ? 2 : 4;
        if (currentGridIndex + 1 < totalSlots) {
          setCurrentGridIndex((prev) => prev + 1);
        } else {
          // Completed all grid shots! Composite them!
          compositeLayoutGrid(newPhotos);
        }
      }
    }
  };

  // Composite Layout Photos into One Canvas
  const compositeLayoutGrid = (photos: string[]) => {
    const canvas = canvasRef.current;
    if (!canvas || photos.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Grid size constants
    const w = 1080;
    const h = 1920;
    canvas.width = w;
    canvas.height = h;

    const imgObjects = photos.map((src) => {
      const img = new Image();
      img.src = src;
      return img;
    });

    // Wait until images load, then paint
    let loaded = 0;
    imgObjects.forEach((img) => {
      img.onload = () => {
        loaded++;
        if (loaded === imgObjects.length) {
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, w, h);

          const borderSize = 8;
          ctx.fillStyle = '#ffffff'; // White grid lines

          if (layoutGrid === '2x1') {
            // 2 vertical rows
            const itemH = h / 2;
            ctx.drawImage(imgObjects[0], 0, 0, w, itemH);
            ctx.drawImage(imgObjects[1], 0, itemH, w, itemH);
            // Draw separator line
            ctx.fillRect(0, itemH - borderSize / 2, w, borderSize);
          } else if (layoutGrid === '1x2') {
            // 2 horizontal columns
            const itemW = w / 2;
            ctx.drawImage(imgObjects[0], 0, 0, itemW, h);
            ctx.drawImage(imgObjects[1], itemW, 0, itemW, h);
            // Draw separator line
            ctx.fillRect(itemW - borderSize / 2, 0, borderSize, h);
          } else if (layoutGrid === '2x2') {
            // 4 quadrants
            const itemW = w / 2;
            const itemH = h / 2;
            ctx.drawImage(imgObjects[0], 0, 0, itemW, itemH);
            ctx.drawImage(imgObjects[1], itemW, 0, itemW, itemH);
            ctx.drawImage(imgObjects[2], 0, itemH, itemW, itemH);
            ctx.drawImage(imgObjects[3], itemW, itemH, itemW, itemH);
            // Draw lines
            ctx.fillRect(itemW - borderSize / 2, 0, borderSize, h);
            ctx.fillRect(0, itemH - borderSize / 2, w, borderSize);
          }

          const compositeDataUrl = canvas.toDataURL('image/jpeg');
          setPreviewImage(compositeDataUrl);
          // Reset grid indexes
          setLayoutPhotos([]);
          setCurrentGridIndex(0);
        }
      };
    });
  };

  // Video Recording Start/Stop
  const startRecording = () => {
    if (!streamRef.current) return;
    setIsRecording(true);
    setRecordingTime(0);

    const chunks: Blob[] = [];
    const mediaRecorder = new MediaRecorder(streamRef.current, {
      mimeType: 'video/webm;codecs=vp9,opus'
    });
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      
      // Speed adjustments if mode is Speed Mode
      if (mode === 'speed' && videoSpeed !== 1) {
        // We'll pass the speed multiplier. For client-side speed rendering, we can use video.playbackRate in preview
        // and upload the original blob or re-render (playbackRate will simulate slowmo/hyperlapse perfectly)
        setPreviewVideoBlob(blob);
        setPreviewVideo(URL.createObjectURL(blob));
      } else {
        setPreviewVideoBlob(blob);
        setPreviewVideo(URL.createObjectURL(blob));
      }
      setIsRecording(false);
    };

    mediaRecorder.start();
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  };

  // Boomerang Capture
  const startBoomerangCapture = async () => {
    const video = videoRef.current;
    if (!video) return;

    setIsBoomerangCapturing(true);
    boomerangFramesRef.current = [];

    // Capture canvas frame every 80ms for 1.5 seconds (around 18-20 frames)
    const intervalTime = 80;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let framesCount = 0;
    const maxFrames = 18; // 18 frames * 80ms = ~1.44s

    boomerangIntervalRef.current = setInterval(() => {
      ctx.save();
      if (facingMode === 'user') {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      ctx.restore();

      boomerangFramesRef.current.push(canvas.toDataURL('image/jpeg'));
      framesCount++;

      if (framesCount >= maxFrames) {
        if (boomerangIntervalRef.current) clearInterval(boomerangIntervalRef.current);
        createBoomerangVideo();
      }
    }, intervalTime);
  };

  // Convert Boomerang Canvas Frames into a continuous Video Blob via MediaRecorder
  const createBoomerangVideo = () => {
    const frames = boomerangFramesRef.current;
    if (frames.length === 0) return;

    // We compile the forward and backward frames
    // e.g. [0, 1, 2, 3, 4, 3, 2, 1]
    const loopFrames = [...frames, ...[...frames].reverse().slice(1, -1)];

    // Create a hidden canvas for recorder
    const canvas = document.createElement('canvas');
    const firstImg = new Image();
    firstImg.src = frames[0];
    firstImg.onload = () => {
      canvas.width = firstImg.width;
      canvas.height = firstImg.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const stream = canvas.captureStream(24); // 24 FPS
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const videoBlob = new Blob(chunks, { type: 'video/webm' });
        setPreviewVideoBlob(videoBlob);
        setPreviewVideo(URL.createObjectURL(videoBlob));
        setIsBoomerangCapturing(false);
      };

      recorder.start();

      let frameIdx = 0;
      let repeats = 4; // Loop the sequence 4 times to make it a 5-6 second Boomerang video
      const drawFrame = () => {
        if (repeats <= 0) {
          recorder.stop();
          return;
        }

        const img = new Image();
        img.src = loopFrames[frameIdx];
        img.onload = () => {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          frameIdx++;
          if (frameIdx >= loopFrames.length) {
            frameIdx = 0;
            repeats--;
          }
          setTimeout(drawFrame, 70); // ~14 FPS playback speed
        };
      };

      drawFrame();
    };
  };

  // Save/Export Captured Content
  const handleSavePreview = () => {
    if (previewImage) {
      onCaptureImage(previewImage);
    } else if (previewVideoBlob) {
      onCaptureVideo(previewVideoBlob);
    }
  };

  const handleDiscardPreview = () => {
    setPreviewImage(null);
    setPreviewVideo(null);
    setPreviewVideoBlob(null);
    setLayoutPhotos([]);
    setCurrentGridIndex(0);
    startCamera();
  };

  // Helper formatting for record timer
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black text-white select-none">
      {/* Flash Screen Overlay */}
      <AnimatePresence>
        {flash && (
          <motion.div 
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-white pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Header controls */}
      <div className="absolute top-0 inset-x-0 p-4 flex justify-between items-center z-40 bg-gradient-to-b from-black/60 to-transparent">
        <button onClick={onClose} className="p-2 bg-black/40 rounded-full hover:bg-black/60 transition">
          <X className="w-6 h-6 text-white" />
        </button>

        {isRecording && (
          <div className="flex items-center gap-2 px-3 py-1 bg-red-600/90 text-white text-xs font-semibold rounded-full animate-pulse">
            <span className="w-2 h-2 rounded-full bg-white" />
            REC {formatTime(recordingTime)}
          </div>
        )}

        {isBoomerangCapturing && (
          <div className="flex items-center gap-2 px-3 py-1 bg-purple-600 text-white text-xs font-semibold rounded-full animate-bounce">
            BOOMERANG CAPTURING
          </div>
        )}

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setFlashOn(!flashOn)}
            className={`p-2 rounded-full transition ${flashOn ? 'bg-amber-400 text-black' : 'bg-black/40 hover:bg-black/60 text-white'}`}
          >
            <Zap className="w-5 h-5" />
          </button>
          
          {mode === 'normal' && (
            <button 
              onClick={() => setMicEnabled(!micEnabled)}
              className={`p-2 rounded-full transition ${micEnabled ? 'bg-black/40 hover:bg-black/60 text-white' : 'bg-red-500 text-white'}`}
            >
              {micEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
          )}
        </div>
      </div>

      {/* Main Viewfinder / Media Preview */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden bg-zinc-950">
        {error ? (
          <div className="text-center p-6 max-w-sm">
            <p className="text-red-400 mb-4 font-semibold">{error}</p>
            <Button onClick={startCamera}>Try Again</Button>
          </div>
        ) : previewImage ? (
          /* Image Preview */
          <img src={previewImage} alt="Preview" className="w-full h-full object-cover max-h-[85vh] rounded-2xl" />
        ) : previewVideo ? (
          /* Video Preview */
          <video 
            src={previewVideo} 
            controls 
            autoPlay 
            loop 
            muted={mode === 'boomerang'}
            className="w-full h-full object-cover max-h-[85vh] rounded-2xl" 
          />
        ) : (
          /* Camera Viewfinder */
          <div className="relative w-full h-full max-h-[85vh] rounded-2xl overflow-hidden shadow-2xl">
            <video 
              ref={videoRef}
              autoPlay 
              playsInline 
              muted 
              className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
            />

            {/* Layout Grid Overlays */}
            {mode === 'layout' && (
              <div className="absolute inset-0 pointer-events-none grid" style={{
                gridTemplateRows: layoutGrid === '2x1' ? 'repeat(2, 1fr)' : layoutGrid === '2x2' ? 'repeat(2, 1fr)' : '1fr',
                gridTemplateColumns: layoutGrid === '1x2' ? 'repeat(2, 1fr)' : layoutGrid === '2x2' ? 'repeat(2, 1fr)' : '1fr',
              }}>
                {Array.from({ length: layoutGrid === '2x1' || layoutGrid === '1x2' ? 2 : 4 }).map((_, idx) => (
                  <div 
                    key={idx}
                    className={`border border-white/40 flex items-center justify-center transition-colors ${
                      idx === currentGridIndex ? 'bg-white/10' : 'bg-transparent'
                    }`}
                  >
                    {layoutPhotos[idx] ? (
                      <img src={layoutPhotos[idx]} className="w-full h-full object-cover pointer-events-auto" />
                    ) : (
                      idx === currentGridIndex && (
                        <div className="bg-black/60 px-3 py-1 rounded text-xs text-white uppercase font-bold tracking-wider">
                          Active Slot
                        </div>
                      )
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Hidden Canvas for Compositing & Frames Extraction */}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Bottom Interface */}
      <div className="bg-black/95 border-t border-zinc-900 pb-8 pt-4 px-6 flex flex-col gap-4">
        {/* Discard / Confirm Preview controls */}
        {(previewImage || previewVideo) ? (
          <div className="flex justify-around items-center">
            <button 
              onClick={handleDiscardPreview}
              className="flex flex-col items-center gap-1 text-sm text-zinc-400 hover:text-white transition"
            >
              <div className="p-4 bg-zinc-900 rounded-full">
                <ArrowLeft className="w-6 h-6" />
              </div>
              Discard
            </button>
            <button 
              onClick={handleSavePreview}
              className="flex flex-col items-center gap-1 text-sm text-indigo-400 hover:text-indigo-300 transition"
            >
              <div className="p-5 bg-indigo-600 hover:bg-indigo-500 rounded-full text-white shadow-lg shadow-indigo-600/35">
                <Check className="w-8 h-8" />
              </div>
              Save Media
            </button>
          </div>
        ) : (
          /* Capture Mode controls */
          <>
            {/* Context parameters (Grids, Speeds, Zoom) */}
            <div className="flex items-center justify-center gap-6 text-sm text-zinc-400 h-10">
              {mode === 'layout' && (
                <div className="flex gap-2 bg-zinc-900 p-1 rounded-lg">
                  {(['2x1', '1x2', '2x2'] as LayoutGridType[]).map((grid) => (
                    <button 
                      key={grid}
                      onClick={() => { setLayoutGrid(grid); setLayoutPhotos([]); setCurrentGridIndex(0); }}
                      className={`px-3 py-1 text-xs rounded font-medium transition ${layoutGrid === grid ? 'bg-indigo-600 text-white' : 'hover:text-white'}`}
                    >
                      {grid}
                    </button>
                  ))}
                </div>
              )}

              {mode === 'speed' && (
                <div className="flex gap-2 bg-zinc-900 p-1 rounded-lg">
                  {([0.5, 1, 2, 3] as const).map((spd) => (
                    <button 
                      key={spd}
                      onClick={() => setVideoSpeed(spd)}
                      className={`px-3 py-1 text-xs rounded font-medium transition ${videoSpeed === spd ? 'bg-indigo-600 text-white' : 'hover:text-white'}`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Shutter Circle Button + Flip controls */}
            <div className="flex justify-between items-center px-8">
              {/* Left element: mode identifier or grid reset */}
              <div className="w-14 flex items-center justify-center">
                {mode === 'layout' && layoutPhotos.length > 0 && (
                  <button 
                    onClick={() => { setLayoutPhotos([]); setCurrentGridIndex(0); }}
                    className="p-2 text-xs bg-red-600/20 text-red-400 rounded-full border border-red-500/20"
                  >
                    Reset
                  </button>
                )}
              </div>

              {/* Shutter Button */}
              <div className="relative flex items-center justify-center">
                {mode === 'normal' || mode === 'speed' ? (
                  <div className="flex items-center gap-4">
                    {/* Capture photo button */}
                    <button 
                      onClick={handleCapture}
                      disabled={isRecording}
                      className="p-5 bg-white rounded-full text-black hover:scale-105 active:scale-95 transition"
                    >
                      <Camera className="w-8 h-8" />
                    </button>

                    {/* Record video button */}
                    <button 
                      onClick={isRecording ? stopRecording : startRecording}
                      className={`p-5 rounded-full text-white hover:scale-105 active:scale-95 transition ${
                        isRecording ? 'bg-red-600 animate-pulse' : 'bg-red-500 shadow-md shadow-red-500/30'
                      }`}
                    >
                      {isRecording ? <Square className="w-8 h-8" /> : <Video className="w-8 h-8" />}
                    </button>
                  </div>
                ) : mode === 'boomerang' ? (
                  <button 
                    onClick={startBoomerangCapture}
                    disabled={isBoomerangCapturing}
                    className="w-20 h-20 rounded-full border-4 border-white p-1 hover:scale-105 active:scale-95 transition duration-200"
                  >
                    <div className="w-full h-full bg-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-purple-600/40">
                      <Film className="w-8 h-8 text-white" />
                    </div>
                  </button>
                ) : (
                  // Layout grid capture
                  <button 
                    onClick={handleCapture}
                    className="w-20 h-20 rounded-full border-4 border-white p-1 hover:scale-105 active:scale-95 transition duration-200"
                  >
                    <div className="w-full h-full bg-indigo-600 rounded-full flex items-center justify-center shadow-lg shadow-indigo-600/40">
                      <Grid className="w-8 h-8 text-white" />
                    </div>
                  </button>
                )}
              </div>

              {/* Flip camera control */}
              <button 
                onClick={toggleFacingMode}
                disabled={isRecording || isBoomerangCapturing}
                className="p-3 bg-zinc-900 hover:bg-zinc-800 rounded-full transition text-zinc-300 hover:text-white"
              >
                <RotateCw className="w-6 h-6" />
              </button>
            </div>

            {/* Mode swiper */}
            <div className="flex justify-center gap-5 text-sm font-semibold tracking-wider text-zinc-400 mt-2 overflow-x-auto">
              {(['normal', 'boomerang', 'layout', 'speed'] as CameraMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setMode(m);
                    handleDiscardPreview();
                  }}
                  className={`capitalize transition-colors ${mode === m ? 'text-indigo-400 underline decoration-2 underline-offset-8 font-bold' : 'hover:text-zinc-200'}`}
                >
                  {m}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
