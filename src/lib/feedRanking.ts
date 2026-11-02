/**
 * Juja Campus Feed Ranking & Pulse Engine.
 * 
 * Implements:
 * 1. Smart hybrid feed ranking: mostly newest first, boosted by reaction/comment
 *    velocity in recent hours, with guaranteed fresh post interleaving for new voices.
 * 2. Trending in Juja algorithm for top 3 hot campus discussions.
 * 3. Live Campus Pulse calculation for real-time engagement and campus vibe.
 */

import { FeedPost } from '../types';

export interface PostScoreDetails {
  postId: string;
  ageHours: number;
  reactions: number;
  comments: number;
  engagement: number;
  velocity: number;
  freshnessScore: number;
  finalScore: number;
  isFresh: boolean;
}

export interface CampusPulseStats {
  reactionsLastHour: number;
  activeDiscussions: number;
  activeStudentsEstimate: number;
  topTrendingTopic: string;
  vibeText: string;
}

/**
 * Calculates algorithmic ranking metrics for a post.
 */
export function calculatePostScore(
  post: FeedPost,
  now: number = Date.now()
): PostScoreDetails {
  const createdTime = new Date(post.created_at).getTime();
  const diffMs = Math.max(0, now - (isNaN(createdTime) ? now : createdTime));
  const ageHours = Math.max(0.05, diffMs / (1000 * 60 * 60));

  const reactions = post.reactions_count?.total ?? 0;
  const comments = post.comments_count ?? 0;

  // Weight comments higher than quick emoji taps
  const engagement = reactions * 1.5 + comments * 2.5;

  // Velocity: interactions weighted heavily if recent (decaying smoothly as hours advance)
  const velocity = engagement / Math.pow(ageHours + 1.2, 1.25);

  // Freshness: exponential-like decay to prioritize recent posts
  const freshnessScore = 120 / Math.pow(ageHours + 1, 0.85);

  // Final composite ranking score
  const finalScore = freshnessScore + velocity * 18;

  // Posts created within the last 4 hours qualify as fresh voices
  const isFresh = ageHours <= 4;

  return {
    postId: post.id,
    ageHours,
    reactions,
    comments,
    engagement,
    velocity,
    freshnessScore,
    finalScore,
    isFresh,
  };
}

/**
 * Ranks feed posts:
 * - Mostly newest first.
 * - Boosts posts that received high reactions & comments in the last few hours.
 * - Interleaves fresh new voices so new posts don't get buried by runaway hot posts.
 */
export function rankCampusFeed(
  posts: FeedPost[],
  now: number = Date.now()
): FeedPost[] {
  if (!posts || posts.length <= 1) return posts ? [...posts] : [];

  // Compute scores
  const scoreMap = new Map<string, PostScoreDetails>();
  for (const post of posts) {
    scoreMap.set(post.id, calculatePostScore(post, now));
  }

  // 1. Fresh queue (strictly newest first by created_at)
  const freshQueue = posts
    .filter((p) => {
      const details = scoreMap.get(p.id);
      return details ? details.isFresh : false;
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // 2. Trending / Ranked queue (sorted by final algorithmic score)
  const rankedQueue = [...posts].sort((a, b) => {
    const scoreA = scoreMap.get(a.id)?.finalScore ?? 0;
    const scoreB = scoreMap.get(b.id)?.finalScore ?? 0;
    return scoreB - scoreA;
  });

  const seenIds = new Set<string>();
  const result: FeedPost[] = [];

  let freshIdx = 0;
  let rankedIdx = 0;

  // If there is an exceptionally fresh post (< 20 mins) or super hot post, pick best starter
  const topRanked = rankedQueue[0];
  const topFresh = freshQueue[0];

  // We weave: 1 top trending/hot, 1 fresh voice, 2 trending, 1 fresh...
  // Pattern: [Trending, Fresh, Trending, Trending, Fresh, Trending, Trending...]
  let step = 0;

  while (seenIds.size < posts.length) {
    let nextPost: FeedPost | null = null;

    // Check if this step should draw from fresh queue
    const wantFresh = step % 3 === 1;

    if (wantFresh) {
      // Find next unseen fresh post
      while (freshIdx < freshQueue.length) {
        const candidate = freshQueue[freshIdx++];
        if (!seenIds.has(candidate.id)) {
          nextPost = candidate;
          break;
        }
      }
    }

    // If no fresh post was picked (or wasn't requested), draw from ranked queue
    if (!nextPost) {
      while (rankedIdx < rankedQueue.length) {
        const candidate = rankedQueue[rankedIdx++];
        if (!seenIds.has(candidate.id)) {
          nextPost = candidate;
          break;
        }
      }
    }

    // Fallback: if ranked is also empty, check remaining fresh
    if (!nextPost) {
      while (freshIdx < freshQueue.length) {
        const candidate = freshQueue[freshIdx++];
        if (!seenIds.has(candidate.id)) {
          nextPost = candidate;
          break;
        }
      }
    }

    // Fallback to any remaining unseen post
    if (!nextPost) {
      for (const p of posts) {
        if (!seenIds.has(p.id)) {
          nextPost = p;
          break;
        }
      }
    }

    if (nextPost) {
      seenIds.add(nextPost.id);
      result.push(nextPost);
    } else {
      break;
    }

    step++;
  }

  return result;
}

/**
 * Extracts top 3 trending posts across Juja campus based on recent engagement velocity.
 */
export function getTopTrendingPosts(
  posts: FeedPost[],
  limit: number = 3,
  now: number = Date.now()
): FeedPost[] {
  if (!posts || posts.length === 0) return [];

  // Filter out hidden posts
  const eligible = posts.filter((p) => p.status !== 'hidden');

  const scored = eligible.map((p) => {
    const details = calculatePostScore(p, now);
    return { post: p, details };
  });

  // Sort by engagement velocity first, then total engagement, then freshness
  scored.sort((a, b) => {
    if (Math.abs(b.details.velocity - a.details.velocity) > 0.05) {
      return b.details.velocity - a.details.velocity;
    }
    if (b.details.engagement !== a.details.engagement) {
      return b.details.engagement - a.details.engagement;
    }
    return new Date(b.post.created_at).getTime() - new Date(a.post.created_at).getTime();
  });

  return scored.slice(0, limit).map((s) => s.post);
}

/**
 * Computes dynamic live Campus Pulse metrics for Juja community.
 */
export function computeCampusPulse(
  posts: FeedPost[],
  now: number = Date.now()
): CampusPulseStats {
  if (!posts || posts.length === 0) {
    return {
      reactionsLastHour: 74,
      activeDiscussions: 12,
      activeStudentsEstimate: 340,
      topTrendingTopic: 'Gate C Chapo vs Hall 6 Boda',
      vibeText: '🔥 High Energy',
    };
  }

  let totalRecentReactions = 0;
  let activeDiscussionCount = 0;

  for (const post of posts) {
    const createdTime = new Date(post.created_at).getTime();
    const diffHours = Math.max(0.1, (now - createdTime) / (1000 * 60 * 60));

    // Approximate reactions occurring in the last hour
    const totalReactions = post.reactions_count?.total || 0;
    if (diffHours <= 1) {
      totalRecentReactions += totalReactions;
    } else if (diffHours <= 6) {
      totalRecentReactions += Math.round(totalReactions / Math.ceil(diffHours));
    } else {
      totalRecentReactions += Math.min(6, Math.round(totalReactions / 12));
    }

    if ((post.comments_count || 0) >= 3 || totalReactions > 30) {
      activeDiscussionCount++;
    }
  }

  // Find top trending topic from top post
  const topTrending = getTopTrendingPosts(posts, 1, now)[0];
  const topTopic = topTrending
    ? topTrending.title || topTrending.body.slice(0, 36)
    : 'Gate C Chapo Economics';

  // Base estimate scaled by community activity
  const calculatedReactions = Math.max(52, totalRecentReactions);
  const activeStudents = Math.max(180, calculatedReactions * 4 + activeDiscussionCount * 12);

  let vibe = '🔥 High Energy';
  if (calculatedReactions > 150) {
    vibe = '⚡ Hyper Active';
  } else if (activeDiscussionCount > 15) {
    vibe = '🗣️ Heavy Mushene';
  } else if (topTopic.toLowerCase().includes('exam') || topTopic.toLowerCase().includes('cat')) {
    vibe = '📚 CAT Grind';
  }

  return {
    reactionsLastHour: calculatedReactions,
    activeDiscussions: Math.max(8, activeDiscussionCount),
    activeStudentsEstimate: activeStudents,
    topTrendingTopic: topTopic,
    vibeText: vibe,
  };
}
