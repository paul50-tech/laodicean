import React, { useEffect, useState, Suspense, lazy } from 'react';
import { TopBar } from './components/TopBar';
import { AuthModal } from './components/AuthModal';
import { ProfileCard } from './components/ProfileCard';
import { FloatingCreateButton } from './components/FloatingCreateButton';
import { PostComposerModal } from './components/PostComposerModal';
import { FeedSection } from './components/FeedSection';
import { PostDetailPage } from './components/PostDetailPage';
import { ReportTargetInfo } from './components/ReportModal';
import { fetchProfile, signOut } from './lib/auth';
import { supabase } from './lib/supabase';
import { togglePostStatus } from './lib/moderation';
import { SEED_JUJA_POSTS } from './lib/posts';
import { Profile, Post, FeedPost, CommentWithAuthor, Community, PostType } from './types';
import { UserPlus, Plus } from 'lucide-react';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineIndicator } from './components/OfflineIndicator';
import { YourCommunitiesRow } from './components/YourCommunitiesRow';
import { CommunityHeader } from './components/CommunityHeader';
import { DesktopCommunitySidebar } from './components/DesktopCommunitySidebar';
import { BottomNavBar } from './components/BottomNavBar';
import {
  getAllCommunities,
  getCommunityBySlug,
  getUserJoinedCommunitySlugs,
  joinCommunity,
  leaveCommunity,
  isCommunityJoined,
  getActiveCommunitySlug,
  setActiveCommunitySlug,
  parseCommunitySlugFromUrl,
} from './lib/communities';

// Code-split heavy modals to ensure lean initial bundle on weak connections
const MemeEditorModal = lazy(() =>
  import('./components/MemeEditorModal').then((m) => ({ default: m.MemeEditorModal }))
);
const AdminDashboardModal = lazy(() =>
  import('./components/AdminDashboardModal').then((m) => ({ default: m.AdminDashboardModal }))
);
const ReportModal = lazy(() =>
  import('./components/ReportModal').then((m) => ({ default: m.ReportModal }))
);
const OnboardingModal = lazy(() =>
  import('./components/OnboardingModal').then((m) => ({ default: m.OnboardingModal }))
);
const AboutModal = lazy(() =>
  import('./components/AboutModal').then((m) => ({ default: m.AboutModal }))
);
const DiscoverCommunitiesModal = lazy(() =>
  import('./components/DiscoverCommunitiesModal').then((m) => ({ default: m.DiscoverCommunitiesModal }))
);
const RequestCommunityModal = lazy(() =>
  import('./components/RequestCommunityModal').then((m) => ({ default: m.RequestCommunityModal }))
);
const CommunityModToolsModal = lazy(() =>
  import('./components/CommunityModToolsModal').then((m) => ({ default: m.CommunityModToolsModal }))
);

/**
 * Extracts post ID from current browser location pathname (/p/:id),
 * hash (#/p/:id), or query string (?p=:id).
 */
function parsePostIdFromUrl(): string | null {
  if (typeof window === 'undefined') return null;

  // 1. Pathname format: /p/:id or /post/:id
  const pathname = window.location.pathname || '';
  const pathMatch = pathname.match(/^\/(?:p|post)\/([^/]+)/);
  if (pathMatch && pathMatch[1]) {
    return decodeURIComponent(pathMatch[1]);
  }

  // 2. Hash format: #/p/:id or #/post/:id
  const hash = window.location.hash || '';
  const hashMatch = hash.match(/^#\/(?:p|post)\/([^/]+)/);
  if (hashMatch && hashMatch[1]) {
    return decodeURIComponent(hashMatch[1]);
  }

  // 3. Query param format: ?p=:id or ?post=:id
  const searchParams = new URLSearchParams(window.location.search);
  const qPost = searchParams.get('p') || searchParams.get('post');
  if (qPost) {
    return decodeURIComponent(qPost);
  }

  return null;
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [memeStudioOpen, setMemeStudioOpen] = useState(false);
  const [composerInitialMeme, setComposerInitialMeme] = useState<{ file: File; previewUrl: string; caption: string } | null>(null);
  const [composerInitialType, setComposerInitialType] = useState<PostType | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingSession, setLoadingSession] = useState(true);
  const [lastCreatedPost, setLastCreatedPost] = useState<FeedPost | null>(null);
  const [authPromptMessage, setAuthPromptMessage] = useState<string | null>(null);

  // Dedicated post routing state
  const [activePostId, setActivePostId] = useState<string | null>(parsePostIdFromUrl);
  const [activePost, setActivePost] = useState<FeedPost | null>(null);

  // Multi-community state
  const [allCommunities, setAllCommunities] = useState<Community[]>(getAllCommunities);
  const [joinedSlugs, setJoinedSlugs] = useState<string[]>(getUserJoinedCommunitySlugs);
  const [activeSlug, setActiveSlug] = useState<string>(() => parseCommunitySlugFromUrl() || getActiveCommunitySlug());
  const [discoverOpen, setDiscoverOpen] = useState(false);
  const [requestCommunityOpen, setRequestCommunityOpen] = useState(false);
  const [modToolsOpen, setModToolsOpen] = useState(false);

  const activeCommunity =
    getCommunityBySlug(activeSlug) ||
    allCommunities.find((c) => c.slug === activeSlug) ||
    allCommunities[0];

  // Moderation & Admin Dashboard state
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<ReportTargetInfo | null>(null);
  const [adminDashboardOpen, setAdminDashboardOpen] = useState(false);
  const [aboutModalOpen, setAboutModalOpen] = useState(false);

  const handleSelectCommunity = (slug: string) => {
    setActiveCommunitySlug(slug);
    setActiveSlug(slug);
    setActivePostId(null);
    setActivePost(null);
    window.history.pushState(null, '', slug === 'juja' ? '/' : `/c/${encodeURIComponent(slug)}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleJoin = (slug: string) => {
    if (isCommunityJoined(slug)) {
      leaveCommunity(slug);
    } else {
      joinCommunity(slug);
    }
    setJoinedSlugs(getUserJoinedCommunitySlugs());
    setAllCommunities(getAllCommunities());
  };

  const handleCommunityUpdated = (_updated: Community) => {
    setAllCommunities(getAllCommunities());
  };

  // Listen to approved community broadcasts from AdminDeck
  useEffect(() => {
    const handleApproved = () => {
      setAllCommunities(getAllCommunities());
      setJoinedSlugs(getUserJoinedCommunitySlugs());
    };
    window.addEventListener('community-approved', handleApproved);
    return () => window.removeEventListener('community-approved', handleApproved);
  }, []);

  const handleRequireAuth = (message: string) => {
    setAuthPromptMessage(message);
    setAuthModalOpen(true);
  };

  const handleReportPost = (post: FeedPost) => {
    setReportTarget({
      type: 'post',
      postId: post.id,
      title: post.title,
      snippet: post.body.slice(0, 160),
      authorPersona: post.is_persona ? post.persona_name : null,
      authorRealName: post.author_real_name,
    });
    setReportModalOpen(true);
  };

  const handleReportComment = (comment: CommentWithAuthor) => {
    setReportTarget({
      type: 'comment',
      commentId: comment.id,
      postId: comment.post_id,
      snippet: comment.body.slice(0, 160),
      authorPersona: comment.is_persona ? comment.persona_name : null,
      authorRealName: comment.author_real_name,
    });
    setReportModalOpen(true);
  };

  const handleToggleHidePost = async (postId: string, currentStatus?: 'live' | 'hidden') => {
    const newStatus = currentStatus === 'hidden' ? 'live' : 'hidden';
    await togglePostStatus(postId, newStatus);
    if (activePost && activePost.id === postId) {
      setActivePost((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
  };

  // Browser navigation history listener (Back / Forward button support)
  useEffect(() => {
    const handleLocationChange = () => {
      const id = parsePostIdFromUrl();
      setActivePostId(id);
      if (!id) {
        setActivePost(null);
      }
      const cSlug = parseCommunitySlugFromUrl();
      if (cSlug) {
        setActiveSlug(cSlug);
        setActiveCommunitySlug(cSlug);
      }
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  const handleNavigateToPost = (postOrId: FeedPost | string) => {
    const id = typeof postOrId === 'string' ? postOrId : postOrId.id;
    if (typeof postOrId !== 'string') {
      setActivePost(postOrId);
    }
    setActivePostId(id);
    window.history.pushState({ postId: id }, '', `/p/${encodeURIComponent(id)}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToFeed = () => {
    setActivePostId(null);
    setActivePost(null);
    window.history.pushState(null, '', activeSlug === 'juja' ? '/' : `/c/${encodeURIComponent(activeSlug)}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Supabase Auth listener
  useEffect(() => {
    let mounted = true;

    async function initSession() {
      if (!supabase) {
        setLoadingSession(false);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && mounted) {
          setCurrentUser(session.user);
          const userProfile = await fetchProfile(session.user.id, session.user.email);
          if (mounted) {
            setProfile(userProfile);
            // Prompt onboarding if user hasn't set their real display name yet
            if (!userProfile?.real_name || userProfile.real_name === 'User') {
              setOnboardingOpen(true);
            }
          }
        }
      } finally {
        if (mounted) setLoadingSession(false);
      }
    }

    initSession();

    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (_event, session) => {
          if (!mounted) return;
          if (session?.user) {
            setCurrentUser(session.user);
            const userProfile = await fetchProfile(session.user.id, session.user.email);
            if (mounted) {
              setProfile(userProfile);
              if (!userProfile?.real_name || userProfile.real_name === 'User') {
                setOnboardingOpen(true);
              }
            }
          } else {
            setCurrentUser(null);
            setProfile(null);
          }
        }
      );

      return () => {
        mounted = false;
        subscription.unsubscribe();
      };
    }

    return () => {
      mounted = false;
    };
  }, []);

  const handleAuthSuccess = async (user: any) => {
    setCurrentUser(user);
    const userProfile = await fetchProfile(user.id, user.email);
    setProfile(userProfile);
    if (!userProfile?.real_name || userProfile.real_name === 'User') {
      setOnboardingOpen(true);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setCurrentUser(null);
    setProfile(null);
  };

  const handlePostCreated = (newPost: any) => {
    // Immediately build a FeedPost item to render into live feed without delay
    const newFeedItem: FeedPost = {
      id: newPost.id,
      community_id: newPost.community_id || activeCommunity.id,
      community_name: newPost.community_name || activeCommunity.name,
      community_slug: newPost.community_slug || activeCommunity.slug,
      post_type: newPost.post_type,
      title: newPost.title,
      body: newPost.body,
      image_url: newPost.image_url,
      is_persona: newPost.is_persona,
      status: newPost.status,
      created_at: newPost.created_at || new Date().toISOString(),
      updated_at: newPost.updated_at || new Date().toISOString(),
      persona_name: profile?.persona_name || '@juja_student',
      persona_avatar: profile?.persona_avatar || '🎓',
      author_id: profile?.id || null,
      author_real_name: profile?.real_name || null,
      author_role: profile?.role || 'user',
      reactions_count: { laugh: 0, relatable: 0, fire: 0, total: 0 },
      comments_count: 0,
      poll_data: newPost.poll_data || null,
    };

    setLastCreatedPost(newFeedItem);
    // Take user to dedicated view of their new post with share options
    handleNavigateToPost(newFeedItem);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] text-zinc-900 pb-20">
      {/* Top Bar with brand, search, new post CTA and user session */}
      <TopBar
        profile={profile}
        userEmail={currentUser?.email}
        activeCommunity={activeCommunity}
        searchQuery={searchQuery}
        onSearchChange={(q) => setSearchQuery(q)}
        onOpenAuth={() => setAuthModalOpen(true)}
        onOpenProfile={() => setOnboardingOpen(true)}
        onNavigateHome={handleBackToFeed}
        onOpenAdmin={() => setAdminDashboardOpen(true)}
        onOpenAbout={() => setAboutModalOpen(true)}
        onOpenComposer={() => {
          if (profile) {
            setComposerInitialType(undefined);
            setComposerOpen(true);
          } else {
            handleRequireAuth(`Sign in with your campus account to create a post in ${activeCommunity.name}!`);
          }
        }}
        onOpenDiscover={() => setDiscoverOpen(true)}
        onSignOut={handleSignOut}
      />

      {/* Main Container: Responsive 2-Column Desktop Grid adhering to Jakob's Law */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-3 sm:px-4 py-4 pb-20 md:pb-8">
        {activePostId ? (
          /* Dedicated Post View with its own URL, meta tags, and open discussion */
          <div className="max-w-2xl mx-auto">
            <PostDetailPage
              postId={activePostId}
              initialPost={activePost}
              currentUserProfile={profile}
              onBack={handleBackToFeed}
              onNavigateToPost={handleNavigateToPost}
              onRequireAuth={handleRequireAuth}
              onReportPost={handleReportPost}
              onReportComment={handleReportComment}
            />
          </div>
        ) : (
          /* Multi-Campus Hub & Feed: Left Feed Column (8 cols) + Right Sidebar (4 cols) */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Main Stream */}
            <div className="lg:col-span-8 space-y-4">
              {/* "Your communities" Row */}
              <YourCommunitiesRow
                communities={allCommunities}
                joinedSlugs={joinedSlugs}
                activeSlug={activeSlug}
                onSelectCommunity={handleSelectCommunity}
                onOpenDiscover={() => setDiscoverOpen(true)}
                onRequestCommunity={() => setRequestCommunityOpen(true)}
              />

              {/* Active Community Banner & Header */}
              <CommunityHeader
                community={activeCommunity}
                currentUserProfile={profile}
                isJoined={isCommunityJoined(activeSlug)}
                onToggleJoin={() => handleToggleJoin(activeSlug)}
                onOpenRules={() => setAboutModalOpen(true)}
                onOpenModTools={() => setModToolsOpen(true)}
              />

              {/* PWA Home Screen Install Banner */}
              <PWAInstallButton variant="banner" />

              {/* Live Posts Feed with FeedComposerCard and Filter Tabs */}
              <FeedSection
                newlyCreatedPost={lastCreatedPost}
                currentUserProfile={profile}
                activeCommunity={activeCommunity}
                searchQuery={searchQuery}
                onClearSearch={() => setSearchQuery('')}
                onRequireAuth={handleRequireAuth}
                onSelectPost={handleNavigateToPost}
                onReportPost={handleReportPost}
                onReportComment={handleReportComment}
                onToggleHidePost={handleToggleHidePost}
                onSelectCommunity={handleSelectCommunity}
                onOpenComposer={(initialType) => {
                  if (profile) {
                    setComposerInitialType(initialType);
                    setComposerOpen(true);
                  } else {
                    handleRequireAuth(`Sign in with your campus account to create a post in ${activeCommunity.name}!`);
                  }
                }}
                onOpenMemeStudio={() => setMemeStudioOpen(true)}
              />

        {/* Authentication Card (if logged in, show ProfileCard; if logged out, show CTA) */}
        {loadingSession ? (
          <div className="p-6 text-center text-xs text-zinc-500 bg-white border border-stone-200/90 rounded-2xl animate-pulse">
            Checking session...
          </div>
        ) : profile ? (
          <ProfileCard
            profile={profile}
            userEmail={currentUser?.email}
            onEditPersona={() => setOnboardingOpen(true)}
            onSignOut={handleSignOut}
          />
        ) : (
          <div className="bg-white border border-stone-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-bold text-zinc-950">
                  Campus Member Account
                </h2>
                <p className="text-xs text-zinc-500">
                  Sign in to publish posts, choose personas, and participate.
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0">
                <UserPlus className="w-5 h-5" aria-hidden="true" />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/80 text-xs text-zinc-600 space-y-1">
              <p className="font-semibold text-zinc-800">
                Dual Identity System:
              </p>
              <ul className="list-disc list-inside space-y-0.5 text-zinc-600 text-[11px]">
                <li><strong className="text-zinc-800">Real Name:</strong> For verified announcements and guides.</li>
                <li><strong className="text-zinc-800">Persona:</strong> For anonymous confessions, memes, and mushene.</li>
              </ul>
            </div>

            <button
              type="button"
              onClick={() => setAuthModalOpen(true)}
              className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
            >
              <UserPlus className="w-4 h-4" aria-hidden="true" />
              <span>Sign Up or Log In</span>
            </button>
          </div>
        )}

        {/* Community Footer Links */}
        <footer className="pt-2 pb-6 border-t border-stone-200/60 flex flex-wrap items-center justify-between gap-3 text-xs text-stone-500">
          <p>© {new Date().getFullYear()} Laodicean • Built for Juja & JKUAT</p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setAboutModalOpen(true)}
              className="text-emerald-800 hover:text-emerald-900 font-semibold hover:underline cursor-pointer"
            >
              📜 5 Golden Rules & Safety
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => {
                if (profile?.role === 'admin') {
                  setAdminDashboardOpen(true);
                } else {
                  setAboutModalOpen(true);
                }
              }}
              className="text-stone-600 hover:text-stone-900 cursor-pointer"
            >
              Moderation Policy
            </button>
          </div>
        </footer>
            </div>

            {/* Right Column: Desktop Community Sidebar (hidden lg:block lg:col-span-4 sticky top-18) */}
            <div className="hidden lg:block lg:col-span-4 sticky top-18 space-y-4">
              <DesktopCommunitySidebar
                community={activeCommunity}
                currentUserProfile={profile}
                onToggleJoin={handleToggleJoin}
                onOpenRules={() => setAboutModalOpen(true)}
                onOpenDiscover={() => setDiscoverOpen(true)}
                onRequestCommunity={() => setRequestCommunityOpen(true)}
                onOpenModTools={() => setModToolsOpen(true)}
                onSelectPost={handleNavigateToPost}
              />
            </div>
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation Bar (Jakob's Law) */}
      <BottomNavBar
        profile={profile}
        onNavigateHome={handleBackToFeed}
        onOpenDiscover={() => setDiscoverOpen(true)}
        onOpenComposer={() => {
          if (profile) {
            setComposerInitialType(undefined);
            setComposerOpen(true);
          } else {
            handleRequireAuth(`Sign in with your campus account to create a post in ${activeCommunity.name}!`);
          }
        }}
        onOpenAbout={() => setAboutModalOpen(true)}
        onOpenProfile={() => {
          if (profile) {
            setOnboardingOpen(true);
          } else {
            setAuthModalOpen(true);
          }
        }}
        onOpenAuth={() => setAuthModalOpen(true)}
      />

      {/* Post Composer Modal */}
      <PostComposerModal
        isOpen={composerOpen}
        profile={profile}
        community={activeCommunity}
        initialPostType={composerInitialMeme ? 'meme' : composerInitialType}
        initialMemeResult={composerInitialMeme}
        onClose={() => {
          setComposerOpen(false);
          setComposerInitialMeme(null);
          setComposerInitialType(undefined);
        }}
        onPostCreated={(post) => {
          setComposerInitialMeme(null);
          handlePostCreated(post);
        }}
        onRequestAuth={() => setAuthModalOpen(true)}
        onRequestCreatePersona={() => {
          setComposerOpen(false);
          setOnboardingOpen(true);
        }}
      />

      {/* Lazy Suspense Boundaries for Heavy Modals */}
      <Suspense fallback={null}>
        {memeStudioOpen && (
          <MemeEditorModal
            isOpen={memeStudioOpen}
            onClose={() => setMemeStudioOpen(false)}
            onPostMeme={(file, previewUrl, caption) => {
              setMemeStudioOpen(false);
              setComposerInitialMeme({ file, previewUrl, caption });
              if (profile) {
                setComposerOpen(true);
              } else {
                handleRequireAuth(`Sign in with your campus account to post your meme to the ${activeCommunity.name} feed!`);
              }
            }}
          />
        )}

        {profile && onboardingOpen && (
          <OnboardingModal
            profile={profile}
            isOpen={onboardingOpen}
            onClose={() => setOnboardingOpen(false)}
            onProfileUpdated={(updated) => setProfile(updated)}
          />
        )}

        {reportModalOpen && (
          <ReportModal
            isOpen={reportModalOpen}
            target={reportTarget}
            reporterId={profile?.id || 'guest_user'}
            onClose={() => {
              setReportModalOpen(false);
              setReportTarget(null);
            }}
          />
        )}

        {adminDashboardOpen && (
          <AdminDashboardModal
            isOpen={adminDashboardOpen}
            currentUserProfile={profile}
            posts={lastCreatedPost ? [lastCreatedPost, ...SEED_JUJA_POSTS] : SEED_JUJA_POSTS}
            onClose={() => setAdminDashboardOpen(false)}
            onPostStatusChange={handleToggleHidePost}
            onNavigateToPost={handleNavigateToPost}
          />
        )}

        {aboutModalOpen && (
          <AboutModal
            isOpen={aboutModalOpen}
            community={activeCommunity}
            onClose={() => setAboutModalOpen(false)}
          />
        )}

        {discoverOpen && (
          <DiscoverCommunitiesModal
            isOpen={discoverOpen}
            communities={allCommunities}
            joinedSlugs={joinedSlugs}
            activeSlug={activeSlug}
            onClose={() => setDiscoverOpen(false)}
            onSelectCommunity={handleSelectCommunity}
            onToggleJoin={handleToggleJoin}
            onRequestCommunity={() => {
              setDiscoverOpen(false);
              setRequestCommunityOpen(true);
            }}
          />
        )}

        {requestCommunityOpen && (
          <RequestCommunityModal
            isOpen={requestCommunityOpen}
            currentUserProfile={profile}
            onClose={() => setRequestCommunityOpen(false)}
            onRequestSubmitted={() => {
              setAllCommunities(getAllCommunities());
            }}
          />
        )}

        {modToolsOpen && (
          <CommunityModToolsModal
            isOpen={modToolsOpen}
            community={activeCommunity}
            currentUserProfile={profile}
            communityPosts={(lastCreatedPost ? [lastCreatedPost, ...SEED_JUJA_POSTS] : SEED_JUJA_POSTS).filter(
              (p) => (p.community_slug || 'juja').toLowerCase() === activeCommunity.slug.toLowerCase()
            )}
            onClose={() => setModToolsOpen(false)}
            onCommunityUpdated={handleCommunityUpdated}
            onPostStatusToggled={handleToggleHidePost}
          />
        )}
      </Suspense>

      {/* Auth Modal (lightweight, immediate) */}
      <AuthModal
        isOpen={authModalOpen}
        promptMessage={authPromptMessage}
        onClose={() => {
          setAuthModalOpen(false);
          setAuthPromptMessage(null);
        }}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Global Connectivity & Offline Status Bar */}
      <OfflineIndicator />
    </div>
  );
}
