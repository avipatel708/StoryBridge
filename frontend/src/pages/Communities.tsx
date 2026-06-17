import React, { useState } from 'react';
import { Users, Plus, Search, Layers, Compass } from 'lucide-react';
import { useCommunities } from '@/hooks/useCommunities';
import { CommunityCard } from '@/components/communities/CommunityCard';
import { CreateCommunityModal } from '@/components/communities/CreateCommunityModal';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const CATEGORIES = [
  'All',
  'General',
  'Photography',
  'Travel',
  'Design',
  'Technology',
  'Writing & Art',
  'Fitness & Health',
  'Food & Cooking',
  'Music & Movies',
];

export default function Communities() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { useBrowseCommunities } = useCommunities();
  const {
    data: communities,
    isLoading,
    isError,
    refetch,
  } = useBrowseCommunities(selectedCategory, searchQuery);

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto px-1 sm:px-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800/60 pb-4 select-none">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30">
            <Users className="h-6 w-6" />
          </div>
          <div className="text-left">
            <h2 className="text-xl font-bold font-outfit text-slate-900 dark:text-[#F8FAFC]">
              Communities
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Explore interest-driven spaces to share stories.
            </p>
          </div>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          variant="primary"
          size="sm"
          className="rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 font-bold border-none flex items-center gap-2"
          leftIcon={<Plus className="h-4.5 w-4.5" />}
        >
          Create Community
        </Button>
      </div>

      {/* Search Input bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search communities by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-4 rounded-xl border-slate-200 dark:border-slate-800 focus:border-indigo-500 shadow-sm"
        />
      </div>

      {/* Horizontal categories scrollable strip */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none select-none text-left">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold font-outfit tracking-wide border cursor-pointer flex-shrink-0 transition-all ${
              selectedCategory === cat
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                : 'bg-white dark:bg-slate-950/30 text-slate-500 border-slate-200 dark:border-slate-800 hover:border-indigo-500/30 hover:text-indigo-500'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Communities Grid content */}
      {isLoading ? (
        <div className="flex justify-center py-24">
          <Spinner size="lg" />
        </div>
      ) : isError ? (
        <EmptyState
          title="Failed to load communities"
          description="There was an error querying interest groups from the database."
          actionText="Retry"
          onAction={refetch}
        />
      ) : communities && communities.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
          {communities.map((comm) => (
            <CommunityCard key={comm.id} community={comm} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Compass}
          title="No Communities Found"
          description="Try selecting a different category or search term, or create your own interest group!"
          actionText={searchQuery || selectedCategory !== 'All' ? 'Clear Filters' : 'Create a Community'}
          onAction={() => {
            if (searchQuery || selectedCategory !== 'All') {
              setSearchQuery('');
              setSelectedCategory('All');
            } else {
              setIsModalOpen(true);
            }
          }}
        />
      )}

      {/* Creation Modal */}
      <CreateCommunityModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
