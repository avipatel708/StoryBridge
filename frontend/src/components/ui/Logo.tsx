import React from 'react';
import { cn } from '@/lib/utils';

interface LogoProps {
  variant?: 'full' | 'icon' | 'text';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function Logo({ variant = 'full', size = 'md', className }: LogoProps) {
  const sizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-4xl',
  };

  const iconSizes = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10',
    xl: 'h-12 w-12',
  };

  return (
    <div className={cn('flex items-center gap-2.5 select-none font-outfit tracking-tight', className)}>
      {variant !== 'text' && (
        <svg
          className={cn(iconSizes[size])}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Path 1: Upper curve flowing down-left */}
          <path
            d="M75 25 C65 15, 35 20, 30 45 C25 70, 55 85, 75 75"
            stroke="url(#flow-grad-1)"
            strokeWidth="8"
            strokeLinecap="round"
            fill="none"
            opacity="0.9"
          />
          {/* Path 2: Lower curve flowing up-right, completing the S shape */}
          <path
            d="M25 75 C35 85, 65 80, 70 55 C75 30, 45 15, 25 25"
            stroke="url(#flow-grad-2)"
            strokeWidth="8"
            strokeLinecap="round"
            fill="none"
            opacity="0.95"
          />

          {/* Connected intersection nodes representing people */}
          <circle cx="50" cy="50" r="5" fill="#8B5CF6" className="shadow-md" />

          {/* Gradients */}
          <defs>
            <linearGradient id="flow-grad-1" x1="75" y1="20" x2="30" y2="75" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#6366F1" />
              <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>
            <linearGradient id="flow-grad-2" x1="25" y1="80" x2="70" y2="25" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#EC4899" />
              <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>
          </defs>
        </svg>
      )}

      {variant !== 'icon' && (
        <span className={cn('font-bold text-slate-900 dark:text-slate-100', sizes[size])}>
          Story<span className="font-light text-slate-500 dark:text-slate-400">Bridge</span>
        </span>
      )}
    </div>
  );
}
