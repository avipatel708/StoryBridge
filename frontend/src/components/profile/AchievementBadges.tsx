import React, { useEffect } from 'react';
import { Award, Lock, Sparkles } from 'lucide-react';
import { useBadges, BADGE_DETAILS } from '@/hooks/useBadges';
import { useAuthStore } from '@/stores/authStore';

interface AchievementBadgesProps {
  userId: string;
}

export function AchievementBadges({ userId }: AchievementBadgesProps) {
  const currentUser = useAuthStore((state) => state.user);
  const isOwner = currentUser?.id === userId;
  const { useUserBadges, checkAndAwardBadges } = useBadges(userId);
  const { data: earnedBadges, isLoading } = useUserBadges();

  // Run dynamic achievement check on load for profile owner
  useEffect(() => {
    if (isOwner) {
      checkAndAwardBadges();
    }
  }, [isOwner, userId]);

  if (isLoading) {
    return <div className="text-center py-4 text-xs text-slate-400">Loading achievements...</div>;
  }

  const earnedTypes = new Set(earnedBadges?.map((b) => b.badge_type) || []);

  return (
    <div className="flex flex-col gap-5 w-full text-left">
      <div className="flex items-center gap-2 border-b border-slate-200/50 dark:border-slate-800/60 pb-3">
        <Award className="h-5 w-5 text-indigo-500" />
        <h3 className="text-base font-bold font-outfit text-slate-900 dark:text-slate-100">
          Achievements & Badges
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {(Object.keys(BADGE_DETAILS) as Array<keyof typeof BADGE_DETAILS>).map((type) => {
          const badge = BADGE_DETAILS[type];
          const isEarned = earnedTypes.has(type);

          return (
            <div
              key={type}
              className={`relative flex items-start gap-3.5 p-4 rounded-2xl border transition-all duration-300 ${
                isEarned
                  ? 'border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-slate-950/20 shadow-sm hover:shadow-md'
                  : 'border-slate-100 dark:border-slate-850 bg-slate-50/40 dark:bg-slate-950/5 opacity-60'
              }`}
            >
              {/* Badge Icon / Emoji with Gradient Circle */}
              <div
                className={`h-11 w-11 rounded-xl flex items-center justify-center text-lg shadow-sm flex-shrink-0 border ${
                  isEarned
                    ? `bg-gradient-to-br ${badge.color} text-white border-white/10`
                    : 'bg-slate-200 dark:bg-slate-900 text-slate-400 dark:text-slate-700 border-transparent'
                }`}
              >
                {isEarned ? (
                  <span>{badge.emoji}</span>
                ) : (
                  <Lock className="h-4.5 w-4.5 text-slate-400 dark:text-slate-650" />
                )}
              </div>

              {/* Descriptions */}
              <div className="min-w-0 flex-1">
                <h4
                  className={`text-xs font-bold font-outfit ${
                    isEarned ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {badge.label}
                </h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-450 mt-1 leading-normal font-sans">
                  {badge.desc}
                </p>
                
                {isEarned && (
                  <span className="inline-flex items-center gap-0.5 text-[8px] font-bold text-emerald-500 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full mt-2 font-mono uppercase tracking-wide">
                    Earned
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
