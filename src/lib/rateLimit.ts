/**
 * Rate Limiting Service for Laodicean.
 * Enforces client-side cooldowns against spam to preserve fair feed visibility for all Juja students.
 * - Posts: Max 2 posts per 3 minutes (180s)
 * - Comments: Max 5 comments per 2 minutes (120s)
 * - Moments: Max 3 flash moments per 5 minutes (300s)
 */

export const RATE_LIMIT_STORAGE_KEY = 'laodicean_rate_limit_timestamps';

export type RateLimitAction = 'post' | 'comment' | 'moment';

export interface RateLimitConfig {
  maxActions: number;
  windowMs: number;
  label: string;
}

export const RATE_LIMIT_CONFIGS: Record<RateLimitAction, RateLimitConfig> = {
  post: {
    maxActions: 2,
    windowMs: 3 * 60 * 1000, // 3 minutes
    label: 'post',
  },
  comment: {
    maxActions: 5,
    windowMs: 2 * 60 * 1000, // 2 minutes
    label: 'comment',
  },
  moment: {
    maxActions: 3,
    windowMs: 5 * 60 * 1000, // 5 minutes
    label: 'flash moment',
  },
};

export interface RateLimitCheckResult {
  allowed: boolean;
  waitSeconds: number;
  message: string | null;
  remainingInWindow: number;
}

/**
 * Pure function: calculates whether an action is allowed given a history of past timestamps.
 */
export function evaluateRateLimit(
  timestamps: number[],
  config: RateLimitConfig,
  currentTime: number = Date.now()
): RateLimitCheckResult {
  const windowStart = currentTime - config.windowMs;
  const recentTimestamps = timestamps.filter((t) => t > windowStart);

  if (recentTimestamps.length >= config.maxActions) {
    // Sort ascending to find oldest action in current window
    const oldestInWindow = Math.min(...recentTimestamps);
    const timeUntilExpiry = oldestInWindow + config.windowMs - currentTime;
    const waitSeconds = Math.max(1, Math.ceil(timeUntilExpiry / 1000));

    return {
      allowed: false,
      waitSeconds,
      message: `Juja Anti-Spam Cooldown: Please wait ${waitSeconds}s before creating another ${config.label} to ensure fair feed visibility for everyone.`,
      remainingInWindow: 0,
    };
  }

  return {
    allowed: true,
    waitSeconds: 0,
    message: null,
    remainingInWindow: Math.max(0, config.maxActions - recentTimestamps.length),
  };
}

/**
 * Reads action timestamps map from localStorage.
 */
export function getActionTimestamps(
  action: RateLimitAction,
  userId?: string | null
): number[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(RATE_LIMIT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    const key = `${action}_${userId || 'anon'}`;
    const list = parsed[key];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

/**
 * Records an action timestamp into storage.
 */
export function recordActionTimestamp(
  action: RateLimitAction,
  userId?: string | null,
  timestamp: number = Date.now()
): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(RATE_LIMIT_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    const key = `${action}_${userId || 'anon'}`;
    const current = Array.isArray(parsed[key]) ? parsed[key] : [];

    const config = RATE_LIMIT_CONFIGS[action];
    const windowStart = timestamp - config.windowMs;
    // Prune stale timestamps older than window
    const updated = [...current.filter((t: number) => t > windowStart), timestamp];

    parsed[key] = updated;
    localStorage.setItem(RATE_LIMIT_STORAGE_KEY, JSON.stringify(parsed));
  } catch {
    // Ignore storage quota
  }
}

/**
 * Checks whether the current user is rate-limited for an action.
 */
export function checkRateLimit(
  action: RateLimitAction,
  userId?: string | null
): RateLimitCheckResult {
  const config = RATE_LIMIT_CONFIGS[action];
  const history = getActionTimestamps(action, userId);
  return evaluateRateLimit(history, config, Date.now());
}

/**
 * Resets rate limit for testing or admin override.
 */
export function resetRateLimits(action?: RateLimitAction, userId?: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (!action) {
      localStorage.removeItem(RATE_LIMIT_STORAGE_KEY);
      return;
    }
    const raw = localStorage.getItem(RATE_LIMIT_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    const key = `${action}_${userId || 'anon'}`;
    delete parsed[key];
    localStorage.setItem(RATE_LIMIT_STORAGE_KEY, JSON.stringify(parsed));
  } catch {
    // Ignore
  }
}
