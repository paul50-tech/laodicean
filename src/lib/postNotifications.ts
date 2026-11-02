/**
 * Post Notification & Follow Service for Laodicean.
 * 
 * Allows students to follow / subscribe to posts to receive alerts
 * when new comments, answers, or updates are posted.
 */

import { PostFollowSubscription } from '../types';

export const LOCAL_FOLLOWED_POSTS_KEY = 'laodicean_followed_posts_store';

const inMemoryFollowed = new Set<string>();

/**
 * Retrieves the list of followed post IDs from local storage.
 */
export function getFollowedPostIds(): Set<string> {
  if (typeof window === 'undefined') {
    return new Set(inMemoryFollowed);
  }

  try {
    const raw = localStorage.getItem(LOCAL_FOLLOWED_POSTS_KEY);
    if (!raw) {
      return new Set();
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? new Set(parsed) : new Set();
  } catch {
    return new Set();
  }
}

/**
 * Checks if a specific post is followed by the current user.
 */
export function isPostFollowed(postId: string): boolean {
  return getFollowedPostIds().has(postId);
}

/**
 * Toggles the follow / notification subscription for a post.
 */
export function toggleFollowPost(
  postId: string
): { isFollowed: boolean; totalFollowed: number } {
  const current = getFollowedPostIds();
  const willFollow = !current.has(postId);

  if (willFollow) {
    current.add(postId);
  } else {
    current.delete(postId);
  }

  if (typeof window === 'undefined') {
    if (willFollow) {
      inMemoryFollowed.add(postId);
    } else {
      inMemoryFollowed.delete(postId);
    }
    return { isFollowed: willFollow, totalFollowed: inMemoryFollowed.size };
  }

  try {
    localStorage.setItem(LOCAL_FOLLOWED_POSTS_KEY, JSON.stringify(Array.from(current)));
    window.dispatchEvent(
      new CustomEvent('post-follow-changed', {
        detail: { postId, isFollowed: willFollow, totalFollowed: current.size },
      })
    );
  } catch {
    // storage error ignored
  }

  return { isFollowed: willFollow, totalFollowed: current.size };
}
