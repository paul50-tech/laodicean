/**
 * Guest Blogger Management & Editorial Review Queue Service for Laodicean.
 * 
 * Features:
 * - Admin tool to create and manage guest blogger accounts.
 * - Auto-routes guest blogger posts to 'pending' review status.
 * - Admin review queue: preview, approve (go live in feed), or send back with editorial feedback.
 * - Syncs with Supabase and persistent local storage.
 */

import { supabase } from './supabase';
import { GuestBloggerAccount, FeedPost, PostStatus } from '../types';

export const LOCAL_GUEST_BLOGGERS_KEY = 'laodicean_guest_bloggers_store';
export const LOCAL_PENDING_POSTS_KEY = 'laodicean_pending_posts_store';

/**
 * Pre-seeded guest blogger accounts representing campus partner societies.
 */
export const SEED_GUEST_BLOGGERS: GuestBloggerAccount[] = [
  {
    id: 'guest-blogger-1',
    email: 'grace.ndinda@students.jkuat.ac.ke',
    display_name: 'Grace Ndinda',
    persona_name: '@green_juja',
    persona_avatar: '🌿',
    bio: 'Secretary of JKUAT Environmental & Tree Planting Club. Reporting on campus sustainability and clean energy projects.',
    require_review: true,
    status: 'active',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    created_by: 'admin',
    posts_count: 2,
  },
  {
    id: 'guest-blogger-2',
    email: 'cyrus.maina@techsociety.jkuat.ac.ke',
    display_name: 'Cyrus Maina',
    persona_name: '@code_sherpa',
    persona_avatar: '⚡',
    bio: 'Lead coordinator at JKUAT Developers Circle. Covering campus hackathons, open-source projects, and engineering workshop highlights.',
    require_review: true,
    status: 'active',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    created_by: 'admin',
    posts_count: 3,
  },
  {
    id: 'guest-blogger-3',
    email: 'brenda.cherono@rotaract.juja.ke',
    display_name: 'Brenda Cherono',
    persona_name: '@rotaract_juja',
    persona_avatar: '🤝',
    bio: 'Community outreach lead at Rotaract Club of Juja. Publishing weekly student welfare initiatives and blood drives.',
    require_review: true,
    status: 'active',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    created_by: 'admin',
    posts_count: 1,
  },
];

/**
 * Initial pending posts from guest bloggers ready for admin preview, approval, or send-back.
 */
export const SEED_PENDING_POSTS: FeedPost[] = [
  {
    id: 'pending-guest-post-1',
    community_id: '00000000-0000-0000-0000-000000000001',
    community_name: 'Juja',
    community_slug: 'juja',
    post_type: 'story',
    title: 'Solar Clean Water Initiative at Gate C & Hall 3',
    body: 'The Environmental Club in collaboration with JKUAT Agricultural Engineering installed two gravity-fed solar filtration taps behind Gate C this morning. All students are welcome to refill reusable water bottles free of charge between 7 AM and 6 PM. We are testing microbial flow sensors this entire week—please report any pressure drops!',
    image_url: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=900&q=80',
    is_persona: false,
    persona_name: '@green_juja',
    persona_avatar: '🌿',
    author_id: 'guest-blogger-1',
    author_real_name: 'Grace Ndinda (Guest Blogger)',
    author_role: 'guest_blogger',
    status: 'pending',
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 min ago
    updated_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    reactions_count: { laugh: 0, relatable: 0, fire: 0, total: 0 },
    comments_count: 0,
  },
  {
    id: 'pending-guest-post-2',
    community_id: '00000000-0000-0000-0000-000000000001',
    community_name: 'Juja',
    community_slug: 'juja',
    post_type: 'meme',
    title: 'Hostel Cooker Power Circuit Tripping at 8:01 PM',
    body: 'WHEN 400 STUDENTS SIMULTANEOUSLY PLUG IN COIL HEATERS TO MAKE UGALI AND THE MAIN HALL 4 TRANSFORMER SOUNDS LIKE A JET ENGINE',
    image_url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=900&q=80',
    is_persona: true,
    persona_name: '@code_sherpa',
    persona_avatar: '⚡',
    author_id: 'guest-blogger-2',
    author_real_name: 'Cyrus Maina (Guest Blogger)',
    author_role: 'guest_blogger',
    status: 'pending',
    created_at: new Date(Date.now() - 1000 * 60 * 20).toISOString(), // 20 min ago
    updated_at: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    reactions_count: { laugh: 0, relatable: 0, fire: 0, total: 0 },
    comments_count: 0,
  },
];

/**
 * Validates parameters for creating a new guest blogger account.
 */
export function validateGuestBloggerInput(params: {
  display_name: string;
  email: string;
  persona_name: string;
  bio?: string;
}): { isValid: boolean; error: string | null } {
  const { display_name, email, persona_name, bio } = params;

  const trimmedName = (display_name || '').trim();
  if (!trimmedName || trimmedName.length < 2) {
    return { isValid: false, error: 'Full name or display title must be at least 2 characters.' };
  }
  if (trimmedName.length > 80) {
    return { isValid: false, error: 'Display name must be 80 characters or less.' };
  }

  const trimmedEmail = (email || '').trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
    return { isValid: false, error: 'Please enter a valid email address for the guest blogger.' };
  }

  const trimmedPersona = (persona_name || '').trim();
  if (!trimmedPersona || trimmedPersona.length < 2) {
    return { isValid: false, error: 'Please specify a campus persona or alias handle.' };
  }

  if (bio && bio.length > 300) {
    return { isValid: false, error: 'Bio must be 300 characters or less.' };
  }

  return { isValid: true, error: null };
}

/**
 * Retrieves all registered guest bloggers from local storage with seed fallback.
 */
export function getLocalGuestBloggers(): GuestBloggerAccount[] {
  if (typeof window === 'undefined') return [...SEED_GUEST_BLOGGERS];

  try {
    const raw = localStorage.getItem(LOCAL_GUEST_BLOGGERS_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_GUEST_BLOGGERS_KEY, JSON.stringify(SEED_GUEST_BLOGGERS));
      return [...SEED_GUEST_BLOGGERS];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [...SEED_GUEST_BLOGGERS];
  } catch {
    return [...SEED_GUEST_BLOGGERS];
  }
}

/**
 * Saves guest bloggers to local storage.
 */
export function saveLocalGuestBloggers(bloggers: GuestBloggerAccount[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_GUEST_BLOGGERS_KEY, JSON.stringify(bloggers));
  } catch {
    // Ignore quota issues
  }
}

/**
 * Creates a new guest blogger account.
 */
export function createGuestBloggerAccount(params: {
  display_name: string;
  email: string;
  persona_name: string;
  persona_avatar?: string;
  bio?: string;
  require_review?: boolean;
  created_by?: string;
}): { success: boolean; blogger?: GuestBloggerAccount; error: string | null } {
  const validation = validateGuestBloggerInput(params);
  if (!validation.isValid) {
    return { success: false, error: validation.error };
  }

  const bloggers = getLocalGuestBloggers();
  const normalizedEmail = params.email.trim().toLowerCase();

  // Prevent duplicate emails
  if (bloggers.some((b) => b.email.toLowerCase() === normalizedEmail)) {
    return { success: false, error: 'A guest blogger account with this email already exists.' };
  }

  // Ensure persona starts with @
  let cleanPersona = params.persona_name.trim();
  if (!cleanPersona.startsWith('@')) {
    cleanPersona = `@${cleanPersona}`;
  }

  const newBlogger: GuestBloggerAccount = {
    id: `guest-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    email: normalizedEmail,
    display_name: params.display_name.trim(),
    persona_name: cleanPersona,
    persona_avatar: params.persona_avatar || '✍️',
    bio: params.bio?.trim() || 'Verified Juja Guest Blogger',
    require_review: params.require_review ?? true,
    status: 'active',
    created_at: new Date().toISOString(),
    created_by: params.created_by || 'admin',
    posts_count: 0,
  };

  const updated = [newBlogger, ...bloggers];
  saveLocalGuestBloggers(updated);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('guest-bloggers-updated', { detail: { blogger: newBlogger } })
    );
  }

  return { success: true, blogger: newBlogger, error: null };
}

/**
 * Toggles a guest blogger's requirement for review or active status.
 */
export function updateGuestBloggerSettings(
  bloggerId: string,
  updates: Partial<Pick<GuestBloggerAccount, 'require_review' | 'status'>>
): boolean {
  const bloggers = getLocalGuestBloggers();
  const updated = bloggers.map((b) => (b.id === bloggerId ? { ...b, ...updates } : b));
  saveLocalGuestBloggers(updated);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('guest-bloggers-updated'));
  }
  return true;
}

/**
 * Retrieves the pending review queue.
 */
export function getLocalPendingQueue(): FeedPost[] {
  if (typeof window === 'undefined') return [...SEED_PENDING_POSTS];

  try {
    const raw = localStorage.getItem(LOCAL_PENDING_POSTS_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_PENDING_POSTS_KEY, JSON.stringify(SEED_PENDING_POSTS));
      return [...SEED_PENDING_POSTS];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [...SEED_PENDING_POSTS];
  } catch {
    return [...SEED_PENDING_POSTS];
  }
}

/**
 * Saves pending review queue to local storage.
 */
export function saveLocalPendingQueue(posts: FeedPost[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_PENDING_POSTS_KEY, JSON.stringify(posts));
  } catch {
    // Ignore
  }
}

/**
 * Adds a post to the pending review queue.
 */
export function addPostToPendingQueue(post: FeedPost): void {
  const queue = getLocalPendingQueue();
  // Avoid duplicate entries
  if (!queue.some((p) => p.id === post.id)) {
    const updated = [post, ...queue];
    saveLocalPendingQueue(updated);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('pending-queue-updated', { detail: { post } }));
    }
  }
}

/**
 * Approves a pending post, making it live in the Juja campus feed.
 */
export function approvePendingPost(
  postId: string,
  reviewerId = 'admin'
): { success: boolean; approvedPost: FeedPost | null; error: string | null } {
  const queue = getLocalPendingQueue();
  const target = queue.find((p) => p.id === postId);

  if (!target) {
    return { success: false, approvedPost: null, error: 'Post not found in pending queue.' };
  }

  // Update status to 'live'
  const approvedPost: FeedPost = {
    ...target,
    status: 'live',
    updated_at: new Date().toISOString(),
    reviewed_at: new Date().toISOString(),
    review_feedback: null,
  };

  // Remove from pending queue
  const remaining = queue.filter((p) => p.id !== postId);
  saveLocalPendingQueue(remaining);

  // Sync to Supabase if available
  if (supabase && !postId.startsWith('pending-guest-')) {
    Promise.resolve(
      supabase
        .from('posts')
        .update({ status: 'live', updated_at: approvedPost.updated_at })
        .eq('id', postId)
    ).catch(() => {});
  }

  // Broadcast events so the feed immediately incorporates the newly approved live post
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('post-status-changed', {
        detail: { postId, status: 'live' },
      })
    );
    window.dispatchEvent(
      new CustomEvent('pending-queue-updated', {
        detail: { approvedPostId: postId },
      })
    );
    window.dispatchEvent(
      new CustomEvent('feed-post-approved', {
        detail: { post: approvedPost },
      })
    );
  }

  return { success: true, approvedPost, error: null };
}

/**
 * Sends a pending post back to the guest blogger with editorial feedback notes.
 */
export function sendBackPendingPost(
  postId: string,
  feedback: string,
  reviewerId = 'admin'
): { success: boolean; updatedPost: FeedPost | null; error: string | null } {
  const trimmedFeedback = (feedback || '').trim();
  if (!trimmedFeedback) {
    return { success: false, updatedPost: null, error: 'Please provide editorial notes explaining why this post is being sent back.' };
  }

  const queue = getLocalPendingQueue();
  const target = queue.find((p) => p.id === postId);

  if (!target) {
    return { success: false, updatedPost: null, error: 'Post not found in pending queue.' };
  }

  const updatedPost: FeedPost = {
    ...target,
    status: 'rejected',
    review_feedback: trimmedFeedback,
    reviewed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Keep in queue but marked as 'rejected' so reviewer can see sent-back history or restore
  const updatedQueue = queue.map((p) => (p.id === postId ? updatedPost : p));
  saveLocalPendingQueue(updatedQueue);

  // Sync to Supabase if available
  if (supabase && !postId.startsWith('pending-guest-')) {
    Promise.resolve(
      supabase
        .from('posts')
        .update({ status: 'hidden', updated_at: updatedPost.updated_at })
        .eq('id', postId)
    ).catch(() => {});
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('pending-queue-updated', {
        detail: { sentBackPostId: postId, feedback: trimmedFeedback },
      })
    );
    window.dispatchEvent(
      new CustomEvent('post-status-changed', {
        detail: { postId, status: 'hidden' },
      })
    );
  }

  return { success: true, updatedPost, error: null };
}
