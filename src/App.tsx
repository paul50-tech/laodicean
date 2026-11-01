import React, { useEffect, useState } from 'react';
import { TopBar } from './components/TopBar';
import { SupabaseCard } from './components/SupabaseCard';
import { AuthModal } from './components/AuthModal';
import { OnboardingModal } from './components/OnboardingModal';
import { ProfileCard } from './components/ProfileCard';
import { FloatingCreateButton } from './components/FloatingCreateButton';
import { PostComposerModal } from './components/PostComposerModal';
import { FeedSection } from './components/FeedSection';
import { PostDetailPage } from './components/PostDetailPage';
import { ReportModal, ReportTargetInfo } from './components/ReportModal';
import { AdminDashboardModal } from './components/AdminDashboardModal';
import { fetchProfile, signOut } from './lib/auth';
import { supabase } from './lib/supabase';
import { togglePostStatus } from './lib/moderation';
import { SEED_JUJA_POSTS } from './lib/posts';
import { Profile, Post, FeedPost, CommentWithAuthor } from './types';
import { UserPlus, Sparkles, ShieldCheck, Key, Plus } from 'lucide-react';

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
  const [loadingSession, setLoadingSession] = useState(true);
  const [lastCreatedPost, setLastCreatedPost] = useState<FeedPost | null>(null);
  const [authPromptMessage, setAuthPromptMessage] = useState<string | null>(null);

  // Dedicated post routing state
  const [activePostId, setActivePostId] = useState<string | null>(parsePostIdFromUrl);
  const [activePost, setActivePost] = useState<FeedPost | null>(null);

  // Moderation & Admin Dashboard state
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<ReportTargetInfo | null>(null);
  const [adminDashboardOpen, setAdminDashboardOpen] = useState(false);

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
    window.history.pushState(null, '', '/');
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
      community_id: newPost.community_id,
      community_name: 'Juja',
      community_slug: 'juja',
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
      {/* Top Bar with brand and user session */}
      <TopBar
        profile={profile}
        userEmail={currentUser?.email}
        onOpenAuth={() => setAuthModalOpen(true)}
        onOpenProfile={() => setOnboardingOpen(true)}
        onNavigateHome={handleBackToFeed}
        onOpenAdmin={() => setAdminDashboardOpen(true)}
      />

      {/* Main mobile-first container */}
      <main className="flex-1 w-full max-w-md md:max-w-xl mx-auto px-4 py-6 space-y-6">
        {activePostId ? (
          /* Dedicated Post View with its own URL, meta tags, and open discussion */
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
        ) : (
          /* Standard Juja Campus Feed & Community Hub */
          <>
            {/* Intro */}
            <section className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
                <Sparkles className="w-4 h-4" aria-hidden="true" />
                <span>Juja Campus Community Hub</span>
              </div>
              <h1 className="font-display text-2xl font-bold tracking-tight text-zinc-950">
                Laodicean
              </h1>
              <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                Campus stories, photos, and mushene from Juja (JKUAT). Post with your verified name or anonymously through your campus persona.
              </p>
            </section>

            {/* Quick Post Prompt Bar */}
            <div className="bg-white border border-stone-200/90 rounded-2xl p-3.5 shadow-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-full bg-emerald-100/70 text-emerald-800 flex items-center justify-center text-sm shrink-0 border border-emerald-200">
                  {profile?.persona_avatar || '🎓'}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-zinc-900 truncate">
                    {profile ? (
                      <>Ready to post in Juja, {profile.real_name}?</>
                    ) : (
                      <>Have something to share in Juja?</>
                    )}
                  </p>
                  <p className="text-[11px] text-zinc-500 truncate">
                    {profile?.persona_name ? (
                      <>Post as {profile.real_name} or {profile.persona_name}</>
                    ) : (
                      <>Tap to compose a Story or Photo</>
                    )}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (profile) {
                    setComposerOpen(true);
                  } else {
                    setAuthModalOpen(true);
                  }
                }}
                className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Create</span>
              </button>
            </div>

            {/* Live Posts Feed */}
            <FeedSection
              newlyCreatedPost={lastCreatedPost}
              currentUserProfile={profile}
              onRequireAuth={handleRequireAuth}
              onSelectPost={handleNavigateToPost}
              onReportPost={handleReportPost}
              onReportComment={handleReportComment}
              onToggleHidePost={handleToggleHidePost}
              onOpenComposer={() => {
                if (profile) {
                  setComposerOpen(true);
                } else {
                  handleRequireAuth('Sign in with your campus account to create a post!');
                }
              }}
            />
          </>
        )}

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

        {/* Database & Supabase Status */}
        <SupabaseCard />

        {/* Admin and Google OAuth Configuration Guidance */}
        <section aria-labelledby="oauth-guide-heading" className="bg-white border border-stone-200/90 rounded-2xl p-5 space-y-3.5">
          <h2 id="oauth-guide-heading" className="font-display text-base font-bold text-zinc-950 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-800" aria-hidden="true" />
            <span>Admin & Storage Setup</span>
          </h2>

          <div className="space-y-3 text-xs text-zinc-600 leading-relaxed">
            <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/60 text-emerald-950 space-y-0.5">
              <p className="font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                <span>Admin Privileges</span>
              </p>
              <p className="text-[11px] text-emerald-900">
                Signing in with <strong className="font-mono">pauljubilee50@gmail.com</strong> automatically grants full <strong className="font-bold">admin</strong> status, allowing you to unmask persona identities and manage communities.
              </p>
            </div>

            <div className="space-y-1.5">
              <p className="font-semibold text-zinc-900 flex items-center gap-1">
                <Key className="w-3.5 h-3.5 text-zinc-600" />
                <span>Supabase Storage Bucket Setup:</span>
              </p>
              <ol className="list-decimal list-inside space-y-1 text-[11px] text-zinc-600 pl-1">
                <li>Go to your Supabase Dashboard → <strong>Storage</strong>.</li>
                <li>Click <strong>New Bucket</strong>, name it <strong className="font-mono">posts</strong>, and toggle <strong>Public bucket</strong> to ON.</li>
                <li>Photos will automatically compress on weak campus networks and upload directly to this bucket.</li>
              </ol>
            </div>
          </div>
        </section>
      </main>

      {/* Floating Action Button for Post Creation */}
      <FloatingCreateButton
        onOpenComposer={() => setComposerOpen(true)}
      />

      {/* Post Composer Modal */}
      <PostComposerModal
        isOpen={composerOpen}
        profile={profile}
        onClose={() => setComposerOpen(false)}
        onPostCreated={handlePostCreated}
        onRequestAuth={() => setAuthModalOpen(true)}
        onRequestCreatePersona={() => {
          setComposerOpen(false);
          setOnboardingOpen(true);
        }}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        promptMessage={authPromptMessage}
        onClose={() => {
          setAuthModalOpen(false);
          setAuthPromptMessage(null);
        }}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Onboarding & Edit Persona Modal */}
      {profile && (
        <OnboardingModal
          profile={profile}
          isOpen={onboardingOpen}
          onClose={() => setOnboardingOpen(false)}
          onProfileUpdated={(updated) => setProfile(updated)}
        />
      )}

      {/* Report Modal */}
      <ReportModal
        isOpen={reportModalOpen}
        target={reportTarget}
        reporterId={profile?.id || 'guest_user'}
        onClose={() => {
          setReportModalOpen(false);
          setReportTarget(null);
        }}
      />

      {/* Admin Dashboard Modal */}
      <AdminDashboardModal
        isOpen={adminDashboardOpen}
        currentUserProfile={profile}
        posts={lastCreatedPost ? [lastCreatedPost, ...SEED_JUJA_POSTS] : SEED_JUJA_POSTS}
        onClose={() => setAdminDashboardOpen(false)}
        onPostStatusChange={handleToggleHidePost}
        onNavigateToPost={handleNavigateToPost}
      />
    </div>
  );
}
