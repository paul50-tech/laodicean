import { Community, CommunityRequest, Profile } from '../types';

export const LOCAL_COMMUNITIES_KEY = 'laodicean_communities_v1';
export const LOCAL_COMMUNITY_REQUESTS_KEY = 'laodicean_community_requests_v1';
export const LOCAL_USER_COMMUNITIES_KEY = 'laodicean_user_joined_communities_v1';
export const LOCAL_ACTIVE_COMMUNITY_KEY = 'laodicean_active_community_slug_v1';

export const JUJA_COMMUNITY_ID = '00000000-0000-0000-0000-000000000001';

const memoryStore: Record<string, string> = {};

export function safeGetItem(key: string): string | null {
  try {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(key);
    }
  } catch {
    // fallback
  }
  return memoryStore[key] ?? null;
}

export function safeSetItem(key: string, value: string): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
    }
  } catch {
    // fallback
  }
  memoryStore[key] = value;
}

export const SEED_COMMUNITIES: Community[] = [
  {
    id: JUJA_COMMUNITY_ID,
    name: 'Juja (JKUAT)',
    slug: 'juja',
    tagline: 'Tech, Dust, Gate C Chapos & Engineering Innovators',
    description: 'The flagship Juja campus hub. Stories, photos, tech demos, and mushene from JKUAT comrades.',
    color: '#064e3b', // emerald-900
    accent_color: '#10b981', // emerald-500
    icon: '🎓',
    banner: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1200&q=80',
    status: 'approved',
    member_count: 1420,
    created_by: JUJA_COMMUNITY_ID,
    creator_name: 'Paul Jubilee',
    creator_persona: '@juja_pioneer',
    moderator_ids: [JUJA_COMMUNITY_ID],
    created_at: '2026-01-01T00:00:00.000Z',
    is_default: true,
    rules: [
      'Respect, Dignity & Anti-Harassment: Zero tolerance for tribal slurs, cyberbullying, doxxing hostel numbers.',
      'Dual Identity & Persona Accountability: Anonymity is protected, but severe defamation leads to administrative unmasking.',
      'Strict Prohibition on Polls Naming Real People: Polls must compare campus spots, units, or food. Never rank individuals.',
      'Anti-Spam & Fair Voice: Cooldown limits enforced (max 2 posts / 3 min, 5 comments / 2 min).',
      'Auto-Hide Moderation: Posts reaching 3 reports are automatically hidden pending mod review.',
    ],
  },
  {
    id: 'community-rongai',
    name: 'Rongai (MMU & CUEA)',
    slug: 'rongai',
    tagline: 'Diaspora Comrades, Ongata Matatus, Hills & Media Mavens',
    description: 'Multimedia University & Catholic University comrades sharing Rongai matatu culture, media projects, hostel mushene and gorge sunsets.',
    color: '#1e3a8a', // blue-900
    accent_color: '#3b82f6', // blue-500
    icon: '🦁',
    banner: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1200&q=80',
    status: 'approved',
    member_count: 890,
    created_by: 'user-mmu-creator',
    creator_name: 'Cyrus Maina',
    creator_persona: '@rongai_lion',
    moderator_ids: ['user-mmu-creator', JUJA_COMMUNITY_ID],
    created_at: '2026-02-10T12:00:00.000Z',
    rules: [
      'Respect all MMU & CUEA comrades across faculties and student halls.',
      'Rongai matatu banter is welcome, but personal attacks and fare extortion scams are strictly barred.',
      'No polls naming or ranking individual students or lecturers.',
      'Keep event flyers and film screenings verified with official campus clubs.',
      'Posts with 3 reports are auto-hidden for moderator review.',
    ],
  },
  {
    id: 'community-madaraka',
    name: 'Madaraka (Strathmore)',
    slug: 'madaraka',
    tagline: 'Fintech, Business Suits, Coffee Lounges & Ole Sangale Vibes',
    description: 'Strathmore University students discussing business ethics, tech startup pitches, student finance, and Ole Sangale campus life.',
    color: '#7c2d12', // orange-900 / terracotta
    accent_color: '#f97316', // orange-500
    icon: '💼',
    banner: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80',
    status: 'approved',
    member_count: 670,
    created_by: 'user-strath-creator',
    creator_name: 'Grace Ndinda',
    creator_persona: '@strath_analyst',
    moderator_ids: ['user-strath-creator', JUJA_COMMUNITY_ID],
    created_at: '2026-02-15T08:30:00.000Z',
    rules: [
      'Maintain professional comradeship and constructive intellectual debate.',
      'No pyramid schemes, crypto pump-and-dump solicitations, or fake academic clearances.',
      'Never create polls targeting or judging individual students or faculty.',
      'Commercial internship listings require verified company domain credentials.',
      'Community auto-hide operates at 3 student reports.',
    ],
  },
  {
    id: 'community-parklands',
    name: 'Parklands (UoN Law)',
    slug: 'parklands',
    tagline: 'Moot Courts, Constitutional Debates & High-Table Comrades',
    description: 'University of Nairobi Parklands Law Campus forum for moot court arguments, legal mushene, student jurisprudence and campus chronicles.',
    color: '#581c87', // purple-900
    accent_color: '#a855f7', // purple-500
    icon: '⚖️',
    banner: 'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?auto=format&fit=crop&w=1200&q=80',
    status: 'approved',
    member_count: 540,
    created_by: 'user-uon-law',
    creator_name: 'Kevin Omondi',
    creator_persona: '@barrister_ke',
    moderator_ids: ['user-uon-law', JUJA_COMMUNITY_ID],
    created_at: '2026-02-20T14:15:00.000Z',
    rules: [
      'Respect the court: civil language and high standards of jurisprudence.',
      'No slander or doxxing of law comrades or judicial interns.',
      'Strict prohibition on polls naming individual students or professors.',
      'Moot court materials and past papers may be shared freely for educational benefit.',
      'Auto-hide kicks in at 3 reports pending moderator evaluation.',
    ],
  },
];

export const SEED_COMMUNITY_REQUESTS: CommunityRequest[] = [
  {
    id: 'req-ku-km',
    name: 'Kenyatta Univ (KM & Main Campus)',
    slug: 'ku-km',
    tagline: 'KM Gate, Nyayo Hostels, Culture Week & Comrades Republic',
    description: 'KU comrades uniting for campus events, hostel food debates, and culture week highlights across Thika Road.',
    color: '#b91c1c', // red-700
    icon: '🚩',
    banner: 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1200&q=80',
    rules: [
      'Respect comrades across Nyayo hostels and KM annexes.',
      'No malicious rumors or room doxxing.',
      'Strict prohibition on polls targeting real students or faculty.',
      'Anti-spam rate limits apply.',
      'Auto-hide enabled at 3 community reports.',
    ],
    requester_id: 'user-ku-student',
    requester_name: 'Brian K.',
    requester_persona: '@ku_republican',
    status: 'pending',
    created_at: '2026-03-01T09:15:00.000Z',
  },
];

/**
 * Retrieves all approved communities.
 */
export function getAllCommunities(): Community[] {
  try {
    const raw = safeGetItem(LOCAL_COMMUNITIES_KEY);
    if (raw) {
      const parsed: Community[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.filter((c) => c.status === 'approved');
      }
    }
  } catch {
    // fallback to seed
  }
  return SEED_COMMITIES_FALLBACK();
}

function SEED_COMMITIES_FALLBACK(): Community[] {
  saveCommunities(SEED_COMMUNITIES);
  return SEED_COMMUNITIES;
}

export function saveCommunities(communities: Community[]): void {
  try {
    safeSetItem(LOCAL_COMMUNITIES_KEY, JSON.stringify(communities));
  } catch {
    // localStorage error ignored
  }
}

/**
 * Finds a community by its slug. Defaults to Juja if not found.
 */
export function getCommunityBySlug(slug?: string | null): Community {
  const all = getAllCommunities();
  if (!slug) {
    return all.find((c) => c.slug === 'juja') || all[0] || SEED_COMMUNITIES[0];
  }
  const cleanSlug = slug.toLowerCase().trim();
  const found = all.find((c) => c.slug.toLowerCase() === cleanSlug);
  return found || all.find((c) => c.slug === 'juja') || all[0] || SEED_COMMUNITIES[0];
}

/**
 * Finds a community by ID.
 */
export function getCommunityById(id?: string | null): Community | null {
  if (!id) return null;
  const all = getAllCommunities();
  return all.find((c) => c.id === id) || null;
}

/**
 * Returns joined community slugs for the current browser session.
 * Always includes 'juja' by default.
 */
export function getUserJoinedCommunitySlugs(): string[] {
  try {
    const raw = safeGetItem(LOCAL_USER_COMMUNITIES_KEY);
    if (raw) {
      const list: string[] = JSON.parse(raw);
      if (Array.isArray(list) && list.length > 0) {
        if (!list.includes('juja')) {
          list.unshift('juja');
        }
        return list;
      }
    }
  } catch {
    // default
  }
  const defaultList = ['juja', 'rongai'];
  saveUserJoinedCommunitySlugs(defaultList);
  return defaultList;
}

export function saveUserJoinedCommunitySlugs(slugs: string[]): void {
  try {
    safeSetItem(LOCAL_USER_COMMUNITIES_KEY, JSON.stringify(Array.from(new Set(slugs))));
  } catch {
    // ignore
  }
}

export function joinCommunity(slug: string): string[] {
  const current = getUserJoinedCommunitySlugs();
  if (!current.includes(slug)) {
    const next = [...current, slug];
    saveUserJoinedCommunitySlugs(next);
    return next;
  }
  return current;
}

export function leaveCommunity(slug: string): string[] {
  if (slug === 'juja') {
    // Juja is the flagship community and cannot be removed
    return getUserJoinedCommunitySlugs();
  }
  const current = getUserJoinedCommunitySlugs();
  const next = current.filter((s) => s !== slug);
  saveUserJoinedCommunitySlugs(next);
  return next;
}

export function isCommunityJoined(slug: string): boolean {
  const joined = getUserJoinedCommunitySlugs();
  return joined.includes(slug);
}

/**
 * Extracts community slug from URL:
 * - Query param: ?c=:slug or ?community=:slug
 * - Path: /c/:slug
 * - Hash: #/c/:slug
 */
export function parseCommunitySlugFromUrl(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    // Query parameter ?c=rongai
    const params = new URLSearchParams(window.location.search);
    const qSlug = params.get('c') || params.get('community');
    if (qSlug) return qSlug.toLowerCase().trim();

    // Path /c/rongai
    const pathname = window.location.pathname || '';
    const pathMatch = pathname.match(/^\/c\/([^/]+)/);
    if (pathMatch && pathMatch[1]) return pathMatch[1].toLowerCase().trim();

    // Hash #/c/rongai
    const hash = window.location.hash || '';
    const hashMatch = hash.match(/^#\/c\/([^/]+)/);
    if (hashMatch && hashMatch[1]) return hashMatch[1].toLowerCase().trim();
  } catch {
    // URL parse error
  }
  return null;
}

/**
 * Gets currently active community slug from URL or localStorage.
 */
export function getActiveCommunitySlug(): string {
  const fromUrl = parseCommunitySlugFromUrl();
  if (fromUrl) return fromUrl;

  try {
    const saved = safeGetItem(LOCAL_ACTIVE_COMMUNITY_KEY);
    if (saved) return saved;
  } catch {
    // ignore
  }
  return 'juja';
}

export function setActiveCommunitySlug(slug: string): void {
  try {
    safeSetItem(LOCAL_ACTIVE_COMMUNITY_KEY, slug);
    if (typeof window !== 'undefined' && window.history?.pushState) {
      const url = new URL(window.location.href);
      if (slug === 'juja') {
        url.searchParams.delete('c');
        url.searchParams.delete('community');
      } else {
        url.searchParams.set('c', slug);
      }
      window.history.pushState({}, '', url.toString());
    }
  } catch {
    // ignore
  }
}

/**
 * Returns all community requests (pending, approved, rejected).
 */
export function getCommunityRequests(): CommunityRequest[] {
  try {
    const raw = safeGetItem(LOCAL_COMMUNITY_REQUESTS_KEY);
    if (raw) {
      const parsed: CommunityRequest[] = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // fallback
  }
  saveCommunityRequests(SEED_COMMUNITY_REQUESTS);
  return SEED_COMMUNITY_REQUESTS;
}

export function saveCommunityRequests(requests: CommunityRequest[]): void {
  try {
    safeSetItem(LOCAL_COMMUNITY_REQUESTS_KEY, JSON.stringify(requests));
  } catch {
    // ignore
  }
}

export interface RequestCommunityInput {
  name: string;
  slug: string;
  tagline?: string;
  description?: string;
  color?: string;
  accent_color?: string;
  icon?: string;
  banner?: string | null;
  banner_url?: string | null;
  rules?: string[];
  requester_id?: string;
  requester_name?: string;
  requester_persona?: string | null;
  requesterId?: string;
  requesterName?: string;
  requesterPersona?: string | null;
}

/**
 * Validates and submits a new community request.
 */
export function requestNewCommunity(input: RequestCommunityInput): {
  success: boolean;
  request?: CommunityRequest;
  error?: string;
} {
  const name = input.name?.trim();
  if (!name || name.length < 3) {
    return { success: false, error: 'Community name must be at least 3 characters.' };
  }
  if (name.length > 50) {
    return { success: false, error: 'Community name cannot exceed 50 characters.' };
  }

  const rawSlug = input.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const slug = rawSlug.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/^-+|-+$/g, '');
  if (!slug || slug.length < 2) {
    return { success: false, error: 'Please provide a valid URL handle/slug (letters, numbers, hyphens).' };
  }

  // Check for slug collision against existing approved communities
  const allExisting = getAllCommunities();
  if (allExisting.some((c) => c.slug === slug)) {
    return { success: false, error: `Handle "/c/${slug}" is already taken by an existing community.` };
  }

  const tagline = input.tagline?.trim() || 'Campus stories, memes & student life';
  const description = input.description?.trim() || `Verified student community for ${name}.`;

  const defaultRules = [
    `Respect all members of ${name}. Zero tolerance for harassment or discrimination.`,
    'Dual identity allows persona anonymity, but defamation leads to unmasking.',
    'Strict prohibition on polls naming or ranking individual students or faculty.',
    'Rate limits enforced against commercial promotions and spam bots.',
    'Posts with 3 reports are auto-hidden pending community moderator review.',
  ];

  const requesterName = input.requester_name || input.requesterName || 'Campus Member';
  const requesterId = input.requester_id || input.requesterId || `user-${Date.now()}`;
  const requesterPersona = input.requester_persona || input.requesterPersona || null;

  const newReq: CommunityRequest = {
    id: `req-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name,
    slug,
    tagline,
    description,
    color: input.color || '#064e3b',
    accent_color: input.accent_color || '#10b981',
    icon: input.icon || '🎓',
    banner: input.banner || input.banner_url || 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1200&q=80',
    banner_url: input.banner_url || input.banner || 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1200&q=80',
    rules: input.rules && input.rules.length >= 3 ? input.rules : defaultRules,
    requester_id: requesterId,
    requester_name: requesterName,
    requester_persona: requesterPersona,
    status: 'pending',
    created_at: new Date().toISOString(),
  };

  const currentRequests = getCommunityRequests();
  saveCommunityRequests([newReq, ...currentRequests]);
  return { success: true, request: newReq };
}

/**
 * Admin action to approve a requested community.
 * Converts request to approved Community and appoints creator as Moderator.
 */
export function approveCommunityRequest(
  requestId: string,
  reviewerId: string = JUJA_COMMUNITY_ID
): { success: boolean; community?: Community; error?: string } {
  const requests = getCommunityRequests();
  const req = requests.find((r) => r.id === requestId);
  if (!req) {
    return { success: false, error: 'Community request not found.' };
  }

  if (req.status === 'approved') {
    return { success: false, error: 'This community request has already been approved.' };
  }

  // Update request status
  const updatedRequests = requests.map((r) =>
    r.id === requestId
      ? {
          ...r,
          status: 'approved' as const,
          reviewed_at: new Date().toISOString(),
          reviewed_by: reviewerId,
        }
      : r
  );
  saveCommunityRequests(updatedRequests);

  // Create new active community
  const creatorId = req.requester_id || `creator-${Date.now()}`;
  const newCommunity: Community = {
    id: `comm-${req.slug}-${Date.now()}`,
    name: req.name,
    slug: req.slug,
    tagline: req.tagline,
    description: req.description || `Verified student community for ${req.name}.`,
    color: req.color,
    accent_color: req.accent_color || req.color,
    icon: req.icon,
    banner: req.banner || req.banner_url,
    banner_url: req.banner_url || req.banner,
    rules: req.rules,
    status: 'approved',
    member_count: 1,
    created_by: creatorId,
    creator_name: req.requester_name,
    creator_persona: req.requester_persona,
    moderator_ids: [creatorId, JUJA_COMMUNITY_ID],
    created_at: new Date().toISOString(),
  };

  const existingCommunities = getAllCommunities();
  saveCommunities([...existingCommunities, newCommunity]);

  // Auto-join community for the user who requested it
  joinCommunity(newCommunity.slug);

  return { success: true, community: newCommunity };
}

/**
 * Admin action to reject a community request.
 */
export function rejectCommunityRequest(
  requestId: string,
  reason: string = 'Did not meet campus standards.',
  reviewerId: string = JUJA_COMMUNITY_ID
): { success: boolean; error?: string } {
  const requests = getCommunityRequests();
  const req = requests.find((r) => r.id === requestId);
  if (!req) {
    return { success: false, error: 'Community request not found.' };
  }

  const updatedRequests = requests.map((r) =>
    r.id === requestId
      ? {
          ...r,
          status: 'rejected' as const,
          rejection_reason: reason.trim() || 'Did not meet campus standards.',
          reviewed_at: new Date().toISOString(),
          reviewed_by: reviewerId,
        }
      : r
  );
  saveCommunityRequests(updatedRequests);
  return { success: true };
}

export type { CommunityRequest } from '../types';

/**
 * Checks if a user has moderator rights in a specific community.
 * Grants access if:
 * 1. User is global super admin ('pauljubilee50@gmail.com' or role === 'admin')
 * 2. User ID is in community.moderator_ids
 * 3. User created this community (community.created_by === userId)
 */
export function isUserCommunityModerator(
  community: Community,
  profileOrUserId?: Profile | string | null,
  userEmailOrRole?: string | null
): boolean {
  if (!community) return false;

  const role =
    typeof profileOrUserId === 'object' && profileOrUserId !== null
      ? profileOrUserId.role
      : userEmailOrRole === 'admin'
      ? 'admin'
      : undefined;

  const email = userEmailOrRole?.includes('@') ? userEmailOrRole : undefined;
  const userId =
    typeof profileOrUserId === 'string'
      ? profileOrUserId
      : profileOrUserId?.id;

  // Super Admin override
  if (role === 'admin' || email === 'pauljubilee50@gmail.com') {
    return true;
  }

  if (!userId) return false;

  if (community.created_by && community.created_by === userId) {
    return true;
  }

  if (Array.isArray(community.moderator_ids) && community.moderator_ids.includes(userId)) {
    return true;
  }

  return false;
}

/**
 * Updates community rules (moderator action).
 */
export function updateCommunityRules(
  communityIdOrSlug: string,
  rules: string[]
): { success: boolean; error?: string; community?: Community } {
  const all = getAllCommunities();
  const index = all.findIndex(
    (c) => c.id === communityIdOrSlug || c.slug === communityIdOrSlug
  );
  if (index === -1) {
    return { success: false, error: 'Community not found.' };
  }

  if (!rules || rules.length === 0) {
    return { success: false, error: 'A community must have at least one rule.' };
  }

  const updated = [...all];
  updated[index] = { ...updated[index], rules };
  saveCommunities(updated);
  return { success: true, community: updated[index] };
}

/**
 * Updates community details (tagline, banner, color, etc.)
 */
export function updateCommunityDetails(
  communityIdOrSlug: string,
  updates: Partial<Community>
): { success: boolean; error?: string; community?: Community } {
  const all = getAllCommunities();
  const index = all.findIndex(
    (c) => c.id === communityIdOrSlug || c.slug === communityIdOrSlug
  );
  if (index === -1) {
    return { success: false, error: 'Community not found.' };
  }

  const updated = [...all];
  updated[index] = {
    ...updated[index],
    ...updates,
    id: updated[index].id, // protect id
    slug: updated[index].slug, // protect slug
  };
  saveCommunities(updated);
  return { success: true, community: updated[index] };
}

/**
 * Builds a clean, shareable URL for a community.
 */
export function formatCommunityShareUrl(
  communityOrSlug: Community | string,
  origin?: string
): string {
  const base =
    origin ||
    (typeof window !== 'undefined' ? window.location.origin : 'https://laodicean.app');
  const slug =
    typeof communityOrSlug === 'string' ? communityOrSlug : communityOrSlug.slug;
  return `${base.replace(/\/$/, '')}/?c=${encodeURIComponent(slug)}`;
}
