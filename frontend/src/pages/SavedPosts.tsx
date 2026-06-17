import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { 
  Bookmark, Folder, Plus, Trash2, ArrowLeft, Grid, Film, 
  FolderHeart, Sparkles, BookOpen, MoreVertical 
} from 'lucide-react';
import { usePosts } from '@/hooks/usePosts';
import { useCollections, Collection } from '@/hooks/useCollections';
import { PostCard } from '@/components/feed/PostCard';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { toast } from 'sonner';

export default function SavedPosts() {
  const navigate = useNavigate();
  
  // Tab states: 'bookmarks' or 'collections'
  const [activeTab, setActiveTab] = useState<'bookmarks' | 'collections'>('bookmarks');
  
  // Drill-down states
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');

  // Fetch hooks
  const { useSavedPosts } = usePosts();
  const { data: savedPosts, isLoading: isPostsLoading, isError: isPostsError, refetch: refetchPosts } = useSavedPosts();

  const { 
    useUserCollections, 
    useCollectionItems, 
    createCollection, 
    deleteCollection, 
    removeItemFromCollection 
  } = useCollections();

  const { data: collections, isLoading: isColsLoading, refetch: refetchCols } = useUserCollections();
  const { data: collectionItems, isLoading: isItemsLoading } = useCollectionItems(selectedCollection?.id || '');

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollectionName.trim()) return;

    try {
      await createCollection.mutateAsync({
        name: newCollectionName.trim(),
        coverUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=360'
      });
      setNewCollectionName('');
      setIsCreateModalOpen(false);
      refetchCols();
    } catch {
      // toast error handled by hook
    }
  };

  const handleDeleteCollection = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this collection? Saved items will remain in your Bookmarks.')) {
      try {
        await deleteCollection.mutateAsync(id);
        if (selectedCollection?.id === id) {
          setSelectedCollection(null);
        }
        refetchCols();
      } catch {
        // handled
      }
    }
  };

  const handleRemoveItem = async (colId: string, postId?: string, reelId?: string) => {
    try {
      await removeItemFromCollection.mutateAsync({
        collectionId: colId,
        postId,
        reelId
      });
    } catch {
      // handled
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto px-4 select-none">
      
      {/* Dynamic drill down header or tab header */}
      {selectedCollection ? (
        <div className="flex justify-between items-center border-b border-slate-200/60 dark:border-slate-800/60 pb-3">
          <button 
            onClick={() => setSelectedCollection(null)}
            className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Collections
          </button>
          
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold font-outfit text-slate-850 dark:text-slate-200">
              {selectedCollection.name}
            </h2>
            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-xs rounded-full text-zinc-500 font-semibold">
              {collectionItems?.length || 0} items
            </span>
          </div>

          <button 
            onClick={(e) => handleDeleteCollection(selectedCollection.id, e)}
            className="p-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 text-red-500 rounded-full hover:scale-105 transition"
          >
            <Trash2 className="w-4.5 h-4.5" />
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4 border-b border-slate-200/60 dark:border-slate-800/60 pb-1">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Bookmark className="h-6 w-6 text-indigo-500 dark:text-indigo-400" />
              <h2 className="text-xl font-bold font-outfit text-slate-850 dark:text-slate-200">Bookmarks</h2>
            </div>

            {activeTab === 'collections' && (
              <Button 
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 rounded-xl"
              >
                <Plus className="w-4 h-4" /> New Collection
              </Button>
            )}
          </div>

          {/* Toggle Tabs */}
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('bookmarks')}
              className={`pb-2 text-sm font-semibold relative transition ${
                activeTab === 'bookmarks' 
                  ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
              }`}
            >
              All Bookmarks
            </button>
            <button
              onClick={() => setActiveTab('collections')}
              className={`pb-2 text-sm font-semibold relative transition ${
                activeTab === 'collections' 
                  ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
              }`}
            >
              Collections
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1">
        {selectedCollection ? (
          /* Drill-down collection items list */
          isItemsLoading ? (
            <div className="flex justify-center py-20">
              <Spinner size="lg" />
            </div>
          ) : collectionItems && collectionItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {collectionItems.map((item) => (
                <div key={item.id} className="relative group">
                  {item.posts ? (
                    <PostCard post={item.posts} />
                  ) : item.reels ? (
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden aspect-[9/16] relative">
                      <video src={item.reels.video_url} className="w-full h-full object-cover" controls />
                      <div className="absolute top-4 left-4 flex items-center gap-1 bg-black/60 px-2 py-0.5 rounded text-[10px] font-bold">
                        <Film className="w-3 h-3" /> Reel
                      </div>
                    </div>
                  ) : null}

                  {/* Remove button overlay */}
                  <button 
                    onClick={() => handleRemoveItem(selectedCollection.id, item.post_id, item.reel_id)}
                    className="absolute top-4 right-4 z-10 p-2 bg-red-600 hover:bg-red-700 text-white rounded-full opacity-0 group-hover:opacity-100 transition shadow-lg cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={FolderHeart}
              title="Collection is empty"
              description="Add saved posts or reels directly from the homepage feed to build this category."
              actionText="Back to Bookmarks"
              onAction={() => setSelectedCollection(null)}
            />
          )
        ) : activeTab === 'bookmarks' ? (
          /* Bookmarked posts list */
          isPostsLoading ? (
            <div className="flex justify-center py-20">
              <Spinner size="lg" />
            </div>
          ) : isPostsError ? (
            <EmptyState
              title="Failed to load saved posts"
              description="There was an error communicating with the database server."
              actionText="Retry"
              onAction={refetchPosts}
            />
          ) : savedPosts && savedPosts.length > 0 ? (
            <div className="flex flex-col gap-6">
              {savedPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Bookmark}
              title="No bookmarks saved"
              description="Tap the save button on any story post to collect them in this section."
              actionText="Explore Feed"
              onAction={() => navigate('/feed')}
            />
          )
        ) : (
          /* Collections Grid View */
          isColsLoading ? (
            <div className="flex justify-center py-20">
              <Spinner size="lg" />
            </div>
          ) : collections && collections.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {collections.map((col) => (
                <div 
                  key={col.id}
                  onClick={() => setSelectedCollection(col)}
                  className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:scale-[1.02] transition duration-200 cursor-pointer flex flex-col group relative"
                >
                  <div className="aspect-[4/3] bg-slate-100 dark:bg-slate-950 overflow-hidden relative">
                    <img 
                      src={col.cover_url} 
                      alt={col.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-xs text-white font-bold">
                      <Folder className="w-4 h-4 text-indigo-400" />
                      <span>{col.items_count} items</span>
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex justify-between items-center">
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-800 dark:text-slate-100 truncate group-hover:text-indigo-550 transition text-sm">
                        {col.name}
                      </h3>
                      <p className="text-[10px] text-slate-450 dark:text-slate-500 uppercase tracking-widest mt-0.5">
                        Collection Category
                      </p>
                    </div>
                    
                    <button 
                      onClick={(e) => handleDeleteCollection(col.id, e)}
                      className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-400 hover:text-red-500 rounded-full transition"
                    >
                      <Trash2 className="w-3.8 h-3.8" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Folder}
              title="Create your first collection"
              description="Organize your bookmark saves into categories like Travel, Recipes, or Inspiration."
              actionText="Create Collection"
              onAction={() => setIsCreateModalOpen(true)}
            />
          )
        )}
      </div>

      {/* Create Collection Modal */}
      <Modal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        title="Create New Collection"
        size="sm"
      >
        <form onSubmit={handleCreateCollection} className="flex flex-col gap-4 text-left">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-450 dark:text-slate-450 uppercase tracking-widest flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Collection Name
            </label>
            <Input 
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              placeholder="e.g. Vacation Inspo"
              required
              className="rounded-xl border-slate-200 dark:border-slate-800"
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800/80 pt-4 mt-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsCreateModalOpen(false)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createCollection.isPending || !newCollectionName.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 shadow-md font-bold px-6 border-none rounded-xl"
            >
              {createCollection.isPending ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
