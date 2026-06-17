import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { Compass, Users, Sparkles, UserPlus, UserCheck, Search, Film, Heart, MessageSquare, MapPin, Hash, ArrowLeft, Bookmark } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useProfile } from '@/hooks/useProfile';
import { useUIStore } from '@/stores/uiStore';
import { supabase, supabaseUrl } from '@/lib/supabase';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { cn, getAvatarUrl } from '@/lib/utils';
import { Profile, Post, Reel } from '@/types';

// Helper to format public storage paths
function getPostImageUrl(path?: string) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${supabaseUrl}/storage/v1/object/public/posts/${path}`;
}

function getReelUrl(path: string) {
  if (path.startsWith('http')) return path;
  return `${supabaseUrl}/storage/v1/object/public/reels/${path}`;
}

type SearchTab = 'all' | 'creators' | 'posts' | 'reels' | 'tags' | 'locations';

export default function Explore() {
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);
  const { searchQuery, setSearchQuery } = useUIStore();
  const { useSuggestedUsers, useSearchUsers, toggleFollow } = useProfile();

  // Search tab switcher
  const [activeTab, setActiveTab] = useState<SearchTab>('all');

  // Query search creators
  const { data: searchCreators, isLoading: searchCreatorsLoading } = useSearchUsers(searchQuery);

  // Query search posts
  const { data: searchPosts, isLoading: searchPostsLoading } = useQuery({
    queryKey: ['explore', 'search-posts', searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      const queryStr = searchQuery.replace('#', '').trim();

      const { data, error } = await supabase
        .from('posts')
        .select('*, profiles:user_id(*), likes(user_id), comments(id)')
        .ilike('content', `%${queryStr}%`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map((p: any) => ({
        ...p,
        likes_count: (p.likes || []).length,
        comments_count: (p.comments || []).length,
      })) as Post[];
    },
    enabled: searchQuery.trim().length > 0,
  });

  // Query search reels
  const { data: searchReels, isLoading: searchReelsLoading } = useQuery({
    queryKey: ['explore', 'search-reels', searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      const queryStr = searchQuery.replace('#', '').trim();

      const { data, error } = await supabase
        .from('reels')
        .select('*, profiles:user_id(*), reel_likes(user_id), reel_comments(id)')
        .or(`caption.ilike.%${queryStr}%,location.ilike.%${queryStr}%`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map((r: any) => ({
        ...r,
        likes_count: (r.reel_likes || []).length,
        comments_count: (r.reel_comments || []).length,
      })) as Reel[];
    },
    enabled: searchQuery.trim().length > 0,
  });

  // Default Explore view: Fetch all posts with images
  const { data: explorePosts, isLoading: explorePostsLoading } = useQuery({
    queryKey: ['explore', 'default-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*, profiles:user_id(*), likes(user_id), comments(id)')
        .not('image_url', 'is', null)
        .order('created_at', { ascending: false })
        .limit(15);

      if (error) throw error;
      return (data || []).map((p: any) => ({
        ...p,
        likes_count: (p.likes || []).length,
        comments_count: (p.comments || []).length,
      })) as Post[];
    },
    enabled: !searchQuery,
  });

  // Default Explore view: Fetch all reels
  const { data: exploreReels, isLoading: exploreReelsLoading } = useQuery({
    queryKey: ['explore', 'default-reels'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reels')
        .select('*, profiles:user_id(*), reel_likes(user_id), reel_comments(id)')
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) throw error;
      return (data || []).map((r: any) => ({
        ...r,
        likes_count: (r.reel_likes || []).length,
        comments_count: (r.reel_comments || []).length,
      })) as Reel[];
    },
    enabled: !searchQuery,
  });

  // Suggestions for trending creators
  const { data: suggestions, isLoading: suggestionsLoading } = useSuggestedUsers(5);

  const handleFollowToggle = (userId: string, isFollowing: boolean) => {
    toggleFollow.mutate({
      targetId: userId,
      isFollowing,
    });
  };

  // Compile list of trending hashtags based on loaded explore posts/reels
  const getTrendingHashtags = () => {
    const counts: Record<string, number> = {};
    
    // Add posts content tags
    explorePosts?.forEach((post) => {
      const tags = post.content.match(/#\w+/g);
      tags?.forEach((t) => {
        const clean = t.toLowerCase();
        counts[clean] = (counts[clean] || 0) + 1;
      });
    });

    // Add reels caption tags
    exploreReels?.forEach((reel) => {
      reel.hashtags?.forEach((tag) => {
        const clean = `#${tag.toLowerCase()}`;
        counts[clean] = (counts[clean] || 0) + 1.5; // weigh reels higher
      });
    });

    const sorted = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map((entry) => entry[0]);

    return sorted.length > 0 ? sorted : ['#storytelling', '#memories', '#creators', '#adventure', '#friendship'];
  };

  const trendingTags = getTrendingHashtags();

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-16">
      
      {/* Search Header */}
      <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800/60 pb-3 select-none text-left">
        <div className="flex items-center gap-3">
          <Compass className="h-6 w-6 text-[#6C63FF]" />
          <h2 className="text-xl font-bold font-outfit text-slate-850 dark:text-slate-200">
            {searchQuery ? `Search results for "${searchQuery}"` : 'Explore Platform'}
          </h2>
        </div>
      </div>

      {/* Search input field */}
      <form onSubmit={(e) => e.preventDefault()} className="relative w-full">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400 pointer-events-none" />
        <input
          type="search"
          placeholder="Search usernames, hashtags, locations, captions..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            if (e.target.value.startsWith('#')) {
              setActiveTab('tags');
            }
          }}
          className="w-full bg-slate-50 dark:bg-white/5 border border-slate-205 dark:border-white/10 rounded-xl pl-11 pr-4 py-2.5 text-sm text-slate-800 dark:text-white placeholder:text-slate-455 focus:outline-none focus:border-[#6C63FF] focus:ring-2 focus:ring-[#6C63FF]/20 transition-colors"
        />
      </form>

      {/* --- SEARCH RESULTS VIEW --- */}
      {searchQuery.trim().length > 0 ? (
        <div className="flex flex-col gap-5 text-left">
          {/* Sub Tabs Navigation */}
          <div className="flex gap-4 border-b border-slate-200 dark:border-slate-800 pb-1.5 select-none overflow-x-auto scrollbar-none">
            {(['all', 'creators', 'posts', 'reels', 'tags', 'locations'] as SearchTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'text-xs font-bold uppercase tracking-wider pb-1 cursor-pointer transition-colors border-b-2',
                  activeTab === tab
                    ? 'border-[#6C63FF] text-slate-900 dark:text-white'
                    : 'border-transparent text-slate-450 dark:text-slate-500 hover:text-[#6C63FF] dark:hover:text-white'
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* 1. Creators Results */}
          {(activeTab === 'all' || activeTab === 'creators') && (
            <div className="flex flex-col gap-3">
              {(activeTab === 'creators') && <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Creators</span>}
              {searchCreatorsLoading ? (
                <div className="py-6 flex justify-center"><Spinner size="sm" /></div>
              ) : searchCreators && searchCreators.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {searchCreators.map((user) => (
                    <Card
                      key={user.id}
                      variant="glass"
                      padding="md"
                      className="flex flex-col items-center text-center gap-3 relative hover:scale-[1.01] transition-transform"
                    >
                      <Link to={`/profile/${user.username}`} className="flex flex-col items-center">
                        <Avatar
                          src={getAvatarUrl(user.avatar_url)}
                          name={user.full_name || user.username}
                          size="xl"
                        />
                        <h4 className="text-sm font-bold text-slate-905 dark:text-white mt-2 truncate max-w-[140px]">{user.full_name || user.username}</h4>
                        <span className="text-[10px] text-slate-500">@{user.username}</span>
                      </Link>
                      <p className="text-[11px] text-slate-400 line-clamp-2 min-h-[30px]">{user.bio || 'Sharing memories and journeys.'}</p>
                      {currentUser && currentUser.id !== user.id && (
                        <Button
                          onClick={() => handleFollowToggle(user.id, false)}
                          variant="outline"
                          size="sm"
                          className="w-full text-xs rounded-xl"
                        >
                          Connect
                        </Button>
                      )}
                    </Card>
                  ))}
                </div>
              ) : (
                activeTab === 'creators' && <p className="text-xs text-slate-500 text-center py-6">No matching creators found</p>
              )}
            </div>
          )}

          {/* 2. Posts Results */}
          {(activeTab === 'all' || activeTab === 'posts') && (
            <div className="flex flex-col gap-3">
              {(activeTab === 'posts') && <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Posts</span>}
              {searchPostsLoading ? (
                <div className="py-6 flex justify-center"><Spinner size="sm" /></div>
              ) : searchPosts && searchPosts.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {searchPosts
                    .filter((p) => p.image_url)
                    .map((post) => (
                      <div
                        key={post.id}
                        onClick={() => navigate(`/profile/${post.profiles?.username}`)}
                        className="relative rounded-xl overflow-hidden aspect-square border border-slate-250 dark:border-slate-800 bg-slate-900 cursor-pointer group"
                      >
                        <img src={getPostImageUrl(post.image_url)} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3.5 text-white text-xs font-bold">
                          <span className="flex items-center gap-1">❤️ {post.likes_count}</span>
                          <span className="flex items-center gap-1">💬 {post.comments_count}</span>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                activeTab === 'posts' && <p className="text-xs text-slate-500 text-center py-6">No matching posts found</p>
              )}
            </div>
          )}

          {/* 3. Reels Results */}
          {(activeTab === 'all' || activeTab === 'reels') && (
            <div className="flex flex-col gap-3">
              {(activeTab === 'reels') && <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reels</span>}
              {searchReelsLoading ? (
                <div className="py-6 flex justify-center"><Spinner size="sm" /></div>
              ) : searchReels && searchReels.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {searchReels.map((reel) => (
                    <div
                      key={reel.id}
                      onClick={() => navigate(`/reels?id=${reel.id}`)}
                      className="relative rounded-xl overflow-hidden aspect-[9/16] border border-slate-250 dark:border-slate-800 bg-slate-950 cursor-pointer group"
                    >
                      <video src={getReelUrl(reel.video_url)} className="w-full h-full object-cover" muted playsInline />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-xs font-bold">
                        <span>❤️ {reel.likes_count}</span>
                        <span>💬 {reel.comments_count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                activeTab === 'reels' && <p className="text-xs text-slate-500 text-center py-6">No matching reels found</p>
              )}
            </div>
          )}

          {/* 4. Hashtags tab results */}
          {activeTab === 'tags' && (
            <div className="flex flex-col gap-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Matching Hashtags</span>
              {searchPostsLoading && searchReelsLoading ? (
                <div className="py-12 flex justify-center"><Spinner size="md" /></div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {/* Union search of posts & reels matching hashtag */}
                  {searchPosts?.map((post) => (
                    <div
                      key={post.id}
                      onClick={() => navigate(`/profile/${post.profiles?.username}`)}
                      className="relative rounded-xl overflow-hidden aspect-square bg-slate-900 cursor-pointer group"
                    >
                      <img src={getPostImageUrl(post.image_url)} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">
                        <span>Post</span>
                      </div>
                    </div>
                  ))}
                  {searchReels?.map((reel) => (
                    <div
                      key={reel.id}
                      onClick={() => navigate(`/reels?id=${reel.id}`)}
                      className="relative rounded-xl overflow-hidden aspect-[9/16] bg-slate-950 cursor-pointer group border border-slate-800"
                    >
                      <video src={getReelUrl(reel.video_url)} className="w-full h-full object-cover" muted playsInline />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">
                        <span>Reel</span>
                      </div>
                    </div>
                  ))}
                  {(!searchPosts || searchPosts.length === 0) && (!searchReels || searchReels.length === 0) && (
                    <p className="col-span-full text-xs text-slate-500 text-center py-12">No media tagged with this hashtag</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 5. Locations tab results */}
          {activeTab === 'locations' && (
            <div className="flex flex-col gap-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Matching Locations</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {searchReels && searchReels.length > 0 ? (
                  searchReels.map((reel) => (
                    <div
                      key={reel.id}
                      onClick={() => navigate(`/reels?id=${reel.id}`)}
                      className="relative rounded-xl overflow-hidden aspect-[9/16] border border-slate-800 bg-slate-950 cursor-pointer group"
                    >
                      <video src={getReelUrl(reel.video_url)} className="w-full h-full object-cover" muted playsInline />
                      <div className="absolute bottom-2 left-2 right-2 text-center text-[9px] text-white bg-black/50 backdrop-blur-[2px] py-1 rounded flex items-center justify-center gap-0.5">
                        <MapPin className="h-2.5 w-2.5" />
                        <span className="truncate">{reel.location}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="col-span-full text-xs text-slate-500 text-center py-12">No locations matched your query</p>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* --- DEFAULT EXPLORE GRID VIEW --- */
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-left">
          
          {/* Main Grid Feed (3 Columns on md+) */}
          <div className="md:col-span-3 flex flex-col gap-4">
            <span className="text-xs font-bold text-slate-550 uppercase tracking-wider select-none">
              Explore media
            </span>

            {explorePostsLoading || exploreReelsLoading ? (
              <div className="py-24 flex justify-center"><Spinner size="lg" /></div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 auto-rows-[160px] sm:auto-rows-[190px]">
                {/* Mix posts and reels in an alternating grid */}
                {explorePosts?.slice(0, 3).map((post) => (
                  <div
                    key={post.id}
                    onClick={() => navigate(`/profile/${post.profiles?.username}`)}
                    className="col-span-1 row-span-1 relative rounded-xl overflow-hidden border border-slate-200/50 dark:border-slate-800/60 bg-slate-900 cursor-pointer group shadow-sm"
                  >
                    <img src={getPostImageUrl(post.image_url)} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 text-white text-xs font-bold">
                      <span className="flex items-center gap-0.5">❤️ {post.likes_count}</span>
                      <span className="flex items-center gap-0.5">💬 {post.comments_count}</span>
                    </div>
                  </div>
                ))}

                {exploreReels && exploreReels[0] && (
                  <div
                    onClick={() => navigate(`/reels?id=${exploreReels[0].id}`)}
                    className="col-span-1 row-span-2 relative rounded-xl overflow-hidden border border-slate-200/50 dark:border-slate-800/60 bg-slate-950 cursor-pointer group shadow-sm"
                  >
                    <video src={getReelUrl(exploreReels[0].video_url)} className="w-full h-full object-cover" muted playsInline />
                    <div className="absolute top-2 right-2 bg-[#6C63FF] text-white rounded p-1">
                      <Film className="h-3.5 w-3.5" />
                    </div>
                    <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2.5 text-white text-xs font-bold">
                      <span>❤️ {exploreReels[0].likes_count}</span>
                      <span>💬 {exploreReels[0].comments_count}</span>
                    </div>
                  </div>
                )}

                {explorePosts?.slice(3, 6).map((post) => (
                  <div
                    key={post.id}
                    onClick={() => navigate(`/profile/${post.profiles?.username}`)}
                    className="col-span-1 row-span-1 relative rounded-xl overflow-hidden border border-slate-200/50 dark:border-slate-800/60 bg-slate-900 cursor-pointer group shadow-sm"
                  >
                    <img src={getPostImageUrl(post.image_url)} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 text-white text-xs font-bold">
                      <span className="flex items-center gap-0.5">❤️ {post.likes_count}</span>
                      <span className="flex items-center gap-0.5">💬 {post.comments_count}</span>
                    </div>
                  </div>
                ))}

                {exploreReels && exploreReels[1] && (
                  <div
                    onClick={() => navigate(`/reels?id=${exploreReels[1].id}`)}
                    className="col-span-1 row-span-2 relative rounded-xl overflow-hidden border border-slate-200/50 dark:border-slate-800/60 bg-slate-950 cursor-pointer group shadow-sm"
                  >
                    <video src={getReelUrl(exploreReels[1].video_url)} className="w-full h-full object-cover" muted playsInline />
                    <div className="absolute top-2 right-2 bg-[#6C63FF] text-white rounded p-1">
                      <Film className="h-3.5 w-3.5" />
                    </div>
                    <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2.5 text-white text-xs font-bold">
                      <span>❤️ {exploreReels[1].likes_count}</span>
                      <span>💬 {exploreReels[1].comments_count}</span>
                    </div>
                  </div>
                )}

                {explorePosts?.slice(6, 11).map((post) => (
                  <div
                    key={post.id}
                    onClick={() => navigate(`/profile/${post.profiles?.username}`)}
                    className="col-span-1 row-span-1 relative rounded-xl overflow-hidden border border-slate-200/50 dark:border-slate-800/60 bg-slate-900 cursor-pointer group shadow-sm"
                  >
                    <img src={getPostImageUrl(post.image_url)} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 text-white text-xs font-bold">
                      <span className="flex items-center gap-0.5">❤️ {post.likes_count}</span>
                      <span className="flex items-center gap-0.5">💬 {post.comments_count}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar Section (1 Column on md+): Trending Tags & Suggested Creators */}
          <div className="md:col-span-1 flex flex-col gap-6 select-none">
            {/* Trending tags */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Trending Tags</span>
                   {trendingTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => {
                      setSearchQuery(tag);
                      setActiveTab('tags');
                    }}
                    className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/70 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/8 hover:border-[#6C63FF]/30 dark:hover:border-[#6C63FF]/30 border border-slate-200 dark:border-white/10 text-xs text-slate-700 dark:text-slate-350 font-bold transition-all text-left cursor-pointer"
                  >
                    <Hash className="h-3.5 w-3.5 text-[#6C63FF] flex-shrink-0" />
                    <span className="truncate">{tag}</span>
                  </button>
                ))}
              </div>

            {/* Suggested Creators */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Popular Stars</span>
              <div className="flex flex-col gap-3">
                {suggestionsLoading ? (
                  <div className="py-4 flex justify-center"><Spinner size="sm" /></div>
                ) : suggestions && suggestions.length > 0 ? (
                  suggestions.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900/40"
                    >
                      <Link to={`/profile/${user.username}`} className="flex items-center gap-2 min-w-0">
                        <Avatar src={getAvatarUrl(user.avatar_url)} name={user.full_name || user.username} size="sm" />
                        <div className="flex flex-col min-w-0 text-left">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-205 truncate max-w-[90px]">
                            {user.full_name || user.username}
                          </span>
                          <span className="text-[9px] text-slate-450 truncate">@{user.username}</span>
                        </div>
                      </Link>
                      <button
                        onClick={() => handleFollowToggle(user.id, false)}
                        className="text-[10px] font-bold text-[#6C63FF] hover:text-[#A855F7] cursor-pointer"
                      >
                        Connect
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-[10px] text-slate-500">No suggestions available</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
