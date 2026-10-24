import React, { useEffect, useState } from 'react';
import { ArrowLeft, Check, Copy, Heart, Share2 } from 'lucide-react';
import {
  buildWhatsAppShareData,
  estimateReadingMinutes,
  formatRelativeTime,
  getPostTypeLabel,
} from '../lib/feedLogic';
import {
  createPostComment,
  fetchCommentsForPost,
  saveCampusUserSession,
} from '../lib/storageService';
import { getCanonicalSiteOrigin } from '../lib/supabase';
import { CampusUser, Post, PostComment, PostType } from '../types/laodicean';
import { SmartImage } from './SmartImage';

interface PostReaderViewProps {
  post: Post | undefined;
  liteMode: boolean;
  currentUser: CampusUser | null;
  onBackToFeed: () => void;
  onToggleLike: (postId: string) => void;
  onPostsUpdated: (posts: Post[]) => void;
  onRequireAuthOrQuickName: (user: CampusUser) => void;
}

/**
 * Full-page fast reader view (/p/:slug) optimized for links opened from WhatsApp.
 */
export const PostReaderView: React.FC<PostReaderViewProps> = ({
  post,
  liteMode,
  currentUser,
  onBackToFeed,
  onToggleLike,
  onPostsUpdated,
  onRequireAuthOrQuickName,
}) => {
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [replyBody, setReplyBody] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestHandle, setGuestHandle] = useState('');
  const [replyError, setReplyError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);

  useEffect(() => {
    if (!post) return;
    let active = true;
    setLoadingComments(true);
    fetchCommentsForPost(post.id).then((list) => {
      if (active) {
        setComments(list);
        setLoadingComments(false);
      }
    });
    return () => {
      active = false;
    };
  }, [post?.id]);

  if (!post) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center space-y-4">
        <h1 className="font-display text-2xl font-bold text-zinc-900">
          Post not found
        </h1>
        <p className="text-sm text-zinc-600">
          This link may have moved or been removed from the community feed.
        </p>
        <button
          type="button"
          onClick={onBackToFeed}
          className="min-h-[44px] px-5 py-2.5 rounded-lg bg-emerald-800 text-white text-sm font-semibold cursor-pointer"
        >
          Back to Juja Feed
        </button>
      </div>
    );
  }

  const shareData = buildWhatsAppShareData(post, getCanonicalSiteOrigin());
  const readMins =
    post.postType === PostType.Story ? estimateReadingMinutes(post.body) : null;

  const handleCopyForWhatsApp = async () => {
    try {
      await navigator.clipboard.writeText(shareData.messageText);
      setCopiedWhatsApp(true);
      setTimeout(() => setCopiedWhatsApp(false), 2200);
    } catch {
      setCopiedWhatsApp(true);
      setTimeout(() => setCopiedWhatsApp(false), 2200);
    }
  };

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReplyError(null);

    if (replyBody.trim().length < 2) {
      setReplyError('Please type a reply before posting.');
      return;
    }

    let activeAuthor = currentUser;
    if (!activeAuthor) {
      if (guestName.trim().length < 2) {
        setReplyError('Please enter your name so people know who is replying.');
        return;
      }
      const fallbackHandle =
        guestHandle.trim().replace(/^@/, '') ||
        guestName
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '_')
          .slice(0, 16) ||
        'juja_reader';

      activeAuthor = {
        id: `guest-${Date.now()}`,
        name: guestName.trim(),
        handle: `@${fallbackHandle}`,
        course: 'Juja Reader',
        email: '',
      };
      saveCampusUserSession(activeAuthor);
      onRequireAuthOrQuickName(activeAuthor);
    }

    setSubmitting(true);
    try {
      const { comment, updatedPosts } = await createPostComment(
        post.id,
        replyBody,
        activeAuthor
      );
      setComments((prev) => [...prev, comment]);
      onPostsUpdated(updatedPosts);
      setReplyBody('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-16">
      <div>
        <button
          type="button"
          onClick={onBackToFeed}
          className="min-h-[44px] inline-flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-zinc-950 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Back to Juja Feed</span>
        </button>
      </div>

      <article className="bg-white border border-stone-200/90 rounded-2xl p-6 sm:p-8 space-y-6">
        {/* Unboxed inline metadata */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500">
          <span className="font-semibold text-zinc-900">c/{post.communitySlug}</span>
          <span aria-hidden="true">·</span>
          <span>{post.spot}</span>
          <span aria-hidden="true">·</span>
          <span>{getPostTypeLabel(post.postType)}</span>
          {readMins !== null && (
            <>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">{readMins} min read</span>
            </>
          )}
          <span aria-hidden="true">·</span>
          <time dateTime={post.createdAt} className="tabular-nums">
            {formatRelativeTime(post.createdAt)}
          </time>
        </div>

        {post.title && (
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-zinc-950 leading-tight text-balance">
            {post.title}
          </h1>
        )}

        <div className="flex items-center justify-between gap-4 pb-4 border-b border-stone-100 text-xs text-zinc-600">
          <div>
            <span className="font-semibold text-zinc-900">{post.authorName}</span>{' '}
            <span className="text-zinc-500">{post.authorHandle}</span>
            {post.authorCourse && (
              <span className="text-zinc-500"> · {post.authorCourse}</span>
            )}
          </div>
          <button
            type="button"
            aria-pressed={Boolean(post.likedByMe)}
            onClick={() => onToggleLike(post.id)}
            className={`min-h-[40px] px-3 rounded-lg inline-flex items-center gap-1.5 text-xs font-semibold transition-colors cursor-pointer ${
              post.likedByMe
                ? 'bg-emerald-50 text-emerald-800'
                : 'bg-stone-100 text-zinc-700 hover:bg-stone-200/70'
            }`}
          >
            <Heart
              className={`w-4 h-4 ${post.likedByMe ? 'fill-emerald-700 text-emerald-700' : ''}`}
              aria-hidden="true"
            />
            <span className="tabular-nums">{post.likesCount}</span>
          </button>
        </div>

        {post.imageUrl && (
          <SmartImage
            src={post.imageUrl}
            alt={post.imageAlt || post.title || 'Juja campus post photo'}
            sizeKb={post.imageKb}
            liteMode={liteMode}
            priority
          />
        )}

        <div className="text-base leading-[1.75] text-zinc-800 whitespace-pre-line max-w-[68ch]">
          {post.body}
        </div>

        {/* WhatsApp-First Share Strip */}
        <div className="pt-5 border-t border-stone-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-0.5">
            <p className="text-sm font-semibold text-zinc-900">
              Send this to a class or hostel WhatsApp group
            </p>
            <p className="text-xs text-zinc-500 font-mono truncate">
              {shareData.canonicalUrl}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <a
              href={shareData.whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[44px] px-4 py-2 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
            >
              <Share2 className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Share on WhatsApp</span>
            </a>
            <button
              type="button"
              onClick={handleCopyForWhatsApp}
              className="min-h-[44px] px-3.5 py-2 rounded-lg border border-stone-300 hover:border-zinc-900 text-zinc-800 text-xs sm:text-sm font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {copiedWhatsApp ? (
                <>
                  <Check className="w-4 h-4 text-emerald-700" aria-hidden="true" />
                  <span>Copied for WhatsApp</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" aria-hidden="true" />
                  <span>Copy Text & Link</span>
                </>
              )}
            </button>
          </div>
        </div>
      </article>

      {/* Replies Section */}
      <section aria-labelledby="replies-heading" className="space-y-5">
        <h2
          id="replies-heading"
          className="font-display text-lg font-bold text-zinc-900 tabular-nums"
        >
          Replies ({comments.length})
        </h2>

        <form
          onSubmit={handleReplySubmit}
          className="bg-white border border-stone-200/90 rounded-2xl p-5 space-y-4"
        >
          {!currentUser && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="reply-guest-name"
                  className="block text-xs font-medium text-zinc-700 mb-1"
                >
                  Your Name
                </label>
                <input
                  id="reply-guest-name"
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="e.g. Brenda Muthoni"
                  className="w-full h-11 px-3 rounded-lg border border-stone-300 bg-[#FAF9F6] text-sm text-zinc-900 focus:outline-none focus:border-emerald-800"
                />
              </div>
              <div>
                <label
                  htmlFor="reply-guest-handle"
                  className="block text-xs font-medium text-zinc-700 mb-1"
                >
                  Handle (optional)
                </label>
                <input
                  id="reply-guest-handle"
                  type="text"
                  value={guestHandle}
                  onChange={(e) => setGuestHandle(e.target.value)}
                  placeholder="@brenda_it"
                  className="w-full h-11 px-3 rounded-lg border border-stone-300 bg-[#FAF9F6] text-sm text-zinc-900 focus:outline-none focus:border-emerald-800"
                />
              </div>
            </div>
          )}

          <div>
            <label
              htmlFor="reply-body-input"
              className="block text-xs font-medium text-zinc-700 mb-1"
            >
              Add a reply {currentUser ? `as ${currentUser.handle}` : ''}
            </label>
            <textarea
              id="reply-body-input"
              rows={3}
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              placeholder="Add local context, ask a follow-up, or chime in..."
              className="w-full p-3 rounded-lg border border-stone-300 bg-[#FAF9F6] text-sm text-zinc-900 focus:outline-none focus:border-emerald-800"
            />
          </div>

          {replyError && (
            <p role="alert" className="text-xs font-medium text-red-700">
              {replyError}
            </p>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="min-h-[44px] px-5 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white text-sm font-semibold transition-colors cursor-pointer"
            >
              {submitting ? 'Posting…' : 'Post Reply'}
            </button>
          </div>
        </form>

        {loadingComments ? (
          <p className="text-sm text-zinc-500 py-4">Loading replies…</p>
        ) : comments.length === 0 ? (
          <p className="text-sm text-zinc-500 py-4">
            No replies yet. Start the conversation above.
          </p>
        ) : (
          <div className="divide-y divide-stone-200/80 border-t border-b border-stone-200/80">
            {comments.map((comment) => (
              <div key={comment.id} className="py-4 space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <span className="font-semibold text-zinc-900">
                    {comment.authorName}
                  </span>
                  <span>{comment.authorHandle}</span>
                  <span aria-hidden="true">·</span>
                  <time dateTime={comment.createdAt} className="tabular-nums">
                    {formatRelativeTime(comment.createdAt)}
                  </time>
                </div>
                <p className="text-sm text-zinc-800 leading-relaxed">
                  {comment.body}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
