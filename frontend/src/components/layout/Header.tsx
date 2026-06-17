import React from 'react';
import { useNavigate, Link } from 'react-router';
import { Bell, Search, PlusCircle, MessageSquare, LogOut } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { useNotifications } from '@/hooks/useNotifications';
import { getAvatarUrl } from '@/lib/utils';
import { useAuth } from '@/app/providers/AuthProvider';

export function Header() {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const { signOut } = useAuth();
  const { setCreatePostOpen, searchQuery, setSearchQuery, setSearchOpen } = useUIStore();
  const { useNotificationsList } = useNotifications();
  const { data: notifications } = useNotificationsList();

  const unreadCount = notifications?.filter((n) => !n.is_read).length || 0;

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate('/explore');
    } else {
      setSearchOpen(true);
    }
  };

  const handleSearchFocus = () => {
    setSearchOpen(true);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/85 dark:bg-[#121829]/80 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800/60 py-3.5 px-4 sm:px-6 md:px-8 shadow-sm dark:shadow-none transition-colors duration-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/feed">
          <Logo size="md" />
        </Link>

        {/* Global Search Bar */}
        <form
          onSubmit={handleSearchSubmit}
          className="hidden sm:flex items-center flex-1 max-w-md relative"
        >
          <Search className="absolute left-3.5 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
          <input
            type="search"
            placeholder="Search stories, people, communities..."
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={handleSearchFocus}
            className="w-full bg-slate-50 dark:bg-[#1A2338]/60 text-slate-800 dark:text-[#F8FAFC] border border-slate-200 dark:border-slate-800/80 focus:border-[#6366F1]/60 focus:ring-2 focus:ring-[#6366F1]/5 rounded-xl pl-11 pr-4 py-2 text-xs placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none transition-all duration-200"
          />
        </form>

        {/* Navigation Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-4">
          <Button
            onClick={() => setCreatePostOpen(true)}
            variant="primary"
            size="sm"
            className="hidden sm:inline-flex rounded-xl text-xs font-bold bg-[#6366F1] hover:bg-[#6366F1]/95 text-white border-none px-4 py-2.5 shadow-md shadow-indigo-600/10"
            leftIcon={<PlusCircle className="h-4.5 w-4.5" />}
          >
            Create Post
          </Button>

          {/* Quick Chat Link */}
          <Link
            to="/messages"
            className="relative p-2 text-slate-500 dark:text-slate-400 hover:text-[#6366F1] rounded-xl hover:bg-slate-50 dark:hover:bg-slate-850/50 transition-all"
          >
            <MessageSquare className="h-5.5 w-5.5" />
          </Link>

          {/* Quick Notifications Link */}
          <Link
            to="/notifications"
            className="relative p-2 text-slate-500 dark:text-slate-400 hover:text-[#6366F1] rounded-xl hover:bg-slate-50 dark:hover:bg-slate-850/50 transition-all"
          >
            <Bell className="h-5.5 w-5.5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#EC4899] animate-pulse" />
            )}
          </Link>

          {/* Desktop User Avatar Profile Link */}
          {profile && (
            <Link to={`/profile/${profile.username}`} className="ml-1 flex-shrink-0">
              <Avatar
                src={getAvatarUrl(profile.avatar_url)}
                name={profile.full_name || profile.username}
                size="sm"
                className="border border-slate-100 dark:border-slate-850"
              />
            </Link>
          )}

          {/* Logout Button (Mobile/Quick) */}
          <button
            onClick={() => {
              signOut();
              navigate('/login');
            }}
            className="sm:hidden p-2 text-slate-500 hover:text-[#EC4899] rounded-xl hover:bg-slate-55 transition-colors cursor-pointer"
          >
            <LogOut className="h-5.5 w-5.5" />
          </button>
        </div>
      </div>
    </header>
  );
}
