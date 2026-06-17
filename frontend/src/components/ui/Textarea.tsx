import React from 'react';
import { cn } from '@/lib/utils';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  containerClassName?: string;
  showCharacterCount?: boolean;
  maxLength?: number;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, containerClassName, showCharacterCount, maxLength, disabled, value, onChange, ...props }, ref) => {
    const currentLength = typeof value === 'string' ? value.length : 0;

    return (
      <div className={cn('flex flex-col gap-1.5 w-full', containerClassName)}>
        <div className="flex justify-between items-center">
          {label && (
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 font-outfit select-none">
              {label}
            </label>
          )}
          {showCharacterCount && maxLength && (
            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
              {currentLength} / {maxLength}
            </span>
          )}
        </div>
        <div className="relative">
          <textarea
            ref={ref}
            disabled={disabled}
            maxLength={maxLength}
            value={value}
            onChange={onChange}
            className={cn(
              'w-full bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/8 text-slate-800 dark:text-[#F8FAFC] border border-slate-200 dark:border-white/10 focus:border-[#6C63FF] rounded-xl px-4 py-3 text-base placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/20 transition-all duration-200 min-h-[100px] resize-y disabled:opacity-50 disabled:pointer-events-none',
              error && 'border-rose-500/70 focus:border-rose-500 focus:ring-rose-500/10',
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <span className="text-sm font-medium text-rose-500 dark:text-rose-455 select-none animate-fade-in">
            {error}
          </span>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
