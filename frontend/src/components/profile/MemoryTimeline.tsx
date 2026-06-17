import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Star,
  PenTool,
  Heart,
  Users,
  Trophy,
  Camera,
  Flag,
  Bookmark,
  Calendar,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { useMemoryTimeline } from '@/hooks/useMemoryTimeline';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';

interface MemoryTimelineProps {
  userId: string;
}

const ICON_MAP = {
  star: Star,
  pen: PenTool,
  heart: Heart,
  users: Users,
  trophy: Trophy,
  camera: Camera,
  milestone: Flag,
  custom: Bookmark,
};

const ICON_COLOR_MAP = {
  star: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  pen: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
  heart: 'bg-pink-500/10 text-pink-500 border-pink-500/20',
  users: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
  trophy: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  camera: 'bg-teal-500/10 text-teal-500 border-teal-500/20',
  milestone: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  custom: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
};

export function MemoryTimeline({ userId }: MemoryTimelineProps) {
  const currentUser = useAuthStore((state) => state.user);
  const isOwner = currentUser?.id === userId;
  const { useTimelineEvents, createTimelineEvent, deleteTimelineEvent } = useMemoryTimeline(userId);

  const { data: events, isLoading, isError } = useTimelineEvents();

  // Add event form state
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [iconType, setIconType] = useState<keyof typeof ICON_MAP>('star');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    createTimelineEvent.mutate(
      {
        title: title.trim(),
        description: description.trim(),
        eventDate: new Date(eventDate).toISOString(),
        iconType,
      },
      {
        onSuccess: () => {
          setTitle('');
          setDescription('');
          setEventDate(new Date().toISOString().split('T')[0]);
          setIconType('star');
          setIsAdding(false);
        },
      }
    );
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this milestone from your timeline?')) {
      deleteTimelineEvent.mutate(id);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full text-left">
      {/* Title & Action */}
      <div className="flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800/60 pb-3.5">
        <div>
          <h3 className="text-lg font-bold font-outfit text-slate-900 dark:text-slate-100">
            Memory Timeline
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            The chronological story of life milestones.
          </p>
        </div>

        {isOwner && !isAdding && (
          <Button
            onClick={() => setIsAdding(true)}
            variant="outline"
            size="sm"
            className="rounded-xl border-slate-200 dark:border-slate-800 font-bold flex items-center gap-1"
          >
            <Plus className="h-3.5 w-3.5" /> Add Milestone
          </Button>
        )}
      </div>

      {/* Add Milestone Form Inline */}
      {isAdding && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 rounded-2xl p-5 flex flex-col gap-4"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Add Timeline Milestone
            </h4>
            <button
              onClick={() => setIsAdding(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Milestone Title
                </label>
                <Input
                  placeholder="e.g. Started My First Job, Moved to Paris"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="rounded-xl border-slate-200 dark:border-slate-800 text-xs"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Date
                </label>
                <Input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  required
                  className="rounded-xl border-slate-200 dark:border-slate-800 text-xs"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Icon Representation
              </label>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(ICON_MAP) as Array<keyof typeof ICON_MAP>).map((type) => {
                  const SingleIcon = ICON_MAP[type];
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setIconType(type)}
                      className={`p-2.5 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                        iconType === type
                          ? 'border-indigo-500 bg-indigo-500/10 text-indigo-500 font-bold'
                          : 'border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 text-slate-400'
                      }`}
                      title={type}
                    >
                      <SingleIcon className="h-4 w-4" />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Milestone Description
              </label>
              <Textarea
                placeholder="Share a short note about this event..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="rounded-xl border-slate-200 dark:border-slate-800 text-xs"
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800/60 pt-3 mt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAdding(false)}
                className="rounded-xl border-slate-200 dark:border-slate-850"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                className="rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/10 font-bold border-none"
                disabled={createTimelineEvent.isPending}
              >
                {createTimelineEvent.isPending ? 'Adding...' : 'Add Milestone'}
              </Button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Vertical Timeline listing */}
      {isLoading ? (
        <div className="text-center py-6 text-xs text-slate-400">Loading timeline...</div>
      ) : isError ? (
        <div className="text-center py-6 text-xs text-red-400">Error loading timeline events.</div>
      ) : events && events.length > 0 ? (
        <div className="relative pl-8 sm:pl-10 border-l-2 border-slate-100 dark:border-slate-800/80 ml-4 py-3 flex flex-col gap-8">
          {events.map((event, index) => {
            const IconComponent = ICON_MAP[event.icon_type as keyof typeof ICON_MAP] || Star;
            const styleClass = ICON_COLOR_MAP[event.icon_type as keyof typeof ICON_COLOR_MAP] || 'bg-slate-100 text-slate-500 border-slate-250';
            const eventYear = new Date(event.event_date).getFullYear();
            
            // Show year group header if it is the first event of that year
            const showYearHeader =
              index === 0 ||
              new Date(events[index - 1].event_date).getFullYear() !== eventYear;

            return (
              <div key={event.id} className="relative flex flex-col gap-2 group text-left">
                {/* Year Marker */}
                {showYearHeader && (
                  <div className="absolute -left-[54px] sm:-left-[58px] -top-9 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-850 border border-slate-200/50 dark:border-slate-800/50 text-[10px] font-bold text-slate-500 dark:text-slate-400 select-none">
                    {eventYear}
                  </div>
                )}

                {/* Floating Icon Node (absolute aligned to timeline border) */}
                <div
                  className={`absolute -left-[50px] sm:-left-[52px] top-1.5 h-8 w-8 rounded-full border flex items-center justify-center bg-white dark:bg-[#121829] shadow-sm z-10 ${styleClass}`}
                >
                  <IconComponent className="h-4 w-4" />
                </div>

                {/* Card Container */}
                <div className="border border-slate-200/40 dark:border-slate-800/40 bg-white dark:bg-slate-950/30 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow relative">
                  {isOwner && (
                    <button
                      onClick={() => handleDelete(event.id)}
                      disabled={deleteTimelineEvent.isPending}
                      className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer"
                      title="Remove Milestone"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}

                  <span className="text-[10px] text-slate-400 font-bold tracking-wider">
                    {new Date(event.event_date).toLocaleDateString(undefined, {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                  
                  <h4 className="text-sm font-bold text-slate-850 dark:text-slate-200 mt-1 flex items-center gap-1.5">
                    {event.title}
                    {event.is_auto && (
                      <span className="text-[8px] bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 px-1.5 py-0.5 rounded font-mono font-medium">
                        SYSTEM
                      </span>
                    )}
                  </h4>

                  {event.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-1.5 font-sans">
                      {event.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="border-2 border-dashed border-slate-200 dark:border-slate-800/80 rounded-2xl p-10 text-center text-sm text-slate-400">
          No life milestones posted on the timeline yet.
        </div>
      )}
    </div>
  );
}
