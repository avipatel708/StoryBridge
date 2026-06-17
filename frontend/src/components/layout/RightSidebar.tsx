import React from 'react';
import { Link } from 'react-router';
import { UserPlus, TrendingUp } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useProfile } from '@/hooks/useProfile';
import { useAuthStore } from '@/stores/authStore';
import { getAvatarUrl } from '@/lib/utils';

export function RightSidebar() {
  const currentUser = useAuthStore((state) => state.user);
  const { useSuggestedUsers, toggleFollow } = useProfile();
  const { data: suggestions, isLoading: suggestionsLoading } = useSuggestedUsers(5);

  const trendingTopics = [
    { tag: '#SharedMemories', posts: '4.2K stories' },
    { tag: '#Belonging', posts: '2.8K stories' },
    { tag: '#StartupLife', posts: '1.9K stories' },
    { tag: '#DailyBridge', posts: '950 shares' },
  ];

  return (
    <aside className="w-[320px] flex-shrink-0 hidden xl:flex flex-col gap-6 sticky top-8 self-start max-h-[calc(100vh-4rem)] overflow-hidden">
      
      {/* 1. Suggested Users to Connect */}
      {currentUser && (
        <Card variant="glass" padding="md" className="flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-2">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Who to connect with
            </h3>
          </div>

          {suggestionsLoading ? (
            <div className="flex justify-center py-6">
              <Spinner size="sm" />
            </div>
          ) : suggestions && suggestions.length > 0 ? (
            <div className="flex flex-col gap-3.5">
              {suggestions.map((user) => (
                <div key={user.id} className="flex items-center justify-between gap-3">
                  <Link
                    to={`/profile/${user.username}`}
                    className="flex items-center gap-3 min-w-0"
                  >
                    <Avatar
                      src={getAvatarUrl(user.avatar_url)}
                      name={user.full_name || user.username}
                      size="sm"
                      className="border border-slate-100 dark:border-slate-850"
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-[#6366F1] dark:hover:text-[#8B5CF6] truncate">
                        {user.full_name || user.username}
                      </span>
                      <span className="text-[10px] text-slate-450 dark:text-slate-500 truncate">
                        @{user.username}
                      </span>
                    </div>
                  </Link>

                  <Button
                    onClick={() =>
                      toggleFollow.mutate({
                        targetId: user.id,
                        isFollowing: false,
                      })
                    }
                    variant="outline"
                    className="h-8 rounded-lg text-[10px] font-bold px-3 border-slate-200 dark:border-slate-850 text-slate-550 dark:text-slate-350 hover:bg-[#6C63FF]/5 hover:text-[#6C63FF] hover:border-[#6C63FF]/40"
                    disabled={toggleFollow.isPending}
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    <span>Connect</span>
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-450 dark:text-slate-500 py-3 text-center">
              No suggestions nearby
            </p>
          )}
        </Card>
      )}

      {/* 2. Trending hashtags and topics */}
      <Card variant="glass" padding="md" className="flex flex-col gap-4">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-2">
          <TrendingUp className="h-4 w-4 text-[#6C63FF] dark:text-[#A855F7]" />
          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Trending stories
          </h3>
        </div>

        <div className="flex flex-col gap-3">
          {trendingTopics.map((topic) => (
            <div
              key={topic.tag}
              className="flex flex-col hover:bg-slate-50 dark:hover:bg-slate-850/40 p-2 rounded-xl transition-all cursor-pointer border border-transparent hover:border-slate-150 dark:hover:border-slate-800/65"
            >
              <span className="text-xs font-bold text-[#6C63FF] dark:text-[#A855F7] hover:text-[#A855F7] dark:hover:text-[#6C63FF]">
                {topic.tag}
              </span>
              <span className="text-[10px] text-slate-450 dark:text-slate-500 mt-0.5">
                {topic.posts}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Footer Branding Info */}
      <footer className="px-2 text-[10px] text-slate-400 dark:text-slate-600 font-bold uppercase tracking-widest leading-relaxed select-none">
        <div className="flex flex-wrap gap-x-3 gap-y-1.5 mb-2">
          <a href="#" className="hover:text-slate-650 dark:hover:text-slate-350">About</a>
          <a href="#" className="hover:text-slate-650 dark:hover:text-slate-350">Privacy</a>
          <a href="#" className="hover:text-slate-650 dark:hover:text-slate-350">Terms</a>
        </div>
        <p>© 2026 StoryBridge</p>
      </footer>
    </aside>
  );
}
