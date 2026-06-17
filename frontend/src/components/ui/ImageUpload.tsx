import React, { useState, useRef } from 'react';
import { UploadCloud, X, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

interface ImageUploadProps {
  value?: string | File | null;
  onChange: (file: File | null) => void;
  onPreviewClear?: () => void;
  maxSize?: number; // In bytes
  aspectRatio?: 'square' | 'video' | 'any';
  label?: string;
  className?: string;
  accept?: string; // e.g. 'image/*,video/*' for stories
}

export function ImageUpload({
  value,
  onChange,
  onPreviewClear,
  maxSize = 10 * 1024 * 1024, // 10MB default
  aspectRatio = 'any',
  label,
  className,
  accept = 'image/*',
}: ImageUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    typeof value === 'string' ? value : null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync value if it is a File or an external string
  React.useEffect(() => {
    if (value instanceof File) {
      const url = URL.createObjectURL(value);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else if (typeof value === 'string') {
      setPreviewUrl(value);
    } else {
      setPreviewUrl(null);
    }
  }, [value]);

  const processFile = (file: File) => {
    const acceptsVideo = accept.includes('video');
    const acceptsImage = accept.includes('image');

    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    const imageExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'heic', 'heif', 'jfif'];
    const videoExtensions = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv', 'quicktime'];

    const isImage = file.type.startsWith('image/') || imageExtensions.includes(extension);
    const isVideo = file.type.startsWith('video/') || videoExtensions.includes(extension);

    if (!((acceptsImage && isImage) || (acceptsVideo && isVideo))) {
      alert(acceptsVideo ? 'Only image or video files are allowed!' : 'Only image files are allowed!');
      return;
    }
    if (file.size > maxSize) {
      const sizeMb = (maxSize / (1024 * 1024)).toFixed(0);
      alert(`File is too large! Maximum size allowed is ${sizeMb}MB.`);
      return;
    }
    onChange(file);
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
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (onPreviewClear) {
      onPreviewClear();
    }
  };

  const aspectRatios = {
    square: 'aspect-square',
    video: 'aspect-video',
    any: 'min-h-[200px]',
  };

  return (
    <div className={cn('flex flex-col gap-1.5 w-full', className)}>
      {label && <label className="text-sm font-semibold text-slate-300 font-outfit">{label}</label>}

      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'relative w-full rounded-2xl border-2 border-dashed border-slate-700/80 bg-[#1E293B]/20 hover:bg-[#1E293B]/40 hover:border-indigo-500/80 transition-all duration-200 cursor-pointer overflow-hidden flex items-center justify-center p-4',
          aspectRatios[aspectRatio],
          isDragOver && 'border-indigo-500 bg-indigo-950/10 scale-[0.99]'
        )}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept={accept}
          className="hidden"
        />

        {previewUrl ? (
          <div className="relative w-full h-full min-h-[160px] flex items-center justify-center group">
            <img
              src={previewUrl}
              alt="Upload preview"
              className="w-full max-h-[350px] object-contain rounded-xl"
            />
            {/* Dark Hover overlay with actions */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200 rounded-xl">
              <Button
                onClick={clearFile}
                variant="danger"
                size="sm"
                leftIcon={<X className="h-4 w-4" />}
              >
                Remove
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-6 select-none pointer-events-none">
            <div className="p-3 rounded-full bg-slate-800/80 text-slate-400 mb-3 border border-slate-700/50">
              <UploadCloud className="h-7 w-7" />
            </div>
            <p className="text-sm font-medium text-slate-200 font-outfit mb-1">
              Drag & drop your image, or <span className="text-indigo-400">browse</span>
            </p>
            <p className="text-xs text-slate-500">
              Supports JPEG, PNG, WEBP, GIF up to {(maxSize / (1024 * 1024)).toFixed(0)}MB
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
