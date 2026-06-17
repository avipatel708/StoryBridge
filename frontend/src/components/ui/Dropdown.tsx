import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

interface DropdownItem {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  variant?: 'default' | 'danger';
}

interface DropdownProps {
  trigger: React.ReactNode;
  items: (DropdownItem | 'divider')[];
  align?: 'left' | 'right';
  className?: string;
}

export function Dropdown({ trigger, items, align = 'right', className }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={cn('relative inline-block text-left', className)} ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {trigger}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -5 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'absolute mt-2 w-56 rounded-xl bg-white dark:bg-[#121829] border border-slate-200 dark:border-slate-800 shadow-2xl z-50 py-1.5 focus:outline-none overflow-hidden',
              align === 'right' ? 'right-0 origin-top-right' : 'left-0 origin-top-left'
            )}
          >
            {items.map((item, index) => {
              if (item === 'divider') {
                return <div key={`divider-${index}`} className="h-px bg-slate-100 dark:bg-slate-800/80 my-1" />;
              }

              const isDanger = item.variant === 'danger';

              return (
                <button
                  key={`item-${index}`}
                  onClick={() => {
                    item.onClick();
                    setIsOpen(false);
                  }}
                  className={cn(
                    'w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 transition-colors duration-150 cursor-pointer',
                    isDanger
                      ? 'text-rose-600 dark:text-rose-400 hover:text-rose-750 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/20'
                      : 'text-slate-650 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  )}
                >
                  {item.icon && <span className="text-slate-400 dark:text-slate-500 h-4 w-4 flex items-center justify-center flex-shrink-0">{item.icon}</span>}
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
