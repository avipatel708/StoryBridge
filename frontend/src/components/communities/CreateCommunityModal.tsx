import React, { useState, useRef } from 'react';
import { Users, Globe, Lock, Image as ImageIcon, X } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { useCommunities } from '@/hooks/useCommunities';

interface CreateCommunityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES = [
  'General',
  'Photography',
  'Travel',
  'Design',
  'Technology',
  'Writing & Art',
  'Fitness & Health',
  'Food & Cooking',
  'Music & Movies',
];

export function CreateCommunityModal({ isOpen, onClose }: CreateCommunityModalProps) {
  const { createCommunity } = useCommunities();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('General');
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    createCommunity.mutate(
      {
        name: name.trim(),
        description: description.trim(),
        category,
        isPublic,
        coverFile,
      },
      {
        onSuccess: () => {
          setName('');
          setDescription('');
          setCategory('General');
          setIsPublic(true);
          setCoverFile(null);
          setCoverPreview('');
          onClose();
        },
      }
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Community" size="md">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5 text-left">
        {/* Cover Photo */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-widest">
            Community Cover
          </label>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageChange}
            accept="image/*"
            className="hidden"
          />

          {coverPreview ? (
            <div className="relative h-36 w-full rounded-2xl overflow-hidden group shadow-inner border border-slate-200/50 dark:border-slate-800/50">
              <img src={coverPreview} alt="Cover Preview" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
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
              onClick={() => fileInputRef.current?.click()}
              className="h-36 w-full rounded-2xl border border-dashed border-slate-205 dark:border-slate-800/80 hover:border-indigo-500/50 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-200 group"
            >
              <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-400 dark:text-slate-500 group-hover:text-indigo-500 transition-colors">
                <ImageIcon className="h-5.5 w-5.5" />
              </div>
              <p className="text-[11px] font-bold text-slate-500">Upload Cover Image</p>
            </div>
          )}
        </div>

        {/* Name */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="comm-name" className="text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-widest">
            Community Name
          </label>
          <Input
            id="comm-name"
            placeholder="e.g. Travel Photographers, Swifties"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={createCommunity.isPending}
            className="rounded-xl border-slate-200 dark:border-slate-800"
          />
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="comm-desc" className="text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-widest">
            Description
          </label>
          <Textarea
            id="comm-desc"
            placeholder="Introduce what this space is about..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={createCommunity.isPending}
            className="rounded-xl border-slate-200 dark:border-slate-800"
            rows={3}
          />
        </div>

        {/* Category & Visibility Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5 text-left">
            <label htmlFor="comm-cat" className="text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-widest">
              Category
            </label>
            <select
              id="comm-cat"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={createCommunity.isPending}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121829] px-3.5 py-2.5 text-xs focus:border-indigo-500 focus:outline-none text-slate-700 dark:text-slate-200 font-sans"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5 text-left">
            <label className="text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-widest">
              Visibility
            </label>
            <div className="flex rounded-xl border border-slate-200 dark:border-slate-800 p-1 bg-slate-50/50 dark:bg-slate-900/30">
              <button
                type="button"
                onClick={() => setIsPublic(true)}
                className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                  isPublic
                    ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm'
                    : 'text-slate-400'
                }`}
              >
                <Globe className="h-3 w-3" /> Public
              </button>
              <button
                type="button"
                onClick={() => setIsPublic(false)}
                className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                  !isPublic
                    ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm'
                    : 'text-slate-400'
                }`}
              >
                <Lock className="h-3 w-3" /> Private
              </button>
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-2.5 border-t border-slate-100 dark:border-slate-800/60 pt-4 mt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={createCommunity.isPending}
            className="rounded-xl border-slate-200 dark:border-slate-850"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={createCommunity.isPending || !name.trim()}
            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/10 font-bold border-none px-6"
          >
            {createCommunity.isPending ? 'Creating...' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
