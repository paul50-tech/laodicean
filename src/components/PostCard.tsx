import React, { useState, useRef, useEffect } from 'react';
import { CommentWithAuthor, FeedPost, PostType, Profile } from '../types';
import { truncateTeaser } from '../lib/posts';
import { ReactionsBar } from './ReactionsBar';
import { CommentsSection } from './CommentsSection';
import { ShareModal } from './ShareModal';
import { PollCardContent } from './PollCardContent';
import {
  Clock,
  MessageCircle,
  Share2,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  ExternalLink,
  Flag,
  Eye,
  EyeOff,
  Calendar,
  MapPin,
  Quote,
  Users,
  Check,
  Smartphone,
  Bell,
  BellRing,
  HelpCircle,
  MoreHorizontal,
  Link as LinkIcon,
  Pin,
} from 'lucide-react';
import { ShareCardModal } from './ShareCardModal';
import { ProfileBadgeTag } from './ProfileBadgeTag';
import { isPostFollowed, toggleFollowPost } from '../lib/postNotifications';

interface PostCardProps {
  post: FeedPost;
  currentUserProfile?: Profile | null;
  onRequireAuth: (message: string) => void;
  onSelectPost?: (post: FeedPost) => void;
  isPinned?: boolean;
  onTogglePin?: (postId: string) => void;
  onReportPost?: (post: FeedPost) => void;
  onReportComment?: (comment: CommentWithAuthor) => void;
  onToggleHidePost?: (postId: string, currentStatus?: 'live' | 'hidden') => void;
}

export function PostCard({
  post,
  currentUserProfile,
  onRequireAuth,
  onSelectPost,
  isPinned = false,
  onTogglePin,
  onReportPost,
  onReportComment,
  onToggleHidePost,
}: PostCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentsCount, setCommentsCount] = useState(post.comments_count ?? 0);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareCardModalOpen, setShareCardModalOpen] = useState(false);
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const moreMenuRef = useRef<HTMLDivElement | null>(null);
  const shareMenuRef = useRef<HTMLDivElement | null>(null);

  const [hasRsvped, setHasRsvped] = useState<boolean>(() => {
    if (post.event_data?.user_has_rsvped) return true;
    try {
      return localStorage.getItem(`juja_rsvp_${post.id}`) === 'true';
    } catch {
      return false;
    }
  });
  const [rsvpCount, setRsvpCount] = useState<number>(post.event_data?.rsvp_count ?? 0);
  const [isFollowed, setIsFollowed] = useState<boolean>(() => isPostFollowed(post.id));
  const [followToast, setFollowToast] = useState<string | null>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setMoreMenuOpen(false);
      }
      if (shareMenuRef.current && !shareMenuRef.current.contains(e.target as Node)) {
        setShareMenuOpen(false);
      }
    };
    if (moreMenuOpen || shareMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [moreMenuOpen, shareMenuOpen]);

  const handleToggleFollow = (e: React.MouseEvent) => {
    e.stopPropagation();
    const res = toggleFollowPost(post.id);
    setIsFollowed(res.isFollowed);
    setFollowToast(res.isFollowed ? '🔔 Notifications turned on for this post' : '🔕 Notifications muted');
    setTimeout(() => setFollowToast(null), 2500);
  };

  const handleCopyLink = async () => {
    try {
      const url = `${window.location.origin}/p/${encodeURIComponent(post.id)}`;
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // fallback
    }
    setMoreMenuOpen(false);
    setShareMenuOpen(false);
  };

  const handleToggleRsvp = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUserProfile) {
      onRequireAuth('Please log in to RSVP for this campus event.');
      return;
    }
    const nextState = !hasRsvped;
    setHasRsvped(nextState);
    setRsvpCount((prev) => Math.max(0, prev + (nextState ? 1 : -1)));
    try {
      const key = `juja_rsvp_${post.id}`;
      if (nextState) {
        localStorage.setItem(key, 'true');
      } else {
        localStorage.removeItem(key);
      }
    } catch {
      // storage error ignored
    }
  };

  const { teaser, isTruncated } = truncateTeaser(post.body, 175);

  const getPostTypeBadge = (type: PostType) => {
    switch (type) {
      case 'story':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-900 border border-emerald-200">
            <FileText className="w-3 h-3 text-emerald-700" />
            <span>Story</span>
          </span>
        );
      case 'photo':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-950 border border-amber-200">
            <ImageIcon className="w-3 h-3 text-amber-700" />
            <span>Photo</span>
          </span>
        );
      case 'mushene':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-900 border border-rose-200">
            <span>🗣️</span>
            <span>Mushene</span>
          </span>
        );
      case 'event':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-900 border border-indigo-200">
            <span>📅</span>
            <span>Event</span>
          </span>
        );
      case 'confession':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-900 border border-purple-200">
            <span>🤫</span>
            <span>Confession</span>
          </span>
        );
      case 'poll':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-900 border border-blue-200">
            <span>📊</span>
            <span>Poll</span>
          </span>
        );
      case 'meme':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-50 text-orange-950 border border-orange-200">
            <span>😂</span>
            <span>Meme</span>
          </span>
        );
      case 'ask_juja':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-50 text-cyan-900 border border-cyan-200">
            <span>❓</span>
            <span>Ask Juja</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-100 text-stone-800">
            <span>{type}</span>
          </span>
        );
    }
  };

  const formatRelativeTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const diffMinutes = Math.floor((Date.now() - date.getTime()) / (1000 * 60));
      if (diffMinutes < 1) return 'Just now';
      if (diffMinutes < 60) return `${diffMinutes}m ago`;
      const diffHours = Math.floor(diffMinutes / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return 'Recently';
    }
  };

  const isModeratorOrAdmin =
    currentUserProfile?.role === 'admin' ||
    currentUserProfile?.role === 'moderator';

  return (
    <article
      className={`bg-white rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5 transition-all ${
        isPinned
          ? 'border-2 border-amber-300 ring-2 ring-amber-200/50 hover:border-amber-400'
          : 'border border-stone-200/90 hover:border-stone-300'
      }`}
    >
      {/* Pinned Meme of the Week Banner */}
      {post.is_meme_of_week && (
        <div className="bg-gradient-to-r from-orange-500/15 via-amber-400/20 to-orange-500/15 border-b border-orange-200/90 -mx-4 -mt-4 mb-3 sm:-mx-5 sm:-mt-5 sm:mb-3.5 px-4 py-2 sm:px-5 flex items-center justify-between text-orange-950 font-semibold text-xs rounded-t-2xl">
          <div className="flex items-center gap-1.5">
            <span className="text-sm">🏆</span>
            <span className="tracking-tight font-bold">Meme of the Week Winner</span>
          </div>
          <span className="text-[10px] font-mono text-orange-950 bg-orange-100 px-1.5 py-0.5 rounded border border-orange-300 uppercase tracking-wider font-bold">
            👑 Pinned Champion
          </span>
        </div>
      )}

      {/* Pinned Poll of the Week Banner */}
      {isPinned && !post.is_meme_of_week && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-400/20 to-amber-500/10 border-b border-amber-200/80 -mx-4 -mt-4 mb-3 sm:-mx-5 sm:-mt-5 sm:mb-3.5 px-4 py-2 sm:px-5 flex items-center justify-between text-amber-950 font-semibold text-xs rounded-t-2xl">
          <div className="flex items-center gap-1.5">
            <span className="text-sm">📌</span>
            <span className="tracking-tight">Pinned Campus Spotlight</span>
          </div>
          <span className="text-[10px] font-mono text-amber-900 bg-amber-100/90 px-1.5 py-0.5 rounded border border-amber-300/80 uppercase tracking-wider font-bold">
            Pinned
          </span>
        </div>
      )}

      {/* Header: Author Identity & Overflow Menu (Jakob's Law) */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-lg shrink-0 border border-stone-200 shadow-2xs">
            {post.is_persona ? post.persona_avatar || '🎭' : '👤'}
          </div>

          {/* Name & Handle */}
          <div className="min-w-0 leading-tight">
            <div className="flex items-center gap-1.5 flex-wrap">
              {post.is_persona ? (
                <>
                  <span className="font-mono text-xs font-bold text-zinc-900 truncate">
                    {post.persona_name}
                  </span>
                  <span className="text-[10px] font-medium text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200/70">
                    Persona
                  </span>
                </>
              ) : (
                <>
                  <span className="text-xs font-bold text-zinc-900 truncate">
                    {/paul\s*jubilee/i.test(post.author_real_name || '') || post.author_real_name === 'pauljubilee50'
                      ? 'Tech Expo Committee'
                      : (post.author_real_name || 'Campus Member')}
                  </span>
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/70">
                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                    <span>Real Name</span>
                  </span>
                </>
              )}

              {/* Badges for author */}
              <ProfileBadgeTag
                badges={post.badges}
                authorName={post.author_real_name}
                personaName={post.persona_name}
                commentsCount={post.comments_count}
                postType={post.post_type}
                isMemeWinner={post.is_meme_of_week}
              />

              {/* Admin unmask indicator */}
              {post.is_persona && currentUserProfile?.role === 'admin' && (
                <span
                  title={`Admin View: Verified student identity is ${post.author_real_name || 'Student Verified'}`}
                  className="text-[9px] font-mono text-amber-950 bg-amber-100/90 border border-amber-300 px-1.5 py-0.5 rounded flex items-center gap-1 font-bold shadow-2xs"
                >
                  <ShieldAlert className="w-2.5 h-2.5 text-amber-700" />
                  <span>Admin: {post.author_real_name || 'Verified Student'}</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-1 text-[11px] text-zinc-400 mt-0.5">
              <Clock className="w-3 h-3" />
              <span>{formatRelativeTime(post.created_at)}</span>
              <span>•</span>
              <span className="text-zinc-500 font-medium">{post.community_name || 'Juja'}</span>
            </div>
          </div>
        </div>

        {/* Right Header: Post Type Badge & Standard '···' Overflow Menu */}
        <div className="flex items-center gap-1.5 shrink-0">
          {post.status === 'hidden' && (
            <span className="text-[10px] font-bold text-rose-800 bg-rose-100 px-1.5 py-0.5 rounded border border-rose-300">
              Hidden
            </span>
          )}

          {getPostTypeBadge(post.post_type)}

          {/* Standard '···' Overflow Menu (Familiar Twitter/Reddit/LinkedIn pattern) */}
          <div className="relative" ref={moreMenuRef}>
            <button
              type="button"
              onClick={() => setMoreMenuOpen(!moreMenuOpen)}
              aria-expanded={moreMenuOpen}
              className="w-8 h-8 rounded-full text-zinc-400 hover:text-zinc-800 hover:bg-stone-100 flex items-center justify-center transition-colors cursor-pointer"
              title="More post options"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {moreMenuOpen && (
              <div
                role="menu"
                className="absolute right-0 mt-1 w-52 bg-white rounded-2xl shadow-lg border border-stone-200/90 py-1.5 z-40 animate-in fade-in zoom-in-95 duration-100"
              >
                {/* Dedicated post page */}
                {onSelectPost && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMoreMenuOpen(false);
                      onSelectPost(post);
                    }}
                    className="cursor-pointer w-full text-left px-3.5 py-2 text-xs flex items-center gap-2.5 hover:bg-stone-50 transition-colors text-stone-700"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-stone-500" />
                    <span>Open full post page</span>
                  </button>
                )}

                {/* Copy link */}
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleCopyLink}
                  className="cursor-pointer w-full text-left px-3.5 py-2 text-xs flex items-center gap-2.5 hover:bg-stone-50 transition-colors text-stone-700"
                >
                  <LinkIcon className="w-3.5 h-3.5 text-stone-500" />
                  <span>{copiedLink ? 'Link copied! ✓' : 'Copy link to post'}</span>
                </button>

                {/* Report post */}
                {onReportPost && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMoreMenuOpen(false);
                      onReportPost(post);
                    }}
                    className="cursor-pointer w-full text-left px-3.5 py-2 text-xs flex items-center gap-2.5 hover:bg-rose-50 text-rose-700 transition-colors"
                  >
                    <Flag className="w-3.5 h-3.5 text-rose-600" />
                    <span>Report post</span>
                  </button>
                )}

                {/* Moderator / Admin Actions */}
                {isModeratorOrAdmin && (
                  <>
                    <div className="my-1 border-t border-stone-100" />

                    {/* Toggle Pin (admin only for polls or spotlights) */}
                    {currentUserProfile?.role === 'admin' && onTogglePin && (
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setMoreMenuOpen(false);
                          onTogglePin(post.id);
                        }}
                        className="cursor-pointer w-full text-left px-3.5 py-2 text-xs flex items-center gap-2.5 hover:bg-amber-50 text-amber-900 transition-colors font-medium"
                      >
                        <Pin className="w-3.5 h-3.5 text-amber-700" />
                        <span>{isPinned ? 'Unpin from top' : 'Pin to top of feed'}</span>
                      </button>
                    )}

                    {/* Toggle Hide */}
                    {onToggleHidePost && (
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setMoreMenuOpen(false);
                          onToggleHidePost(post.id, post.status === 'hidden' ? 'hidden' : 'live');
                        }}
                        className="cursor-pointer w-full text-left px-3.5 py-2 text-xs flex items-center gap-2.5 hover:bg-stone-100 text-stone-700 transition-colors font-medium"
                      >
                        {post.status === 'hidden' ? (
                          <>
                            <Eye className="w-3.5 h-3.5 text-emerald-700" />
                            <span>Restore post to feed</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3.5 h-3.5 text-rose-700" />
                            <span>Hide post from feed</span>
                          </>
                        )}
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Post Title */}
      {post.title && (
        <h3
          onClick={() => onSelectPost && onSelectPost(post)}
          className={`font-display text-base font-bold text-zinc-950 leading-snug ${
            onSelectPost ? 'cursor-pointer hover:text-emerald-900 transition-colors' : ''
          }`}
        >
          {post.title}
        </h3>
      )}

      {/* Card Content based on post type */}
      {post.post_type === 'poll' ? (
        <PollCardContent
          postId={post.id}
          initialPoll={post.poll_data}
          currentUserProfile={currentUserProfile}
          onRequireAuth={onRequireAuth}
          isPinned={isPinned}
          onTogglePin={onTogglePin}
        />
      ) : post.post_type === 'mushene' ? (
        /* Text-First Punchy Street Story Card Design for Mushene */
        <div className="relative rounded-2xl bg-gradient-to-br from-rose-50/70 via-stone-50/80 to-amber-50/40 border border-rose-200/90 p-4 sm:p-5 shadow-2xs overflow-hidden">
          <div className="absolute right-3 -bottom-2 text-rose-200/30 select-none pointer-events-none" aria-hidden="true">
            <Quote className="w-16 h-16" />
          </div>
          <div className="relative z-10 space-y-2">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-rose-800">
              <span className="text-sm">🔥</span>
              <span>Juja Street Mushene</span>
            </div>
            <p className="font-display text-sm sm:text-base font-semibold text-stone-900 leading-snug tracking-tight whitespace-pre-line">
              {isTruncated && !isExpanded ? teaser : post.body}
            </p>
            {isTruncated && (
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="cursor-pointer text-xs font-bold text-rose-900 hover:text-rose-950 inline-flex items-center gap-0.5 transition-colors"
                >
                  <span>{isExpanded ? 'Show less' : 'Read full mushene'}</span>
                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}
          </div>
        </div>
      ) : post.post_type === 'event' ? (
        /* Structured Event Card Design */
        <div className="bg-indigo-50/60 border border-indigo-200/80 rounded-2xl p-4 sm:p-4.5 space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-xs text-indigo-950 font-medium">
            <div className="inline-flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-indigo-200 shadow-2xs font-bold">
              <Calendar className="w-3.5 h-3.5 text-indigo-700" />
              <span>{post.event_data?.event_date || 'Upcoming Date'}</span>
            </div>
            <div className="inline-flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-indigo-200 shadow-2xs font-semibold">
              <MapPin className="w-3.5 h-3.5 text-rose-600" />
              <span>{post.event_data?.event_place || 'Juja Campus'}</span>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-stone-800 leading-relaxed whitespace-pre-line font-normal">
            {isTruncated && !isExpanded ? teaser : post.body}
          </p>

          {isTruncated && (
            <div className="flex items-center gap-3 pt-0.5">
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="cursor-pointer text-xs font-semibold text-indigo-800 hover:text-indigo-950 inline-flex items-center gap-0.5 transition-colors"
              >
                <span>{isExpanded ? 'Show less' : 'Read more details'}</span>
                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}

          <div className="pt-2 border-t border-indigo-100 flex items-center justify-between gap-2">
            <div className="inline-flex items-center gap-1.5 text-xs text-indigo-900 font-medium">
              <Users className="w-3.5 h-3.5 text-indigo-600" />
              <span><strong className="font-bold">{rsvpCount}</strong> attending</span>
            </div>

            <button
              type="button"
              onClick={handleToggleRsvp}
              className={`cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs ${
                hasRsvped
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700 border border-emerald-700'
                  : 'bg-indigo-900 text-white hover:bg-indigo-950 border border-indigo-950'
              }`}
            >
              {hasRsvped ? (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Going ✓</span>
                </>
              ) : (
                <span>RSVP Now</span>
              )}
            </button>
          </div>
        </div>
      ) : post.post_type === 'ask_juja' ? (
        /* Ask Juja Question Card */
        <div className="bg-gradient-to-br from-cyan-50/80 via-white to-sky-50/50 border border-cyan-200/90 rounded-2xl p-4 sm:p-5 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between gap-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-100 text-cyan-950 border border-cyan-300">
              <HelpCircle className="w-3.5 h-3.5 text-cyan-700" />
              <span>Ask Juja Question</span>
            </div>
            <span className="text-[11px] text-cyan-900 font-medium">
              Juja campus answers
            </span>
          </div>

          <div className="space-y-1.5">
            <p className="font-display text-sm sm:text-base font-bold text-zinc-950 leading-snug">
              {isTruncated && !isExpanded ? teaser : post.body}
            </p>
            {isTruncated && (
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="cursor-pointer text-xs font-semibold text-cyan-800 hover:text-cyan-950 inline-flex items-center gap-0.5 transition-colors"
              >
                <span>{isExpanded ? 'Show less' : 'Read full question'}</span>
                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>

          <div className="pt-2 border-t border-cyan-100 flex items-center justify-between gap-2">
            <span className="text-xs text-cyan-900 font-medium">
              {commentsCount === 0 ? 'No answers yet • Be first to help' : `${commentsCount} answer${commentsCount === 1 ? '' : 's'}`}
            </span>
            <button
              type="button"
              onClick={() => setShowComments(true)}
              className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-cyan-700 text-white hover:bg-cyan-800 transition-colors shadow-2xs"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Answer Question</span>
            </button>
          </div>
        </div>
      ) : (
        /* Regular Post Body */
        <div className="text-xs sm:text-sm text-zinc-700 leading-relaxed space-y-1.5">
          <p className="whitespace-pre-line">
            {isTruncated && !isExpanded ? teaser : post.body}
          </p>

          {isTruncated && (
            <div className="flex items-center gap-3 pt-0.5">
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="cursor-pointer text-xs font-semibold text-emerald-800 hover:text-emerald-950 inline-flex items-center gap-0.5 transition-colors"
              >
                <span>{isExpanded ? 'Show less' : 'Read more'}</span>
                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {onSelectPost && (
                <button
                  type="button"
                  onClick={() => onSelectPost(post)}
                  className="cursor-pointer text-xs text-zinc-500 hover:text-emerald-800 inline-flex items-center gap-1 transition-colors"
                >
                  <span>Full post page</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Lazy-Loaded Image */}
      {post.image_url && (
        <div
          onClick={() => onSelectPost && onSelectPost(post)}
          className={`rounded-xl overflow-hidden border border-stone-200/90 bg-stone-100 max-h-96 w-full ${
            onSelectPost ? 'cursor-pointer' : ''
          }`}
        >
          <img
            src={post.image_url}
            alt={post.title || `${post.post_type} in Juja`}
            loading="lazy"
            decoding="async"
            className="w-full h-auto max-h-96 object-cover transition-opacity duration-300"
            onError={(e) => {
              (e.currentTarget.parentElement as HTMLElement).style.display = 'none';
            }}
          />
        </div>
      )}

      {/* Standard Bottom Action Bar (Jakob's Law: Reactions · Comments · Follow · Share) */}
      <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500">
        {/* Campus Reactions Bar */}
        <ReactionsBar
          postId={post.id}
          initialCounts={post.reactions_count}
          currentUserProfile={currentUserProfile}
          onRequireAuth={onRequireAuth}
        />

        {/* Right Action Icons: Comments, Follow, Share */}
        <div className="flex items-center gap-1.5 sm:gap-2 ml-auto">
          {/* Comments Toggle Button */}
          <button
            type="button"
            onClick={() => setShowComments(!showComments)}
            aria-expanded={showComments}
            className={`cursor-pointer inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors border ${
              showComments
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold'
                : 'bg-stone-50/80 border-stone-200/90 text-stone-600 hover:bg-stone-100 hover:border-stone-300'
            }`}
            title="Comments & Replies"
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-800" />
            <span className="hidden xs:inline">Comments</span>
            <span className="font-mono text-[11px] bg-white/90 px-1 py-0.2 rounded border border-stone-200/80">
              {commentsCount}
            </span>
          </button>

          {/* Follow / Notify Button */}
          <button
            type="button"
            onClick={handleToggleFollow}
            className={`cursor-pointer inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors border ${
              isFollowed
                ? 'bg-amber-50 text-amber-950 border-amber-300 font-semibold'
                : 'bg-stone-50/80 border-stone-200/90 text-stone-600 hover:bg-stone-100 hover:border-stone-300'
            }`}
            title={isFollowed ? 'Following: You will be notified of new activity' : 'Follow: Get notified on new comments'}
          >
            {isFollowed ? (
              <BellRing className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
            ) : (
              <Bell className="w-3.5 h-3.5 text-stone-500" />
            )}
            <span className="text-[11px] font-semibold">{isFollowed ? 'Following' : 'Follow'}</span>
          </button>

          {/* Unified Share Button with Familiar Dropdown */}
          <div className="relative" ref={shareMenuRef}>
            <button
              type="button"
              onClick={() => setShareMenuOpen(!shareMenuOpen)}
              aria-expanded={shareMenuOpen}
              className="cursor-pointer inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium text-emerald-800 bg-emerald-50/80 border border-emerald-200/80 hover:bg-emerald-100 transition-colors"
              title="Share post via WhatsApp, Story Card, or Link"
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-700" />
              <span className="text-[11px] font-semibold">Share</span>
            </button>

            {shareMenuOpen && (
              <div
                role="menu"
                className="absolute right-0 bottom-full mb-1 w-56 bg-white rounded-2xl shadow-lg border border-stone-200/90 py-1.5 z-40 animate-in fade-in zoom-in-95 duration-100"
              >
                {/* 1080x1920 Status Card */}
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setShareMenuOpen(false);
                    setShareCardModalOpen(true);
                  }}
                  className="cursor-pointer w-full text-left px-3.5 py-2 text-xs flex items-center gap-2.5 hover:bg-emerald-50 text-emerald-950 transition-colors font-medium"
                >
                  <Smartphone className="w-4 h-4 text-emerald-800" />
                  <span>WhatsApp Status Card (HD)</span>
                </button>

                {/* Standard Share (WhatsApp / Phone) */}
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setShareMenuOpen(false);
                    setShareModalOpen(true);
                  }}
                  className="cursor-pointer w-full text-left px-3.5 py-2 text-xs flex items-center gap-2.5 hover:bg-stone-50 text-stone-700 transition-colors"
                >
                  <Share2 className="w-4 h-4 text-emerald-700" />
                  <span>Share via WhatsApp / Apps</span>
                </button>

                {/* Quick Copy Link */}
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleCopyLink}
                  className="cursor-pointer w-full text-left px-3.5 py-2 text-xs flex items-center gap-2.5 hover:bg-stone-50 text-stone-700 transition-colors"
                >
                  <LinkIcon className="w-4 h-4 text-stone-500" />
                  <span>{copiedLink ? 'Link copied! ✓' : 'Copy link to clipboard'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Follow / Notify Toast Notification */}
      {followToast && (
        <div className="bg-amber-50 border border-amber-200/90 text-amber-950 px-3 py-1.5 rounded-xl text-xs flex items-center gap-2 font-medium transition-all animate-in fade-in">
          <span>{followToast}</span>
        </div>
      )}

      {/* Expandable Comments Section */}
      {showComments && (
        <CommentsSection
          postId={post.id}
          currentUserProfile={currentUserProfile}
          onRequireAuth={onRequireAuth}
          onCommentCountChange={(newCount) => setCommentsCount(newCount)}
          onReportComment={onReportComment}
        />
      )}

      {/* Share Modals */}
      <ShareModal
        post={post}
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
      />

      <ShareCardModal
        post={post}
        isOpen={shareCardModalOpen}
        onClose={() => setShareCardModalOpen(false)}
      />
    </article>
  );
}
