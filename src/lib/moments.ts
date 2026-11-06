/**
 * 24-Hour Stories Service ("Mushene Moments") for Laodicean.
 * Handles fresh campus street moments, gossip snippets, and quick flashes
 * that automatically expire and disappear after 24 hours (a day).
 */

import { MusheneMoment } from '../types';

export const LOCAL_MOMENTS_STORAGE_KEY = 'laodicean_mushene_moments_v1';

export const MOMENT_GRADIENTS = [
  'from-rose-600 via-orange-500 to-amber-500',
  'from-emerald-700 via-teal-700 to-cyan-800',
  'from-purple-700 via-pink-600 to-rose-600',
  'from-amber-600 via-rose-700 to-indigo-800',
  'from-indigo-800 via-blue-700 to-cyan-600',
  'from-fuchsia-700 via-purple-800 to-slate-900',
];

/**
 * Checks if a Mushene Moment is still within its 24-hour lifetime.
 */
export function isMomentActive(moment: MusheneMoment, now = Date.now()): boolean {
  if (!moment.expires_at) return false;
  try {
    const expiryTime = new Date(moment.expires_at).getTime();
    return !Number.isNaN(expiryTime) && expiryTime > now;
  } catch {
    return false;
  }
}

/**
 * Filters out moments older than 24 hours and sorts newest first.
 */
export function filterActiveMoments(
  moments: MusheneMoment[],
  now = Date.now()
): MusheneMoment[] {
  return moments
    .filter((m) => isMomentActive(m, now))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

/**
 * Calculates human-readable time remaining before the moment vanishes.
 */
export function calculateTimeRemaining(expiresAt: string, now = Date.now()): string {
  try {
    const diffMs = new Date(expiresAt).getTime() - now;
    if (diffMs <= 0) return 'Expired';

    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    if (diffMinutes < 60) return `${diffMinutes}m left`;

    const diffHours = Math.floor(diffMinutes / 60);
    return `${diffHours}h left`;
  } catch {
    return '24h left';
  }
}

/**
 * Validates text for a punchy 24h Mushene moment.
 */
export function validateMomentInput(text: string): {
  isValid: boolean;
  error: string | null;
} {
  const trimmed = (text || '').trim();
  if (!trimmed) {
    return {
      isValid: false,
      error: 'Please enter what is happening for this Mushene moment.',
    };
  }
  if (trimmed.length < 3) {
    return {
      isValid: false,
      error: 'Moment must be at least 3 characters.',
    };
  }
  if (trimmed.length > 280) {
    return {
      isValid: false,
      error: 'Keep Mushene moments short and punchy (280 characters max).',
    };
  }
  return { isValid: true, error: null };
}

/**
 * Constructs a new 24h Mushene Moment.
 */
export function createMusheneMoment(params: {
  authorId: string;
  authorName: string;
  authorAvatar: string;
  isPersona: boolean;
  authorRealName?: string | null;
  text: string;
  tag?: string;
  bgGradient?: string;
  now?: number;
}): MusheneMoment {
  const timestamp = params.now || Date.now();
  const createdAt = new Date(timestamp).toISOString();
  // Exactly 24 hours later
  const expiresAt = new Date(timestamp + 24 * 60 * 60 * 1000).toISOString();

  return {
    id: `moment-${timestamp}-${Math.random().toString(36).substring(2, 7)}`,
    author_id: params.authorId,
    author_name: params.authorName,
    author_avatar: params.authorAvatar,
    is_persona: params.isPersona,
    author_real_name: params.authorRealName || null,
    text: params.text.trim(),
    tag: params.tag || 'Juja Street',
    bg_gradient: params.bgGradient || MOMENT_GRADIENTS[0],
    created_at: createdAt,
    expires_at: expiresAt,
    views_count: 1,
    reactions_count: { fire: 0, laugh: 0, shock: 0 },
  };
}

/**
 * Realistic Juja seed moments that are active right now (created a few hours ago).
 */
export function getSeedMoments(): MusheneMoment[] {
  const now = Date.now();
  return [
    {
      id: 'seed-moment-1',
      author_id: 'seed-author-1',
      author_name: '@gate_c_inspector',
      author_avatar: '🕵️',
      is_persona: true,
      author_real_name: 'Kevin Omondi',
      text: 'Power just went off in highrise! Entire hostel is outside on balconies screaming "KPLC Mwizi!" in perfect 4-part choir harmony 😭',
      tag: 'Hostels',
      bg_gradient: 'from-amber-600 via-rose-700 to-purple-800',
      created_at: new Date(now - 1000 * 60 * 60 * 2).toISOString(), // 2h ago
      expires_at: new Date(now + 1000 * 60 * 60 * 22).toISOString(), // 22h left
      views_count: 142,
      reactions_count: { fire: 38, laugh: 89, shock: 12 },
    },
    {
      id: 'seed-moment-2',
      author_id: 'seed-author-2',
      author_name: '@tech_park_ninja',
      author_avatar: '⚡',
      is_persona: true,
      author_real_name: 'Brian K.',
      text: 'Comp Sci 3rd years have occupied the grass lawn outside Tech Park with 3 extension cords daisy-chained together. Debugging thermodynamics assignments in broad daylight!',
      tag: 'Tech Park',
      bg_gradient: 'from-emerald-700 via-teal-700 to-cyan-800',
      created_at: new Date(now - 1000 * 60 * 60 * 5).toISOString(), // 5h ago
      expires_at: new Date(now + 1000 * 60 * 60 * 19).toISOString(), // 19h left
      views_count: 98,
      reactions_count: { fire: 45, laugh: 21, shock: 4 },
    },
    {
      id: 'seed-moment-3',
      author_id: 'seed-author-3',
      author_name: '@juja_chow',
      author_avatar: '🍲',
      is_persona: true,
      author_real_name: 'Faith Mwangi',
      text: 'Fresh batch of hot samosas and smokie pasua just landed at Gate A corner trolley. Queue already 15 students deep!',
      tag: 'Gate A',
      bg_gradient: 'from-rose-600 via-orange-500 to-amber-500',
      created_at: new Date(now - 1000 * 60 * 60 * 8).toISOString(), // 8h ago
      expires_at: new Date(now + 1000 * 60 * 60 * 16).toISOString(), // 16h left
      views_count: 210,
      reactions_count: { fire: 67, laugh: 15, shock: 8 },
    },
    {
      id: 'seed-moment-4',
      author_id: 'seed-author-4',
      author_name: '@library_sleeper',
      author_avatar: '😴',
      is_persona: true,
      author_real_name: 'Emmanuel Kip',
      text: 'Library 2nd floor silent section: someone set an 80s synth ringtone at maximum volume and left their phone in their backpack to go fetch tea.',
      tag: 'Library',
      bg_gradient: 'from-purple-700 via-pink-600 to-rose-600',
      created_at: new Date(now - 1000 * 60 * 60 * 14).toISOString(), // 14h ago
      expires_at: new Date(now + 1000 * 60 * 60 * 10).toISOString(), // 10h left
      views_count: 320,
      reactions_count: { fire: 22, laugh: 114, shock: 19 },
    },
    {
      id: 'seed-moment-5',
      author_id: 'seed-author-5',
      author_name: '@super_metro_fan',
      author_avatar: '🚌',
      is_persona: false,
      author_real_name: 'Collins K.',
      text: 'Super Metro conductor at Juja stage just announced 50 bob to town because of Friday jam. Fastest stampede in university history.',
      tag: 'Juja Stage',
      bg_gradient: 'from-indigo-800 via-blue-700 to-cyan-600',
      created_at: new Date(now - 1000 * 60 * 60 * 20).toISOString(), // 20h ago
      expires_at: new Date(now + 1000 * 60 * 60 * 4).toISOString(), // 4h left
      views_count: 450,
      reactions_count: { fire: 58, laugh: 94, shock: 33 },
    },
  ];
}

/**
 * Loads moments from localStorage and filters out expired ones.
 */
export function getLocalMoments(): MusheneMoment[] {
  if (typeof window === 'undefined') return filterActiveMoments(getSeedMoments());

  try {
    const raw = localStorage.getItem(LOCAL_MOMENTS_STORAGE_KEY);
    if (!raw) {
      const seeds = getSeedMoments();
      localStorage.setItem(LOCAL_MOMENTS_STORAGE_KEY, JSON.stringify(seeds));
      return filterActiveMoments(seeds);
    }

    const parsed: MusheneMoment[] = JSON.parse(raw);
    const active = filterActiveMoments(Array.isArray(parsed) ? parsed : []);

    // If all user stored moments expired, merge with fresh seed moments
    if (active.length === 0) {
      const freshSeeds = getSeedMoments();
      localStorage.setItem(LOCAL_MOMENTS_STORAGE_KEY, JSON.stringify(freshSeeds));
      return freshSeeds;
    }

    return active;
  } catch {
    return filterActiveMoments(getSeedMoments());
  }
}

/**
 * Saves active moments to localStorage.
 */
export function saveLocalMoments(moments: MusheneMoment[]): void {
  if (typeof window === 'undefined') return;
  try {
    const active = filterActiveMoments(moments);
    localStorage.setItem(LOCAL_MOMENTS_STORAGE_KEY, JSON.stringify(active));
  } catch {
    // Ignore storage quota
  }
}

/**
 * Appends a new moment to localStorage and dispatches a broadcast event.
 */
export function addLocalMoment(moment: MusheneMoment): MusheneMoment[] {
  const current = getLocalMoments();
  const updated = [moment, ...current];
  saveLocalMoments(updated);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('mushene-moments-changed', { detail: { moment } }));
  }

  return updated;
}
