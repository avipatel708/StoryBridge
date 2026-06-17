import React, { useState } from 'react';
import { Layers, Plus, Sparkles } from 'lucide-react';
import { useCapsules } from '@/hooks/useCapsules';
import { CapsuleCard } from '@/components/capsules/CapsuleCard';
import { CreateCapsuleModal } from '@/components/capsules/CreateCapsuleModal';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';

export default function Capsules() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { useUserCapsules } = useCapsules();
  const { data: capsules, isLoading, isError, refetch } = useUserCapsules();

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto px-1 sm:px-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800/60 pb-4 select-none">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30">
            <Layers className="h-6 w-6" />
          </div>
          <div className="text-left">
            <h2 className="text-xl font-bold font-outfit text-slate-900 dark:text-[#F8FAFC]">
              Memory Capsules
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Curate your special stories into digital albums.
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
          Create Capsule
        </Button>
      </div>

      {/* Grid Content */}
      {isLoading ? (
        <div className="flex justify-center py-24">
          <Spinner size="lg" />
        </div>
      ) : isError ? (
        <EmptyState
          title="Failed to load memory capsules"
          description="We had trouble retrieving your capsules from the database."
          actionText="Retry"
          onAction={refetch}
        />
      ) : capsules && capsules.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
          {capsules.map((capsule) => (
            <CapsuleCard key={capsule.id} capsule={capsule} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Layers}
          title="No Memory Capsules Yet"
          description="Story capsules let you group stories and posts together, like digital photo albums of your favorite trips or milestones."
          actionText="Create Your First Capsule"
          onAction={() => setIsModalOpen(true)}
        />
      )}

      {/* Creation Modal */}
      <CreateCapsuleModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
