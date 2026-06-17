import React from 'react';
import { useNavigate } from 'react-router';
import { Layers, Globe, Lock, Trash2 } from 'lucide-react';
import { StoryCapsule } from '@/types';
import { getCapsuleCoverUrl } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { useCapsules } from '@/hooks/useCapsules';

interface CapsuleCardProps {
  capsule: StoryCapsule;
}

export function CapsuleCard({ capsule }: CapsuleCardProps) {
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);
  const isOwner = currentUser?.id === capsule.user_id;
  const { deleteCapsule } = useCapsules();

  const handleCardClick = () => {
    navigate(`/capsules/${capsule.id}`);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this capsule? Content inside posts will not be deleted.')) {
      deleteCapsule.mutate(capsule.id);
    }
  };

  const coverUrl = getCapsuleCoverUrl(capsule.cover_url) || 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=500';

  return (
    <div
      onClick={handleCardClick}
      className="group relative h-72 w-full rounded-3xl overflow-hidden border border-slate-200/50 dark:border-slate-800/50 shadow-md hover:shadow-xl cursor-pointer transition-all duration-300 hover:-translate-y-1 bg-white dark:bg-[#121829]"
    >
      {/* Background Cover Image with Hover Zoom */}
      <div className="absolute inset-0 z-0 bg-slate-100 dark:bg-slate-900 overflow-hidden">
        <img
          src={coverUrl}
          alt={capsule.title}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
        />
        {/* Soft shadow gradients overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/40 to-transparent z-10" />
      </div>

      {/* RLS Status Badge (Public / Private) */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/65 backdrop-blur-md text-[10px] font-bold text-white border border-white/10">
        {capsule.is_public ? (
          <>
            <Globe className="h-3 w-3 text-cyan-400" />
            <span>PUBLIC</span>
          </>
        ) : (
          <>
            <Lock className="h-3 w-3 text-amber-400" />
            <span>PRIVATE</span>
          </>
        )}
      </div>

      {/* Trash/Delete Action */}
      {isOwner && (
        <button
          onClick={handleDelete}
          disabled={deleteCapsule.isPending}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-red-500/10 hover:bg-red-500/80 text-red-500 hover:text-white backdrop-blur-md border border-red-500/20 transition-all duration-200 cursor-pointer disabled:opacity-50"
          title="Delete Capsule"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}

      {/* Capsule Info Details at Bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-6 z-20 flex flex-col justify-end text-left">
        <div className="flex items-center gap-2 text-indigo-300 font-bold text-[10px] uppercase tracking-widest mb-1">
          <Layers className="h-3.5 w-3.5" />
          <span>{capsule.items_count || 0} Stories</span>
        </div>
        
        <h3 className="text-xl font-bold text-white font-outfit tracking-tight group-hover:text-indigo-200 transition-colors line-clamp-1">
          {capsule.title}
        </h3>

        {capsule.description && (
          <p className="text-xs text-slate-300 font-sans mt-1 line-clamp-2 leading-relaxed opacity-90">
            {capsule.description}
          </p>
        )}

        {/* Profile Owner Meta Indicator */}
        <div className="mt-4 flex items-center gap-2 border-t border-white/10 pt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="h-5 w-5 rounded-full overflow-hidden ring-1 ring-white/20">
            <img
              src={capsule.profiles?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=60'}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-[10px] text-slate-300 font-medium font-sans">
            Created by {capsule.profiles?.full_name || capsule.profiles?.username || 'User'}
          </span>
        </div>
      </div>
    </div>
  );
}
