import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Type, Edit3, Smile, Filter, Music, ArrowRight, 
  Trash2, Undo, Circle, RotateCcw, Check, Sparkles,
  Send, ChevronDown, Palette
} from 'lucide-react';
import { Button } from '../ui/Button';
import { StickersDrawer } from './StickersDrawer';
import { MusicPicker } from '../ui/MusicPicker';
import { AudioTrack } from '../../lib/musicLibrary';

/* ─── Countdown Sticker (unchanged logic) ─── */
const CountdownSticker: React.FC<{ title: string; targetDate: string }> = ({ title, targetDate }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTime = () => {
      if (!targetDate) return;
      const targetMs = Date.parse(targetDate.replace(' ', 'T'));
      if (isNaN(targetMs)) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      const difference = targetMs - Date.now();
      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return (
    <div className="p-3 bg-zinc-950/90 border border-zinc-800 rounded-2xl text-white w-48 shadow-2xl flex flex-col items-center gap-1.5 select-none">
      <p className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 text-center truncate w-full">{title || 'Countdown'}</p>
      <div className="grid grid-cols-4 gap-1 w-full text-center">
        <div className="bg-zinc-900/80 p-1.5 rounded-lg">
          <div className="text-xs font-black">{timeLeft.days}</div>
          <div className="text-[6px] text-zinc-500 uppercase font-bold">Days</div>
        </div>
        <div className="bg-zinc-900/80 p-1.5 rounded-lg">
          <div className="text-xs font-black">{timeLeft.hours}</div>
          <div className="text-[6px] text-zinc-500 uppercase font-bold">Hours</div>
        </div>
        <div className="bg-zinc-900/80 p-1.5 rounded-lg">
          <div className="text-xs font-black">{timeLeft.minutes}</div>
          <div className="text-[6px] text-zinc-500 uppercase font-bold">Mins</div>
        </div>
        <div className="bg-zinc-900/80 p-1.5 rounded-lg">
          <div className="text-xs font-black">{timeLeft.seconds}</div>
          <div className="text-[6px] text-zinc-500 uppercase font-bold">Secs</div>
        </div>
      </div>
    </div>
  );
};

/* ─── Types ─── */
interface StoryEditorProps {
  mediaUrl: string;
  mediaType?: 'image' | 'video';
  originalFile?: File | null;
  onPublish: (finalMedia: string | File | Blob, stickers: any[], audioTrackId?: string, audioStartTime?: number) => void;
  onCancel: () => void;
}

interface TextOverlay {
  id: string;
  text: string;
  color: string;
  background: string;
  font: string;
  fontSize: number;
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

interface StorySticker {
  id: string;
  type: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  data: any;
}

type FilterType = 'normal' | 'vintage' | 'warm' | 'cool' | 'grayscale' | 'cinematic' | 'sketch' | 'blur';
type BrushType = 'pencil' | 'marker' | 'neon' | 'highlighter' | 'eraser';

/* ─── Shared spring configs ─── */
const springPop = { type: 'spring' as const, damping: 20, stiffness: 300 };
const springSmooth = { type: 'spring' as const, damping: 28, stiffness: 200 };

/* ─── Tool button sub-component ─── */
const ToolBtn: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
  gradient?: string;
}> = ({ icon, label, onClick, active, gradient }) => (
  <motion.button
    whileHover={{ scale: 1.12 }}
    whileTap={{ scale: 0.9 }}
    onClick={onClick}
    className="relative group flex flex-col items-center gap-1 cursor-pointer outline-none"
  >
    <div
      className={`
        relative p-3 rounded-2xl transition-all duration-300 
        ${active
          ? 'bg-white/25 shadow-lg shadow-white/10 ring-2 ring-white/30'
          : 'bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/[0.06]'
        }
      `}
      style={gradient && active ? { background: gradient } : undefined}
    >
      {icon}
    </div>
    <span className="text-[9px] font-bold text-white/70 tracking-wider uppercase group-hover:text-white transition-colors">
      {label}
    </span>
  </motion.button>
);

/* ─────────────────────────────────────────────────────────────── */
/*                      STORY EDITOR COMPONENT                    */
/* ─────────────────────────────────────────────────────────────── */
export const StoryEditor: React.FC<StoryEditorProps> = ({
  mediaUrl,
  mediaType = 'image',
  originalFile,
  onPublish,
  onCancel
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Tools & UI Views
  const [activeTool, setActiveTool] = useState<'none' | 'text' | 'draw' | 'sticker' | 'filter' | 'music'>('none');
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('normal');

  // Text state
  const [texts, setTexts] = useState<TextOverlay[]>([]);
  const [currentText, setCurrentText] = useState('');
  const [textColor, setTextColor] = useState('#ffffff');
  const [textBackground, setTextBackground] = useState('transparent');
  const [textFont, setTextFont] = useState('Classic');
  const [textFontSize, setTextFontSize] = useState(24);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);

  // Stickers state
  const [stickers, setStickers] = useState<StorySticker[]>([]);
  const [activeMusicTrack, setActiveMusicTrack] = useState<AudioTrack | null>(null);
  const [musicStartTime, setMusicStartTime] = useState(0);

  // Drawing state
  const [brushColor, setBrushColor] = useState('#e11d48');
  const [brushSize, setBrushSize] = useState(6);
  const [brushType, setBrushType] = useState<BrushType>('pencil');
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawHistory, setDrawHistory] = useState<string[]>([]);

  // Dragging interaction state
  const [draggingItem, setDraggingItem] = useState<{ id: string; type: 'text' | 'sticker' } | null>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  // Load canvas setup for drawing
  useEffect(() => {
    if (activeTool === 'draw') {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Clear canvas or draw existing history
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
        }
      }
    }
  }, [activeTool]);

  // Drawing mouse handlers
  const handleDrawStart = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    
    // Support touch / mouse
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);

    // Apply brush style details
    ctx.strokeStyle = brushType === 'eraser' ? '#000000' : brushColor;
    ctx.lineWidth = brushSize;

    if (brushType === 'neon') {
      ctx.shadowBlur = 12;
      ctx.shadowColor = brushColor;
    } else {
      ctx.shadowBlur = 0;
    }

    if (brushType === 'highlighter') {
      ctx.globalAlpha = 0.4;
    } else {
      ctx.globalAlpha = 1.0;
    }

    if (brushType === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
    } else {
      ctx.globalCompositeOperation = 'source-over';
    }
  };

  const handleDrawMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handleDrawEnd = () => {
    setIsDrawing(false);
    // Save to history
    const canvas = canvasRef.current;
    if (canvas) {
      const newHistory = [...drawHistory, canvas.toDataURL()];
      setDrawHistory(newHistory);
    }
  };

  const undoLastDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const newHistory = [...drawHistory];
    newHistory.pop();
    setDrawHistory(newHistory);

    if (newHistory.length > 0) {
      const img = new Image();
      img.src = newHistory[newHistory.length - 1];
      img.onload = () => {
        ctx.globalCompositeOperation = 'source-over';
        ctx.drawImage(img, 0, 0);
      };
    }
  };

  // Dragging logic for texts and stickers
  const handleDragStart = (id: string, type: 'text' | 'sticker', e: React.MouseEvent) => {
    e.preventDefault();
    setDraggingItem({ id, type });
    
    const item = type === 'text' ? texts.find(t => t.id === id) : stickers.find(s => s.id === id);
    if (item) {
      dragOffsetRef.current = {
        x: e.clientX - item.x,
        y: e.clientY - item.y
      };
    }
  };

  const handleTouchDragStart = (id: string, type: 'text' | 'sticker', e: React.TouchEvent) => {
    const touch = e.touches[0];
    setDraggingItem({ id, type });
    
    const item = type === 'text' ? texts.find(t => t.id === id) : stickers.find(s => s.id === id);
    if (item) {
      dragOffsetRef.current = {
        x: touch.clientX - item.x,
        y: touch.clientY - item.y
      };
    }
  };

  const handleGlobalMouseMove = (e: MouseEvent) => {
    if (!draggingItem) return;
    
    const newX = e.clientX - dragOffsetRef.current.x;
    const newY = e.clientY - dragOffsetRef.current.y;

    if (draggingItem.type === 'text') {
      setTexts(prev => prev.map(t => t.id === draggingItem.id ? { ...t, x: newX, y: newY } : t));
    } else {
      setStickers(prev => prev.map(s => s.id === draggingItem.id ? { ...s, x: newX, y: newY } : s));
    }
  };

  const handleGlobalTouchMove = (e: TouchEvent) => {
    if (!draggingItem) return;
    if (e.cancelable) {
      e.preventDefault();
    }
    const touch = e.touches[0];
    const newX = touch.clientX - dragOffsetRef.current.x;
    const newY = touch.clientY - dragOffsetRef.current.y;

    if (draggingItem.type === 'text') {
      setTexts(prev => prev.map(t => t.id === draggingItem.id ? { ...t, x: newX, y: newY } : t));
    } else {
      setStickers(prev => prev.map(s => s.id === draggingItem.id ? { ...s, x: newX, y: newY } : s));
    }
  };

  const handleGlobalMouseUp = () => {
    setDraggingItem(null);
  };

  const handleGlobalTouchEnd = () => {
    setDraggingItem(null);
  };

  useEffect(() => {
    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });
    window.addEventListener('touchend', handleGlobalTouchEnd);
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('touchmove', handleGlobalTouchMove);
      window.removeEventListener('touchend', handleGlobalTouchEnd);
    };
  }, [draggingItem]);

  // Add/Edit Text blocks
  const handleSaveText = () => {
    if (!currentText.trim()) return;

    if (editingTextId) {
      // Update
      setTexts(prev => prev.map(t => t.id === editingTextId ? {
        ...t,
        text: currentText,
        color: textColor,
        background: textBackground,
        font: textFont,
        fontSize: textFontSize
      } : t));
      setEditingTextId(null);
    } else {
      // Create new
      const newText: TextOverlay = {
        id: `text-${Date.now()}`,
        text: currentText,
        color: textColor,
        background: textBackground,
        font: textFont,
        fontSize: textFontSize,
        x: 100,
        y: 200,
        scale: 1,
        rotation: 0
      };
      setTexts(prev => [...prev, newText]);
    }

    setCurrentText('');
    setActiveTool('none');
  };

  const startEditText = (textObj: TextOverlay) => {
    setEditingTextId(textObj.id);
    setCurrentText(textObj.text);
    setTextColor(textObj.color);
    setTextBackground(textObj.background);
    setTextFont(textObj.font);
    setTextFontSize(textObj.fontSize);
    setActiveTool('text');
  };

  const deleteText = (id: string) => {
    setTexts(prev => prev.filter(t => t.id !== id));
  };

  const deleteSticker = (id: string) => {
    setStickers(prev => prev.filter(s => s.id !== id));
  };

  // Composite and Export final story
  const handlePublishClick = () => {
    if (mediaType === 'video') {
      const finalStickers = [...stickers];

      // Export drawing layer as a sticker if drawing history exists
      if (canvasRef.current && drawHistory.length > 0) {
        const drawingDataUrl = canvasRef.current.toDataURL('image/png');
        finalStickers.push({
          id: `drawing-${Date.now()}`,
          type: 'drawing',
          x: 190, // center of the 380px wide container
          y: 335, // center of the 670px high container
          scale: 1,
          rotation: 0,
          data: {
            url: drawingDataUrl
          }
        });
      }

      // Export texts as text stickers
      texts.forEach((textObj) => {
        finalStickers.push({
          id: textObj.id,
          type: 'text',
          x: textObj.x,
          y: textObj.y,
          scale: textObj.scale,
          rotation: textObj.rotation,
          data: {
            text: textObj.text,
            color: textObj.color,
            background: textObj.background,
            font: textObj.font,
            fontSize: textObj.fontSize
          }
        });
      });

      onPublish(originalFile || mediaUrl, finalStickers, activeMusicTrack?.id, musicStartTime);
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = mediaUrl;
    img.onload = () => {
      // Ensure all custom web fonts are fully loaded before rendering to canvas
      document.fonts.ready.then(() => {
        // Setup canvas size
        canvas.width = img.naturalWidth || 1080;
        canvas.height = img.naturalHeight || 1920;

        // Draw background media with filters applied
        ctx.save();
        applyFilterToContext(ctx, selectedFilter);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        ctx.restore();

        // Draw client drawing canvas layer
        const drawingCanvas = canvasRef.current;
        if (drawingCanvas) {
          ctx.drawImage(drawingCanvas, 0, 0, canvas.width, canvas.height);
        }

        // Draw all text overlays onto the final image
        texts.forEach((textObj) => {
          ctx.save();
          
          // Map editor coordinates (relative screen size) to natural image coordinates
          const scaleX = canvas.width / (containerRef.current?.clientWidth || 1);
          const scaleY = canvas.height / (containerRef.current?.clientHeight || 1);

          const targetX = textObj.x * scaleX;
          const targetY = textObj.y * scaleY;

          ctx.translate(targetX, targetY);
          ctx.rotate((textObj.rotation * Math.PI) / 180);

          const fontSizeScaled = textObj.fontSize * scaleX;
          ctx.font = `${fontSizeScaled}px ${
            textObj.font === 'Classic' ? 'Inter, sans-serif' : 
            textObj.font === 'Serif' ? '"Playfair Display", Georgia, serif' : 
            textObj.font === 'Handwriting' ? '"Dancing Script", cursive' : 
            textObj.font === 'Neon' ? 'Monoton, sans-serif' : 'Arial'
          }`;
          
          // Add neon glow shadow if needed
          if (textObj.font === 'Neon') {
            ctx.shadowColor = textObj.color;
            ctx.shadowBlur = 20 * scaleX;
          } else {
            ctx.shadowBlur = 0;
          }
          
          // Draw text background
          if (textObj.background !== 'transparent') {
            ctx.fillStyle = textObj.background;
            const textWidth = ctx.measureText(textObj.text).width;
            ctx.fillRect(-10, -fontSizeScaled, textWidth + 20, fontSizeScaled + 12);
          }

          ctx.fillStyle = textObj.color;
          ctx.fillText(textObj.text, 0, 0);
          ctx.restore();
        });

        // Export composite base64 DataUrl
        const finalMedia = canvas.toDataURL('image/jpeg', 0.9);
        onPublish(finalMedia, stickers, activeMusicTrack?.id, musicStartTime);
      });
    };
  };

  // Simple canvas context pixel filtering
  const applyFilterToContext = (ctx: CanvasRenderingContext2D, filter: FilterType) => {
    switch (filter) {
      case 'vintage':
        ctx.filter = 'sepia(0.6) contrast(1.1) brightness(0.9)';
        break;
      case 'warm':
        ctx.filter = 'saturate(1.2) sepia(0.2)';
        break;
      case 'cool':
        ctx.filter = 'hue-rotate(20deg) saturate(1.1)';
        break;
      case 'grayscale':
        ctx.filter = 'grayscale(1)';
        break;
      case 'cinematic':
        ctx.filter = 'contrast(1.2) saturate(0.8)';
        break;
      case 'blur':
        ctx.filter = 'blur(2px)';
        break;
      default:
        ctx.filter = 'none';
    }
  };

  // Get CSS filter string for editor preview
  const getFilterStyle = (): string => {
    switch (selectedFilter) {
      case 'vintage': return 'sepia(0.6) contrast(1.1) brightness(0.9)';
      case 'warm': return 'saturate(1.2) sepia(0.2)';
      case 'cool': return 'hue-rotate(20deg) saturate(1.1)';
      case 'grayscale': return 'grayscale(1)';
      case 'cinematic': return 'contrast(1.2) saturate(0.8)';
      case 'blur': return 'blur(2px)';
      default: return 'none';
    }
  };

  // Font family resolver
  const getFontFamily = (font: string): string => {
    switch (font) {
      case 'Classic': return 'Inter, sans-serif';
      case 'Serif': return '"Playfair Display", Georgia, serif';
      case 'Handwriting': return '"Dancing Script", cursive';
      case 'Neon': return '"Monoton", sans-serif';
      default: return 'sans-serif';
    }
  };

  /* ═══════════════════════════════════════════════════════════════ */
  /*                           R E N D E R                          */
  /* ═══════════════════════════════════════════════════════════════ */
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black text-white overflow-hidden select-none"
    >
      {/* ── Immersive ambient blurred background ── */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden select-none">
        {mediaType === 'image' ? (
          <img 
            src={mediaUrl} 
            alt="" 
            className="w-full h-full object-cover blur-[60px] scale-125 saturate-150 opacity-40" 
          />
        ) : (
          <video 
            src={mediaUrl} 
            autoPlay 
            loop 
            muted 
            className="w-full h-full object-cover blur-[60px] scale-125 saturate-150 opacity-40" 
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black/90" />
        {/* Decorative gradient orbs */}
        <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-purple-600/15 blur-[100px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-indigo-500/10 blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* ── Phone-frame / Canvas container ── */}
      <motion.div 
        ref={containerRef}
        initial={{ scale: 0.92, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        transition={springSmooth}
        className="relative z-10 w-full h-full md:aspect-[9/16] md:h-[92vh] md:max-h-[900px] md:w-auto md:max-w-[420px] md:rounded-[44px] md:border md:border-white/[0.08] md:shadow-[0_30px_80px_-10px_rgba(0,0,0,0.9)] md:ring-1 md:ring-white/[0.04] bg-black flex items-center justify-center overflow-hidden"
      >
        {/* Main Background Image / Video with filters */}
        {mediaType === 'image' ? (
          <img 
            src={mediaUrl} 
            alt="Base" 
            style={{ filter: getFilterStyle() }}
            className="w-full h-full object-cover select-none pointer-events-none" 
          />
        ) : (
          <video 
            src={mediaUrl} 
            autoPlay 
            loop 
            muted 
            style={{ filter: getFilterStyle() }}
            className="w-full h-full object-cover select-none pointer-events-none" 
          />
        )}

        {/* Subtle vignette overlay for premium feel */}
        <div className="absolute inset-0 z-[5] pointer-events-none" style={{
          background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.35) 100%)'
        }} />

        {/* Client side drawing canvas */}
        <canvas
          ref={canvasRef}
          width={450}
          height={800}
          onMouseDown={handleDrawStart}
          onMouseMove={handleDrawMove}
          onMouseUp={handleDrawEnd}
          onTouchStart={handleDrawStart}
          onTouchMove={handleDrawMove}
          onTouchEnd={handleDrawEnd}
          className={`absolute inset-0 w-full h-full z-20 ${
            activeTool === 'draw' ? 'cursor-crosshair pointer-events-auto' : 'pointer-events-none'
          }`}
        />

        {/* ── Text and Sticker Elements layer ── */}
        <div className="absolute inset-0 z-30 pointer-events-none">
          {/* Dynamic texts overlay */}
          {texts.map((textObj) => (
            <motion.div
              key={textObj.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={springPop}
              style={{ 
                left: textObj.x, 
                top: textObj.y, 
                color: textObj.color, 
                backgroundColor: textObj.background,
                fontFamily: getFontFamily(textObj.font),
                textShadow: textObj.font === 'Neon' ? `0 0 10px ${textObj.color}, 0 0 20px ${textObj.color}` : '1px 2px 4px rgba(0,0,0,0.4)',
                fontSize: `${textObj.fontSize}px`
              }}
              onMouseDown={(e) => handleDragStart(textObj.id, 'text', e)}
              onTouchStart={(e) => handleTouchDragStart(textObj.id, 'text', e)}
              className="absolute pointer-events-auto cursor-grab px-4 py-2 rounded-2xl whitespace-nowrap select-none flex items-center gap-2.5 bg-black/30 backdrop-blur-md border border-white/10 hover:border-white/30 shadow-xl hover:shadow-2xl transition-all duration-200 group"
            >
              <span onClick={() => startEditText(textObj)} className="cursor-pointer font-bold">{textObj.text}</span>
              <motion.button 
                whileTap={{ scale: 0.8 }}
                onClick={(e) => { e.stopPropagation(); deleteText(textObj.id); }}
                className="hidden group-hover:flex p-1.5 bg-red-500/80 hover:bg-red-500 rounded-full text-white cursor-pointer transition-all backdrop-blur-sm"
              >
                <Trash2 className="w-3 h-3" />
              </motion.button>
            </motion.div>
          ))}

          {/* Dynamic stickers overlay */}
          {stickers.map((stk) => (
            <motion.div
              key={stk.id}
              initial={{ scale: 0, rotate: -15, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={springPop}
              style={{ left: stk.x, top: stk.y }}
              onMouseDown={(e) => handleDragStart(stk.id, 'sticker', e)}
              onTouchStart={(e) => handleTouchDragStart(stk.id, 'sticker', e)}
              className="absolute pointer-events-auto cursor-grab select-none p-2 border border-transparent hover:border-white/20 hover:bg-black/30 rounded-2xl group transition-all duration-200 backdrop-blur-sm"
            >
              {/* Render sticker layouts based on type */}
              {stk.type === 'location' && (
                <div className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full text-xs font-bold shadow-xl border border-white/10">
                  <span>📍</span> {stk.data.name}
                </div>
              )}
              {stk.type === 'mention' && (
                <div className="px-4 py-2 bg-white text-indigo-900 rounded-full text-xs font-black shadow-xl border border-indigo-100/20">
                  @{stk.data.username}
                </div>
              )}
              {stk.type === 'hashtag' && (
                <div className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-full text-xs font-black shadow-xl border border-white/10">
                  #{stk.data.tag}
                </div>
              )}
              {stk.type === 'poll' && (
                <div className="p-4 bg-zinc-950/90 border border-white/10 text-white rounded-3xl w-48 shadow-2xl flex flex-col items-center gap-3 backdrop-blur-md">
                  <p className="text-xs font-extrabold text-center text-zinc-300 leading-snug">{stk.data.question}</p>
                  <div className="grid grid-cols-2 gap-2 w-full">
                    <div className="p-2.5 bg-indigo-600/90 border border-white/10 rounded-xl text-center text-xs font-black tracking-wide">{stk.data.options[0]}</div>
                    <div className="p-2.5 bg-zinc-800 border border-white/5 rounded-xl text-center text-xs font-black tracking-wide text-zinc-300">{stk.data.options[1]}</div>
                  </div>
                </div>
              )}
              {stk.type === 'quiz' && (
                <div className="p-4 bg-indigo-950/90 border border-indigo-900/60 text-white rounded-3xl w-52 shadow-2xl space-y-3 backdrop-blur-md">
                  <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-3 py-1 rounded-lg text-[9px] uppercase font-black tracking-widest w-max shadow-md border border-white/10">QUIZ</div>
                  <p className="text-xs font-bold leading-normal">{stk.data.question}</p>
                  <div className="space-y-2">
                    {stk.data.options.map((opt: string, i: number) => (
                      <div key={i} className="p-2.5 bg-indigo-900/40 rounded-xl text-xs font-bold border border-indigo-800/30">
                        {opt}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {stk.type === 'link' && (
                <div className="flex items-center gap-1.5 px-4 py-2 bg-white text-cyan-600 rounded-full text-xs font-black shadow-xl border border-cyan-100">
                  <span>🔗</span> {stk.data.text}
                </div>
              )}
              {stk.type === 'countdown' && (
                <CountdownSticker title={stk.data.title} targetDate={stk.data.date} />
              )}
              {stk.type === 'weather' && (
                <div className="flex items-center gap-2 p-3 bg-black/60 backdrop-blur-md rounded-2xl font-black shadow-xl text-base border border-white/10">
                  <span>{stk.data.icon}</span> {stk.data.temp}°F
                </div>
              )}
              {stk.type === 'gif' && (
                <img src={stk.data.url} alt="GIF" className="w-24 h-24 object-contain rounded-lg" />
              )}

              <motion.button 
                whileTap={{ scale: 0.8 }}
                onClick={(e) => { e.stopPropagation(); deleteSticker(stk.id); }}
                className="absolute -top-2.5 -right-2.5 hidden group-hover:flex p-1.5 bg-red-500 rounded-full text-white cursor-pointer shadow-lg hover:bg-red-600 transition backdrop-blur-sm ring-2 ring-black/30"
              >
                <Trash2 className="w-3 h-3" />
              </motion.button>
            </motion.div>
          ))}

          {/* Music track preview chip — floating pill at top */}
          <AnimatePresence>
            {activeMusicTrack && (
              <motion.div 
                initial={{ y: -60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -60, opacity: 0 }}
                transition={springPop}
                className="absolute top-20 left-4 right-4 pointer-events-auto"
              >
                <div className="p-3 bg-black/50 backdrop-blur-2xl border border-white/[0.08] rounded-2xl flex items-center gap-3 shadow-2xl">
                  <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white shadow-lg">
                    <Music className="w-4 h-4 animate-bounce" style={{ animationDuration: '2s' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black truncate text-white">{activeMusicTrack.title}</p>
                    <p className="text-[10px] text-white/50 font-medium truncate">@{activeMusicTrack.artist}</p>
                  </div>
                  <motion.button 
                    whileTap={{ scale: 0.85 }}
                    onClick={() => setActiveMusicTrack(null)}
                    className="p-2 bg-white/10 hover:bg-white/20 text-white/60 hover:text-white rounded-xl transition cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ═══════════ FLOATING HEADER BAR ═══════════ */}
        <AnimatePresence>
          {activeTool === 'none' && (
            <motion.div 
              initial={{ y: -40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -40, opacity: 0 }}
              transition={springSmooth}
              className="absolute top-0 left-0 right-0 z-40 flex justify-between items-center px-5 pt-5 pb-10"
              style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 100%)' }}
            >
              {/* Close Button */}
              <motion.button 
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={onCancel} 
                className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/[0.06] backdrop-blur-2xl transition-all shadow-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </motion.button>

              {/* Header title pill */}
              <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-xl rounded-full border border-white/[0.06]">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-[11px] font-bold text-white/80 tracking-wide">Story Editor</span>
              </div>

              {/* Spacer to balance */}
              <div className="w-11" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══════════ FLOATING TOOLBAR — RIGHT SIDE ═══════════ */}
        <AnimatePresence>
          {activeTool === 'none' && (
            <motion.div 
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 50, opacity: 0 }}
              transition={springSmooth}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-4"
            >
              <ToolBtn
                icon={<Type className="w-5 h-5 text-white" />}
                label="Text"
                onClick={() => setActiveTool('text')}
              />
              <ToolBtn
                icon={<Edit3 className="w-5 h-5 text-white" />}
                label="Draw"
                onClick={() => setActiveTool('draw')}
              />
              <ToolBtn
                icon={<Smile className="w-5 h-5 text-white" />}
                label="Sticker"
                onClick={() => setActiveTool('sticker')}
              />
              <ToolBtn
                icon={<Filter className="w-5 h-5 text-white" />}
                label="Filter"
                onClick={() => setActiveTool('filter')}
              />
              <ToolBtn
                icon={<Music className="w-5 h-5 text-white" />}
                label="Music"
                onClick={() => setActiveTool('music')}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══════════ FLOATING BOTTOM ACTION BAR ═══════════ */}
        <AnimatePresence>
          {activeTool === 'none' && (
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              transition={springSmooth}
              className="absolute bottom-0 inset-x-0 z-40 px-5 pb-6 pt-16"
              style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)' }}
            >
              <div className="flex items-center gap-3">
                {/* Discard button */}
                <motion.button 
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={onCancel}
                  className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-xl text-white border border-white/[0.06] transition-all shadow-lg cursor-pointer hover:bg-red-500/20 group"
                  title="Discard Story"
                >
                  <Trash2 className="w-5 h-5 text-red-400 group-hover:text-red-300 transition-colors" />
                </motion.button>

                {/* Publish button — premium gradient with glow */}
                <motion.button 
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={handlePublishClick}
                  className="flex-1 relative overflow-hidden flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl font-extrabold text-sm tracking-wider text-white cursor-pointer"
                  style={{
                    background: 'linear-gradient(135deg, #6C63FF 0%, #A855F7 50%, #EC4899 100%)',
                    boxShadow: '0 12px 40px -8px rgba(108, 99, 255, 0.5), 0 4px 20px -4px rgba(168, 85, 247, 0.3)',
                  }}
                >
                  {/* Animated shimmer sweep */}
                  <div 
                    className="absolute inset-0 opacity-30"
                    style={{
                      background: 'linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.4) 50%, transparent 70%)',
                      backgroundSize: '200% 100%',
                      animation: 'shimmerSweep 3s ease-in-out infinite',
                    }}
                  />
                  <Send className="w-4 h-4 relative z-10" />
                  <span className="relative z-10">Share to Story</span>
                  <ArrowRight className="w-4 h-4 relative z-10 opacity-60" />
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══════════ DRAWING SETTINGS PANEL ═══════════ */}
        <AnimatePresence>
          {activeTool === 'draw' && (
            <>
              {/* Top Close & Undo */}
              <motion.div 
                initial={{ y: -30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -30, opacity: 0 }}
                transition={springSmooth}
                className="absolute top-5 inset-x-5 z-45 flex justify-between items-center"
              >
                {drawHistory.length > 0 && (
                  <motion.button 
                    whileTap={{ scale: 0.9 }}
                    onClick={undoLastDrawing} 
                    className="p-3 rounded-2xl bg-black/40 hover:bg-black/60 text-white border border-white/[0.06] backdrop-blur-xl transition-all shadow-md cursor-pointer"
                  >
                    <Undo className="w-5 h-5" />
                  </motion.button>
                )}
                <div className="flex-1" />
                <motion.button 
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setActiveTool('none')} 
                  className="p-3 rounded-2xl text-white shadow-lg transition-all cursor-pointer border border-white/10"
                  style={{ background: 'linear-gradient(135deg, #6C63FF, #A855F7)' }}
                >
                  <Check className="w-5 h-5" />
                </motion.button>
              </motion.div>

              {/* Bottom Config */}
              <motion.div 
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 40, opacity: 0 }}
                transition={springSmooth}
                className="absolute bottom-5 inset-x-5 z-45 bg-black/60 backdrop-blur-2xl border border-white/[0.08] p-5 rounded-3xl space-y-4 shadow-2xl"
              >
                {/* Brush Type Selection */}
                <div className="flex justify-between items-center gap-3">
                  <div className="flex gap-1 bg-white/5 p-1 rounded-2xl border border-white/[0.04] overflow-x-auto">
                    {(['pencil', 'marker', 'neon', 'highlighter', 'eraser'] as BrushType[]).map((type) => (
                      <button
                        key={type}
                        onClick={() => setBrushType(type)}
                        className={`px-3 py-2 text-[9px] uppercase tracking-wider rounded-xl font-bold transition-all cursor-pointer ${
                          brushType === type 
                            ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md' 
                            : 'text-white/40 hover:text-white/80 hover:bg-white/5'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                  
                  {/* Brush size range */}
                  <div className="flex items-center gap-2 flex-1 max-w-[100px]">
                    <span className="text-[9px] font-extrabold text-white/40 uppercase tracking-widest">Size</span>
                    <input 
                      type="range" 
                      min="2" 
                      max="24" 
                      value={brushSize} 
                      onChange={(e) => setBrushSize(parseInt(e.target.value))} 
                      className="accent-indigo-500 w-full cursor-pointer h-1 bg-zinc-800 rounded-lg appearance-none"
                    />
                  </div>
                </div>

                {/* Brush Color Swatches */}
                <div className="flex gap-2.5 overflow-x-auto py-1 custom-scrollbar">
                  {['#ffffff', '#000000', '#e11d48', '#ea580c', '#eab308', '#16a34a', '#2563eb', '#9333ea', '#db2777'].map((col) => (
                    <motion.button
                      key={col}
                      whileTap={{ scale: 0.85 }}
                      onClick={() => setBrushColor(col)}
                      className={`w-8 h-8 rounded-xl flex-shrink-0 border-2 transition-all cursor-pointer hover:scale-110 ${
                        brushColor === col ? 'border-white scale-110 ring-2 ring-indigo-400/60 shadow-lg' : 'border-white/10'
                      }`}
                      style={{ backgroundColor: col }}
                    />
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* ═══════════ TEXT OVERLAY EDITOR ═══════════ */}
        <AnimatePresence>
          {activeTool === 'text' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-2xl z-50 p-5 flex flex-col justify-between"
            >
              {/* Header Actions */}
              <div className="flex justify-between items-center">
                <motion.button 
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { setActiveTool('none'); setCurrentText(''); setEditingTextId(null); }}
                  className="px-4 py-2.5 text-xs font-bold text-white/50 hover:text-white transition cursor-pointer rounded-xl hover:bg-white/5"
                >
                  Cancel
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSaveText}
                  className="px-6 py-2.5 text-xs font-black rounded-2xl shadow-lg transition cursor-pointer text-white"
                  style={{ background: 'linear-gradient(135deg, #6C63FF, #A855F7)' }}
                >
                  Done
                </motion.button>
              </div>

              {/* Centered input */}
              <div className="flex-1 flex items-center justify-center px-4">
                <input
                  value={currentText}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrentText(e.target.value)}
                  placeholder="Start typing..."
                  className="bg-transparent border-0 text-3xl font-black text-center text-white focus:ring-0 py-3 w-full outline-none placeholder:text-white/15"
                  style={{
                    fontFamily: getFontFamily(textFont),
                    textShadow: textFont === 'Neon' ? `0 0 10px ${textColor}, 0 0 20px ${textColor}` : 'none',
                    color: textColor,
                    backgroundColor: textBackground
                  }}
                  autoFocus
                />
              </div>

              {/* Custom controls */}
              <div className="space-y-4">
                {/* Font selector pill buttons */}
                <div className="flex flex-wrap gap-2 justify-center">
                  {['Classic', 'Serif', 'Handwriting', 'Neon'].map((font) => (
                    <motion.button
                      key={font}
                      whileTap={{ scale: 0.92 }}
                      onClick={() => setTextFont(font)}
                      className={`px-4 py-2 text-xs rounded-2xl border transition-all cursor-pointer ${
                        textFont === font 
                          ? 'bg-white text-black font-extrabold border-white shadow-lg shadow-white/10' 
                          : 'border-white/10 text-white/60 bg-white/5 hover:bg-white/10 hover:text-white'
                      }`}
                      style={{ fontFamily: getFontFamily(font) }}
                    >
                      {font}
                    </motion.button>
                  ))}
                </div>

                {/* Background toggler & Colors */}
                <div className="flex justify-between items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/[0.04]">
                  <motion.button 
                    whileTap={{ scale: 0.92 }}
                    onClick={() => setTextBackground(textBackground === 'transparent' ? 'rgba(0,0,0,0.85)' : 'transparent')}
                    className={`px-4 py-2 text-[10px] font-extrabold uppercase rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
                      textBackground !== 'transparent' 
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-500 border-transparent text-white shadow-md' 
                        : 'border-white/10 text-white/50 hover:text-white'
                    }`}
                  >
                    <Palette className="w-3 h-3" />
                    Fill
                  </motion.button>

                  <div className="flex gap-2">
                    {['#ffffff', '#000000', '#f43f5e', '#3b82f6', '#10b981', '#eab308'].map((c) => (
                      <motion.button 
                        key={c} 
                        whileTap={{ scale: 0.85 }}
                        onClick={() => setTextColor(c)}
                        className={`w-7 h-7 rounded-xl border-2 transition-all cursor-pointer hover:scale-110 ${
                          textColor === c ? 'border-white ring-2 ring-indigo-400/50 shadow-md' : 'border-white/10'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══════════ FILTER SELECTION PANEL ═══════════ */}
        <AnimatePresence>
          {activeTool === 'filter' && (
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              transition={springSmooth}
              className="absolute bottom-5 inset-x-5 z-45 bg-black/60 backdrop-blur-2xl border border-white/[0.08] p-5 rounded-3xl space-y-4 shadow-2xl"
            >
              <div className="flex justify-between items-center px-1">
                <span className="text-[10px] font-extrabold uppercase text-white/40 tracking-widest flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-purple-400" />
                  Select Filter
                </span>
                <motion.button 
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setActiveTool('none')}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer transition"
                >
                  <Check className="w-4 h-4" />
                </motion.button>
              </div>
              <div className="flex gap-3 overflow-x-auto py-1 custom-scrollbar scrollbar-none">
                {(['normal', 'vintage', 'warm', 'cool', 'grayscale', 'cinematic', 'blur'] as FilterType[]).map((f) => (
                  <motion.button
                    key={f}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => setSelectedFilter(f)}
                    className={`flex flex-col items-center gap-2 p-2 rounded-2xl transition-all cursor-pointer flex-shrink-0 ${
                      selectedFilter === f 
                        ? 'bg-indigo-500/20 border border-indigo-400/50 ring-1 ring-indigo-400/20 shadow-lg' 
                        : 'hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <div className="w-14 h-20 rounded-xl bg-zinc-800 overflow-hidden relative border border-white/[0.06]">
                      {mediaType === 'image' ? (
                        <img 
                          src={mediaUrl} 
                          alt="" 
                          className="w-full h-full object-cover" 
                          style={{
                            filter: 
                              f === 'vintage' ? 'sepia(0.6) contrast(1.1) brightness(0.9)' :
                              f === 'warm' ? 'saturate(1.2) sepia(0.2)' :
                              f === 'cool' ? 'hue-rotate(20deg) saturate(1.1)' :
                              f === 'grayscale' ? 'grayscale(1)' :
                              f === 'cinematic' ? 'contrast(1.2) saturate(0.8)' :
                              f === 'blur' ? 'blur(2px)' : 'none'
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-zinc-900 flex items-center justify-center text-[8px] font-bold text-zinc-500">Video</div>
                      )}
                    </div>
                    <span className={`text-[9px] font-extrabold uppercase tracking-widest ${
                      selectedFilter === f ? 'text-indigo-300' : 'text-white/40'
                    }`}>{f}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══════════ STICKER DRAWER ═══════════ */}
        <AnimatePresence>
          {activeTool === 'sticker' && (
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute inset-x-0 bottom-0 h-[60vh] z-50 rounded-t-[32px] overflow-hidden"
            >
              <StickersDrawer 
                onAddSticker={(stk) => setStickers(prev => [...prev, stk])} 
                onClose={() => setActiveTool('none')} 
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══════════ MUSIC PICKER ═══════════ */}
        <AnimatePresence>
          {activeTool === 'music' && (
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute inset-x-0 bottom-0 h-[60vh] z-50 rounded-t-[32px] overflow-hidden"
            >
              <MusicPicker 
                onSelectTrack={(track, start) => {
                  setActiveMusicTrack(track);
                  setMusicStartTime(start);
                  setActiveTool('none');
                }} 
                onClose={() => setActiveTool('none')} 
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Shimmer keyframe injection ── */}
      <style>{`
        @keyframes shimmerSweep {
          0% { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
      `}</style>
    </motion.div>
  );
};
