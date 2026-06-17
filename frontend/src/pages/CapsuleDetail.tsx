import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Layers, ArrowLeft, Plus, Trash2, ShieldAlert, Globe, Lock } from 'lucide-react';
import { useCapsules } from '@/hooks/useCapsules';
import { usePosts } from '@/hooks/usePosts';
import { PostCard } from '@/components/feed/PostCard';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { getCapsuleCoverUrl, getPostImageUrl } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';

export default function CapsuleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const {
    useCapsuleDetails,
    useCapsuleItems,
    addPostToCapsule,
    removePostFromCapsule,
    deleteCapsule,
  } = useCapsules();

  const { useUserPosts } = usePosts();

  // 1. Fetch Capsule Meta
  const {
    data: capsule,
    isLoading: isCapsuleLoading,
    isError: isCapsuleError,
  } = useCapsuleDetails(id || '');

  // 2. Fetch Capsule Item Posts
  const {
    data: items,
    isLoading: isItemsLoading,
    isError: isItemsError,
    refetch: refetchItems,
  } = useCapsuleItems(id || '');

  // 3. Fetch User's general posts (for Add Post feature)
  const { data: userPosts, isLoading: isUserPostsLoading } = useUserPosts(currentUser?.id || '');

  if (isCapsuleLoading || isItemsLoading) {
    return (
      <div className="flex justify-center py-32">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isCapsuleError || !capsule) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <EmptyState
          icon={ShieldAlert}
          title="Capsule Not Found"
          description="This story capsule does not exist or you do not have permission to view it."
          actionText="Back to Capsules"
          onAction={() => navigate('/capsules')}
        />
      </div>
    );
  }

  const isOwner = currentUser?.id === capsule.user_id;
  const coverUrl = getCapsuleCoverUrl(capsule.cover_url) || 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=800';

  // Filter posts that are not already in the capsule
  const existingPostIds = new Set((items || []).map((item) => item.post_id));
  const addablePosts = (userPosts || []).filter((post) => !existingPostIds.has(post.id));

  const handleDeleteCapsule = () => {
    if (confirm('Are you sure you want to delete this capsule? Content inside posts will not be deleted.')) {
      deleteCapsule.mutate(capsule.id, {
        onSuccess: () => navigate('/capsules'),
      });
    }
  };

  const handleAddPost = (postId: string) => {
    addPostToCapsule.mutate(
      { capsuleId: capsule.id, postId },
      {
        onSuccess: () => {
          setIsAddModalOpen(false);
        },
      }
    );
  };

  const handleRemovePost = (postId: string) => {
    if (confirm('Remove this story from this capsule?')) {
      removePostFromCapsule.mutate({ capsuleId: capsule.id, postId });
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto pb-16 px-1 sm:px-4">
      {/* Back button */}
      <button
        onClick={() => navigate('/capsules')}
        className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white uppercase tracking-wider transition-colors mr-auto cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Capsules
      </button>

      {/* Premium Cover Header */}
      <div className="relative h-64 w-full rounded-[2rem] overflow-hidden border border-slate-200/50 dark:border-slate-800/50 shadow-md">
        <img src={coverUrl} alt={capsule.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
        
        {/* Visibility Info */}
        <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/65 backdrop-blur-md text-[10px] font-bold text-white border border-white/10">
          {capsule.is_public ? (
            <>
              <Globe className="h-3 w-3 text-cyan-400" />
              <span>PUBLIC CAPSULE</span>
            </>
          ) : (
            <>
              <Lock className="h-3 w-3 text-amber-400" />
              <span>PRIVATE CAPSULE</span>
            </>
          )}
        </div>

        {/* Text meta */}
        <div className="absolute bottom-6 left-6 right-6 text-left">
          <div className="flex items-center gap-2 text-indigo-300 font-bold text-[10px] uppercase tracking-wider mb-1">
            <Layers className="h-3.5 w-3.5" />
            <span>{items?.length || 0} Stories Collected</span>
          </div>
          
          <h1 className="text-2xl sm:text-3xl font-extrabold font-outfit text-white tracking-tight leading-tight">
            {capsule.title}
          </h1>

          {capsule.description && (
            <p className="text-xs text-slate-200 mt-1 max-w-lg font-sans opacity-90 leading-relaxed">
              {capsule.description}
            </p>
          )}
        </div>
      </div>

      {/* Owner controls strip */}
      {isOwner && (
        <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-4 gap-4">
          <div className="text-left">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Capsule Curator</p>
            <p className="text-[10px] text-slate-400">Add posts to this collection or delete it.</p>
          </div>
          <div className="flex gap-2.5">
            <Button
              onClick={handleDeleteCapsule}
              variant="outline"
              size="sm"
              className="rounded-xl border-red-200/50 dark:border-red-900/30 text-red-500 hover:bg-red-500/10 cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => setIsAddModalOpen(true)}
              variant="primary"
              size="sm"
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 font-bold border-none flex items-center gap-1.5"
              leftIcon={<Plus className="h-4.5 w-4.5" />}
            >
              Add Story
            </Button>
          </div>
        </div>
      )}

      {/* Capsule Content Posts */}
      <div className="flex flex-col gap-5 mt-2">
        {items && items.length > 0 ? (
          items.map((item) => (
            <div key={item.id} className="relative group">
              {item.posts ? (
                <>
                  <PostCard post={item.posts} />
                  
                  {isOwner && (
                    <button
                      onClick={() => handleRemovePost(item.post_id)}
                      className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-xl bg-slate-900/80 hover:bg-red-600 text-slate-350 hover:text-white border border-white/10 shadow-lg cursor-pointer"
                      title="Remove from Capsule"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-900 text-xs text-slate-400">
                  This post has been deleted.
                </div>
              )}
            </div>
          ))
        ) : (
          <EmptyState
            icon={Layers}
            title="Capsule is Empty"
            description={
              isOwner
                ? "This memory capsule is empty. Tap 'Add Story' to add posts from your profile into this capsule!"
                : "The creator has not added any stories to this capsule yet."
            }
            actionText={isOwner ? "Add Story Post" : undefined}
            onAction={isOwner ? () => setIsAddModalOpen(true) : undefined}
          />
        )}
      </div>

      {/* Add Story to Capsule selection modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Story to Capsule"
        size="md"
      >
        {isUserPostsLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size="md" />
          </div>
        ) : addablePosts && addablePosts.length > 0 ? (
          <div className="flex flex-col gap-3 max-h-96 overflow-y-auto pr-1 text-left">
            <p className="text-xs text-slate-400 mb-2 leading-relaxed">
              Select one of your posts below to add it to this capsule collection:
            </p>
            {addablePosts.map((post) => (
              <div
                key={post.id}
                onClick={() => handleAddPost(post.id)}
                className="flex items-center gap-4 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/80 hover:border-indigo-500/50 hover:bg-slate-50 dark:hover:bg-slate-900/40 cursor-pointer transition-all duration-200 group"
              >
                {post.image_url ? (
                  <div className="h-16 w-16 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0">
                    <img src={getPostImageUrl(post.image_url) || ''} alt="" className="h-full w-full object-cover" />
                  </div>
                ) : (
                  <div className="h-16 w-16 rounded-xl bg-indigo-500/5 flex items-center justify-center flex-shrink-0 text-indigo-500 font-bold border border-indigo-500/10">
                    Aa
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-400 font-medium">
                    {new Date(post.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate mt-1">
                    {post.content || 'Photo Story'}
                  </p>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl border-slate-200 dark:border-slate-800 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 font-bold"
                >
                  Add
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No Addable Stories Found"
            description="All of your stories are already inside this capsule, or you have not posted any stories yet."
            actionText="Go to Feed to Post"
            onAction={() => {
              setIsAddModalOpen(false);
              navigate('/feed');
            }}
          />
        )}
      </Modal>
    </div>
  );
}
