import React from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', label, error, leftIcon, rightIcon, containerClassName, disabled, ...props }, ref) => {
    return (
      <div className={cn('flex flex-col gap-1.5 w-full', containerClassName)}>
        {label && (
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 font-outfit select-none">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 text-slate-400 pointer-events-none select-none flex items-center justify-center">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            type={type}
            disabled={disabled}
            className={cn(
              'w-full bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/8 text-slate-800 dark:text-[#F8FAFC] border border-slate-200 dark:border-white/10 focus:border-[#6C63FF] rounded-xl px-4 py-3 text-base placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/20 transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none',
              leftIcon ? 'pl-11' : false,
              rightIcon ? 'pr-11' : false,
              error ? 'border-rose-500/70 focus:border-rose-500 focus:ring-rose-500/10' : false,
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3.5 text-slate-400 flex items-center justify-center">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <span className="text-sm font-medium text-rose-500 dark:text-rose-400 select-none animate-fade-in">
            {error}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
