import React from 'react';
import { NavLink } from 'react-router';
import { Home, Compass, PlusSquare, MessageSquare, User, Film } from 'lucide-react';
import { cn, getAvatarUrl } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { Avatar } from '../ui/Avatar';

export function MobileNav() {
  const { profile } = useAuthStore();
  const { setCreatePostOpen, toggleMessagesPanel } = useUIStore();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#121829]/95 backdrop-blur-lg border-t border-slate-200/60 dark:border-slate-800/60 px-4 py-2 flex items-center justify-around md:hidden transition-colors duration-300">
      <NavLink
        to="/feed"
        className={({ isActive }) =>
          cn('p-2 text-slate-400 dark:text-slate-500 flex flex-col items-center gap-0.5 transition-colors', isActive && 'text-[#6366F1] dark:text-[#8B5CF6]')
        }
      >
        <Home className="h-5.5 w-5.5" />
      </NavLink>

      <NavLink
        to="/explore"
        className={({ isActive }) =>
          cn('p-2 text-slate-400 dark:text-slate-500 flex flex-col items-center gap-0.5 transition-colors', isActive && 'text-[#6366F1] dark:text-[#8B5CF6]')
        }
      >
        <Compass className="h-5.5 w-5.5" />
      </NavLink>

      <NavLink
        to="/reels"
        className={({ isActive }) =>
          cn('p-2 text-slate-400 dark:text-slate-500 flex flex-col items-center gap-0.5 transition-colors', isActive && 'text-[#6366F1] dark:text-[#8B5CF6]')
        }
      >
        <Film className="h-5.5 w-5.5" />
      </NavLink>

      <NavLink
        to="/create"
        className={({ isActive }) =>
          cn(
            'p-2 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white flex flex-col items-center justify-center transition-colors',
            isActive && 'text-[#6366F1] dark:text-[#8B5CF6]'
          )
        }
      >
        <PlusSquare className="h-6 w-6" />
      </NavLink>

      <button
        type="button"
        onClick={toggleMessagesPanel}
        className="p-2 text-slate-400 dark:text-slate-500 hover:text-[#6366F1] flex flex-col items-center gap-0.5 transition-colors cursor-pointer"
      >
        <MessageSquare className="h-5.5 w-5.5" />
      </button>

      {profile ? (
        <NavLink
          to={`/profile/${profile.username}`}
          className={({ isActive }) =>
            cn(
              'p-1 flex flex-col items-center justify-center rounded-full border border-transparent',
              isActive && 'border-[#6366F1] dark:border-[#8B5CF6] bg-indigo-50 dark:bg-purple-950/20'
            )
          }
        >
          <Avatar
            src={getAvatarUrl(profile.avatar_url)}
            name={profile.full_name || profile.username}
            size="xs"
          />
        </NavLink>
      ) : (
        <NavLink
          to="/login"
          className={({ isActive }) =>
            cn('p-2 text-slate-400 dark:text-slate-500 flex flex-col items-center gap-0.5 transition-colors', isActive && 'text-[#6366F1] dark:text-[#8B5CF6]')
          }
        >
          <User className="h-5.5 w-5.5" />
        </NavLink>
      )}
    </nav>
  );
}
