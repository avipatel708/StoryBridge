import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circle' | 'rectangle' | 'card';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  className,
  variant = 'rectangle',
  width,
  height,
}: SkeletonProps) {
  const styles: React.CSSProperties = {
    width: width !== undefined ? width : undefined,
    height: height !== undefined ? height : undefined,
  };

  const variants = {
    text: 'h-3.5 w-full rounded-md',
    circle: 'rounded-full aspect-square',
    rectangle: 'rounded-xl',
    card: 'rounded-2xl h-[280px]',
  };

  return (
    <div
      style={styles}
      className={cn(
        'animate-pulse bg-slate-800/60 border border-slate-800/10',
        variants[variant],
        className
      )}
    />
  );
}
