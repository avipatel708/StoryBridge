import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from './Button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionText,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center p-8 rounded-2xl bg-slate-50 dark:bg-[#1E293B]/20 border border-slate-200/60 dark:border-slate-800/40 backdrop-blur-sm',
        className
      )}
    >
      <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 mb-4 flex items-center justify-center">
        {Icon ? (
          <Icon className="h-8 w-8" />
        ) : (
          <svg
            className="h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0V9a2 2 0 00-2-2H6a2 2 0 00-2 2v4.5m12-4l-3 3m0 0l-3-3m3 3V10"
            />
          </svg>
        )}
      </div>
      <h3 className="text-xl font-bold font-outfit text-slate-900 dark:text-[#F8FAFC] mb-2">
        {title}
      </h3>
      <p className="text-slate-500 dark:text-slate-400 max-w-sm text-sm sm:text-base mb-6 leading-relaxed">
        {description}
      </p>
      {actionText && onAction && (
        <Button onClick={onAction} variant="outline" size="sm">
          {actionText}
        </Button>
      )}
    </div>
  );
}
