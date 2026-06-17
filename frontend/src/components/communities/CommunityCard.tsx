import React from 'react';
import { useNavigate } from 'react-router';
import { Users, Globe, Lock, Check } from 'lucide-react';
import { Community } from '@/types';
import { getCommunityCoverUrl } from '@/lib/utils';
import { useCommunities } from '@/hooks/useCommunities';
import { Button } from '@/components/ui/Button';

interface CommunityCardProps {
  community: Community;
}

export function CommunityCard({ community }: CommunityCardProps) {
  const navigate = useNavigate();
  const { joinCommunity, leaveCommunity } = useCommunities();

  const handleCardClick = () => {
    navigate(`/communities/${community.slug}`);
  };

  const handleJoinToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (community.is_member) {
      if (confirm(`Are you sure you want to leave ${community.name}?`)) {
        leaveCommunity.mutate(community.id);
      }
    } else {
      joinCommunity.mutate(community.id);
    }
  };

  const coverUrl = getCommunityCoverUrl(community.cover_url) || 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=500';

  return (
    <div
      onClick={handleCardClick}
      className="group relative flex flex-col h-80 rounded-3xl overflow-hidden border border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-[#121829] shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 text-left cursor-pointer"
    >
      {/* Cover Image */}
      <div className="h-28 w-full bg-slate-100 dark:bg-slate-900 overflow-hidden relative">
        <img
          src={coverUrl}
          alt={community.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        
        {/* Category tag */}
        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/95 dark:bg-slate-900/90 text-[9px] font-bold text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-100 dark:border-slate-850">
          {community.category}
        </span>
      </div>

      {/* Main info */}
      <div className="flex-1 p-5 flex flex-col justify-between">
        <div className="flex flex-col gap-1.5">
          <h3 className="text-base font-bold text-slate-850 dark:text-slate-100 group-hover:text-indigo-500 transition-colors line-clamp-1">
            {community.name}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
            {community.description || 'No description provided.'}
          </p>
        </div>

        {/* Member meta & Join/Leave CTA */}
        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/60 pt-4 mt-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold font-sans">
            <Users className="h-4 w-4" />
            <span>{community.member_count} Members</span>
          </div>

          <Button
            onClick={handleJoinToggle}
            variant={community.is_member ? 'outline' : 'primary'}
            size="sm"
            className={`rounded-xl font-bold px-4 flex items-center gap-1 border-none ${
              community.is_member
                ? 'bg-slate-100 dark:bg-slate-850 text-slate-600 dark:text-slate-400 hover:bg-red-500/10 hover:text-red-500 transition-colors'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-600/10'
            }`}
            disabled={joinCommunity.isPending || leaveCommunity.isPending}
          >
            {community.is_member ? (
              <>
                <Check className="h-3 w-3" />
                <span>Joined</span>
              </>
            ) : (
              'Join'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
