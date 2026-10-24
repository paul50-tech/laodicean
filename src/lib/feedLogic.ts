import {
  AppRoute,
  CommunityRequestInput,
  Post,
  PostDraftInput,
  PostType,
} from '../types/laodicean';

/**
 * Converts a headline or community name into a clean URL-safe slug.
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

/**
 * Estimates reading time in minutes at ~200 words per minute (minimum 1 min).
 */
export function estimateReadingMinutes(text: string): number {
  const words = text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

/**
 * Human-readable post type label used for inline metadata.
 */
export function getPostTypeLabel(postType: PostType): string {
  switch (postType) {
    case PostType.Story:
      return 'Story';
    case PostType.Gist:
      return 'Quick Gist';
    case PostType.Photo:
      return 'Photo';
    case PostType.Notice:
      return 'Notice';
  }
}

/**
 * Formats an ISO timestamp as a compact relative campus timestamp (e.g. "12m ago", "3h ago").
 */
export function formatRelativeTime(isoDate: string, nowMs: number = Date.now()): string {
  const createdMs = new Date(isoDate).getTime();
  if (Number.isNaN(createdMs)) return 'just now';
  const diffSeconds = Math.max(0, Math.floor((nowMs - createdMs) / 1000));

  if (diffSeconds < 60) return 'just now';
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(createdMs).toLocaleDateString('en-KE', {
    month: 'short',
    day: 'numeric',
  });
}

export interface FeedFilterOptions {
  communitySlug?: string | null;
  postType?: PostType | null;
  spot?: string | null;
  searchQuery?: string;
}

/**
 * Filters the unified endless-scroll stream.
 * By default (all options null/empty), all post types mix chronologically in one stream.
 */
export function filterAndSearchPosts(
  posts: Post[],
  options: FeedFilterOptions = {}
): Post[] {
  const { communitySlug = null, postType = null, spot = null, searchQuery = '' } = options;
  const normalizedQuery = searchQuery.trim().toLowerCase();

  return posts
    .filter((post) => {
      if (communitySlug && post.communitySlug !== communitySlug) {
        return false;
      }
      if (postType && post.postType !== postType) {
        return false;
      }
      if (spot && post.spot.toLowerCase() !== spot.toLowerCase()) {
        return false;
      }
      if (normalizedQuery) {
        const haystack = [
          post.title ?? '',
          post.body,
          post.authorName,
          post.authorHandle,
          post.spot,
          post.communitySlug,
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(normalizedQuery)) {
          return false;
        }
      }
      return true;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Slices filtered posts for progressive endless-scroll pagination.
 */
export function paginatePosts(
  posts: Post[],
  page: number,
  pageSize: number = 5
): { visiblePosts: Post[]; hasMore: boolean; remainingCount: number } {
  const safePage = Math.max(1, Math.floor(page));
  const limit = safePage * pageSize;
  const visiblePosts = posts.slice(0, limit);
  const remainingCount = Math.max(0, posts.length - visiblePosts.length);

  return {
    visiblePosts,
    hasMore: remainingCount > 0,
    remainingCount,
  };
}

/**
 * Formats a post specifically for 1-tap WhatsApp sharing into class/hostel groups.
 */
export function buildWhatsAppShareData(
  post: Post,
  siteOrigin: string = 'https://laodicean.online'
): { canonicalUrl: string; messageText: string; whatsappHref: string } {
  const cleanOrigin = siteOrigin.replace(/\/+$/, '');
  const canonicalUrl = `${cleanOrigin}/p/${post.slug}`;

  const rawSnippet = post.body.replace(/\s+/g, ' ').trim();
  const shortSnippet =
    rawSnippet.length > 130 ? `${rawSnippet.slice(0, 127).trimEnd()}...` : rawSnippet;

  const lines: string[] = [];
  if (post.title && post.title.trim()) {
    lines.push(`*${post.title.trim()}*`);
    lines.push(shortSnippet);
  } else {
    lines.push(`"${shortSnippet}"`);
  }
  lines.push(`— ${post.authorHandle} in c/${post.communitySlug} (${post.spot})`);
  lines.push(canonicalUrl);

  const messageText = lines.join('\n');
  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(messageText)}`;

  return {
    canonicalUrl,
    messageText,
    whatsappHref,
  };
}

/**
 * Validates a new post draft before publishing. Never substitutes silent fallback text.
 */
export function validatePostDraft(draft: PostDraftInput): string | null {
  const trimmedTitle = draft.title.trim();
  const trimmedBody = draft.body.trim();
  const trimmedSpot = draft.spot.trim();

  if (!draft.communitySlug.trim()) {
    return 'Please select a community.';
  }

  if (
    (draft.postType === PostType.Story || draft.postType === PostType.Notice) &&
    trimmedTitle.length < 4
  ) {
    return draft.postType === PostType.Story
      ? 'Please give your story a headline (at least 4 characters).'
      : 'Please add a clear notice headline (at least 4 characters).';
  }

  if (draft.postType === PostType.Photo && !draft.imageUrl) {
    return 'Please choose a photo to upload for a Photo post.';
  }

  if (trimmedBody.length < 8) {
    return 'Please write at least a short sentence (8+ characters) before publishing.';
  }

  if (trimmedBody.length > 5000) {
    return 'Post text is too long (maximum 5,000 characters).';
  }

  if (!trimmedSpot) {
    return 'Please pick or type a campus spot (for example, Gate C or Campus).';
  }

  return null;
}

/**
 * Validates a user request to launch a new community under Laodicean.
 */
export function validateCommunityRequest(
  input: CommunityRequestInput,
  existingSlugs: string[] = ['juja']
): string | null {
  const name = input.proposedName.trim();
  const slug = slugify(name);
  const area = input.campusOrArea.trim();
  const reason = input.reason.trim();
  const contact = input.requesterContact.trim();

  if (name.length < 2) {
    return 'Please enter a community name (at least 2 characters).';
  }
  if (!slug) {
    return 'Community name must include letters or numbers.';
  }
  if (existingSlugs.map((s) => s.toLowerCase()).includes(slug)) {
    return `c/${slug} already exists or has already been requested.`;
  }
  if (area.length < 3) {
    return 'Please specify the campus, town, or neighborhood.';
  }
  if (reason.length < 15) {
    return 'Tell us briefly (15+ characters) what people will share in this community.';
  }
  if (contact.length < 5) {
    return 'Please leave a valid WhatsApp number or email so we can reach you.';
  }

  return null;
}

/**
 * Validates campus profile / sign-in fields.
 */
export function validateCampusProfile(input: {
  name: string;
  handle: string;
  email: string;
}): string | null {
  if (input.name.trim().length < 2) {
    return 'Please enter your display name.';
  }
  const cleanHandle = input.handle.trim().replace(/^@/, '');
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(cleanHandle)) {
    return 'Handle must be 3–20 letters, numbers, or underscores (no spaces).';
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) {
    return 'Please enter a valid email address.';
  }
  return null;
}

/**
 * Parses clean pathname routes so shared URLs (/c/juja, /p/slug, /communities) work directly.
 */
export function parseRoute(pathname: string): AppRoute {
  const clean = pathname.replace(/\/+$/, '') || '/';

  if (clean === '/' || clean === '') {
    return { view: 'feed', communitySlug: null };
  }

  if (clean === '/communities') {
    return { view: 'communities', focusRequestForm: false };
  }

  if (clean === '/request-community') {
    return { view: 'communities', focusRequestForm: true };
  }

  const communityMatch = clean.match(/^\/c\/([a-z0-9-]+)$/i);
  if (communityMatch) {
    return { view: 'feed', communitySlug: communityMatch[1].toLowerCase() };
  }

  const postMatch = clean.match(/^\/p\/([a-z0-9-]+)$/i);
  if (postMatch) {
    return { view: 'post', postSlug: postMatch[1].toLowerCase() };
  }

  return { view: 'feed', communitySlug: null };
}
