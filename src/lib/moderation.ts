/**
 * Moderation and Admin Identity Reveal service for Laodicean.
 * Handles:
 * - Reporting posts and comments with reason categories
 * - One-tap hiding/restoring of posts
 * - Admin persona unmasking / deanonymization directory
 * - Sync with Supabase tables and persistent local cache
 */

import { supabase } from './supabase';
import { Report, ReportReason, ReportStatus, Post, FeedPost } from '../types';
import { SEED_JUJA_POSTS } from './posts';

export const LOCAL_REPORTS_KEY = 'laodicean_reports_store';
export const LOCAL_HIDDEN_POSTS_KEY = 'laodicean_hidden_posts_store';
export const LOCAL_HIDDEN_COMMENTS_KEY = 'laodicean_hidden_comments_store';
export const LOCAL_AUTOHIDE_THRESHOLD_KEY = 'laodicean_autohide_threshold';
export const DEFAULT_AUTOHIDE_THRESHOLD = 3;

export interface EnrichedReport extends Report {
  target_type: 'post' | 'comment';
  target_snippet: string;
  target_title?: string | null;
  target_author_persona?: string | null;
  target_author_real_name?: string | null;
  post_status?: 'live' | 'hidden';
  auto_hidden?: boolean;
}

export interface PersonaIdentityRecord {
  user_id: string;
  real_name: string;
  persona_name: string;
  persona_avatar: string;
  role: 'user' | 'moderator' | 'admin';
  confessions_count: number;
  total_posts_count: number;
  sample_confession?: string | null;
  created_at?: string;
}

/**
 * Pure validation for report submissions.
 */
export function validateReportInput(reason: string, details?: string | null): {
  isValid: boolean;
  error: string | null;
} {
  const validReasons: ReportReason[] = [
    'spam',
    'harassment',
    'hate_speech',
    'misinformation',
    'other',
  ];

  if (!reason || !validReasons.includes(reason as ReportReason)) {
    return {
      isValid: false,
      error: 'Please select a valid reason for reporting this content.',
    };
  }

  if (details && details.trim().length > 500) {
    return {
      isValid: false,
      error: 'Additional details must be 500 characters or less.',
    };
  }

  return { isValid: true, error: null };
}

/**
 * Seed reports to showcase the moderation dashboard immediately.
 */
export const SEED_REPORTS: EnrichedReport[] = [
  {
    id: 'rep-seed-1',
    reporter_id: 'seed-reporter-1',
    post_id: 'seed-juja-2',
    comment_id: null,
    reason: 'misinformation',
    details: 'Claims to not know Fourier Transform while actually solving 4th year lab problems.',
    status: 'pending',
    created_at: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    target_type: 'post',
    target_title: 'Hall 1 8 AM Lecture Confession',
    target_snippet: 'I have attended exactly two 8 AM differential calculus lectures in Hall 1 this entire semester...',
    target_author_persona: '@backrow_scholar',
    target_author_real_name: 'Kevin Omondi',
    post_status: 'live',
  },
  {
    id: 'rep-seed-2',
    reporter_id: 'seed-reporter-2',
    post_id: null,
    comment_id: 'c-seed-3',
    reason: 'harassment',
    details: 'Aggressive debate regarding Gate C chapo diameter.',
    status: 'pending',
    created_at: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    target_type: 'comment',
    target_snippet: 'Stew density does not pay student tuition brother 😂 We want our 2cm back!',
    target_author_persona: '@chapo_crusader',
    target_author_real_name: 'Dennis Kiprop',
    post_status: 'live',
  },
];

/**
 * Known seed personas for the Admin Persona Directory so admins can deanonymize immediately.
 */
export const SEED_PERSONAS_DIRECTORY: PersonaIdentityRecord[] = [
  {
    user_id: 'seed-user-omondi',
    real_name: 'Kevin Omondi',
    persona_name: '@backrow_scholar',
    persona_avatar: '🎭',
    role: 'user',
    confessions_count: 3,
    total_posts_count: 5,
    sample_confession: 'I have attended exactly two 8 AM differential calculus lectures in Hall 1...',
  },
  {
    user_id: 'seed-user-kiprop',
    real_name: 'Dennis Kiprop',
    persona_name: '@chapo_crusader',
    persona_avatar: '🛡️',
    role: 'user',
    confessions_count: 1,
    total_posts_count: 4,
    sample_confession: 'Confession: I secretly weighed the Gate C mandazi batch on my electronic kitchen scale.',
  },
  {
    user_id: 'seed-user-inspector',
    real_name: 'Joy Wambui',
    persona_name: '@gate_c_inspector',
    persona_avatar: '🕵️',
    role: 'user',
    confessions_count: 2,
    total_posts_count: 6,
    sample_confession: 'The chapo guy reduced the diameter by 2cm while keeping 20 bob.',
  },
  {
    user_id: 'seed-user-eduroam',
    real_name: 'Erick Mutua',
    persona_name: '@eduroam_believer',
    persona_avatar: '📡',
    role: 'user',
    confessions_count: 1,
    total_posts_count: 3,
    sample_confession: 'I once sat outside the library until 2 AM downloading Python documentation on 3G.',
  },
];

/**
 * Loads reports from local storage.
 */
export function getLocalReports(): EnrichedReport[] {
  if (typeof window === 'undefined') return SEED_REPORTS;
  try {
    const raw = localStorage.getItem(LOCAL_REPORTS_KEY);
    if (!raw) return SEED_REPORTS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : SEED_REPORTS;
  } catch {
    return SEED_REPORTS;
  }
}

/**
 * Saves reports to local storage.
 */
export function saveLocalReports(reports: EnrichedReport[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_REPORTS_KEY, JSON.stringify(reports));
  } catch {
    // Ignore storage quota
  }
}

/**
 * Gets hidden post IDs map from localStorage.
 */
export function getHiddenPostIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(LOCAL_HIDDEN_POSTS_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

/**
 * Saves hidden post IDs map to localStorage.
 */
export function saveHiddenPostIds(ids: Set<string>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_HIDDEN_POSTS_KEY, JSON.stringify(Array.from(ids)));
  } catch {
    // Ignore storage quota
  }
}

/**
 * Retrieves the configured auto-hide report threshold (defaults to 3).
 */
export function getAutoHideThreshold(): number {
  if (typeof window === 'undefined') return DEFAULT_AUTOHIDE_THRESHOLD;
  try {
    const raw = localStorage.getItem(LOCAL_AUTOHIDE_THRESHOLD_KEY);
    if (!raw) return DEFAULT_AUTOHIDE_THRESHOLD;
    const val = parseInt(raw, 10);
    return isNaN(val) || val < 1 ? DEFAULT_AUTOHIDE_THRESHOLD : val;
  } catch {
    return DEFAULT_AUTOHIDE_THRESHOLD;
  }
}

/**
 * Updates the auto-hide threshold (admin only).
 */
export function setAutoHideThreshold(threshold: number): void {
  if (typeof window === 'undefined') return;
  try {
    const safeVal = Math.max(1, Math.min(20, Math.round(threshold)));
    localStorage.setItem(LOCAL_AUTOHIDE_THRESHOLD_KEY, safeVal.toString());
    window.dispatchEvent(
      new CustomEvent('autohide-threshold-changed', { detail: { threshold: safeVal } })
    );
  } catch {
    // Ignore storage quota
  }
}

/**
 * Gets hidden comment IDs map from localStorage.
 */
export function getHiddenCommentIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(LOCAL_HIDDEN_COMMENTS_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

/**
 * Saves hidden comment IDs map to localStorage.
 */
export function saveHiddenCommentIds(ids: Set<string>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_HIDDEN_COMMENTS_KEY, JSON.stringify(Array.from(ids)));
  } catch {
    // Ignore storage quota
  }
}

/**
 * Toggles a comment's hidden status.
 */
export function toggleCommentStatus(
  commentId: string,
  newStatus: 'live' | 'hidden'
): { success: boolean; commentId: string; status: 'live' | 'hidden' } {
  const hidden = getHiddenCommentIds();
  if (newStatus === 'hidden') {
    hidden.add(commentId);
  } else {
    hidden.delete(commentId);
  }
  saveHiddenCommentIds(hidden);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('comment-status-changed', {
        detail: { commentId, status: newStatus },
      })
    );
  }

  return { success: true, commentId, status: newStatus };
}

/**
 * Pure function: Determines whether content should be auto-hidden based on pending reports.
 */
export function shouldAutoHide(pendingReportCount: number, threshold: number): boolean {
  return pendingReportCount >= threshold;
}

/**
 * Submits a new report on a post or comment.
 * If reports reach the auto-hide threshold, automatically hides the content pending admin review.
 */
export async function submitReport(params: {
  reporterId: string;
  postId?: string | null;
  commentId?: string | null;
  reason: ReportReason;
  details?: string | null;
  targetSnippet?: string;
  targetTitle?: string | null;
  targetAuthorPersona?: string | null;
  targetAuthorRealName?: string | null;
}): Promise<{
  success: boolean;
  report?: EnrichedReport;
  autoHidden?: boolean;
  reportCount?: number;
  error?: string;
}> {
  const {
    reporterId,
    postId,
    commentId,
    reason,
    details,
    targetSnippet,
    targetTitle,
    targetAuthorPersona,
    targetAuthorRealName,
  } = params;

  const validation = validateReportInput(reason, details);
  if (!validation.isValid) {
    return { success: false, error: validation.error || 'Invalid report input' };
  }

  const reportId = `rep-${Date.now()}`;
  const newReport: EnrichedReport = {
    id: reportId,
    reporter_id: reporterId,
    post_id: postId || null,
    comment_id: commentId || null,
    reason,
    details: details?.trim() || null,
    status: 'pending',
    created_at: new Date().toISOString(),
    target_type: postId ? 'post' : 'comment',
    target_snippet: targetSnippet || 'Reported campus content',
    target_title: targetTitle || null,
    target_author_persona: targetAuthorPersona || '@anonymous',
    target_author_real_name: targetAuthorRealName || null,
    post_status: 'live',
  };

  // 1. Save to local storage for instant dashboard updates
  const current = getLocalReports();
  const updated = [newReport, ...current];
  saveLocalReports(updated);

  // 2. Count pending reports for this exact target
  const targetPendingReports = updated.filter((r) => {
    if (r.status !== 'pending') return false;
    if (postId && r.post_id === postId) return true;
    if (commentId && r.comment_id === commentId) return true;
    return false;
  });

  const threshold = getAutoHideThreshold();
  let wasAutoHidden = false;

  // 3. Auto-hide if pending reports reach threshold
  if (shouldAutoHide(targetPendingReports.length, threshold)) {
    wasAutoHidden = true;
    if (postId) {
      await togglePostStatus(postId, 'hidden');
    } else if (commentId) {
      toggleCommentStatus(commentId, 'hidden');
    }

    // Mark reports as auto_hidden
    const markedReports = updated.map((r) => {
      const isTarget = (postId && r.post_id === postId) || (commentId && r.comment_id === commentId);
      return isTarget ? { ...r, auto_hidden: true, post_status: 'hidden' as const } : r;
    });
    saveLocalReports(markedReports);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('content-autohidden', {
          detail: {
            targetType: postId ? 'post' : 'comment',
            targetId: postId || commentId,
            reportCount: targetPendingReports.length,
            threshold,
          },
        })
      );
    }
  }

  // 4. Persist to Supabase if available
  if (supabase && (!postId || !postId.startsWith('seed-')) && (!commentId || !commentId.startsWith('c-seed-'))) {
    try {
      await supabase.from('reports').insert({
        reporter_id: reporterId,
        post_id: postId || null,
        comment_id: commentId || null,
        reason,
        details: details?.trim() || null,
        status: 'pending',
      });
    } catch {
      // Local fallback is already saved
    }
  }

  // Dispatch event so any open admin dashboard refreshes count
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('reports-updated', { detail: { reportId } }));
  }

  return {
    success: true,
    report: newReport,
    autoHidden: wasAutoHidden,
    reportCount: targetPendingReports.length,
  };
}

/**
 * Admin action: Dismisses all reports against a post or comment and restores it to live status.
 */
export async function dismissAllReportsAndRestore(
  targetType: 'post' | 'comment',
  targetId: string
): Promise<{ success: boolean }> {
  // 1. Mark all reports for this target as dismissed
  const reports = getLocalReports();
  const updated = reports.map((r) => {
    const isTarget =
      (targetType === 'post' && r.post_id === targetId) ||
      (targetType === 'comment' && r.comment_id === targetId);
    return isTarget ? { ...r, status: 'dismissed' as const, post_status: 'live' as const, auto_hidden: false } : r;
  });
  saveLocalReports(updated);

  // 2. Restore live status
  if (targetType === 'post') {
    await togglePostStatus(targetId, 'live');
  } else {
    toggleCommentStatus(targetId, 'live');
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('reports-updated', { detail: { targetId, restored: true } }));
  }

  return { success: true };
}

/**
 * Toggles a post's status between 'live' and 'hidden' with one tap.
 */
export async function togglePostStatus(
  postId: string,
  newStatus: 'live' | 'hidden'
): Promise<{ success: boolean; postId: string; status: 'live' | 'hidden' }> {
  // 1. Update local hidden posts set
  const hidden = getHiddenPostIds();
  if (newStatus === 'hidden') {
    hidden.add(postId);
  } else {
    hidden.delete(postId);
  }
  saveHiddenPostIds(hidden);

  // 2. Update reports targeting this post
  const reports = getLocalReports();
  const updatedReports = reports.map((r) =>
    r.post_id === postId ? { ...r, post_status: newStatus } : r
  );
  saveLocalReports(updatedReports);

  // 3. Persist to Supabase if connected
  if (supabase && !postId.startsWith('seed-')) {
    try {
      await supabase
        .from('posts')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', postId);
    } catch {
      // Ignore
    }
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('post-status-changed', {
        detail: { postId, status: newStatus },
      })
    );
  }

  return { success: true, postId, status: newStatus };
}

/**
 * Updates report status (e.g. resolve or dismiss).
 */
export async function updateReportStatus(
  reportId: string,
  status: ReportStatus
): Promise<boolean> {
  const reports = getLocalReports();
  const updated = reports.map((r) => (r.id === reportId ? { ...r, status } : r));
  saveLocalReports(updated);

  if (supabase && !reportId.startsWith('rep-seed-')) {
    try {
      await supabase.from('reports').update({ status }).eq('id', reportId);
    } catch {
      // Ignore
    }
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('reports-updated', { detail: { reportId, status } }));
  }

  return true;
}

/**
 * Returns the persona directory with real names for admin view.
 */
export async function getPersonaDirectory(): Promise<PersonaIdentityRecord[]> {
  const directory: PersonaIdentityRecord[] = [...SEED_PERSONAS_DIRECTORY];

  // Try fetching profiles from Supabase if active
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, real_name, persona_name, persona_avatar, role, created_at')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        data.forEach((p) => {
          if (!directory.some((d) => d.user_id === p.id || d.persona_name === p.persona_name)) {
            directory.push({
              user_id: p.id,
              real_name: p.real_name,
              persona_name: p.persona_name,
              persona_avatar: p.persona_avatar || '🎭',
              role: p.role,
              confessions_count: 0,
              total_posts_count: 1,
              created_at: p.created_at,
            });
          }
        });
      }
    } catch {
      // Fallback to directory
    }
  }

  return directory;
}
