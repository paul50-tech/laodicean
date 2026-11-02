/**
 * Post creation and community resolution service for Laodicean.
 * Supports Story & Photo post types with persona protection and live status.
 */

import { supabase } from './supabase';
import { Post, PostType, FeedPost, FeedFilter, ReactionCounts, EventData, UserRole, PostStatus } from '../types';
import { rankCampusFeed } from './feedRanking';
import { addPostToPendingQueue } from './guestBloggers';

export const DEFAULT_COMMUNITY_SLUG = 'juja';

// Fallback UUID if communities table has not yet executed the schema insert
export const JUJA_FALLBACK_ID = '00000000-0000-0000-0000-000000000001';

export interface CreatePostParams {
  authorId: string;
  postType: PostType;
  title?: string | null;
  body: string;
  imageUrl?: string | null;
  isPersona: boolean;
  communityId?: string;
  eventData?: EventData | null;
  status?: PostStatus;
  authorRole?: UserRole;
  requiresReview?: boolean;
}

export interface PostValidationResult {
  isValid: boolean;
  error: string | null;
}

/**
 * Truncates post body to a readable teaser length.
 * Splits on whitespace when possible to avoid awkward cut words.
 */
export function truncateTeaser(
  text: string,
  maxLength = 180
): { teaser: string; isTruncated: boolean } {
  if (!text) {
    return { teaser: '', isTruncated: false };
  }

  const trimmed = text.trim();
  if (trimmed.length <= maxLength) {
    return { teaser: trimmed, isTruncated: false };
  }

  // Find last space before or near the maxLength
  const cutTarget = trimmed.slice(0, maxLength);
  const lastSpace = cutTarget.lastIndexOf(' ');
  const cleanSnippet = lastSpace > maxLength * 0.6 ? cutTarget.slice(0, lastSpace) : cutTarget;

  return {
    teaser: `${cleanSnippet.trim()}...`,
    isTruncated: true,
  };
}

/**
 * Filters feed posts by chip category.
 */
export function filterFeedPosts(
  posts: FeedPost[],
  filter: FeedFilter
): FeedPost[] {
  if (filter === 'all') return posts;
  return posts.filter((post) => post.post_type === filter);
}

/**
 * Pure validator for post composer inputs.
 */
export function validatePostInput(params: {
  postType: PostType;
  title?: string | null;
  body: string;
  hasImage?: boolean;
  eventDate?: string | null;
  eventPlace?: string | null;
  eventData?: { event_date?: string; event_place?: string } | null;
}): PostValidationResult {
  const { postType, title, body, hasImage, eventDate, eventPlace, eventData } = params;
  const trimmedBody = (body || '').trim();
  const trimmedTitle = (title || '').trim();

  if (trimmedTitle.length > 150) {
    return {
      isValid: false,
      error: 'Title must be 150 characters or less.',
    };
  }

  if (postType === 'event') {
    if (!trimmedTitle || trimmedTitle.length < 3) {
      return {
        isValid: false,
        error: 'Please enter a title for the event (at least 3 characters).',
      };
    }
    const trimmedDate = (eventDate || eventData?.event_date || '').trim();
    if (!trimmedDate) {
      return {
        isValid: false,
        error: 'Please specify the date and time for the event.',
      };
    }
    const trimmedPlace = (eventPlace || eventData?.event_place || '').trim();
    if (!trimmedPlace) {
      return {
        isValid: false,
        error: 'Please specify the campus place or venue for the event.',
      };
    }
    if (!trimmedBody) {
      return {
        isValid: false,
        error: 'Please add a description of what will happen at this event.',
      };
    }
    if (trimmedBody.length > 5000) {
      return {
        isValid: false,
        error: 'Event description must be 5,000 characters or less.',
      };
    }
    return { isValid: true, error: null };
  }

  if (postType === 'mushene') {
    if (!trimmedBody) {
      return {
        isValid: false,
        error: 'Please write your street Mushene story.',
      };
    }
    if (trimmedBody.length < 5) {
      return {
        isValid: false,
        error: 'Mushene story should be at least 5 characters.',
      };
    }
    if (trimmedBody.length > 1500) {
      return {
        isValid: false,
        error: 'Keep Mushene stories short and punchy (1,500 characters max).',
      };
    }
    return { isValid: true, error: null };
  }

  if (postType === 'meme') {
    if (!hasImage) {
      return {
        isValid: false,
        error: 'Please design or upload a meme image before publishing.',
      };
    }
    if (trimmedBody.length > 2000) {
      return {
        isValid: false,
        error: 'Meme caption must be 2,000 characters or less.',
      };
    }
    return { isValid: true, error: null };
  }

  if (postType === 'photo') {
    if (!hasImage) {
      return {
        isValid: false,
        error: 'Please select an image to upload for a Photo post.',
      };
    }
    if (!trimmedBody && !trimmedTitle) {
      return {
        isValid: false,
        error: 'Please add a caption or title for your photo.',
      };
    }
    if (trimmedBody.length > 3000) {
      return {
        isValid: false,
        error: 'Photo caption must be 3,000 characters or less.',
      };
    }
    return { isValid: true, error: null };
  }

  if (postType === 'poll') {
    if (!trimmedBody) {
      return {
        isValid: false,
        error: 'Please enter a poll question for the campus.',
      };
    }
    if (trimmedBody.length < 5) {
      return {
        isValid: false,
        error: 'Poll question must be at least 5 characters.',
      };
    }
    if (trimmedBody.length > 250) {
      return {
        isValid: false,
        error: 'Poll question must be 250 characters or less.',
      };
    }
    return { isValid: true, error: null };
  }

  if (postType === 'confession') {
    if (!trimmedBody) {
      return {
        isValid: false,
        error: 'Please write your confession before posting.',
      };
    }
    if (trimmedBody.length < 10) {
      return {
        isValid: false,
        error: 'Confession should be at least 10 characters long.',
      };
    }
    if (trimmedBody.length > 5000) {
      return {
        isValid: false,
        error: 'Confession must be 5,000 characters or less.',
      };
    }
    return { isValid: true, error: null };
  }

  if (postType === 'ask_juja') {
    if (!trimmedBody) {
      return {
        isValid: false,
        error: 'Please enter your question for Juja campus.',
      };
    }
    if (trimmedBody.length < 5) {
      return {
        isValid: false,
        error: 'Your question should be at least 5 characters.',
      };
    }
    if (trimmedBody.length > 2500) {
      return {
        isValid: false,
        error: 'Question must be 2,500 characters or less.',
      };
    }
    return { isValid: true, error: null };
  }

  // Story post type
  if (!trimmedBody) {
    return {
      isValid: false,
      error: 'Please write some text for your story.',
    };
  }

  if (trimmedBody.length < 5) {
    return {
      isValid: false,
      error: 'Story should be at least 5 characters long.',
    };
  }

  if (trimmedBody.length > 10000) {
    return {
      isValid: false,
      error: 'Story must be 10,000 characters or less.',
    };
  }

  return { isValid: true, error: null };
}

/**
 * Realistic seed posts for Juja (JKUAT campus).
 * Used when the database is empty or offline so infinite scroll,
 * teasers, and filters can be immediately experienced and tested.
 */
export const SEED_JUJA_POSTS: FeedPost[] = [
  {
    id: 'seed-juja-1',
    community_id: JUJA_FALLBACK_ID,
    community_name: 'Juja',
    community_slug: 'juja',
    post_type: 'mushene',
    title: 'The Great Gate C Chapo Controversy Continues',
    body: 'So apparently the chapo guy at Gate C has been secretly reducing the diameter by 2cm while maintaining 20 bob price. We brought a campus compass and engineering ruler yesterday to verify and our department group chat is currently in absolute shambles. Some 4th years are staging a friendly debate tomorrow after thermodynamics class.',
    is_persona: true,
    persona_name: '@gate_c_inspector',
    persona_avatar: '🕵️',
    author_role: 'user',
    status: 'live',
    created_at: new Date(Date.now() - 1000 * 60 * 10).toISOString(), // 10 mins ago
    updated_at: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    reactions_count: { laugh: 42, relatable: 31, fire: 18, total: 91 },
    comments_count: 27,
  },
  {
    id: 'seed-juja-ask-1',
    community_id: JUJA_FALLBACK_ID,
    community_name: 'Juja',
    community_slug: 'juja',
    post_type: 'ask_juja',
    title: 'Which 3rd-year engineering unit is harder: EEE 311 or SMA 301?',
    body: 'Second CAT is coming up in two weeks and everyone in Hall 2 is stressing. Between Applied Differential Equations and Circuit Analysis, which one should we dedicate the library weekend grind to? Looking for advice from seniors who survived.',
    is_persona: true,
    persona_name: '@hall2_fresher',
    persona_avatar: '❓',
    author_role: 'user',
    status: 'live',
    created_at: new Date(Date.now() - 1000 * 60 * 14).toISOString(), // 14 mins ago
    updated_at: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
    reactions_count: { laugh: 8, relatable: 74, fire: 19, total: 101 },
    comments_count: 28,
    badges: ['top_commenter'],
  },
  {
    id: 'seed-juja-meme-1',
    community_id: JUJA_FALLBACK_ID,
    community_name: 'Juja',
    community_slug: 'juja',
    post_type: 'meme',
    title: 'Stepping Out of Gate C Reality',
    body: 'STEPPING OUT OF GATE C — RETURNING LOOKING LIKE A POWDERED DOUGHNUT 😂 #JujaDustGang',
    image_url: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=800&q=80',
    is_persona: true,
    persona_name: '@dust_general',
    persona_avatar: '🌪️',
    author_role: 'user',
    status: 'live',
    created_at: new Date(Date.now() - 1000 * 60 * 18).toISOString(), // 18 mins ago
    updated_at: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    reactions_count: { laugh: 154, relatable: 98, fire: 45, total: 297 },
    comments_count: 36,
  },
  {
    id: 'seed-juja-event-1',
    community_id: JUJA_FALLBACK_ID,
    community_name: 'Juja',
    community_slug: 'juja',
    post_type: 'event',
    title: 'JKUAT Tech Expo & Builders Hackathon 2026',
    body: 'All student developers, hardware builders, and design creators assemble! Pitch campus apps, demo robotics & solar IoT prototypes, win project grants, and connect with tech alumni. Free chapos & soda for registered participants.',
    is_persona: false,
    persona_name: '@tech_society',
    persona_avatar: '🚀',
    author_id: 'real-author-event-1',
    author_real_name: 'Paul Jubilee',
    author_role: 'admin',
    status: 'live',
    event_data: {
      event_date: 'Friday, Nov 7, 2026 • 9:00 AM - 5:00 PM',
      event_place: 'Tech Park Hall 1 & Innovation Lawn',
      rsvp_count: 148,
      user_has_rsvped: false,
    },
    created_at: new Date(Date.now() - 1000 * 60 * 25).toISOString(), // 25 mins ago
    updated_at: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    reactions_count: { laugh: 12, relatable: 84, fire: 195, total: 291 },
    comments_count: 47,
  },
  {
    id: 'seed-juja-mushene-2',
    community_id: JUJA_FALLBACK_ID,
    community_name: 'Juja',
    community_slug: 'juja',
    post_type: 'mushene',
    title: 'The Hall 6 Boda Boda Rate Hike',
    body: 'Stage rider looked me dead in the eyes and demanded 100 bob because "dust is heavy today". My brother, since when does atmospheric air quality determine the combustion rate of petrol in a Boxer 150?',
    is_persona: true,
    persona_name: '@stage_watcher',
    persona_avatar: '🛵',
    author_role: 'user',
    status: 'live',
    created_at: new Date(Date.now() - 1000 * 60 * 35).toISOString(), // 35 mins ago
    updated_at: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    reactions_count: { laugh: 115, relatable: 142, fire: 19, total: 276 },
    comments_count: 38,
  },
  {
    id: 'seed-juja-2',
    community_id: JUJA_FALLBACK_ID,
    community_name: 'Juja',
    community_slug: 'juja',
    post_type: 'confession',
    title: 'Hall 1 8 AM Lecture Confession',
    body: 'I have attended exactly two 8 AM differential calculus lectures in Hall 1 this entire semester, and both times I sat in the very last row pretending to write down notes while actually checking live scores on my 2G bundle. My lab partner still thinks I understand Fourier Transform and is relying on me for next week\'s presentation. If you see me sweating by the whiteboard, mind your business.',
    is_persona: true,
    persona_name: '@backrow_scholar',
    persona_avatar: '🎭',
    author_role: 'user',
    status: 'live',
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 mins ago
    updated_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    reactions_count: { laugh: 88, relatable: 114, fire: 9, total: 211 },
    comments_count: 53,
  },
  {
    id: 'seed-juja-3',
    community_id: JUJA_FALLBACK_ID,
    community_name: 'Juja',
    community_slug: 'juja',
    post_type: 'poll',
    title: 'Campus Food Debate: Best late-night dinner spot in Juja?',
    body: 'Power is out in highrise apartments so everyone is eating out tonight. Settle this once and for all: Is Gate A chicken/smokie pasua unmatched, or is Gate C mama chapo the ultimate king of student survival budgets? Cast your votes!',
    is_persona: false,
    persona_name: '@juja_eats',
    persona_avatar: '🍲',
    author_id: 'real-author-1',
    author_real_name: 'Brian K.',
    author_role: 'user',
    status: 'live',
    created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(), // 1.5 hrs ago
    updated_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    reactions_count: { laugh: 15, relatable: 56, fire: 67, total: 138 },
    comments_count: 42,
  },
  {
    id: 'seed-juja-ask-2',
    community_id: JUJA_FALLBACK_ID,
    community_name: 'Juja',
    community_slug: 'juja',
    post_type: 'ask_juja',
    title: 'Best quiet spot with power sockets to study on weekends?',
    body: 'Main library 2nd floor gets crowded by 10 AM on Saturdays. Are the Tech Park discussion rooms or the Agriculture pavilion open for group revision with laptops? Drop your secret campus spots below!',
    is_persona: false,
    persona_name: '@weekend_scholar',
    persona_avatar: '📚',
    author_id: 'real-author-scholar',
    author_real_name: 'Collins Kipkorir',
    author_role: 'user',
    status: 'live',
    created_at: new Date(Date.now() - 1000 * 60 * 110).toISOString(), // 1.8 hrs ago
    updated_at: new Date(Date.now() - 1000 * 60 * 110).toISOString(),
    reactions_count: { laugh: 4, relatable: 89, fire: 42, total: 135 },
    comments_count: 36,
    badges: ['top_storyteller'],
  },
  {
    id: 'seed-juja-4',
    community_id: JUJA_FALLBACK_ID,
    community_name: 'Juja',
    community_slug: 'juja',
    post_type: 'meme',
    title: 'The JKUAT Wifi Experience',
    body: 'When you step into the tech park building, the campus Eduroam bar shows 5 bars of pure hope, but the moment you try opening GitHub or the student portal, your phone suddenly thinks it is communicating with Voyager 1 in deep interstellar space.',
    image_url: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=900&q=80',
    is_persona: true,
    persona_name: '@eduroam_believer',
    persona_avatar: '📡',
    author_role: 'user',
    status: 'live',
    created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(), // 3 hrs ago
    updated_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    reactions_count: { laugh: 130, relatable: 95, fire: 40, total: 265 },
    comments_count: 38,
  },
  {
    id: 'seed-juja-event-2',
    community_id: JUJA_FALLBACK_ID,
    community_name: 'Juja',
    community_slug: 'juja',
    post_type: 'event',
    title: 'Juja Friday Night Street Food Fair',
    body: 'The ultimate campus culinary clash! Smokie pasua challenge, live acoustic sets by the JKUAT music society, mama chapo tasting contest, and thrift streetwear pop-up.',
    is_persona: false,
    persona_name: '@juja_nightlife',
    persona_avatar: '🎪',
    author_id: 'real-author-event-2',
    author_real_name: 'Brian K.',
    author_role: 'user',
    status: 'live',
    event_data: {
      event_date: 'Saturday, Nov 8, 2026 • 6:30 PM till late',
      event_place: 'Gate A Commercial Street Grounds',
      rsvp_count: 242,
      user_has_rsvped: true,
    },
    created_at: new Date(Date.now() - 1000 * 60 * 240).toISOString(), // 4 hrs ago
    updated_at: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    reactions_count: { laugh: 35, relatable: 112, fire: 160, total: 307 },
    comments_count: 58,
  },
  {
    id: 'seed-juja-5',
    community_id: JUJA_FALLBACK_ID,
    community_name: 'Juja',
    community_slug: 'juja',
    post_type: 'story',
    title: 'Surviving 4th Year Engineering at JKUAT',
    body: 'Yesterday our project supervisor looked at our solar desalination prototype, sighed heavily, took off his spectacles, and asked: "Did you construct this or did it happen to you by accident?". We had been awake for 38 straight hours in the workshop surviving on instant coffee and cold chapos. But we re-soldered the power supply board, recalibrated the flow meters, and today morning the test run actually produced pure distilled water! Never give up when the deadline is near.',
    is_persona: false,
    persona_name: '@engineer_sam',
    persona_avatar: '⚡',
    author_id: 'real-author-2',
    author_real_name: 'Faith Mwangi',
    author_role: 'user',
    status: 'live',
    created_at: new Date(Date.now() - 1000 * 60 * 360).toISOString(), // 6 hrs ago
    updated_at: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    reactions_count: { laugh: 24, relatable: 78, fire: 145, total: 247 },
    comments_count: 61,
  },
  {
    id: 'seed-juja-6',
    community_id: JUJA_FALLBACK_ID,
    community_name: 'Juja',
    community_slug: 'juja',
    post_type: 'photo',
    title: 'Golden Hour by Hall 4 and the Library Grounds',
    body: 'Evening rains cleared just in time for this calm view right outside the main library. Juja sunsets really hit different after a hectic week of lectures and practicals.',
    image_url: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=900&q=80',
    is_persona: false,
    persona_name: '@campus_lens',
    persona_avatar: '📸',
    author_id: 'real-author-3',
    author_real_name: 'Kelvin Ochieng',
    author_role: 'user',
    status: 'live',
    created_at: new Date(Date.now() - 1000 * 60 * 720).toISOString(), // 12 hrs ago
    updated_at: new Date(Date.now() - 1000 * 60 * 720).toISOString(),
    reactions_count: { laugh: 10, relatable: 45, fire: 180, total: 235 },
    comments_count: 19,
  },
  {
    id: 'seed-juja-7',
    community_id: JUJA_FALLBACK_ID,
    community_name: 'Juja',
    community_slug: 'juja',
    post_type: 'mushene',
    title: 'The Library AC Mystery',
    body: 'Who controls the thermostat on the 2nd floor of the library? It is either sub-zero Siberian winter where people are shivering in heavy hoodies, or the Sahara desert during midday. There is literally no middle ground. Bring a puffer jacket even if it is sunny outside!',
    is_persona: true,
    persona_name: '@frozen_reader',
    persona_avatar: '🥶',
    author_role: 'user',
    status: 'live',
    created_at: new Date(Date.now() - 1000 * 60 * 1200).toISOString(), // 20 hrs ago
    updated_at: new Date(Date.now() - 1000 * 60 * 1200).toISOString(),
    reactions_count: { laugh: 92, relatable: 110, fire: 14, total: 216 },
    comments_count: 31,
  },
  {
    id: 'seed-juja-8',
    community_id: JUJA_FALLBACK_ID,
    community_name: 'Juja',
    community_slug: 'juja',
    post_type: 'confession',
    title: 'Gate A Smokie Pasua Addiction',
    body: 'I swore to myself that I would save my pocket money this month and cook ugali greens in the hostel. It has been 4 days and I have visited the same smokie pasua kachumbari trolley 9 times. The msee even knows my order without asking: double smokie, extra pili pili, heavy kachumbari.',
    is_persona: true,
    persona_name: '@kachumbari_fiend',
    persona_avatar: '🌭',
    author_role: 'user',
    status: 'live',
    created_at: new Date(Date.now() - 1000 * 60 * 1800).toISOString(), // 30 hrs ago
    updated_at: new Date(Date.now() - 1000 * 60 * 1800).toISOString(),
    reactions_count: { laugh: 76, relatable: 135, fire: 22, total: 233 },
    comments_count: 44,
  },
  {
    id: 'seed-juja-9',
    community_id: JUJA_FALLBACK_ID,
    community_name: 'Juja',
    community_slug: 'juja',
    post_type: 'poll',
    title: 'Weekend vibe: Staying in Juja or heading to Nairobi CBD?',
    body: 'Mid-semester chill weekend is here. Are people staying back for gaming sessions and Gate A vibes, or boarding Super Metro to Nairobi town? Let us know your plans below.',
    is_persona: false,
    persona_name: '@weekend_planner',
    persona_avatar: '🚌',
    author_id: 'real-author-4',
    author_real_name: 'Dennis Mutua',
    author_role: 'user',
    status: 'live',
    created_at: new Date(Date.now() - 1000 * 60 * 2400).toISOString(), // 40 hrs ago
    updated_at: new Date(Date.now() - 1000 * 60 * 2400).toISOString(),
    reactions_count: { laugh: 19, relatable: 64, fire: 88, total: 171 },
    comments_count: 29,
  },
  {
    id: 'seed-juja-10',
    community_id: JUJA_FALLBACK_ID,
    community_name: 'Juja',
    community_slug: 'juja',
    post_type: 'meme',
    title: 'Submitting Assignments on the Portal at 11:59 PM',
    body: 'Deadline: 11:59 PM. My internet: 1 KB/s. The upload spinner: spinning with the emotional weight of a thousand lost credits. But when the green checkmark finally appears at 11:58:47 PM, that feeling of relief is unmatched by anything in this world.',
    image_url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=900&q=80',
    is_persona: true,
    persona_name: '@clutch_coder',
    persona_avatar: '⏳',
    author_role: 'user',
    status: 'live',
    created_at: new Date(Date.now() - 1000 * 60 * 3000).toISOString(), // 50 hrs ago
    updated_at: new Date(Date.now() - 1000 * 60 * 3000).toISOString(),
    reactions_count: { laugh: 154, relatable: 182, fire: 62, total: 398 },
    comments_count: 73,
  },
];

/**
 * Resolves the UUID for the Juja flagship community.
 * Caches in memory to minimize round-trips.
 */
let cachedJujaCommunityId: string | null = null;

export async function getJujaCommunityId(): Promise<string> {
  if (cachedJujaCommunityId) return cachedJujaCommunityId;

  if (!supabase) return JUJA_FALLBACK_ID;

  try {
    const { data, error } = await supabase
      .from('communities')
      .select('id, slug')
      .eq('slug', DEFAULT_COMMUNITY_SLUG)
      .maybeSingle();

    if (!error && data?.id) {
      cachedJujaCommunityId = data.id;
      return data.id;
    }

    // If Juja doesn't exist yet, attempt to query any approved community
    const { data: anyCommunity } = await supabase
      .from('communities')
      .select('id')
      .limit(1)
      .maybeSingle();

    if (anyCommunity?.id) {
      cachedJujaCommunityId = anyCommunity.id;
      return anyCommunity.id;
    }

    return JUJA_FALLBACK_ID;
  } catch {
    return JUJA_FALLBACK_ID;
  }
}

/**
 * Creates a new post in the database.
 * Sets status to 'live' immediately.
 */
export async function createPost(
  params: CreatePostParams
): Promise<{ post: Post | null; error: string | null }> {
  const initialStatus: PostStatus =
    params.status ||
    (params.authorRole === 'guest_blogger' || params.requiresReview ? 'pending' : 'live');

  if (!supabase) {
    const fallbackPost: Post = {
      id: `local-post-${Date.now()}`,
      community_id: params.communityId || JUJA_FALLBACK_ID,
      author_id: params.authorId,
      post_type: params.postType,
      title: params.title?.trim() || null,
      body: params.body.trim(),
      image_url: params.imageUrl || null,
      is_persona: Boolean(params.isPersona),
      status: initialStatus,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      event_data: params.eventData || null,
    };

    if (initialStatus === 'pending') {
      addPostToPendingQueue({
        ...fallbackPost,
        community_name: 'Juja',
        community_slug: 'juja',
        persona_name: params.isPersona ? '@guest_blogger' : '',
        author_role: params.authorRole || 'guest_blogger',
        reactions_count: { laugh: 0, relatable: 0, fire: 0, total: 0 },
        comments_count: 0,
      });
    }

    return { post: fallbackPost, error: null };
  }

  const validation = validatePostInput({
    postType: params.postType,
    title: params.title,
    body: params.body,
    hasImage: Boolean(params.imageUrl),
    eventDate: params.eventData?.event_date,
    eventPlace: params.eventData?.event_place,
  });

  if (!validation.isValid) {
    return { post: null, error: validation.error };
  }

  try {
    // Resolve community ID (defaulting to Juja)
    const communityId = params.communityId || (await getJujaCommunityId());

    const insertPayload = {
      community_id: communityId,
      author_id: params.authorId,
      post_type: params.postType,
      title: params.title?.trim() || null,
      body: params.body.trim(),
      image_url: params.imageUrl || null,
      is_persona: Boolean(params.isPersona),
      status: initialStatus,
    };

    const { data, error } = await supabase
      .from('posts')
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      console.warn('Remote post insert failed, using local post fallback:', error.message);
      const fallbackPost: Post = {
        id: `post-${Date.now()}`,
        community_id: communityId,
        author_id: params.authorId,
        post_type: params.postType,
        title: params.title?.trim() || null,
        body: params.body.trim(),
        image_url: params.imageUrl || null,
        is_persona: Boolean(params.isPersona),
        status: initialStatus,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        event_data: params.eventData || null,
      };

      if (initialStatus === 'pending') {
        addPostToPendingQueue({
          ...fallbackPost,
          community_name: 'Juja',
          community_slug: 'juja',
          persona_name: params.isPersona ? '@guest_blogger' : '',
          author_role: params.authorRole || 'guest_blogger',
          reactions_count: { laugh: 0, relatable: 0, fire: 0, total: 0 },
          comments_count: 0,
        });
      }

      return { post: fallbackPost, error: null };
    }

    const postObj = data as Post;
    if (params.eventData) {
      postObj.event_data = params.eventData;
    }

    if (initialStatus === 'pending') {
      addPostToPendingQueue({
        ...postObj,
        community_name: 'Juja',
        community_slug: 'juja',
        persona_name: params.isPersona ? '@guest_blogger' : '',
        author_role: params.authorRole || 'guest_blogger',
        reactions_count: { laugh: 0, relatable: 0, fire: 0, total: 0 },
        comments_count: 0,
      });
    }

    return { post: postObj, error: null };
  } catch (err: any) {
    const fallbackPost: Post = {
      id: `post-${Date.now()}`,
      community_id: params.communityId || JUJA_FALLBACK_ID,
      author_id: params.authorId,
      post_type: params.postType,
      title: params.title?.trim() || null,
      body: params.body.trim(),
      image_url: params.imageUrl || null,
      is_persona: Boolean(params.isPersona),
      status: initialStatus,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      event_data: params.eventData || null,
    };

    if (initialStatus === 'pending') {
      addPostToPendingQueue({
        ...fallbackPost,
        community_name: 'Juja',
        community_slug: 'juja',
        persona_name: params.isPersona ? '@guest_blogger' : '',
        author_role: params.authorRole || 'guest_blogger',
        reactions_count: { laugh: 0, relatable: 0, fire: 0, total: 0 },
        comments_count: 0,
      });
    }

    return { post: fallbackPost, error: null };
  }
}

export interface FetchFeedParams {
  page?: number;
  pageSize?: number;
  filter?: FeedFilter;
  communitySlug?: string;
}

export interface FeedResponse {
  posts: FeedPost[];
  hasMore: boolean;
  total?: number;
}

/**
 * Fetches an infinite page of live posts, newest first.
 * Connects to Supabase with fallback to Juja seed posts.
 */
export async function fetchInfiniteFeed(
  params: FetchFeedParams = {}
): Promise<FeedResponse> {
  const {
    page = 0,
    pageSize = 6,
    filter = 'all',
  } = params;

  // If Supabase is available, try fetching real live posts
  if (supabase) {
    try {
      let query = supabase
        .from('feed_posts')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (filter && filter !== 'all') {
        query = query.eq('post_type', filter);
      }

      const from = page * pageSize;
      const to = from + pageSize - 1;
      const { data, error, count } = await query.range(from, to);

      if (!error && Array.isArray(data) && data.length > 0) {
        const posts: FeedPost[] = data.map((item: any) => ({
          ...item,
          reactions_count: item.reactions_count || {
            laugh: Math.floor(Math.random() * 20),
            relatable: Math.floor(Math.random() * 35),
            fire: Math.floor(Math.random() * 15),
            total: 0,
          },
          comments_count: item.comments_count ?? 0,
        })).map((item) => ({
          ...item,
          reactions_count: {
            ...item.reactions_count,
            total:
              item.reactions_count.laugh +
              item.reactions_count.relatable +
              item.reactions_count.fire,
          },
        }));

        const totalCount = count ?? 0;
        return {
          posts,
          hasMore: totalCount > to + 1 || data.length === pageSize,
          total: totalCount,
        };
      }

      // If feed_posts view failed or was empty, check direct posts table
      let fallbackQuery = supabase
        .from('posts')
        .select(`
          id,
          community_id,
          author_id,
          post_type,
          title,
          body,
          image_url,
          is_persona,
          status,
          created_at,
          updated_at,
          profiles:author_id (real_name, persona_name, persona_avatar, role),
          communities:community_id (name, slug)
        `, { count: 'exact' })
        .eq('status', 'live')
        .order('created_at', { ascending: false });

      if (filter && filter !== 'all') {
        fallbackQuery = fallbackQuery.eq('post_type', filter);
      }

      const { data: postsData, error: postsError, count: postsCount } =
        await fallbackQuery.range(from, to);

      if (!postsError && Array.isArray(postsData) && postsData.length > 0) {
        const posts: FeedPost[] = postsData.map((item: any) => {
          const laugh = Math.floor(Math.random() * 12);
          const relatable = Math.floor(Math.random() * 24);
          const fire = Math.floor(Math.random() * 10);
          return {
            id: item.id,
            community_id: item.community_id,
            community_name: item.communities?.name || 'Juja',
            community_slug: item.communities?.slug || 'juja',
            post_type: item.post_type,
            title: item.title,
            body: item.body,
            image_url: item.image_url,
            is_persona: item.is_persona,
            status: item.status,
            created_at: item.created_at,
            updated_at: item.updated_at,
            persona_name: item.profiles?.persona_name || '@juja_campus',
            persona_avatar: item.profiles?.persona_avatar || '🎓',
            author_id: item.is_persona ? null : item.author_id,
            author_real_name: item.is_persona ? null : item.profiles?.real_name,
            author_role: item.profiles?.role || 'user',
            reactions_count: {
              laugh,
              relatable,
              fire,
              total: laugh + relatable + fire,
            },
            comments_count: Math.floor(Math.random() * 15),
          };
        });

        const totalCount = postsCount ?? 0;
        return {
          posts,
          hasMore: totalCount > to + 1 || postsData.length === pageSize,
          total: totalCount,
        };
      }
    } catch {
      // Fall through to seed data if error or empty
    }
  }

  // Fallback to seed posts with intelligent ranking (newest + high engagement boost + fresh voices)
  const filteredSeed = filterFeedPosts(SEED_JUJA_POSTS, filter);
  const rankedSeed = rankCampusFeed(filteredSeed);
  const start = page * pageSize;
  const end = start + pageSize;
  const slice = rankedSeed.slice(start, end);

  return {
    posts: slice,
    hasMore: end < rankedSeed.length,
    total: rankedSeed.length,
  };
}

/**
 * Backwards compatibility helper for simple single-page loads.
 */
export async function fetchLiveFeed(limit = 20): Promise<FeedPost[]> {
  const result = await fetchInfiniteFeed({ page: 0, pageSize: limit, filter: 'all' });
  return result.posts;
}

/**
 * Fetches a single post by ID for dedicated post view and social link previews.
 * Searches Supabase feed_posts/posts table, with fallback to seed posts.
 */
export async function fetchPostById(id: string): Promise<FeedPost | null> {
  if (!id) return null;

  // Check seed posts first if it starts with 'seed-'
  const seedMatch = SEED_JUJA_POSTS.find((p) => p.id === id);
  if (seedMatch) {
    return seedMatch;
  }

  // Attempt database query if Supabase is active
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          community_id,
          author_id,
          post_type,
          title,
          body,
          image_url,
          is_persona,
          status,
          created_at,
          updated_at,
          profiles:author_id (real_name, persona_name, persona_avatar, role),
          communities:community_id (name, slug)
        `)
        .eq('id', id)
        .maybeSingle();

      if (!error && data) {
        const item: any = data;
        return {
          id: item.id,
          community_id: item.community_id,
          community_name: item.communities?.name || 'Juja',
          community_slug: item.communities?.slug || 'juja',
          post_type: item.post_type,
          title: item.title,
          body: item.body,
          image_url: item.image_url,
          is_persona: item.is_persona,
          status: item.status,
          created_at: item.created_at,
          updated_at: item.updated_at,
          persona_name: item.profiles?.persona_name || '@juja_campus',
          persona_avatar: item.profiles?.persona_avatar || '🎓',
          author_id: item.is_persona ? null : item.author_id,
          author_real_name: item.is_persona ? null : item.profiles?.real_name,
          author_role: item.profiles?.role || 'user',
          reactions_count: {
            laugh: 0,
            relatable: 0,
            fire: 0,
            total: 0,
          },
          comments_count: 0,
        };
      }
    } catch {
      // In case of error, fall back to checking seed posts
    }
  }

  return SEED_JUJA_POSTS.find((p) => p.id === id) || null;
}

