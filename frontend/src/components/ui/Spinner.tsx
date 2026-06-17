import React from 'react';
import { cn } from '@/lib/utils';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'primary' | 'secondary' | 'accent' | 'muted' | 'white';
  className?: string;
}

export function Spinner({ size = 'md', variant = 'primary', className }: SpinnerProps) {
  const sizes = {
    sm: 'h-4 w-4 stroke-[3px]',
    md: 'h-6 w-6 stroke-[3px]',
    lg: 'h-8 w-8 stroke-[2px]',
    xl: 'h-12 w-12 stroke-[2px]',
  };

  const variants = {
    primary: 'text-indigo-500',
    secondary: 'text-purple-500',
    accent: 'text-pink-500',
    muted: 'text-slate-500',
    white: 'text-white',
  };

  return (
    <svg
      className={cn('animate-spin', variants[variant], sizes[size], className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}
