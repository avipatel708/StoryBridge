import React, { useState, useRef } from 'react';
import { Layers, Globe, Lock, Image as ImageIcon, X } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { useCapsules } from '@/hooks/useCapsules';

interface CreateCapsuleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateCapsuleModal({ isOpen, onClose }: CreateCapsuleModalProps) {
  const { createCapsule } = useCapsules();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeCoverImage = () => {
    setCoverFile(null);
    setCoverPreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    createCapsule.mutate(
      {
        title: title.trim(),
        description: description.trim(),
        isPublic,
        coverFile,
      },
      {
        onSuccess: () => {
          setTitle('');
          setDescription('');
          setIsPublic(true);
          setCoverFile(null);
          setCoverPreview('');
          onClose();
        },
      }
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Memory Capsule" size="md">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6 text-left">
        {/* Cover image picker */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
            Cover Image
          </label>
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageChange}
            accept="image/*"
            className="hidden"
          />

          {coverPreview ? (
            <div className="relative h-44 w-full rounded-2xl overflow-hidden group shadow-inner border border-slate-200/50 dark:border-slate-800/50">
              <img src={coverPreview} alt="Cover Preview" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={triggerFileInput}
                  className="p-2.5 rounded-full bg-white text-slate-900 hover:bg-slate-100 shadow transition-colors cursor-pointer text-xs font-bold"
                >
                  Change
                </button>
                <button
                  type="button"
                  onClick={removeCoverImage}
                  className="p-2.5 rounded-full bg-red-500 text-white hover:bg-red-600 shadow transition-colors cursor-pointer"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={triggerFileInput}
              className="h-44 w-full rounded-2xl border-2 border-dashed border-slate-200/60 dark:border-slate-800/80 hover:border-indigo-500/50 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-200 group"
            >
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-400 dark:text-slate-500 group-hover:text-indigo-500 group-hover:scale-105 transition-all duration-200">
                <ImageIcon className="h-6 w-6" />
              </div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                Upload Cover Photo
              </p>
              <p className="text-[10px] text-slate-400">
                Supports JPG, PNG, WEBP (Max 5MB)
              </p>
            </div>
          )}
        </div>

        {/* Title */}
        <div className="flex flex-col gap-2">
          <label htmlFor="capsule-title" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
            Capsule Title
          </label>
          <Input
            id="capsule-title"
            placeholder="e.g. Summer Travels 2026, College Reunions"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            disabled={createCapsule.isPending}
            className="rounded-xl border-slate-200 dark:border-slate-800 focus:border-indigo-500"
          />
        </div>

        {/* Description */}
        <div className="flex flex-col gap-2">
          <label htmlFor="capsule-desc" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
            Description
          </label>
          <Textarea
            id="capsule-desc"
            placeholder="A collection of special moments and unforgettable stories..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={createCapsule.isPending}
            className="rounded-xl border-slate-200 dark:border-slate-800 focus:border-indigo-500"
            rows={3}
          />
        </div>

        {/* Visibility Setting */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
            Visibility
          </label>
          
          <div className="grid grid-cols-2 gap-4">
            <div
              onClick={() => !createCapsule.isPending && setIsPublic(true)}
              className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                isPublic
                  ? 'border-indigo-500 bg-indigo-500/5 text-slate-900 dark:text-white'
                  : 'border-slate-200 dark:border-slate-800 bg-transparent text-slate-500'
              }`}
            >
              <div className={`p-2 rounded-lg ${isPublic ? 'bg-indigo-500/10 text-indigo-500' : 'bg-slate-100 dark:bg-slate-900 text-slate-400'}`}>
                <Globe className="h-4.5 w-4.5" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold leading-none">Public</p>
                <p className="text-[10px] text-slate-400 mt-1">Anyone can view</p>
              </div>
            </div>

            <div
              onClick={() => !createCapsule.isPending && setIsPublic(false)}
              className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                !isPublic
                  ? 'border-indigo-500 bg-indigo-500/5 text-slate-900 dark:text-white'
                  : 'border-slate-200 dark:border-slate-800 bg-transparent text-slate-500'
              }`}
            >
              <div className={`p-2 rounded-lg ${!isPublic ? 'bg-indigo-500/10 text-indigo-500' : 'bg-slate-100 dark:bg-slate-900 text-slate-400'}`}>
                <Lock className="h-4.5 w-4.5" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold leading-none">Private</p>
                <p className="text-[10px] text-slate-400 mt-1">Only you can view</p>
              </div>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3 mt-4 border-t border-slate-100 dark:border-slate-800/60 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={createCapsule.isPending}
            className="rounded-xl border-slate-200 dark:border-slate-800"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={createCapsule.isPending || !title.trim()}
            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/25 border-none font-bold px-6"
          >
            {createCapsule.isPending ? 'Creating...' : 'Create Capsule'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
