import {
  SEED_COMMENTS,
  SEED_COMMUNITIES,
  SEED_COMMUNITY_REQUESTS,
  SEED_POSTS,
} from '../data/seedData';
import { slugify } from './feedLogic';
import { isSupabaseConfigured, supabase } from './supabase';
import {
  CampusUser,
  Community,
  CommunityRequest,
  CommunityRequestInput,
  Post,
  PostComment,
  PostDraftInput,
  PostType,
} from '../types/laodicean';

const STORAGE_KEYS = {
  posts: 'laodicean_posts_v1',
  comments: 'laodicean_comments_v1',
  requests: 'laodicean_community_requests_v1',
  user: 'laodicean_user_v1',
  liteMode: 'laodicean_lite_mode_v1',
};

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota errors cleanly
  }
}

/**
 * Detects weak-data preference from localStorage or browser Save-Data header.
 */
export function getInitialLiteMode(): boolean {
  if (typeof window === 'undefined') return false;
  const saved = window.localStorage.getItem(STORAGE_KEYS.liteMode);
  if (saved !== null) {
    return saved === 'true';
  }
  const nav = navigator as Navigator & { connection?: { saveData?: boolean } };
  return Boolean(nav.connection?.saveData);
}

export function saveLiteModePreference(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEYS.liteMode, String(enabled));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Loads active communities (Supabase when configured, otherwise seed data).
 */
export async function fetchCommunities(): Promise<Community[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('communities')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (!error && data && data.length > 0) {
      return data.map((row) => ({
        slug: row.slug,
        name: row.name,
        subtitle: row.subtitle,
        description: row.description,
        region: row.region,
        memberCount: row.member_count ?? 1,
        isActive: row.is_active ?? true,
        bannerUrl: row.slug === 'juja' ? SEED_COMMUNITIES[0].bannerUrl : undefined,
      }));
    }
  }
  return SEED_COMMUNITIES;
}

/**
 * Loads all mixed posts in chronological order.
 */
export async function fetchPosts(): Promise<Post[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (!error && data && data.length > 0) {
      return data.map((row) => ({
        id: row.id,
        slug: row.slug,
        communitySlug: row.community_slug,
        postType: row.post_type as PostType,
        title: row.title ?? undefined,
        body: row.body,
        spot: row.spot,
        authorName: row.author_name,
        authorHandle: row.author_handle,
        authorCourse: row.author_course ?? undefined,
        imageUrl: row.image_url ?? undefined,
        imageAlt: row.image_alt ?? undefined,
        imageKb: row.image_kb ?? undefined,
        likesCount: row.likes_count ?? 0,
        commentsCount: row.comments_count ?? 0,
        likedByMe: false,
        createdAt: row.created_at,
      }));
    }
  }

  const stored = readJson<Post[] | null>(STORAGE_KEYS.posts, null);
  if (stored && stored.length > 0) {
    return stored;
  }
  writeJson(STORAGE_KEYS.posts, SEED_POSTS);
  return SEED_POSTS;
}

/**
 * Publishes a new post to Supabase (or local storage when running without keys).
 */
export async function publishPost(
  draft: PostDraftInput,
  author: CampusUser
): Promise<Post> {
  const baseSlug = slugify(draft.title || draft.body.slice(0, 48)) || 'campus-post';
  const uniqueSlug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;

  const newPost: Post = {
    id: `post-${Date.now()}`,
    slug: uniqueSlug,
    communitySlug: draft.communitySlug,
    postType: draft.postType,
    title: draft.title.trim() || undefined,
    body: draft.body.trim(),
    spot: draft.spot.trim() || 'Campus',
    authorName: author.name,
    authorHandle: author.handle.startsWith('@') ? author.handle : `@${author.handle}`,
    authorCourse: author.course || undefined,
    imageUrl: draft.imageUrl,
    imageAlt: draft.imageAlt || draft.title.trim() || 'Campus photo from Juja',
    imageKb: draft.imageKb,
    likesCount: 0,
    commentsCount: 0,
    likedByMe: false,
    createdAt: new Date().toISOString(),
  };

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('posts')
      .insert({
        slug: newPost.slug,
        community_slug: newPost.communitySlug,
        post_type: newPost.postType,
        title: newPost.title ?? null,
        body: newPost.body,
        spot: newPost.spot,
        author_name: newPost.authorName,
        author_handle: newPost.authorHandle,
        author_course: newPost.authorCourse ?? null,
        image_url: newPost.imageUrl ?? null,
        image_alt: newPost.imageAlt ?? null,
        image_kb: newPost.imageKb ?? null,
      })
      .select()
      .single();

    if (!error && data) {
      newPost.id = data.id;
      newPost.createdAt = data.created_at;
    }
  }

  const current = readJson<Post[]>(STORAGE_KEYS.posts, SEED_POSTS);
  const updated = [newPost, ...current];
  writeJson(STORAGE_KEYS.posts, updated);
  writeJson(STORAGE_KEYS.user, {
    ...author,
    handle: newPost.authorHandle,
  });
  return newPost;
}

export function saveCampusUserSession(user: CampusUser): void {
  const formattedHandle = user.handle.trim().startsWith('@')
    ? user.handle.trim()
    : `@${user.handle.trim()}`;
  writeJson(STORAGE_KEYS.user, {
    ...user,
    handle: formattedHandle,
  });
}

/**
 * Toggles reaction ("Appreciate / Felt this") count on a post.
 */
export async function togglePostLike(postId: string): Promise<Post[]> {
  const current = readJson<Post[]>(STORAGE_KEYS.posts, SEED_POSTS);
  let targetLikes = 0;

  const updated = current.map((post) => {
    if (post.id !== postId) return post;
    const nextLiked = !post.likedByMe;
    const nextCount = Math.max(0, post.likesCount + (nextLiked ? 1 : -1));
    targetLikes = nextCount;
    return {
      ...post,
      likedByMe: nextLiked,
      likesCount: nextCount,
    };
  });

  writeJson(STORAGE_KEYS.posts, updated);

  if (isSupabaseConfigured && supabase) {
    await supabase
      .from('posts')
      .update({ likes_count: targetLikes })
      .eq('id', postId);
  }

  return updated;
}

/**
 * Loads comments for a specific post.
 */
export async function fetchCommentsForPost(postId: string): Promise<PostComment[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('post_comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      return data.map((row) => ({
        id: row.id,
        postId: row.post_id,
        authorName: row.author_name,
        authorHandle: row.author_handle,
        body: row.body,
        createdAt: row.created_at,
      }));
    }
  }

  const allComments = readJson<Record<string, PostComment[]>>(
    STORAGE_KEYS.comments,
    SEED_COMMENTS
  );
  return allComments[postId] ?? [];
}

/**
 * Adds a reply/comment to a post and increments its comment count.
 */
export async function createPostComment(
  postId: string,
  body: string,
  author: CampusUser
): Promise<{ comment: PostComment; updatedPosts: Post[] }> {
  const newComment: PostComment = {
    id: `c-${Date.now()}`,
    postId,
    authorName: author.name,
    authorHandle: author.handle.startsWith('@') ? author.handle : `@${author.handle}`,
    body: body.trim(),
    createdAt: new Date().toISOString(),
  };

  if (isSupabaseConfigured && supabase) {
    const { data } = await supabase
      .from('post_comments')
      .insert({
        post_id: postId,
        author_name: newComment.authorName,
        author_handle: newComment.authorHandle,
        body: newComment.body,
      })
      .select()
      .single();

    if (data) {
      newComment.id = data.id;
      newComment.createdAt = data.created_at;
    }
  }

  const allComments = readJson<Record<string, PostComment[]>>(
    STORAGE_KEYS.comments,
    SEED_COMMENTS
  );
  const existingForPost = allComments[postId] ?? [];
  allComments[postId] = [...existingForPost, newComment];
  writeJson(STORAGE_KEYS.comments, allComments);

  const posts = readJson<Post[]>(STORAGE_KEYS.posts, SEED_POSTS);
  let nextCount = 1;
  const updatedPosts = posts.map((p) => {
    if (p.id !== postId) return p;
    nextCount = p.commentsCount + 1;
    return { ...p, commentsCount: nextCount };
  });
  writeJson(STORAGE_KEYS.posts, updatedPosts);

  if (isSupabaseConfigured && supabase) {
    await supabase
      .from('posts')
      .update({ comments_count: nextCount })
      .eq('id', postId);
  }

  return { comment: newComment, updatedPosts };
}

/**
 * Fetches pending & approved community requests under the Laodicean umbrella.
 */
export async function fetchCommunityRequests(): Promise<CommunityRequest[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('community_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      return data.map((row) => ({
        id: row.id,
        proposedName: row.proposed_name,
        proposedSlug: row.proposed_slug,
        campusOrArea: row.campus_or_area,
        reason: row.reason,
        requesterContact: row.requester_contact,
        status: row.status,
        createdAt: row.created_at,
      }));
    }
  }

  const stored = readJson<CommunityRequest[] | null>(STORAGE_KEYS.requests, null);
  if (stored && stored.length > 0) {
    return stored;
  }
  writeJson(STORAGE_KEYS.requests, SEED_COMMUNITY_REQUESTS);
  return SEED_COMMUNITY_REQUESTS;
}

/**
 * Submits a request to create a new campus/neighborhood community.
 */
export async function submitNewCommunityRequest(
  input: CommunityRequestInput
): Promise<CommunityRequest> {
  const newReq: CommunityRequest = {
    id: `req-${Date.now()}`,
    proposedName: input.proposedName.trim(),
    proposedSlug: slugify(input.proposedName),
    campusOrArea: input.campusOrArea.trim(),
    reason: input.reason.trim(),
    requesterContact: input.requesterContact.trim(),
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  if (isSupabaseConfigured && supabase) {
    const { data } = await supabase
      .from('community_requests')
      .insert({
        proposed_name: newReq.proposedName,
        proposed_slug: newReq.proposedSlug,
        campus_or_area: newReq.campusOrArea,
        reason: newReq.reason,
        requester_contact: newReq.requesterContact,
      })
      .select()
      .single();

    if (data) {
      newReq.id = data.id;
      newReq.createdAt = data.created_at;
    }
  }

  const current = readJson<CommunityRequest[]>(
    STORAGE_KEYS.requests,
    SEED_COMMUNITY_REQUESTS
  );
  const updated = [newReq, ...current];
  writeJson(STORAGE_KEYS.requests, updated);
  return newReq;
}

/**
 * Reads or persists the current campus user profile (bridging Supabase Auth when configured).
 */
export function getStoredCampusUser(): CampusUser | null {
  return readJson<CampusUser | null>(STORAGE_KEYS.user, null);
}

export async function signInCampusUser(input: {
  name: string;
  handle: string;
  course: string;
  email: string;
}): Promise<{ user: CampusUser; magicLinkSent: boolean }> {
  const formattedHandle = input.handle.trim().startsWith('@')
    ? input.handle.trim()
    : `@${input.handle.trim()}`;

  const user: CampusUser = {
    id: `u-${Date.now()}`,
    name: input.name.trim(),
    handle: formattedHandle,
    course: input.course.trim() || 'Juja Community Member',
    email: input.email.trim(),
  };

  let magicLinkSent = false;
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.auth.signInWithOtp({
      email: user.email,
      options: {
        data: {
          name: user.name,
          handle: user.handle,
          course: user.course,
        },
      },
    });
    if (!error) {
      magicLinkSent = true;
    }
  }

  writeJson(STORAGE_KEYS.user, user);
  return { user, magicLinkSent };
}

export async function signOutCampusUser(): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    await supabase.auth.signOut();
  }
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(STORAGE_KEYS.user);
  }
}
