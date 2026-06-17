import React from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'glass' | 'default' | 'flat';
  hoverable?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export function Card({
  className,
  variant = 'glass',
  hoverable = false,
  padding = 'md',
  children,
  ...props
}: CardProps) {
  const baseStyles = 'rounded-2xl transition-all duration-300 overflow-hidden';

  const variants = {
    glass: 'glass-card',
    default: 'bg-white/95 dark:bg-[#121829]/75 backdrop-blur-[15px] border border-slate-200/50 dark:border-slate-800/60 premium-shadow-md text-slate-800 dark:text-slate-100',
    flat: 'bg-slate-50 dark:bg-[#1E293B]/20 border border-slate-100 dark:border-slate-800/30 text-slate-700 dark:text-slate-350',
  };

  const paddings = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  if (hoverable) {
    return (
      <motion.div
        whileHover={{
          y: -4,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
          borderColor: 'rgba(99, 102, 241, 0.2)', // indigo glow
        }}
        className={cn(baseStyles, variants[variant], paddings[padding], className)}
        {...(props as any)}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={cn(baseStyles, variants[variant], paddings[padding], className)} {...props}>
      {children}
    </div>
  );
}
