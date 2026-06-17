import React, { useEffect, useRef } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  Home,
  Compass,
  Bell,
  MessageSquare,
  Bookmark,
  PlusSquare,
  Settings,
  LogOut,
  Search,
  User,
  PanelLeftOpen,
  PanelLeftClose,
  Layers,
  Users,
  Film,
} from 'lucide-react';
import { cn, getAvatarUrl } from '@/lib/utils';
import { Logo } from '@/components/ui/Logo';
import { Avatar } from '@/components/ui/Avatar';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/app/providers/AuthProvider';

export const SIDEBAR_COLLAPSED_WIDTH = 72;
export const SIDEBAR_EXPANDED_WIDTH = 260;

type NavItem = {
  label: string;
  to?: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  badge?: number;
  action?: 'messages' | 'create' | 'search';
};

export function LeftSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const sidebarRef = useRef<HTMLElement>(null);
  const { profile } = useAuthStore();
  const { signOut } = useAuth();
  const {
    sidebarOpen,
    sidebarPinned,
    setSidebarOpen,
    setSidebarPinned,
    toggleSidebar,
    setCreatePostOpen,
    toggleMessagesPanel,
    setSearchOpen,
  } = useUIStore();
  const { useNotificationsList } = useNotifications();
  const { data: notifications } = useNotificationsList();

  const unreadCount = notifications?.filter((n) => !n.is_read).length || 0;
  const expanded = sidebarOpen;

  const navItems: NavItem[] = [
    { label: 'Home', to: '/feed', icon: Home },
    { label: 'Explore', to: '/explore', icon: Compass },
    { label: 'Reels', to: '/reels', icon: Film },
    { label: 'Search', action: 'search', icon: Search },
    { label: 'Notifications', to: '/notifications', icon: Bell, badge: unreadCount || undefined },
    { label: 'Messages', action: 'messages', icon: MessageSquare },
    { label: 'Saved', to: '/saved', icon: Bookmark },
    { label: 'Capsules', to: '/capsules', icon: Layers },
    { label: 'Communities', to: '/communities', icon: Users },
    { label: 'Create', to: '/create', icon: PlusSquare },
    { label: 'Profile', to: profile ? `/profile/${profile.username}` : '/feed', icon: User },
    { label: 'Settings', to: '/settings', icon: Settings },
  ];

  const isActivePath = (to?: string) => {
    if (!to) return false;
    if (to === '/feed') return location.pathname === '/feed';
    return location.pathname.startsWith(to);
  };

  const handleItemClick = (item: NavItem) => {
    if (item.action === 'messages') {
      toggleMessagesPanel();
      return;
    }
    if (item.action === 'create') {
      setCreatePostOpen(true);
      return;
    }
    if (item.action === 'search') {
      setSearchOpen(true);
      return;
    }
    if (item.to) navigate(item.to);
  };

  // Tap outside expanded sidebar → collapse (unless pinned via toggle)
  useEffect(() => {
    if (!expanded || sidebarPinned) return;
    const onPointerDown = (e: PointerEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        setSidebarOpen(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [expanded, sidebarPinned, setSidebarOpen]);

  const navItemClass = (active: boolean) =>
    cn(
      'group relative flex items-center rounded-xl transition-all duration-200 w-full cursor-pointer',
      expanded ? 'gap-4 px-3.5 py-3' : 'justify-center p-3',
      active
        ? 'bg-gradient-to-r from-[#6C63FF]/15 to-[#A855F7]/10 dark:from-[#6C63FF]/20 dark:to-[#A855F7]/10 text-[#6C63FF] dark:text-[#A855F7] font-semibold'
        : 'hover:bg-slate-150/50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-350 hover:text-[#6C63FF] dark:hover:text-white'
    );

  return (
    <motion.aside
      ref={sidebarRef}
      initial={false}
      animate={{ width: expanded ? SIDEBAR_EXPANDED_WIDTH : SIDEBAR_COLLAPSED_WIDTH }}
      transition={{ type: 'spring', stiffness: 350, damping: 28 }}
      onMouseEnter={() => setSidebarOpen(true)}
      onMouseLeave={() => {
        if (!sidebarPinned) setSidebarOpen(false);
      }}
      onClick={() => {
        if (!expanded) setSidebarOpen(true);
      }}
      className={cn(
        'hidden md:flex fixed left-0 top-0 z-50 h-screen flex-col',
        'border-r border-slate-200/50 dark:border-white/8',
        'bg-white/75 dark:bg-[#0B1020]/75 backdrop-blur-[20px]',
        'shadow-[4px_0_24px_rgba(0,0,0,0.02)] dark:shadow-[4px_0_32px_rgba(0,0,0,0.25)]',
        'overflow-hidden py-5'
      )}
    >
      {/* Logo */}
      <NavLink
        to="/feed"
        className={cn(
          'flex-shrink-0 mb-6 hover:opacity-90 transition-opacity',
          expanded ? 'px-5' : 'flex justify-center px-2'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {expanded ? (
          <Logo size="md" />
        ) : (
          <Logo variant="icon" size="md" />
        )}
      </NavLink>

      {/* Nav */}
      <nav className="flex flex-col gap-1 flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar px-2">
        {navItems.map((item) => {
          const Icon = item.icon;

          if (item.to && !item.action) {
            return (
              <NavLink
                key={item.label}
                to={item.to}
                end={item.to === '/feed'}
                title={!expanded ? item.label : undefined}
                onClick={(e) => e.stopPropagation()}
                className={({ isActive: linkActive }) => navItemClass(linkActive || isActivePath(item.to))}
              >
                {({ isActive: linkActive }) => {
                  const active = linkActive || isActivePath(item.to);
                  return (
                    <>
                      {active && expanded && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-7 rounded-r-full bg-gradient-to-b from-[#6C63FF] to-[#A855F7]" />
                      )}
                      <div className="relative flex-shrink-0">
                        <Icon
                          className={cn(
                            'h-6 w-6 transition-all duration-200',
                            active
                              ? 'text-[#6C63FF] dark:text-[#A855F7]'
                              : 'text-slate-700 dark:text-slate-350',
                            !expanded && active && 'scale-110'
                          )}
                          strokeWidth={active ? 2.2 : 1.75}
                        />
                        {!expanded && item.badge !== undefined && item.badge > 0 && (
                          <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-[#EC4899] ring-2 ring-white dark:ring-[#0B1020]" />
                        )}
                      </div>
                      <AnimatePresence>
                        {expanded && (
                          <motion.span
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -8 }}
                            transition={{ duration: 0.15 }}
                            className={cn(
                              'text-[15px] font-outfit whitespace-nowrap',
                              active ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-700 dark:text-slate-350'
                            )}
                          >
                            {item.label}
                          </motion.span>
                        )}
                      </AnimatePresence>
                      {expanded && item.badge !== undefined && item.badge > 0 && (
                        <span className="ml-auto bg-[#EC4899] text-white text-[10px] font-bold rounded-full h-5 min-w-5 px-1.5 flex items-center justify-center">
                          {item.badge > 9 ? '9+' : item.badge}
                        </span>
                      )}
                    </>
                  );
                }}
              </NavLink>
            );
          }

          return (
            <button
              key={item.label}
              type="button"
              title={!expanded ? item.label : undefined}
              onClick={(e) => {
                e.stopPropagation();
                handleItemClick(item);
              }}
              className={navItemClass(false)}
            >
              <Icon
                className="h-6 w-6 flex-shrink-0 text-slate-700 dark:text-slate-300 group-hover:text-indigo-500 transition-colors"
                strokeWidth={1.75}
              />
              <AnimatePresence>
                {expanded && (
                  <motion.span
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    className="text-[15px] font-medium font-outfit text-slate-700 dark:text-slate-300 whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          );
        })}
      </nav>

      {/* Toggle + profile footer */}
      <div className="mt-auto pt-3 border-t border-slate-200/60 dark:border-slate-800/60 flex-shrink-0 px-2 space-y-1">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleSidebar();
          }}
          title={sidebarPinned ? 'Unpin sidebar' : 'Pin sidebar open'}
          className={cn(
            'flex items-center rounded-2xl w-full text-slate-500 hover:text-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 transition-all cursor-pointer',
            expanded ? 'gap-4 px-3 py-2.5' : 'justify-center p-3'
          )}
        >
          {expanded ? (
            <PanelLeftClose className="h-5 w-5 flex-shrink-0" />
          ) : (
            <PanelLeftOpen className="h-5 w-5 flex-shrink-0" />
          )}
          <AnimatePresence>
            {expanded && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm font-medium font-outfit whitespace-nowrap"
              >
                {sidebarPinned ? 'Pinned' : 'Pin open'}
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {profile && (
          <>
            <NavLink
              to={`/profile/${profile.username}`}
              title={!expanded ? profile.username : undefined}
              onClick={(e) => e.stopPropagation()}
              className={({ isActive }) =>
                cn(
                  navItemClass(isActive),
                  'mb-0'
                )
              }
            >
              <Avatar
                src={getAvatarUrl(profile.avatar_url)}
                name={profile.full_name || profile.username}
                size="sm"
                className="ring-2 ring-indigo-500/30 flex-shrink-0"
              />
              <AnimatePresence>
                {expanded && (
                  <motion.div
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    className="flex flex-col min-w-0"
                  >
                    <span className="text-xs font-bold truncate text-slate-800 dark:text-white">{profile.username}</span>
                    <span className="text-[10px] text-slate-500 truncate">{profile.full_name}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </NavLink>

            <button
              type="button"
              title={!expanded ? 'Log out' : undefined}
              onClick={(e) => {
                e.stopPropagation();
                signOut();
                navigate('/login');
              }}
              className={cn(
                'flex items-center rounded-2xl w-full text-slate-500 hover:text-rose-500 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 cursor-pointer transition-all',
                expanded ? 'gap-4 px-3 py-2.5' : 'justify-center p-3'
              )}
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
              <AnimatePresence>
                {expanded && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-sm font-medium whitespace-nowrap"
                  >
                    Log out
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </>
        )}
      </div>
    </motion.aside>
  );
}
