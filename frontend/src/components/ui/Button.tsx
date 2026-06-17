import React from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { Spinner } from './Spinner';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'danger' | 'outline' | 'light';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading = false, disabled, children, leftIcon, rightIcon, type = 'button', ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/50 active:scale-95 disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 cursor-pointer';

    const variants = {
      primary: 'bg-gradient-to-r from-[#6C63FF] to-[#A855F7] hover:brightness-110 text-white shadow-md shadow-[#6C63FF]/20 border-0',
      secondary: 'bg-gradient-to-r from-[#A855F7] to-[#EC4899] hover:brightness-110 text-white shadow-md shadow-[#A855F7]/20 border-0',
      accent: 'bg-gradient-to-r from-[#EC4899] to-rose-500 hover:brightness-110 text-white shadow-md shadow-[#EC4899]/20 border-0',
      ghost: 'hover:bg-slate-150/50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-350 hover:text-[#6C63FF] dark:hover:text-white',
      danger: 'bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/20',
      outline: 'border border-slate-200 dark:border-white/10 hover:border-slate-400 dark:hover:border-white/20 hover:bg-slate-50/50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 hover:text-[#6C63FF] dark:hover:text-white',
      light: 'bg-white hover:bg-slate-50 text-[#6C63FF] shadow-lg shadow-black/5 border-0',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm gap-1.5',
      md: 'px-5 py-2.5 text-base gap-2',
      lg: 'px-7 py-3.5 text-lg gap-2.5',
    };

    const isDisabled = disabled || isLoading;

    return (
      <motion.button
        ref={ref}
        type={type}
        disabled={isDisabled}
        whileHover={isDisabled ? undefined : { scale: 1.02 }}
        whileTap={isDisabled ? undefined : { scale: 0.98 }}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...(props as any)}
      >
        {isLoading && <Spinner size="sm" variant={variant === 'outline' || variant === 'ghost' || variant === 'light' ? 'primary' : 'white'} />}
        {!isLoading && leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
