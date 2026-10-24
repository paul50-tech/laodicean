import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUpRight, Search, Wifi, X } from 'lucide-react';
import { AuthModal } from './components/AuthModal';
import { CommunitiesView } from './components/CommunitiesView';
import { MobileBottomNav } from './components/MobileBottomNav';
import { PostCard } from './components/PostCard';
import { PostReaderView } from './components/PostReaderView';
import { TopBar } from './components/TopBar';
import { WhatsAppShareSheet } from './components/WhatsAppShareSheet';
import { WritePostModal } from './components/WritePostModal';
import { JUJA_SPOTS, SEED_COMMUNITIES } from './data/seedData';
import {
  filterAndSearchPosts,
  paginatePosts,
  parseRoute,
} from './lib/feedLogic';
import {
  fetchCommunities,
  fetchCommunityRequests,
  fetchPosts,
  getInitialLiteMode,
  getStoredCampusUser,
  publishPost,
  saveLiteModePreference,
  signInCampusUser,
  signOutCampusUser,
  submitNewCommunityRequest,
  togglePostLike,
} from './lib/storageService';
import {
  AppRoute,
  CampusUser,
  Community,
  CommunityRequest,
  CommunityRequestInput,
  Post,
  PostDraftInput,
  PostType,
} from './types/laodicean';

const PAGE_SIZE = 5;

const OPTIONAL_CHIPS: { label: string; value: PostType }[] = [
  { label: 'Stories', value: PostType.Story },
  { label: 'Quick Gists', value: PostType.Gist },
  { label: 'Photos', value: PostType.Photo },
  { label: 'Notices', value: PostType.Notice },
];

export default function App() {
  const [route, setRoute] = useState<AppRoute>(() =>
    typeof window !== 'undefined'
      ? parseRoute(window.location.pathname)
      : { view: 'feed', communitySlug: null }
  );

  const [communities, setCommunities] = useState<Community[]>(SEED_COMMUNITIES);
  const [posts, setPosts] = useState<Post[]>([]);
  const [requests, setRequests] = useState<CommunityRequest[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(true);

  // Optional feed filters (never required tabs; all null = full mixed endless scroll)
  const [activePostType, setActivePostType] = useState<PostType | null>(null);
  const [activeSpot, setActiveSpot] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  // Weak-data saver mode
  const [liteMode, setLiteMode] = useState<boolean>(() => getInitialLiteMode());

  // User session & dialogs
  const [currentUser, setCurrentUser] = useState<CampusUser | null>(() =>
    getStoredCampusUser()
  );
  const [composerOpen, setComposerOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [sharePost, setSharePost] = useState<Post | null>(null);

  const loadMoreSentinelRef = useRef<HTMLDivElement | null>(null);

  // Initial load from Supabase or local persistence
  useEffect(() => {
    let mounted = true;
    Promise.all([fetchCommunities(), fetchPosts(), fetchCommunityRequests()]).then(
      ([loadedCommunities, loadedPosts, loadedRequests]) => {
        if (!mounted) return;
        setCommunities(loadedCommunities);
        setPosts(loadedPosts);
        setRequests(loadedRequests);
        setLoadingFeed(false);
      }
    );
    return () => {
      mounted = false;
    };
  }, []);

  // Browser back/forward button listener
  useEffect(() => {
    const handlePopState = () => {
      setRoute(parseRoute(window.location.pathname));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const pushPath = useCallback((path: string) => {
    if (typeof window !== 'undefined' && window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
    setRoute(parseRoute(path));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleNavigateFeed = useCallback(
    (communitySlug: string | null, postType: PostType | null = null) => {
      setActivePostType(postType);
      setPage(1);
      pushPath(communitySlug ? `/c/${communitySlug}` : '/');
    },
    [pushPath]
  );

  const handleNavigateCommunities = useCallback(
    (focusRequestForm = false) => {
      pushPath(focusRequestForm ? '/request-community' : '/communities');
    },
    [pushPath]
  );

  const handleOpenPost = useCallback(
    (slug: string) => {
      pushPath(`/p/${slug}`);
    },
    [pushPath]
  );

  const handleToggleLiteMode = () => {
    setLiteMode((prev) => {
      const next = !prev;
      saveLiteModePreference(next);
      return next;
    });
  };

  // Filtered + paginated feed
  const filteredPosts = useMemo(() => {
    const communitySlug = route.view === 'feed' ? route.communitySlug : null;
    return filterAndSearchPosts(posts, {
      communitySlug,
      postType: activePostType,
      spot: activeSpot,
      searchQuery,
    });
  }, [posts, route, activePostType, activeSpot, searchQuery]);

  const { visiblePosts, hasMore, remainingCount } = useMemo(
    () => paginatePosts(filteredPosts, page, PAGE_SIZE),
    [filteredPosts, page]
  );

  // Endless scroll IntersectionObserver
  useEffect(() => {
    if (route.view !== 'feed' || !hasMore) return;
    const node = loadMoreSentinelRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setPage((prev) => prev + 1);
        }
      },
      { rootMargin: '220px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [route.view, hasMore, visiblePosts.length]);

  // Keep document title synced with active post or view
  useEffect(() => {
    if (route.view === 'post') {
      const match = posts.find((p) => p.slug === route.postSlug);
      if (match) {
        document.title = `${match.title || match.body.slice(0, 44)} — c/${match.communitySlug} · Laodicean`;
        return;
      }
    }
    if (route.view === 'communities') {
      document.title = 'Communities & Campus Requests — Laodicean';
      return;
    }
    document.title = 'Laodicean — Community Social Blogging (Juja · JKUAT)';
  }, [route, posts]);

  const handleToggleLike = async (postId: string) => {
    const updated = await togglePostLike(postId);
    setPosts(updated);
  };

  const handlePublishPost = async (draft: PostDraftInput, author: CampusUser) => {
    if (!currentUser) {
      setCurrentUser(author);
    }
    const created = await publishPost(draft, author);
    setPosts((prev) => [created, ...prev]);
    setActivePostType(null);
    setActiveSpot(null);
    setSearchQuery('');
    setPage(1);
    pushPath('/');
  };

  const handleSubmitCommunityRequest = async (input: CommunityRequestInput) => {
    const created = await submitNewCommunityRequest(input);
    setRequests((prev) => [created, ...prev]);
  };

  const handleSignIn = async (input: {
    name: string;
    handle: string;
    course: string;
    email: string;
  }) => {
    const { user, magicLinkSent } = await signInCampusUser(input);
    setCurrentUser(user);
    return { magicLinkSent };
  };

  const handleSignOut = async () => {
    await signOutCampusUser();
    setCurrentUser(null);
  };

  const jujaCommunity = communities.find((c) => c.slug === 'juja') ?? SEED_COMMUNITIES[0];

  const postCountByCommunity = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of posts) {
      counts[p.communitySlug] = (counts[p.communitySlug] ?? 0) + 1;
    }
    return counts;
  }, [posts]);

  const activeReaderPost =
    route.view === 'post'
      ? posts.find((p) => p.slug === route.postSlug)
      : undefined;

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] text-zinc-900">
      <TopBar
        route={route}
        activePostType={activePostType}
        currentUser={currentUser}
        onNavigateFeed={handleNavigateFeed}
        onNavigateCommunities={handleNavigateCommunities}
        onOpenComposer={() => setComposerOpen(true)}
        onOpenAuth={() => setAuthModalOpen(true)}
      />

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 pt-5 sm:pt-8 pb-20 md:pb-12">
        {route.view === 'post' ? (
          <PostReaderView
            post={activeReaderPost}
            liteMode={liteMode}
            currentUser={currentUser}
            onBackToFeed={() => handleNavigateFeed(null, null)}
            onToggleLike={handleToggleLike}
            onPostsUpdated={setPosts}
            onRequireAuthOrQuickName={(guestUser) => setCurrentUser(guestUser)}
          />
        ) : route.view === 'communities' ? (
          <CommunitiesView
            communities={communities}
            requests={requests}
            postCountByCommunity={postCountByCommunity}
            focusRequestForm={route.focusRequestForm}
            onOpenCommunityFeed={(slug) => handleNavigateFeed(slug, null)}
            onSubmitRequest={handleSubmitCommunityRequest}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Main Endless-Scroll Feed Column (8 cols on desktop) */}
            <div className="lg:col-span-8 space-y-5">
              {/* Clean Editorial Feed Header */}
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-x-2 text-xs text-zinc-500">
                  <span className="font-semibold text-emerald-800">c/juja</span>
                  <span aria-hidden="true">·</span>
                  <span>JKUAT Main Campus, Kenya</span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">
                    {jujaCommunity.memberCount.toLocaleString()} readers
                  </span>
                </div>
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-zinc-950 tracking-tight text-balance">
                  What Juja is writing & sharing today
                </h1>
              </div>

              {/* Optional Filter Chips + Search + Lite Data Saver Bar */}
              <div className="space-y-3 pt-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  {/* Optional filter chips (never required tabs; clicking active chip resets to mixed stream) */}
                  <div
                    role="group"
                    aria-label="Optional post type filters"
                    className="flex flex-wrap items-center gap-1.5"
                  >
                    <button
                      type="button"
                      aria-pressed={activePostType === null}
                      onClick={() => {
                        setActivePostType(null);
                        setPage(1);
                      }}
                      className={`min-h-[40px] px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        activePostType === null
                          ? 'bg-zinc-900 text-white'
                          : 'bg-stone-200/75 text-zinc-700 hover:bg-stone-200 hover:text-zinc-950'
                      }`}
                    >
                      All Mix
                    </button>

                    {OPTIONAL_CHIPS.map((chip) => {
                      const isSelected = activePostType === chip.value;
                      return (
                        <button
                          key={chip.value}
                          type="button"
                          aria-pressed={isSelected}
                          onClick={() => {
                            setActivePostType(isSelected ? null : chip.value);
                            setPage(1);
                          }}
                          className={`min-h-[40px] px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                            isSelected
                              ? 'bg-zinc-900 text-white'
                              : 'bg-stone-200/75 text-zinc-700 hover:bg-stone-200 hover:text-zinc-950'
                          }`}
                        >
                          {chip.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Weak-data saver toggle */}
                  <button
                    type="button"
                    aria-pressed={liteMode}
                    onClick={handleToggleLiteMode}
                    className={`min-h-[40px] px-3 py-1.5 rounded-lg border text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto cursor-pointer ${
                      liteMode
                        ? 'bg-emerald-50 border-emerald-700 text-emerald-900'
                        : 'bg-white border-stone-300 text-zinc-700 hover:border-zinc-900'
                    }`}
                  >
                    <Wifi className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>{liteMode ? 'Lite Data: On' : 'Lite Data: Off'}</span>
                  </button>
                </div>

                {/* Search + Active Spot Reset */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative flex-1 min-w-[200px]">
                    <label htmlFor="feed-search-input" className="sr-only">
                      Search posts in Juja
                    </label>
                    <Search
                      className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                      aria-hidden="true"
                    />
                    <input
                      id="feed-search-input"
                      type="search"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setPage(1);
                      }}
                      placeholder="Search Gate C, hostels, labs, notes..."
                      className="w-full h-10 pl-9 pr-3 rounded-lg bg-white border border-stone-200/90 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-800"
                    />
                  </div>

                  {activeSpot && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveSpot(null);
                        setPage(1);
                      }}
                      className="min-h-[40px] px-3 rounded-lg bg-stone-200/80 hover:bg-stone-300/70 text-xs font-semibold text-zinc-900 inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                    >
                      <span>Spot: {activeSpot}</span>
                      <X className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>

              {/* Endless Scroll Post List */}
              {loadingFeed ? (
                <div className="py-12 text-center text-sm text-zinc-500">
                  Loading Juja stream…
                </div>
              ) : visiblePosts.length === 0 ? (
                <div className="bg-white border border-stone-200/90 rounded-2xl p-8 text-center space-y-3">
                  <p className="font-display text-lg font-bold text-zinc-900">
                    No posts match that filter yet
                  </p>
                  <p className="text-sm text-zinc-600 max-w-md mx-auto">
                    Clear your filter to return to the full mixed stream, or publish
                    the first post on this topic.
                  </p>
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setActivePostType(null);
                        setActiveSpot(null);
                        setSearchQuery('');
                        setPage(1);
                      }}
                      className="min-h-[44px] px-4 py-2 rounded-lg bg-zinc-900 text-white text-xs font-semibold cursor-pointer"
                    >
                      Reset Filters
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {visiblePosts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      liteMode={liteMode}
                      onOpenPost={handleOpenPost}
                      onToggleLike={handleToggleLike}
                      onShareWhatsApp={(target) => setSharePost(target)}
                      onFilterBySpot={(spot) => {
                        setActiveSpot((prev) => (prev === spot ? null : spot));
                        setPage(1);
                      }}
                    />
                  ))}

                  {/* Progressive Endless Scroll Trigger + Accessible Load More Button */}
                  <div ref={loadMoreSentinelRef} className="pt-2 text-center">
                    {hasMore ? (
                      <button
                        type="button"
                        onClick={() => setPage((prev) => prev + 1)}
                        className="min-h-[44px] px-5 py-2.5 rounded-xl bg-white border border-stone-300 hover:border-zinc-900 text-xs font-semibold text-zinc-800 transition-colors tabular-nums cursor-pointer"
                      >
                        Load older posts ({remainingCount} more)
                      </button>
                    ) : (
                      <p className="text-xs text-zinc-500 py-3">
                        You are caught up with the latest dispatches from c/juja.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Desktop Context Rail (4 cols on lg+, zero nested boxes) */}
            <aside
              aria-label="Community context"
              className="hidden lg:block lg:col-span-4 space-y-6 sticky top-22"
            >
              {/* Active Flagship Community Card */}
              <div className="bg-white border border-stone-200/90 rounded-2xl overflow-hidden">
                {jujaCommunity.bannerUrl && !liteMode && (
                  <div className="aspect-[16/9] w-full bg-stone-100 overflow-hidden">
                    <img
                      src={jujaCommunity.bannerUrl}
                      alt="Students walking along sunlit brick lecture halls in Juja"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-5 space-y-3">
                  <div className="text-xs text-zinc-500">
                    <span className="font-semibold text-zinc-900">First Community</span>
                    <span aria-hidden="true"> · </span>
                    <span>{jujaCommunity.region}</span>
                  </div>
                  <h2 className="font-display text-lg font-bold text-zinc-950">
                    c/{jujaCommunity.slug} — JKUAT Campus
                  </h2>
                  <p className="text-xs text-zinc-600 leading-relaxed">
                    {jujaCommunity.description}
                  </p>
                </div>
              </div>

              {/* Popular Juja Spots Filter */}
              <div className="space-y-2.5 px-1">
                <h2 className="font-display text-sm font-bold text-zinc-900">
                  Filter by Juja spot
                </h2>
                <div className="flex flex-wrap gap-1.5">
                  {JUJA_SPOTS.map((spot) => {
                    const selected = activeSpot === spot;
                    return (
                      <button
                        key={spot}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => {
                          setActiveSpot(selected ? null : spot);
                          setPage(1);
                        }}
                        className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                          selected
                            ? 'bg-zinc-900 text-white'
                            : 'bg-stone-200/70 text-zinc-700 hover:bg-stone-200 hover:text-zinc-950'
                        }`}
                      >
                        {spot}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Laodicean Umbrella — Request a Community */}
              <div className="pt-4 border-t border-stone-200/90 px-1 space-y-2">
                <h2 className="font-display text-sm font-bold text-zinc-900">
                  Outside Juja?
                </h2>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Laodicean hosts independent campus and neighborhood communities.
                  Request the next one for your university or town.
                </p>
                <a
                  href="/request-community"
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavigateCommunities(true);
                  }}
                  className="min-h-[40px] inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 hover:underline"
                >
                  <span>Request your community</span>
                  <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                </a>
              </div>
            </aside>
          </div>
        )}
      </main>

      {/* Quiet Editorial Footer */}
      <footer className="hidden md:block border-t border-stone-200/80 py-6 text-xs text-zinc-500">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between gap-4">
          <span>Laodicean · laodicean.online · Starting in Juja (JKUAT)</span>
          <div className="flex items-center gap-5">
            <a
              href="/communities"
              onClick={(e) => {
                e.preventDefault();
                handleNavigateCommunities(false);
              }}
              className="hover:text-zinc-900 transition-colors"
            >
              Communities
            </a>
            <a
              href="/request-community"
              onClick={(e) => {
                e.preventDefault();
                handleNavigateCommunities(true);
              }}
              className="hover:text-zinc-900 transition-colors"
            >
              Request a Community
            </a>
          </div>
        </div>
      </footer>

      <MobileBottomNav
        route={route}
        currentUser={currentUser}
        onNavigateFeed={() => handleNavigateFeed(null, null)}
        onOpenComposer={() => setComposerOpen(true)}
        onNavigateCommunities={() => handleNavigateCommunities(false)}
        onOpenAuth={() => setAuthModalOpen(true)}
      />

      <WritePostModal
        isOpen={composerOpen}
        currentUser={currentUser}
        onClose={() => setComposerOpen(false)}
        onPublish={handlePublishPost}
      />

      <WhatsAppShareSheet
        post={sharePost}
        onClose={() => setSharePost(null)}
      />

      <AuthModal
        isOpen={authModalOpen}
        currentUser={currentUser}
        onClose={() => setAuthModalOpen(false)}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
      />
    </div>
  );
}
