/**
 * Reaction management for Juja campus posts.
 * Supports:
 * - Three campus-flavored reactions: laugh (😂), "ni kweli" (🤝), fire (🔥)
 * - Strict one-reaction-per-user-per-post rule
 * - Switchable (clicking another reaction switches; clicking current toggles off)
 * - Live optimistic count updates with Supabase persistence
 */

import { supabase } from './supabase';
import { ReactionType, ReactionCounts } from '../types';

/**
 * Pure state transition function for switching / toggling reactions.
 * Enforces one reaction per user per post.
 */
export function calculateReactionSwitch(
  currentReaction: ReactionType | null,
  clickedReaction: ReactionType,
  currentCounts: ReactionCounts
): { newReaction: ReactionType | null; newCounts: ReactionCounts } {
  const counts: ReactionCounts = {
    laugh: currentCounts?.laugh || 0,
    relatable: currentCounts?.relatable || 0,
    fire: currentCounts?.fire || 0,
    total: currentCounts?.total || 0,
  };

  // Case 1: Toggling off (user clicks their active reaction)
  if (currentReaction === clickedReaction) {
    const updatedTypeCount = Math.max(0, counts[clickedReaction] - 1);
    counts[clickedReaction] = updatedTypeCount;
    counts.total = counts.laugh + counts.relatable + counts.fire;
    return {
      newReaction: null,
      newCounts: counts,
    };
  }

  // Case 2: Switching from existing reaction to a different reaction
  if (currentReaction !== null) {
    counts[currentReaction] = Math.max(0, counts[currentReaction] - 1);
    counts[clickedReaction] = counts[clickedReaction] + 1;
    counts.total = counts.laugh + counts.relatable + counts.fire;
    return {
      newReaction: clickedReaction,
      newCounts: counts,
    };
  }

  // Case 3: Adding first reaction (previously null)
  counts[clickedReaction] = counts[clickedReaction] + 1;
  counts.total = counts.laugh + counts.relatable + counts.fire;
  return {
    newReaction: clickedReaction,
    newCounts: counts,
  };
}

/**
 * In-memory store for user reactions per post when running in demo/offline mode.
 */
const inMemoryUserReactions = new Map<string, ReactionType>(); // key: `${postId}:${userId}`

export function isUuid(id?: string | null): boolean {
  if (!id) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

/**
 * Fetches the current user's reaction for a given post.
 */
export async function getUserReactionForPost(
  postId: string,
  userId?: string | null
): Promise<ReactionType | null> {
  if (!userId) return null;

  // Check in-memory first for instant response
  const memKey = `${postId}:${userId}`;
  if (inMemoryUserReactions.has(memKey)) {
    return inMemoryUserReactions.get(memKey) || null;
  }

  if (!supabase || !isUuid(postId) || !isUuid(userId)) return null;

  try {
    const { data, error } = await supabase
      .from('reactions')
      .select('reaction_type')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .maybeSingle();

    if (!error && data?.reaction_type) {
      const reaction = data.reaction_type as ReactionType;
      inMemoryUserReactions.set(memKey, reaction);
      return reaction;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Persists the reaction switch/toggle to Supabase.
 * Enforces one reaction per user per post.
 */
export async function persistReaction(params: {
  postId: string;
  userId: string;
  newReaction: ReactionType | null;
  previousReaction: ReactionType | null;
}): Promise<{ success: boolean; error: string | null }> {
  const { postId, userId, newReaction } = params;
  const memKey = `${postId}:${userId}`;

  // Update in-memory state
  if (newReaction) {
    inMemoryUserReactions.set(memKey, newReaction);
  } else {
    inMemoryUserReactions.delete(memKey);
  }

  if (!supabase || !isUuid(postId) || !isUuid(userId)) {
    return { success: true, error: null };
  }

  try {
    // If removing reaction
    if (!newReaction) {
      const { error } = await supabase
        .from('reactions')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', userId);

      if (error) return { success: false, error: error.message };
      return { success: true, error: null };
    }

    // If adding or switching reaction, delete previous post reactions for this user first
    // to strictly enforce one reaction per user per post across all schemas
    await supabase
      .from('reactions')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId);

    const { error: insertError } = await supabase
      .from('reactions')
      .insert({
        post_id: postId,
        user_id: userId,
        reaction_type: newReaction,
      });

    if (insertError) {
      return { success: false, error: insertError.message };
    }

    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to save reaction' };
  }
}
