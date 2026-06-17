import React from 'react';
import { cn, getInitials } from '@/lib/utils';

interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  isOnline?: boolean;
  hasStory?: boolean;
  storySeen?: boolean;
  className?: string;
  onClick?: () => void;
}

export function Avatar({
  src,
  name = '?',
  size = 'md',
  isOnline = false,
  hasStory = false,
  storySeen = false,
  className,
  onClick,
}: AvatarProps) {
  const sizes = {
    xs: 'h-6 w-6 min-h-6 min-w-6 text-[10px]',
    sm: 'h-8 w-8 min-h-8 min-w-8 text-xs',
    md: 'h-10 w-10 min-h-10 min-w-10 text-sm',
    lg: 'h-14 w-14 min-h-14 min-w-14 text-lg',
    xl: 'h-20 w-20 min-h-20 min-w-20 text-2xl',
    '2xl': 'h-32 w-32 min-h-32 min-w-32 text-4xl',
  };

  const ringSizes = {
    xs: 'p-[1px]',
    sm: 'p-[1.5px]',
    md: 'p-[2px]',
    lg: 'p-[2.5px]',
    xl: 'p-[3px]',
    '2xl': 'p-[4px]',
  };

  const indicatorSizes = {
    xs: 'h-1.5 w-1.5 bottom-0 right-0 border-[1px]',
    sm: 'h-2.5 w-2.5 bottom-0 right-0 border-2',
    md: 'h-3 w-3 bottom-0 right-0 border-2',
    lg: 'h-3.5 w-3.5 bottom-0.5 right-0.5 border-2',
    xl: 'h-4.5 w-4.5 bottom-1 right-1 border-2',
    '2xl': 'h-6 w-6 bottom-2 right-2 border-[3px]',
  };

  const initials = getInitials(name);

  const avatarEl = (
    <div
      className={cn(
        'relative inline-flex flex-shrink-0 items-center justify-center rounded-full overflow-hidden',
        'bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-700 border border-slate-300/50 dark:border-slate-700/50 text-slate-600 dark:text-[#F8FAFC]',
        sizes[size],
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
    >
      {src ? (
        <img
          src={src}
          alt={name}
          className="absolute inset-0 h-full w-full max-h-full max-w-full object-cover"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      ) : (
        <span className="font-outfit uppercase leading-none select-none">{initials}</span>
      )}

      {isOnline && (
        <span
          className={cn(
            'absolute rounded-full bg-green-500 border-white dark:border-slate-900 z-10',
            indicatorSizes[size]
          )}
        />
      )}
    </div>
  );

  if (hasStory) {
    return (
      <div
        className={cn(
          'inline-flex flex-shrink-0 rounded-full items-center justify-center',
          ringSizes[size],
          storySeen
            ? 'bg-slate-300 dark:bg-slate-700'
            : 'bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500'
        )}
      >
        <div className="rounded-full bg-white dark:bg-[#0F172A] p-[2px]">{avatarEl}</div>
      </div>
    );
  }

  return avatarEl;
}
