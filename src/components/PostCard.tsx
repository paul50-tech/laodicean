import React from 'react';
import { Heart, MessageCircle, Share2 } from 'lucide-react';
import {
  estimateReadingMinutes,
  formatRelativeTime,
  getPostTypeLabel,
} from '../lib/feedLogic';
import { Post, PostType } from '../types/laodicean';
import { SmartImage } from './SmartImage';

interface PostCardProps {
  post: Post;
  liteMode: boolean;
  onOpenPost: (slug: string) => void;
  onToggleLike: (postId: string) => void;
  onShareWhatsApp: (post: Post) => void;
  onFilterBySpot?: (spot: string) => void;
}

/**
 * Unified feed card rendering Stories, Quick Gists, Photos, and Campus Notices
 * inside one endless scroll. Uses clean inline metadata with typographic separators.
 */
export const PostCard: React.FC<PostCardProps> = ({
  post,
  liteMode,
  onOpenPost,
  onToggleLike,
  onShareWhatsApp,
  onFilterBySpot,
}) => {
  const isLongStory = post.postType === PostType.Story && post.body.length > 260;
  const previewBody = isLongStory
    ? `${post.body.slice(0, 260).trimEnd()}…`
    : post.body;
  const readMins =
    post.postType === PostType.Story ? estimateReadingMinutes(post.body) : null;

  const initials = post.authorName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <article className="bg-white border border-stone-200/90 rounded-2xl p-5 sm:p-6 transition-colors hover:border-stone-300">
      {/* Unboxed inline metadata row (Zero-Pill Discipline) */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500 mb-3">
        <span className="font-semibold text-zinc-800">c/{post.communitySlug}</span>
        <span aria-hidden="true">·</span>
        {onFilterBySpot ? (
          <button
            type="button"
            onClick={() => onFilterBySpot(post.spot)}
            className="hover:text-emerald-800 hover:underline transition-colors cursor-pointer"
          >
            {post.spot}
          </button>
        ) : (
          <span>{post.spot}</span>
        )}
        <span aria-hidden="true">·</span>
        <span
          className={
            post.postType === PostType.Notice
              ? 'font-semibold text-amber-800'
              : 'font-medium text-zinc-700'
          }
        >
          {getPostTypeLabel(post.postType)}
        </span>
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

      {/* Main clickable content block */}
      <div className="space-y-3">
        {post.title && (
          <h2 className="font-display text-lg sm:text-xl font-bold text-zinc-950 leading-snug text-balance">
            <a
              href={`/p/${post.slug}`}
              onClick={(e) => {
                e.preventDefault();
                onOpenPost(post.slug);
              }}
              className="hover:text-emerald-900 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800 rounded-sm"
            >
              {post.title}
            </a>
          </h2>
        )}

        <p className="text-[15px] leading-relaxed text-zinc-700 whitespace-pre-line max-w-[68ch]">
          {previewBody}
          {isLongStory && (
            <>
              {' '}
              <a
                href={`/p/${post.slug}`}
                onClick={(e) => {
                  e.preventDefault();
                  onOpenPost(post.slug);
                }}
                className="font-semibold text-emerald-800 hover:underline whitespace-nowrap"
              >
                Read full story
              </a>
            </>
          )}
        </p>

        {post.imageUrl && (
          <div className="pt-1">
            <SmartImage
              src={post.imageUrl}
              alt={post.imageAlt || post.title || 'Juja campus post photo'}
              sizeKb={post.imageKb}
              liteMode={liteMode}
            />
          </div>
        )}
      </div>

      {/* Author attribution + ergonomic action bar */}
      <div className="mt-4 pt-3.5 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            aria-hidden="true"
            className="w-8 h-8 rounded-full bg-stone-200/80 text-zinc-800 text-xs font-bold flex items-center justify-center shrink-0"
          >
            {initials}
          </div>
          <div className="min-w-0 text-xs leading-tight">
            <div className="flex items-center gap-1.5 truncate">
              <span className="font-semibold text-zinc-900 truncate">
                {post.authorName}
              </span>
              <span className="text-zinc-500 truncate">{post.authorHandle}</span>
            </div>
            {post.authorCourse && (
              <p className="text-zinc-500 truncate mt-0.5">{post.authorCourse}</p>
            )}
          </div>
        </div>

        {/* 44px minimum touch hitboxes for mobile thumb comfort */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <button
            type="button"
            aria-pressed={Boolean(post.likedByMe)}
            aria-label={`Like post "${post.title || post.body.slice(0, 28)}"`}
            onClick={() => onToggleLike(post.id)}
            className={`min-h-[44px] px-3 rounded-lg inline-flex items-center gap-1.5 text-xs font-medium transition-colors cursor-pointer ${
              post.likedByMe
                ? 'text-emerald-800 bg-emerald-50 font-semibold'
                : 'text-zinc-600 hover:bg-stone-100 hover:text-zinc-900'
            }`}
          >
            <Heart
              className={`w-4 h-4 shrink-0 ${post.likedByMe ? 'fill-emerald-700 text-emerald-700' : ''}`}
              aria-hidden="true"
            />
            <span className="tabular-nums">{post.likesCount}</span>
          </button>

          <button
            type="button"
            aria-label={`View replies on "${post.title || post.body.slice(0, 28)}"`}
            onClick={() => onOpenPost(post.slug)}
            className="min-h-[44px] px-3 rounded-lg inline-flex items-center gap-1.5 text-xs font-medium text-zinc-600 hover:bg-stone-100 hover:text-zinc-900 transition-colors cursor-pointer"
          >
            <MessageCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span className="tabular-nums">{post.commentsCount}</span>
          </button>

          <button
            type="button"
            aria-label={`Share "${post.title || post.body.slice(0, 28)}" on WhatsApp`}
            onClick={() => onShareWhatsApp(post)}
            className="min-h-[44px] px-3.5 rounded-lg inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Share2 className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>WhatsApp</span>
          </button>
        </div>
      </div>
    </article>
  );
};
