/**
 * PWA & Offline Cache Helper Functions
 */

import { FeedPost } from '../types';

export const OFFLINE_FEED_CACHE_KEY = 'laodicean_offline_feed_cache_v1';

let inMemoryFeedCache: FeedPost[] = [];

/**
 * Saves posts to local offline storage and memory cache.
 */
export function saveOfflineFeedCache(posts: FeedPost[]): void {
  inMemoryFeedCache = [...posts];

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(OFFLINE_FEED_CACHE_KEY, JSON.stringify(posts.slice(0, 30)));
    } catch {
      // Ignore quota storage issues
    }
  }
}

/**
 * Retrieves cached feed posts for instant offline rendering.
 */
export function getOfflineFeedCache(): FeedPost[] {
  if (typeof window === 'undefined') {
    return inMemoryFeedCache;
  }

  try {
    const raw = localStorage.getItem(OFFLINE_FEED_CACHE_KEY);
    if (!raw) return inMemoryFeedCache;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((p: FeedPost) => ({
        ...p,
        author_real_name: /paul\s*jubilee/i.test(p.author_real_name || '')
          ? 'Tech Expo Committee'
          : p.author_real_name,
      }));
    }
    return inMemoryFeedCache;
  } catch {
    return inMemoryFeedCache;
  }
}

/**
 * Checks if the app is currently running in standalone (PWA installed) mode.
 */
export function isStandaloneDisplayMode(): boolean {
  if (typeof window === 'undefined') return false;

  const isStandaloneMedia = window.matchMedia('(display-mode: standalone)').matches;
  const isIOSStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone === true;

  return Boolean(isStandaloneMedia || isIOSStandalone);
}

/**
 * Converts prompt outcomes into clean, user-friendly notifications.
 */
export function formatInstallPromptOutcome(outcome?: string): string {
  if (outcome === 'accepted') {
    return 'App successfully installed to home screen!';
  }
  if (outcome === 'dismissed') {
    return 'Installation cancelled. You can install anytime from the header.';
  }
  return 'Installation not supported or already installed.';
}
