import React from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { usePosts } from '@/hooks/usePosts';
import { PostCard } from '@/components/feed/PostCard';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';

export default function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { usePost } = usePosts();

  const { data: post, isLoading, isError } = usePost(id || '');

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Spinner size="lg" />
        <span className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-widest uppercase animate-pulse">
          Loading memory details...
        </span>
      </div>
    );
  }

  if (isError || !post) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <EmptyState
          icon={Sparkles}
          title="Memory Not Found"
          description="The post you are trying to view doesn't exist or has been deleted by its creator."
          actionText="Back to Feed"
          onAction={() => navigate('/feed')}
        />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 flex flex-col gap-6 text-left">
      <div className="flex items-center gap-2 select-none">
        <Button
          onClick={() => navigate(-1)}
          variant="outline"
          size="sm"
          className="rounded-xl border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-850 font-bold text-xs"
          leftIcon={<ArrowLeft className="h-4 w-4" />}
        >
          Back
        </Button>
        <span className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
          Memory Detail
        </span>
      </div>

      <PostCard post={post} />
    </div>
  );
}
