import React from 'react';
import { Link } from 'react-router';
import { Bell, Heart, MessageCircle, UserPlus, CheckCheck, Trash2, ArrowRight } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { getAvatarUrl, formatDate } from '@/lib/utils';

export default function Notifications() {
  const { useNotificationsList, markAsRead, markAllAsRead } = useNotifications();
  const { data: notifications, isLoading, isError, refetch } = useNotificationsList();

  const handleMarkAllRead = () => {
    markAllAsRead.mutate();
  };

  const handleNotificationClick = (id: string, isRead: boolean) => {
    if (!isRead) {
      markAsRead.mutate(id);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="h-4 w-4 text-pink-500 fill-pink-500" />;
      case 'comment':
        return <MessageCircle className="h-4 w-4 text-indigo-400 fill-indigo-400/10" />;
      case 'follow':
        return <UserPlus className="h-4 w-4 text-purple-400" />;
      default:
        return <Bell className="h-4 w-4 text-slate-400" />;
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      {/* Header with actions */}
      <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800/60 pb-3 select-none">
        <div className="flex items-center gap-3">
          <Bell className="h-6 w-6 text-indigo-500 dark:text-indigo-400" />
          <h2 className="text-xl font-bold font-outfit text-slate-850 dark:text-slate-200">Notifications</h2>
        </div>

        {notifications && notifications.some((n) => !n.is_read) && (
          <Button
            onClick={handleMarkAllRead}
            variant="ghost"
            size="sm"
            className="text-slate-500 dark:text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 text-xs font-semibold px-3 py-1.5 flex items-center gap-1.5"
            isLoading={markAllAsRead.isPending}
          >
            <CheckCheck className="h-4 w-4" />
            <span>Mark all read</span>
          </Button>
        )}
      </div>

      {/* Notifications list */}
      <div className="flex flex-col gap-1">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : isError ? (
          <EmptyState
            title="Failed to load notifications"
            description="There was an error communicating with the notification server."
            actionText="Retry"
            onAction={refetch}
          />
        ) : notifications && notifications.length > 0 ? (
          <div className="flex flex-col gap-3">
            {notifications.map((notif) => (
              <Card
                key={notif.id}
                variant="glass"
                padding="sm"
                className={`border transition-all flex gap-4 items-start ${
                  notif.is_read
                    ? 'border-slate-200 dark:border-slate-850 bg-white/50 dark:bg-slate-900/10'
                    : 'border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/10 dark:bg-indigo-950/5 shadow-md shadow-indigo-100/5 dark:shadow-indigo-950/5'
                }`}
                onClick={() => handleNotificationClick(notif.id, notif.is_read)}
              >
                {/* Icon wrapper badge */}
                <div className="relative">
                  {notif.actor ? (
                    <Link to={`/profile/${notif.actor.username}`}>
                      <Avatar
                        src={getAvatarUrl(notif.actor.avatar_url)}
                        name={notif.actor.full_name || notif.actor.username}
                        size="md"
                        className="border border-slate-100 dark:border-slate-850"
                      />
                    </Link>
                  ) : (
                    <div className="h-10 w-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                      <Bell className="h-5 w-5" />
                    </div>
                  )}
                  <span className="absolute -bottom-1 -right-1 p-1 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center">
                    {getNotificationIcon(notif.type)}
                  </span>
                </div>

                {/* Content Message */}
                <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                  <div className="flex flex-col select-text">
                    <p className="text-sm font-medium text-slate-650 dark:text-slate-300 leading-relaxed">
                      {notif.actor && (
                        <Link
                          to={`/profile/${notif.actor.username}`}
                          className="font-bold text-slate-900 dark:text-slate-200 hover:text-[#6366F1] dark:hover:text-[#8B5CF6]"
                        >
                          {notif.actor.full_name || notif.actor.username}{' '}
                        </Link>
                      )}
                      {notif.message}
                    </p>
                    <span className="text-[10px] text-slate-450 dark:text-slate-500 font-semibold mt-1">
                      {formatDate(notif.created_at)}
                    </span>
                  </div>

                  {/* Actions to view post links */}
                  {notif.post_id && (
                    <Link
                      to={`/feed`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-500 dark:text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 self-start sm:self-center flex-shrink-0 cursor-pointer"
                    >
                      <span>View post</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  )}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No notifications yet"
            description="We'll let you know when other users comment, like, or start following your stories."
          />
        )}
      </div>
    </div>
  );
}
