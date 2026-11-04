import React, { useEffect, useState } from 'react';
import { CommentWithAuthor, FeedPost, Profile } from '../types';
import { fetchPostById, SEED_JUJA_POSTS } from '../lib/posts';
import { updateSocialMetaTags } from '../lib/seo';
import { ReactionsBar } from './ReactionsBar';
import { CommentsSection } from './CommentsSection';
import { ShareModal } from './ShareModal';
import { PollCardContent } from './PollCardContent';
import {
  ArrowLeft,
  Share2,
  Clock,
  CheckCircle2,
  ShieldAlert,
  MessageCircle,
  FileText,
  Image as ImageIcon,
  ExternalLink,
  Sparkles,
  Flag,
  Calendar,
  MapPin,
  Quote,
  Users,
  Check,
  Smartphone,
} from 'lucide-react';
import { ShareCardModal } from './ShareCardModal';

interface PostDetailPageProps {
  postId: string;
  initialPost?: FeedPost | null;
  currentUserProfile?: Profile | null;
  onBack: () => void;
  onNavigateToPost: (id: string) => void;
  onRequireAuth: (message: string) => void;
  onReportPost?: (post: FeedPost) => void;
  onReportComment?: (comment: CommentWithAuthor) => void;
}

export function PostDetailPage({
  postId,
  initialPost,
  currentUserProfile,
  onBack,
  onNavigateToPost,
  onRequireAuth,
  onReportPost,
  onReportComment,
}: PostDetailPageProps) {
  const [post, setPost] = useState<FeedPost | null>(initialPost || null);
  const [loading, setLoading] = useState(!initialPost);
  const [error, setError] = useState<string | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareCardModalOpen, setShareCardModalOpen] = useState(false);
  const [commentsCount, setCommentsCount] = useState(initialPost?.comments_count ?? 0);
  const [hasRsvped, setHasRsvped] = useState<boolean>(() => {
    if (initialPost?.event_data?.user_has_rsvped) return true;
    try {
      return localStorage.getItem(`juja_rsvp_${postId}`) === 'true';
    } catch {
      return false;
    }
  });
  const [rsvpCount, setRsvpCount] = useState<number>(initialPost?.event_data?.rsvp_count ?? 0);

  const handleToggleRsvp = () => {
    if (!currentUserProfile) {
      onRequireAuth('Please log in to RSVP for this campus event.');
      return;
    }
    const nextState = !hasRsvped;
    setHasRsvped(nextState);
    setRsvpCount((prev) => Math.max(0, prev + (nextState ? 1 : -1)));
    try {
      const key = `juja_rsvp_${postId}`;
      if (nextState) {
        localStorage.setItem(key, 'true');
      } else {
        localStorage.removeItem(key);
      }
    } catch {
      // storage error ignored
    }
  };

  // Fetch post data if not already provided or if postId changes
  useEffect(() => {
    let active = true;

    async function loadPost() {
      if (initialPost && initialPost.id === postId) {
        setPost(initialPost);
        setCommentsCount(initialPost.comments_count ?? 0);
        if (initialPost.event_data) {
          setRsvpCount(initialPost.event_data.rsvp_count ?? 0);
        }
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const found = await fetchPostById(postId);
        if (!active) return;

        if (found) {
          setPost(found);
          setCommentsCount(found.comments_count ?? 0);
          if (found.event_data) {
            setRsvpCount(found.event_data.rsvp_count ?? 0);
          }
        } else {
          setError('Post not found or it may have been removed.');
        }
      } catch (err: any) {
        if (!active) return;
        setError('Unable to load this post. Please check your connection.');
      } finally {
        if (active) setLoading(false);
      }
    }

    loadPost();

    return () => {
      active = false;
    };
  }, [postId, initialPost]);

  // Dynamically update Open Graph & Twitter meta tags in document head
  useEffect(() => {
    if (!post) return;
    const cleanup = updateSocialMetaTags(post);
    return cleanup;
  }, [post]);

  const getPostTypeBadge = (type: string) => {
    switch (type) {
      case 'story':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-900 border border-emerald-200">
            <FileText className="w-3.5 h-3.5 text-emerald-700" />
            <span>Story</span>
          </span>
        );
      case 'photo':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-950 border border-amber-200">
            <ImageIcon className="w-3.5 h-3.5 text-amber-700" />
            <span>Photo</span>
          </span>
        );
      case 'mushene':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-900 border border-rose-200">
            <span>🗣️</span>
            <span>Mushene</span>
          </span>
        );
      case 'event':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-900 border border-indigo-200">
            <span>📅</span>
            <span>Event</span>
          </span>
        );
      case 'confession':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-900 border border-purple-200">
            <span>🤫</span>
            <span>Confession</span>
          </span>
        );
      case 'poll':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-900 border border-blue-200">
            <span>📊</span>
            <span>Poll</span>
          </span>
        );
      case 'meme':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-950 border border-orange-200">
            <span>😂</span>
            <span>Meme</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-800">
            <span>{type}</span>
          </span>
        );
    }
  };

  const formatRelativeTime = (isoString?: string) => {
    if (!isoString) return 'Recently';
    try {
      const date = new Date(isoString);
      const diffMinutes = Math.floor((Date.now() - date.getTime()) / (1000 * 60));
      if (diffMinutes < 1) return 'Just now';
      if (diffMinutes < 60) return `${diffMinutes}m ago`;
      const diffHours = Math.floor(diffMinutes / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return 'Recently';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-800 hover:text-emerald-950 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Juja Feed</span>
        </button>
        <div className="bg-white border border-stone-200 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-stone-200" />
            <div className="space-y-1.5 flex-1">
              <div className="h-4 bg-stone-200 rounded w-1/3" />
              <div className="h-3 bg-stone-100 rounded w-1/4" />
            </div>
          </div>
          <div className="h-6 bg-stone-200 rounded w-3/4" />
          <div className="space-y-2">
            <div className="h-4 bg-stone-100 rounded w-full" />
            <div className="h-4 bg-stone-100 rounded w-5/6" />
            <div className="h-4 bg-stone-100 rounded w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="bg-white border border-stone-200 rounded-2xl p-6 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 mx-auto flex items-center justify-center">
          <FileText className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h2 className="font-display text-base font-bold text-zinc-950">
            Post Unavailable
          </h2>
          <p className="text-xs text-zinc-500 max-w-xs mx-auto">
            {error || 'This campus post could not be loaded.'}
          </p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 rounded-xl bg-emerald-800 text-white text-xs font-semibold hover:bg-emerald-900 transition-colors cursor-pointer"
        >
          Back to Juja Campus Feed
        </button>
      </div>
    );
  }

  if (post.status === 'hidden' && currentUserProfile?.role !== 'admin') {
    return (
      <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-6 text-center space-y-4 shadow-xs">
        <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-800 mx-auto flex items-center justify-center">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div className="space-y-1.5">
          <h2 className="font-display text-base font-bold text-amber-950">
            Post Temporarily Hidden
          </h2>
          <p className="text-xs text-amber-800/90 max-w-sm mx-auto leading-relaxed">
            This campus post has received multiple student reports and has been automatically hidden pending moderation review by Juja campus admins.
          </p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 rounded-xl bg-amber-900 text-white text-xs font-semibold hover:bg-amber-950 transition-colors cursor-pointer"
        >
          Back to Juja Campus Feed
        </button>
      </div>
    );
  }

  // Related posts from Juja excluding this one
  const relatedPosts = SEED_JUJA_POSTS.filter((p) => p.id !== post.id).slice(0, 3);

  return (
    <div className="space-y-4">
      {/* Top Navigation & Action Bar */}
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onBack}
          className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-stone-200 text-xs font-semibold text-zinc-700 hover:text-emerald-900 hover:border-emerald-200 transition-colors shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4 text-emerald-800" />
          <span>Back to Juja Feed</span>
        </button>

        <div className="flex items-center gap-2">
          {onReportPost && (
            <button
              type="button"
              onClick={() => onReportPost(post)}
              className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-stone-200 text-xs font-semibold text-stone-600 hover:text-rose-700 hover:border-rose-300 hover:bg-rose-50 transition-colors shadow-2xs"
              title="Report post to moderators"
            >
              <Flag className="w-3.5 h-3.5 text-stone-400" />
              <span>Report</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShareCardModalOpen(true)}
            className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-950 text-xs font-bold transition-colors border border-emerald-300 shadow-2xs"
            title="Generate 1080x1920 WhatsApp Status card"
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-800" />
            <span>Share as card</span>
          </button>

          <button
            type="button"
            onClick={() => setShareModalOpen(true)}
            className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold transition-colors shadow-xs"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share Link</span>
          </button>
        </div>
      </div>

      {/* Main Post Article Card */}
      <article className="bg-white border border-stone-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        {post.status === 'hidden' && currentUserProfile?.role === 'admin' && (
          <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl flex items-center justify-between gap-2 text-xs text-amber-950 font-medium">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                <strong>Admin Notice:</strong> This post is currently <strong>auto-hidden</strong> from students due to community reports.
              </span>
            </div>
          </div>
        )}

        {/* Header: Author Identity & Post Type */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Avatar */}
            <div className="w-11 h-11 rounded-full bg-stone-100 flex items-center justify-center text-xl shrink-0 border border-stone-200 shadow-2xs">
              {post.is_persona ? post.persona_avatar || '🎭' : '👤'}
            </div>

            {/* Author Meta */}
            <div className="min-w-0 leading-tight">
              <div className="flex items-center gap-1.5 flex-wrap">
                {post.is_persona ? (
                  <>
                    <span className="font-mono text-sm font-bold text-zinc-950 truncate">
                      {post.persona_name}
                    </span>
                    <span className="text-[10px] font-medium text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200/70">
                      Persona
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-sm font-bold text-zinc-950 truncate">
                      {post.author_real_name || 'Campus Member'}
                    </span>
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/70">
                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                      <span>Real Name</span>
                    </span>
                  </>
                )}

                {/* Admin unmask indicator if applicable (visible strictly to admins) */}
                {post.is_persona && post.author_real_name && currentUserProfile?.role === 'admin' && (
                  <span
                    title={`Admin View: Verified student identity is ${post.author_real_name}`}
                    className="text-[9px] font-mono text-amber-900 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded flex items-center gap-0.5"
                  >
                    <ShieldAlert className="w-2.5 h-2.5 text-amber-700" />
                    <span>Admin: {post.author_real_name}</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{formatRelativeTime(post.created_at)}</span>
                <span>•</span>
                <span className="text-zinc-600 font-medium">{post.community_name || 'Juja'} Campus</span>
              </div>
            </div>
          </div>

          <div className="shrink-0">
            {getPostTypeBadge(post.post_type)}
          </div>
        </div>

        {/* Title */}
        {post.title && (
          <h1 className="font-display text-xl sm:text-2xl font-bold text-zinc-950 leading-snug">
            {post.title}
          </h1>
        )}

        {/* Post Content based on type */}
        {post.post_type === 'mushene' ? (
          <div className="relative rounded-2xl bg-gradient-to-br from-rose-50/70 via-stone-50/80 to-amber-50/40 border border-rose-200/90 p-5 sm:p-6 shadow-2xs overflow-hidden">
            <div className="absolute right-4 -bottom-3 text-rose-200/30 select-none pointer-events-none" aria-hidden="true">
              <Quote className="w-20 h-20" />
            </div>
            <div className="relative z-10 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-rose-800">
                <span className="text-base">🔥</span>
                <span>Juja Street Mushene</span>
              </div>
              <p className="font-display text-base sm:text-lg font-semibold text-stone-900 leading-relaxed tracking-tight whitespace-pre-line">
                {post.body}
              </p>
            </div>
          </div>
        ) : post.post_type === 'event' ? (
          <div className="bg-indigo-50/60 border border-indigo-200/80 rounded-2xl p-5 space-y-4">
            <div className="flex flex-wrap items-center gap-2.5 text-xs text-indigo-950 font-medium">
              <div className="inline-flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-indigo-200 shadow-2xs font-bold">
                <Calendar className="w-4 h-4 text-indigo-700" />
                <span>{post.event_data?.event_date || 'Upcoming Date'}</span>
              </div>
              <div className="inline-flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-indigo-200 shadow-2xs font-semibold">
                <MapPin className="w-4 h-4 text-rose-600" />
                <span>{post.event_data?.event_place || 'Juja Campus'}</span>
              </div>
            </div>

            <div className="text-sm sm:text-base text-stone-800 leading-relaxed whitespace-pre-line font-normal space-y-2">
              {post.body}
            </div>

            <div className="pt-3 border-t border-indigo-100 flex items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 text-xs text-indigo-900 font-medium">
                <Users className="w-4 h-4 text-indigo-600" />
                <span><strong className="font-bold">{rsvpCount}</strong> students attending</span>
              </div>

              <button
                type="button"
                onClick={handleToggleRsvp}
                className={`cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs ${
                  hasRsvped
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700 border border-emerald-700'
                    : 'bg-indigo-900 text-white hover:bg-indigo-950 border border-indigo-950'
                }`}
              >
                {hasRsvped ? (
                  <>
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>Going ✓</span>
                  </>
                ) : (
                  <span>RSVP Now</span>
                )}
              </button>
            </div>
          </div>
        ) : post.post_type !== 'poll' ? (
          <div className="text-sm sm:text-base text-zinc-800 leading-relaxed space-y-3 whitespace-pre-line font-normal">
            {post.body}
          </div>
        ) : null}

        {/* Interactive Poll Component if post is a poll */}
        {post.post_type === 'poll' && (
          <PollCardContent
            postId={post.id}
            initialPoll={post.poll_data}
            currentUserProfile={currentUserProfile}
            onRequireAuth={onRequireAuth}
          />
        )}

        {/* Post Image (Full size with responsive container) */}
        {post.image_url && (
          <div className="rounded-xl overflow-hidden border border-stone-200/90 bg-stone-100 w-full">
            <img
              src={post.image_url}
              alt={post.title || `${post.post_type} in Juja`}
              loading="eager"
              decoding="async"
              className="w-full h-auto max-h-[500px] object-cover"
              onError={(e) => {
                (e.currentTarget.parentElement as HTMLElement).style.display = 'none';
              }}
            />
          </div>
        )}

        {/* Campus Reactions Bar */}
        <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3">
          <ReactionsBar
            postId={post.id}
            initialCounts={post.reactions_count}
            currentUserProfile={currentUserProfile}
            onRequireAuth={onRequireAuth}
          />

          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span className="inline-flex items-center gap-1 bg-stone-100 px-2 py-1 rounded-lg">
              <MessageCircle className="w-3.5 h-3.5 text-emerald-800" />
              <span className="font-semibold text-zinc-800">{commentsCount}</span>
              <span className="hidden xs:inline">Comments</span>
            </span>

            <button
              type="button"
              onClick={() => setShareModalOpen(true)}
              className="cursor-pointer inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 transition-colors border border-emerald-200"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </button>

            {onReportPost && (
              <button
                type="button"
                onClick={() => onReportPost(post)}
                className="cursor-pointer inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-stone-500 hover:text-rose-700 hover:bg-rose-50 transition-colors border border-stone-200/80"
                title="Report post"
              >
                <Flag className="w-3.5 h-3.5 text-stone-400" />
                <span>Report</span>
              </button>
            )}
          </div>
        </div>

        {/* Direct WhatsApp Share Highlight Banner */}
        <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-bold text-emerald-950">
              Share this story with campus groups
            </p>
            <p className="text-[11px] text-emerald-800 truncate">
              Includes instant teaser & preview card for WhatsApp
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShareCardModalOpen(true)}
              className="cursor-pointer px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs"
              title="Generate 1080x1920 WhatsApp Status Card"
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-300" />
              <span>Status Card</span>
            </button>
            <button
              type="button"
              onClick={() => setShareModalOpen(true)}
              className="cursor-pointer px-3 py-1.5 rounded-lg bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-semibold inline-flex items-center gap-1 shadow-2xs"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </button>
          </div>
        </div>
      </article>

      {/* Threaded Comments Section (Open by default on dedicated post page) */}
      <section className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-emerald-800" />
            <h2 className="font-display text-sm font-bold text-zinc-950">
              Discussion & Replies ({commentsCount})
            </h2>
          </div>
          <span className="text-[11px] text-zinc-400">
            Open campus thread
          </span>
        </div>

        <CommentsSection
          postId={post.id}
          currentUserProfile={currentUserProfile}
          onRequireAuth={onRequireAuth}
          onCommentCountChange={setCommentsCount}
          onReportComment={onReportComment}
        />
      </section>

      {/* Related Posts from Juja Campus */}
      {relatedPosts.length > 0 && (
        <section className="space-y-2 pt-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 uppercase tracking-wider px-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-800" />
            <span>More from Juja Campus</span>
          </div>

          <div className="space-y-2">
            {relatedPosts.map((related) => (
              <div
                key={related.id}
                onClick={() => onNavigateToPost(related.id)}
                className="cursor-pointer bg-white border border-stone-200/80 hover:border-emerald-300 rounded-xl p-3 transition-all flex items-center justify-between gap-3 shadow-2xs group"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 mb-0.5">
                    <span>{related.is_persona ? related.persona_avatar : '👤'}</span>
                    <span className="font-medium text-zinc-600 truncate">
                      {related.is_persona ? related.persona_name : related.author_real_name}
                    </span>
                    <span>•</span>
                    <span className="capitalize">{related.post_type}</span>
                  </div>
                  <h4 className="text-xs font-bold text-zinc-900 group-hover:text-emerald-900 line-clamp-1">
                    {related.title || related.body}
                  </h4>
                </div>
                <ExternalLink className="w-4 h-4 text-zinc-400 group-hover:text-emerald-800 shrink-0" />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Share Modal Dialog */}
      <ShareModal
        post={post}
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
      />

      {/* 1080x1920 WhatsApp Status Card Modal */}
      <ShareCardModal
        post={post}
        isOpen={shareCardModalOpen}
        onClose={() => setShareCardModalOpen(false)}
      />
    </div>
  );
}
