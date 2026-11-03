/**
 * Threaded commenting service with persona support for Juja campus posts.
 * Includes pure comment tree hierarchy construction, input validation, and Supabase integration.
 */

import { supabase } from './supabase';
import { Comment, CommentWithAuthor, Profile } from '../types';
import { containsBannedWords } from './bannedWords';
import { getHiddenCommentIds } from './moderation';

export interface CommentValidationResult {
  isValid: boolean;
  error: string | null;
}

/**
 * Validates a comment or reply input string.
 */
export function validateCommentInput(body: string): CommentValidationResult {
  const trimmed = (body || '').trim();

  if (!trimmed) {
    return {
      isValid: false,
      error: 'Comment cannot be empty.',
    };
  }

  if (trimmed.length > 2000) {
    return {
      isValid: false,
      error: 'Comment must be 2,000 characters or less.',
    };
  }

  // Check for banned words
  const bannedCheck = containsBannedWords(trimmed);
  if (bannedCheck.hasBannedWord) {
    return {
      isValid: false,
      error: `Your comment contains prohibited word "${bannedCheck.matchedWord}". Please follow Juja community rules.`,
    };
  }

  return { isValid: true, error: null };
}

/**
 * Pure function: Builds a nested tree of threaded comments from a flat list.
 * Sorts top-level comments and replies chronologically.
 */
export function buildCommentTree(
  flatComments: CommentWithAuthor[]
): CommentWithAuthor[] {
  if (!Array.isArray(flatComments) || flatComments.length === 0) {
    return [];
  }

  const hiddenIds = getHiddenCommentIds();

  // Create cloned map to avoid mutating originals
  const commentMap = new Map<string, CommentWithAuthor>();
  flatComments.forEach((c) => {
    const isHidden = hiddenIds.has(c.id) || Boolean(c.is_hidden);
    commentMap.set(c.id, {
      ...c,
      is_hidden: isHidden,
      replies: [],
    });
  });

  const roots: CommentWithAuthor[] = [];

  flatComments.forEach((original) => {
    const item = commentMap.get(original.id)!;
    if (original.parent_id && commentMap.has(original.parent_id)) {
      const parent = commentMap.get(original.parent_id)!;
      parent.replies = parent.replies || [];
      parent.replies.push(item);
    } else {
      roots.push(item);
    }
  });

  // Sort top-level comments newest first or oldest first (standard discussion is oldest first)
  roots.sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  // Recursively sort replies by created_at ascending
  const sortReplies = (comment: CommentWithAuthor) => {
    if (comment.replies && comment.replies.length > 0) {
      comment.replies.sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      comment.replies.forEach(sortReplies);
    }
  };

  roots.forEach(sortReplies);
  return roots;
}

/**
 * Pure helper to count all comments in a tree or flat list.
 */
export function countAllComments(comments: CommentWithAuthor[]): number {
  let count = 0;
  const traverse = (list: CommentWithAuthor[]) => {
    for (const item of list) {
      count++;
      if (item.replies && item.replies.length > 0) {
        traverse(item.replies);
      }
    }
  };
  traverse(comments);
  return count;
}

/**
 * In-memory fallback comment repository for offline/demo/testing mode.
 */
const inMemoryComments = new Map<string, CommentWithAuthor[]>();

// Seed sample campus threaded discussions for initial demo posts
const SEED_COMMENTS: Record<string, CommentWithAuthor[]> = {
  'seed-juja-1': [
    {
      id: 'c-seed-1',
      post_id: 'seed-juja-1',
      author_id: 'seed-user-1',
      parent_id: null,
      body: 'Can confirm! I bought two chapos today by Hall 6 and they could fit inside my teacup saucer. The revolution begins now.',
      is_persona: true,
      persona_name: '@engineering_ruler',
      persona_avatar: '📐',
      author_role: 'user',
      created_at: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    },
    {
      id: 'c-seed-2',
      post_id: 'seed-juja-1',
      author_id: 'seed-user-2',
      parent_id: 'c-seed-1', // Threaded reply!
      body: 'Haha but the stew density increased by 15% to compensate for the radius loss. Economics at JKUAT is wild.',
      is_persona: false,
      author_real_name: 'Kevin Kiptoo',
      author_role: 'user',
      created_at: new Date(Date.now() - 1000 * 60 * 7).toISOString(),
    },
    {
      id: 'c-seed-3',
      post_id: 'seed-juja-1',
      author_id: 'seed-user-3',
      parent_id: 'c-seed-2', // Nested reply!
      body: 'Stew density does not pay student tuition brother 😂 We want our 2cm back!',
      is_persona: true,
      persona_name: '@chapo_crusader',
      persona_avatar: '🛡️',
      author_role: 'user',
      created_at: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
    },
    {
      id: 'c-seed-4',
      post_id: 'seed-juja-1',
      author_id: 'seed-user-4',
      parent_id: null,
      body: 'Try Gate A near the bodaboda stage. Consistent thickness and zero skimping.',
      is_persona: false,
      author_real_name: 'Stacy W.',
      author_role: 'user',
      created_at: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    },
  ],
  'seed-juja-2': [
    {
      id: 'c-seed-5',
      post_id: 'seed-juja-2',
      author_id: 'seed-user-5',
      parent_id: null,
      body: 'I am your lab partner reading this right now. Tomorrow you are doing the entire derivation yourself! 😂',
      is_persona: true,
      persona_name: '@fourier_victim',
      persona_avatar: '📉',
      author_role: 'user',
      created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    },
    {
      id: 'c-seed-6',
      post_id: 'seed-juja-2',
      author_id: 'seed-user-6',
      parent_id: 'c-seed-5',
      body: 'Caught in 4K on Laodicean 😭',
      is_persona: true,
      persona_name: '@hall1_survivor',
      persona_avatar: '🍿',
      author_role: 'user',
      created_at: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    },
  ],
};

export function isUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

/**
 * Fetches all comments for a post, returns as a threaded tree.
 */
export async function fetchComments(
  postId: string
): Promise<CommentWithAuthor[]> {
  // Check if in-memory has comments for this post
  let flatList: CommentWithAuthor[] = inMemoryComments.get(postId) || [];

  if (supabase && isUuid(postId)) {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          id,
          post_id,
          author_id,
          parent_id,
          body,
          is_persona,
          created_at,
          profiles:author_id (real_name, persona_name, persona_avatar, role)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (!error && Array.isArray(data) && data.length > 0) {
        flatList = data.map((item: any) => ({
          id: item.id,
          post_id: item.post_id,
          author_id: item.is_persona ? 'masked' : item.author_id,
          parent_id: item.parent_id,
          body: item.body,
          is_persona: item.is_persona,
          created_at: item.created_at,
          persona_name: item.profiles?.persona_name || '@juja_campus',
          persona_avatar: item.profiles?.persona_avatar || '🎓',
          author_real_name: item.is_persona ? null : item.profiles?.real_name || 'Campus Student',
          author_role: item.profiles?.role || 'user',
        }));
      }
    } catch {
      // Fall through to in-memory/seed
    }
  }

  // If still empty and seed comments exist for this post, initialize with seed
  if (flatList.length === 0 && SEED_COMMENTS[postId]) {
    flatList = [...SEED_COMMENTS[postId]];
    inMemoryComments.set(postId, flatList);
  }

  return buildCommentTree(flatList);
}

export interface PostCommentParams {
  postId: string;
  authorId: string;
  body: string;
  isPersona: boolean;
  parentId?: string | null;
  profile?: Profile | null;
}

/**
 * Creates and saves a new comment or threaded reply.
 */
export async function postComment(
  params: PostCommentParams
): Promise<{ comment: CommentWithAuthor | null; error: string | null }> {
  const validation = validateCommentInput(params.body);
  if (!validation.isValid) {
    return { comment: null, error: validation.error };
  }

  const { postId, authorId, body, isPersona, parentId, profile } = params;

  // Build the local CommentWithAuthor object
  const newComment: CommentWithAuthor = {
    id: `c-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    post_id: postId,
    author_id: authorId,
    parent_id: parentId || null,
    body: body.trim(),
    is_persona: isPersona,
    created_at: new Date().toISOString(),
    persona_name: profile?.persona_name || '@juja_student',
    persona_avatar: profile?.persona_avatar || '🎓',
    author_real_name: isPersona ? null : profile?.real_name || 'Campus Student',
    author_role: profile?.role || 'user',
    replies: [],
  };

  // Save to in-memory store
  const existing = inMemoryComments.get(postId) || SEED_COMMENTS[postId] || [];
  inMemoryComments.set(postId, [...existing, newComment]);

  if (supabase && isUuid(postId) && isUuid(authorId)) {
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          author_id: authorId,
          parent_id: parentId || null,
          body: body.trim(),
          is_persona: isPersona,
        })
        .select(`
          id,
          post_id,
          author_id,
          parent_id,
          body,
          is_persona,
          created_at
        `)
        .single();

      if (!error && data) {
        newComment.id = data.id;
      }
    } catch {
      // In-memory already updated for instant feedback
    }
  }

  return { comment: newComment, error: null };
}
