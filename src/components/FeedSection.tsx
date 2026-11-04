import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CommentWithAuthor, FeedPost, FeedFilter, Profile, Community, PostType } from '../types';
import { fetchInfiniteFeed, fetchPostById, SEED_JUJA_POSTS } from '../lib/posts';
import { getPinnedPollId, setPinnedPollId } from '../lib/polls';
import { FeedFilterChips } from './FeedFilterChips';
import { PostCard } from './PostCard';
import { MusheneStoriesBar } from './MusheneStoriesBar';
import { CampusPulseBar } from './CampusPulseBar';
import { TrendingStrip } from './TrendingStrip';
import { MemeOfTheWeekSection } from './MemeOfTheWeekSection';
import { FeedComposerCard } from './FeedComposerCard';
import {
  Sparkles,
  RefreshCw,
  Plus,
  Loader2,
  CheckCircle,
  Search,
  X,
} from 'lucide-react';

interface FeedSectionProps {
  onOpenComposer: (initialType?: PostType) => void;
  onOpenMemeStudio?: () => void;
  newlyCreatedPost?: FeedPost | null;
  currentUserProfile?: Profile | null;
  activeCommunity?: Community | null;
  searchQuery?: string;
  onClearSearch?: () => void;
  onRequireAuth: (message: string) => void;
  onSelectPost?: (post: FeedPost) => void;
  onReportPost?: (post: FeedPost) => void;
  onReportComment?: (comment: CommentWithAuthor) => void;
  onToggleHidePost?: (postId: string, currentStatus?: 'live' | 'hidden') => void;
  onSelectCommunity?: (slug: string) => void;
}

const PAGE_SIZE = 5;

export function FeedSection({
  onOpenComposer,
  onOpenMemeStudio,
  newlyCreatedPost,
  currentUserProfile,
  activeCommunity,
  searchQuery = '',
  onClearSearch,
  onRequireAuth,
  onSelectPost,
  onReportPost,
  onReportComment,
  onToggleHidePost,
  onSelectCommunity,
}: FeedSectionProps) {
  const [filter, setFilter] = useState<FeedFilter>('all');
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [page, setPage] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Pinned Poll of the Week state
  const [pinnedPollId, setPinnedPollIdState] = useState<string | null>(getPinnedPollId);
  const [pinnedPost, setPinnedPost] = useState<FeedPost | null>(null);

  // Sentinel ref for infinite scroll
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Listen to custom pinned poll changes across components
  useEffect(() => {
    const handlePinnedChange = (e: any) => {
      setPinnedPollIdState(e.detail?.postId ?? getPinnedPollId());
    };
    window.addEventListener('pinned-poll-change', handlePinnedChange);
    return () => window.removeEventListener('pinned-poll-change', handlePinnedChange);
  }, []);

  // Listen to post-status-changed event
  useEffect(() => {
    const handleStatusChange = (e: any) => {
      const { postId, status } = e.detail || {};
      if (!postId || !status) return;
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, status } : p))
      );
      setPinnedPost((prev) =>
        prev && prev.id === postId ? { ...prev, status } : prev
      );
    };
    window.addEventListener('post-status-changed', handleStatusChange);
    return () => window.removeEventListener('post-status-changed', handleStatusChange);
  }, []);

  // Listen to feed-post-approved event
  useEffect(() => {
    const handleApproved = (e: any) => {
      const approved = e.detail?.post as FeedPost;
      if (!approved) return;
      setPosts((prev) => {
        const exists = prev.some((p) => p.id === approved.id);
        if (exists) {
          return prev.map((p) => (p.id === approved.id ? { ...p, status: 'live' } : p));
        }
        return [approved, ...prev];
      });
    };
    window.addEventListener('feed-post-approved', handleApproved);
    return () => window.removeEventListener('feed-post-approved', handleApproved);
  }, []);

  // Resolve pinned post object whenever pinnedPollId or posts change
  useEffect(() => {
    let active = true;

    async function loadPinned() {
      if (!pinnedPollId) {
        setPinnedPost(null);
        return;
      }

      // 1. Check in newly created post
      if (newlyCreatedPost && newlyCreatedPost.id === pinnedPollId) {
        setPinnedPost(newlyCreatedPost);
        return;
      }

      // 2. Check in current loaded posts
      const foundInPosts = posts.find((p) => p.id === pinnedPollId);
      if (foundInPosts) {
        setPinnedPost(foundInPosts);
        return;
      }

      // 3. Check in seed posts
      const foundInSeed = SEED_JUJA_POSTS.find((p) => p.id === pinnedPollId);
      if (foundInSeed) {
        setPinnedPost(foundInSeed);
        return;
      }

      // 4. Fetch by ID from database
      const fetched = await fetchPostById(pinnedPollId);
      if (active && fetched) {
        setPinnedPost(fetched);
      }
    }

    loadPinned();

    return () => {
      active = false;
    };
  }, [pinnedPollId, posts, newlyCreatedPost]);

  // Admin action to toggle pinning of any poll
  const handleTogglePin = (postId: string) => {
    if (pinnedPollId === postId) {
      setPinnedPollId(null);
      setPinnedPollIdState(null);
      setPinnedPost(null);
    } else {
      setPinnedPollId(postId);
      setPinnedPollIdState(postId);
    }
  };

  const commSlug = activeCommunity?.slug || 'juja';

  // Load initial page of posts or on filter/search change
  const loadInitialFeed = useCallback(
    async (selectedFilter: FeedFilter, searchStr = searchQuery) => {
      setLoading(true);
      try {
        const res = await fetchInfiniteFeed({
          page: 0,
          pageSize: PAGE_SIZE,
          filter: selectedFilter,
          communitySlug: commSlug,
          searchQuery: searchStr,
        });

        // If user just created a post matching the current filter, prepend it
        let combined = res.posts;
        if (
          newlyCreatedPost &&
          (selectedFilter === 'all' || newlyCreatedPost.post_type === selectedFilter) &&
          !combined.some((p) => p.id === newlyCreatedPost.id)
        ) {
          combined = [newlyCreatedPost, ...combined];
        }

        setPosts(combined);
        setPage(0);
        setHasMore(res.hasMore);
      } finally {
        setLoading(false);
      }
    },
    [newlyCreatedPost, commSlug, searchQuery]
  );

  // Load next batch for infinite scroll
  const loadNextPage = useCallback(async () => {
    if (loading || loadingMore || !hasMore) return;

    setLoadingMore(true);
    const nextPage = page + 1;

    try {
      const res = await fetchInfiniteFeed({
        page: nextPage,
        pageSize: PAGE_SIZE,
        filter,
        communitySlug: commSlug,
        searchQuery,
      });

      setPosts((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        const newItems = res.posts.filter((p) => !existingIds.has(p.id));
        return [...prev, ...newItems];
      });

      setPage(nextPage);
      setHasMore(res.hasMore);
    } finally {
      setLoadingMore(false);
    }
  }, [loading, loadingMore, hasMore, page, filter, commSlug, searchQuery]);

  // Trigger load on filter, search, or community switch
  useEffect(() => {
    loadInitialFeed(filter, searchQuery);
  }, [filter, commSlug, searchQuery, loadInitialFeed]);

  // Pull-to-refresh / manual refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadInitialFeed(filter, searchQuery);
    } finally {
      setRefreshing(false);
    }
  };

  // Setup Intersection Observer for mobile endless scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasMore && !loading && !loadingMore) {
          loadNextPage();
        }
      },
      {
        root: null,
        rootMargin: '250px',
        threshold: 0.1,
      }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, loading, loadingMore, loadNextPage]);

  // Show pinned poll at top when viewing 'all' or 'poll' without active search
  const shouldShowPinnedPoll =
    Boolean(pinnedPost && (filter === 'all' || filter === 'poll') && !searchQuery);

  // Filter hidden posts for regular users; admins can see all posts with status tags
  const visiblePosts = currentUserProfile?.role === 'admin'
    ? posts
    : posts.filter((p) => p.status !== 'hidden');

  // Exclude pinned post from the regular list below so it doesn't duplicate
  const regularPosts = shouldShowPinnedPoll && pinnedPost
    ? visiblePosts.filter((p) => p.id !== pinnedPost.id)
    : visiblePosts;

  const communityName = activeCommunity?.name || 'Juja';

  return (
    <section aria-labelledby="feed-heading" className="space-y-4">
      {/* Standard Top Feed Composer Card (Jakob's Law: "What's on your mind?") */}
      <FeedComposerCard
        currentUserProfile={currentUserProfile}
        activeCommunity={activeCommunity}
        onOpenComposer={onOpenComposer}
        onOpenMemeStudio={onOpenMemeStudio}
      />

      {/* 24-hour Mushene Moments Stories Bar */}
      <MusheneStoriesBar
        currentUserProfile={currentUserProfile}
        onRequireAuth={onRequireAuth}
      />

      {/* Live Campus Pulse Line */}
      <CampusPulseBar posts={posts.length > 0 ? posts : SEED_JUJA_POSTS} />

      {/* Trending in Juja (Top Three Posts Strip) */}
      <TrendingStrip
        posts={posts.length > 0 ? posts : SEED_JUJA_POSTS}
        onSelectPost={onSelectPost}
      />

      {/* Weekly Meme of the Week Strip & Pinned Winner */}
      <MemeOfTheWeekSection
        currentUserProfile={currentUserProfile}
        onSelectPost={onSelectPost}
      />

      {/* Community Feed Header & Live Indicator */}
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <h2
            id="feed-heading"
            className="font-display text-sm font-bold tracking-tight text-zinc-950 flex items-center gap-1.5"
          >
            <span>{communityName} Campus Feed</span>
            <span className="text-[11px] font-normal text-zinc-400 font-mono">
              (Live stream)
            </span>
          </h2>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={loading || refreshing}
          className="cursor-pointer text-xs font-semibold text-emerald-800 hover:text-emerald-950 inline-flex items-center gap-1 transition-colors disabled:opacity-50"
          title={`Refresh ${communityName} feed`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span className="hidden xs:inline">Refresh</span>
        </button>
      </div>

      {/* Search Filter Banner (if search is active) */}
      {searchQuery && (
        <div className="bg-emerald-50/90 border border-emerald-200/90 rounded-2xl p-3 flex items-center justify-between gap-2 text-xs text-emerald-950">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-emerald-800 shrink-0" />
            <span>
              Searching for "<strong>{searchQuery}</strong>" in {communityName}
            </span>
          </div>
          {onClearSearch && (
            <button
              type="button"
              onClick={onClearSearch}
              className="cursor-pointer text-xs font-bold text-emerald-800 hover:text-emerald-950 underline shrink-0"
            >
              Clear search
            </button>
          )}
        </div>
      )}

      {/* Standard Tab Navigation (Jakob's Law) */}
      <FeedFilterChips currentFilter={filter} onSelectFilter={(f) => setFilter(f)} />

      {/* Main Endless Scroll Content */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="bg-white border border-stone-200 rounded-2xl p-4 sm:p-5 space-y-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-stone-200" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3 bg-stone-200 rounded w-1/3" />
                  <div className="h-2.5 bg-stone-100 rounded w-1/5" />
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="h-3.5 bg-stone-200 rounded w-3/4" />
                <div className="h-3 bg-stone-100 rounded w-full" />
                <div className="h-3 bg-stone-100 rounded w-5/6" />
              </div>
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white border border-dashed border-stone-300 rounded-2xl p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-display text-sm font-bold text-zinc-900">
              {searchQuery
                ? `No posts matched "${searchQuery}" in ${communityName}`
                : `No ${filter !== 'all' ? `${filter} ` : ''}posts in ${communityName} yet`}
            </h3>
            <p className="text-xs text-zinc-500 max-w-xs mx-auto">
              {searchQuery
                ? 'Try a different keyword or clear your search filter.'
                : 'Be the first comrade to break campus news, ask a question, or post a meme!'}
            </p>
          </div>
          <div className="flex items-center justify-center gap-2">
            {searchQuery && onClearSearch ? (
              <button
                type="button"
                onClick={onClearSearch}
                className="cursor-pointer min-h-[44px] px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
              >
                Clear Search
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => onOpenComposer()}
              className="cursor-pointer min-h-[44px] px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Compose First Post</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Pinned Poll / Spotlight Post Card */}
          {shouldShowPinnedPoll && pinnedPost && (
            <PostCard
              key={`pinned-${pinnedPost.id}`}
              post={pinnedPost}
              currentUserProfile={currentUserProfile}
              onRequireAuth={onRequireAuth}
              onSelectPost={onSelectPost}
              isPinned={true}
              onTogglePin={currentUserProfile?.role === 'admin' ? handleTogglePin : undefined}
              onReportPost={onReportPost}
              onReportComment={onReportComment}
              onToggleHidePost={onToggleHidePost}
            />
          )}

          {/* Regular Stream of Posts */}
          {regularPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserProfile={currentUserProfile}
              onRequireAuth={onRequireAuth}
              onSelectPost={onSelectPost}
              isPinned={false}
              onTogglePin={currentUserProfile?.role === 'admin' ? handleTogglePin : undefined}
              onReportPost={onReportPost}
              onReportComment={onReportComment}
              onToggleHidePost={onToggleHidePost}
            />
          ))}

          {/* Infinite Scroll Sentinel & Loading Indicator */}
          <div ref={sentinelRef} className="py-4 text-center">
            {loadingMore && (
              <div className="inline-flex items-center gap-2 text-xs text-zinc-500 font-medium">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-800" />
                <span>Loading more campus stories...</span>
              </div>
            )}
            {!hasMore && posts.length > 0 && (
              <div className="inline-flex items-center gap-1.5 text-xs text-zinc-400 font-mono py-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>You're all caught up with {communityName} pulse!</span>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
