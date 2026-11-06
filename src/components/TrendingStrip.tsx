import React, { useMemo } from 'react';
import { FeedPost } from '../types';
import { getTopTrendingPosts } from '../lib/feedRanking';
import { Flame, MessageSquare, TrendingUp, Sparkles, ChevronRight } from 'lucide-react';

interface TrendingStripProps {
  posts: FeedPost[];
  onSelectPost?: (post: FeedPost) => void;
  className?: string;
}

const RANK_BADGES = [
  {
    rank: '#1',
    label: 'Top Viral',
    badgeClass: 'bg-amber-100 text-amber-950 border-amber-300',
    ringClass: 'ring-1 ring-amber-400/50',
    accentBorder: 'border-amber-200/90 hover:border-amber-400',
  },
  {
    rank: '#2',
    label: 'Heating Up',
    badgeClass: 'bg-emerald-100 text-emerald-950 border-emerald-300',
    ringClass: 'ring-1 ring-emerald-400/50',
    accentBorder: 'border-emerald-200/90 hover:border-emerald-400',
  },
  {
    rank: '#3',
    label: 'On Fire',
    badgeClass: 'bg-orange-100 text-orange-950 border-orange-300',
    ringClass: 'ring-1 ring-orange-400/50',
    accentBorder: 'border-orange-200/90 hover:border-orange-400',
  },
];

export function TrendingStrip({
  posts,
  onSelectPost,
  className = '',
}: TrendingStripProps) {
  const topTrending = useMemo(() => getTopTrendingPosts(posts, 3), [posts]);

  if (!topTrending || topTrending.length === 0) {
    return null;
  }

  const getPostTypeLabel = (post: FeedPost) => {
    switch (post.post_type) {
      case 'meme':
        return '😂 Meme';
      case 'mushene':
        return '🗣️ Mushene';
      case 'poll':
        return '📊 Poll';
      case 'confession':
        return '🤫 Confession';
      case 'photo':
        return '📸 Photo';
      case 'event':
        return '📅 Event';
      case 'story':
      default:
        return '📝 Story';
    }
  };

  return (
    <section aria-labelledby="trending-heading" className={`space-y-2.5 ${className}`}>
      {/* Strip Header */}
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <Flame className="w-4 h-4 fill-amber-500" aria-hidden="true" />
          </div>
          <h3
            id="trending-heading"
            className="font-display text-sm font-bold tracking-tight text-zinc-950 flex items-center gap-1.5"
          >
            <span>Trending in Juja</span>
            <span className="text-[11px] font-normal text-zinc-500 font-mono">
              (Top 3)
            </span>
          </h3>
        </div>
        <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/70 inline-flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-emerald-600" aria-hidden="true" />
          <span>High Velocity</span>
        </span>
      </div>

      {/* 3 Top Trending Cards Grid / Horizontal Scroll */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {topTrending.map((post, idx) => {
          const rankInfo = RANK_BADGES[idx] || RANK_BADGES[2];
          const rawAuthor = post.is_persona
            ? post.persona_name
            : post.author_real_name || 'Campus Member';
          const authorDisplay = /paul\s*jubilee/i.test(rawAuthor)
            ? 'Tech Expo Committee'
            : rawAuthor;

          return (
            <article
              key={post.id}
              onClick={() => onSelectPost?.(post)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectPost?.(post);
                }
              }}
              tabIndex={0}
              role="button"
              className={`bg-white border rounded-2xl p-3 shadow-2xs transition-all cursor-pointer flex flex-col justify-between gap-2 group hover:shadow-xs active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-emerald-700 ${rankInfo.accentBorder}`}
              aria-label={`Trending #${idx + 1}: ${post.title || post.body.slice(0, 40)}`}
            >
              {/* Header: Rank + Type */}
              <div className="flex items-center justify-between gap-1.5">
                <span
                  className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border shadow-2xs font-mono inline-flex items-center gap-1 ${rankInfo.badgeClass}`}
                >
                  <span>{rankInfo.rank}</span>
                  <span className="font-sans font-semibold text-[9px] opacity-80">{rankInfo.label}</span>
                </span>

                <span className="text-[10px] font-medium text-zinc-500 bg-stone-100 px-1.5 py-0.5 rounded-md">
                  {getPostTypeLabel(post)}
                </span>
              </div>

              {/* Title / Snippet */}
              <div className="space-y-1 my-0.5">
                <h4 className="text-xs font-bold text-zinc-900 group-hover:text-emerald-900 transition-colors line-clamp-2 leading-snug">
                  {post.title || post.body.slice(0, 60)}
                </h4>
                {post.title && (
                  <p className="text-[11px] text-zinc-500 line-clamp-1 leading-relaxed">
                    {post.body}
                  </p>
                )}
              </div>

              {/* Footer: Author & Metrics */}
              <div className="pt-1.5 border-t border-stone-100 flex items-center justify-between text-[10px] text-zinc-500">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="truncate font-medium text-zinc-700">
                    {authorDisplay}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0 font-mono">
                  <span className="flex items-center gap-0.5 text-amber-700 font-semibold">
                    <Flame className="w-3 h-3 fill-amber-500/20 text-amber-600" aria-hidden="true" />
                    <span>{post.reactions_count?.total || 0}</span>
                  </span>
                  <span className="flex items-center gap-0.5 text-zinc-600 font-semibold">
                    <MessageSquare className="w-3 h-3 text-zinc-400" aria-hidden="true" />
                    <span>{post.comments_count || 0}</span>
                  </span>
                  <ChevronRight className="w-3 h-3 text-stone-300 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-all" aria-hidden="true" />
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
