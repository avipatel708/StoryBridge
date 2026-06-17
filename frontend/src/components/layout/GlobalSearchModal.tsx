import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, Compass } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { useProfile } from '@/hooks/useProfile';
import { useAuthStore } from '@/stores/authStore';
import { Avatar } from '@/components/ui/Avatar';
import { Spinner } from '@/components/ui/Spinner';
import { getAvatarUrl } from '@/lib/utils';

export function GlobalSearchModal() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const currentUser = useAuthStore((state) => state.user);
  const { searchOpen, setSearchOpen, searchQuery, setSearchQuery } = useUIStore();
  const { useSearchUsers } = useProfile();

  const [localQuery, setLocalQuery] = useState(searchQuery);
  const { data: results, isLoading } = useSearchUsers(localQuery);

  useEffect(() => {
    if (searchOpen) {
      setLocalQuery(searchQuery);
      const t = window.setTimeout(() => inputRef.current?.focus(), 50);
      return () => window.clearTimeout(t);
    }
  }, [searchOpen, searchQuery]);

  useEffect(() => {
    if (!searchOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSearchOpen(false);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [searchOpen, setSearchOpen]);

  const close = () => setSearchOpen(false);

  const goToProfile = (username: string) => {
    setSearchQuery(localQuery.trim());
    close();
    navigate(`/profile/${username}`);
  };

  const viewAllOnExplore = () => {
    const q = localQuery.trim();
    setSearchQuery(q);
    close();
    navigate('/explore');
  };

  const filteredResults = (results || []).filter((u) => u.id !== currentUser?.id);

  return createPortal(
    <AnimatePresence>
      {searchOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[190] bg-black/50 backdrop-blur-sm"
            onClick={close}
          />
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            className="fixed z-[195] left-1/2 top-[12vh] -translate-x-1/2 w-[min(560px,calc(100vw-2rem))] rounded-2xl overflow-hidden
              bg-white dark:bg-[#121829] border border-slate-200/80 dark:border-slate-800/80
              shadow-[0_24px_80px_rgba(0,0,0,0.25)]"
            onClick={(e) => e.stopPropagation()}
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (localQuery.trim()) viewAllOnExplore();
              }}
              className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200/70 dark:border-slate-800/70"
            >
              <Search className="h-5 w-5 text-slate-400 flex-shrink-0" />
              <input
                ref={inputRef}
                type="search"
                value={localQuery}
                onChange={(e) => setLocalQuery(e.target.value)}
                placeholder="Search people by name or username…"
                className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
                autoComplete="off"
                aria-label="Search users"
              />
              <button
                type="button"
                onClick={close}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                aria-label="Close search"
              >
                <X className="h-4 w-4" />
              </button>
            </form>

            <div className="max-h-[min(420px,50vh)] overflow-y-auto custom-scrollbar">
              {localQuery.trim().length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-slate-500">
                  Type a name or @username to find people
                </p>
              ) : isLoading ? (
                <div className="flex justify-center py-10">
                  <Spinner size="md" />
                </div>
              ) : filteredResults.length > 0 ? (
                <ul className="py-2">
                  {filteredResults.slice(0, 8).map((user) => (
                    <li key={user.id}>
                      <button
                        type="button"
                        onClick={() => goToProfile(user.username)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-indigo-50/70 dark:hover:bg-indigo-950/25 cursor-pointer text-left transition-colors"
                      >
                        <Avatar
                          src={getAvatarUrl(user.avatar_url)}
                          name={user.full_name || user.username}
                          size="md"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                            {user.full_name || user.username}
                          </p>
                          <p className="text-xs text-slate-500 truncate">@{user.username}</p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-4 py-8 text-center text-sm text-slate-500">
                  No people found for &ldquo;{localQuery.trim()}&rdquo;
                </p>
              )}
            </div>

            {localQuery.trim().length > 0 && (
              <button
                type="button"
                onClick={viewAllOnExplore}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 border-t border-slate-200/70 dark:border-slate-800/70 text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 cursor-pointer transition-colors"
              >
                <Compass className="h-4 w-4" />
                See all results on Explore
              </button>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}

export default GlobalSearchModal;
