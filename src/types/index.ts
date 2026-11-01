/**
 * Core types for Laodicean matching supabase/schema.sql.
 */

export type UserRole = 'user' | 'moderator' | 'admin';

export interface Profile {
  id: string;
  real_name: string;
  persona_name: string;
  persona_avatar?: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export type CommunityStatus = 'pending' | 'approved';

export interface Community {
  id: string;
  name: string;
  slug: string;
  banner?: string | null;
  description: string;
  rules: string[];
  status: CommunityStatus;
  created_by?: string | null;
  created_at: string;
}

export interface CommunityMember {
  id: string;
  community_id: string;
  user_id: string;
  joined_at: string;
}

export type PostType =
  | 'story'
  | 'poll'
  | 'photo'
  | 'meme'
  | 'confession'
  | 'event'
  | 'mushene';

export type PostStatus = 'pending' | 'live' | 'hidden';

export interface PollOptionResult {
  id: string;
  poll_id: string;
  option_text: string;
  position: number;
  votes_count: number;
  percentage: number;
}

export interface PollWithResults {
  id: string;
  post_id: string;
  question: string;
  options: PollOptionResult[];
  total_votes: number;
  user_voted_option_id?: string | null;
}

export interface EventData {
  event_date: string;
  event_place: string;
  rsvp_count?: number;
  user_has_rsvped?: boolean;
}

export interface Post {
  id: string;
  community_id: string;
  author_id: string;
  post_type: PostType;
  title?: string | null;
  body: string;
  image_url?: string | null;
  is_persona: boolean;
  status: PostStatus;
  created_at: string;
  updated_at: string;
  poll_data?: PollWithResults | null;
  event_data?: EventData | null;
}

export type FeedFilter =
  | 'all'
  | 'mushene'
  | 'event'
  | 'poll'
  | 'confession'
  | 'meme'
  | 'story'
  | 'photo';

export interface ReactionCounts {
  laugh: number;
  relatable: number;
  fire: number;
  total: number;
}

export interface FeedPost {
  id: string;
  community_id: string;
  community_name: string;
  community_slug: string;
  post_type: PostType;
  title?: string | null;
  body: string;
  image_url?: string | null;
  is_persona: boolean;
  status: PostStatus;
  created_at: string;
  updated_at: string;
  persona_name: string;
  persona_avatar?: string | null;
  author_id?: string | null; // Masked if persona post and reader is not admin/author
  author_real_name?: string | null; // Only populated for admins or author
  author_role: UserRole;
  reactions_count?: ReactionCounts;
  comments_count?: number;
  poll_data?: PollWithResults | null;
  event_data?: EventData | null;
}

export interface MusheneMoment {
  id: string;
  author_id: string;
  author_name: string;
  author_avatar: string;
  is_persona: boolean;
  author_real_name?: string | null;
  text: string;
  tag?: string;
  bg_gradient?: string;
  created_at: string;
  expires_at: string;
  views_count?: number;
  reactions_count?: { fire: number; laugh: number; shock: number };
}

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  parent_id?: string | null;
  body: string;
  is_persona: boolean;
  created_at: string;
}

export interface CommentWithAuthor extends Comment {
  persona_name?: string;
  persona_avatar?: string | null;
  author_real_name?: string | null;
  author_role?: UserRole;
  replies?: CommentWithAuthor[];
}

export type ReactionType = 'laugh' | 'relatable' | 'fire';

export interface ReactionConfigItem {
  type: ReactionType;
  emoji: string;
  label: string;
  campusName: string;
}

export const CAMPUS_REACTIONS: ReactionConfigItem[] = [
  { type: 'laugh', emoji: '😂', label: 'Laugh', campusName: 'Laugh' },
  { type: 'relatable', emoji: '🤝', label: 'Ni Kweli', campusName: 'Ni Kweli' },
  { type: 'fire', emoji: '🔥', label: 'Fire', campusName: 'Fire' },
];

export interface Reaction {
  id: string;
  post_id?: string | null;
  comment_id?: string | null;
  user_id: string;
  reaction_type: ReactionType;
  created_at: string;
}

export interface Poll {
  id: string;
  post_id: string;
  question: string;
  created_at: string;
}

export interface PollOption {
  id: string;
  poll_id: string;
  option_text: string;
  position: number;
}

export interface PollVote {
  id: string;
  poll_id: string;
  option_id: string;
  user_id: string;
  created_at: string;
}

export type ReportReason =
  | 'spam'
  | 'harassment'
  | 'hate_speech'
  | 'misinformation'
  | 'other';

export type ReportStatus = 'pending' | 'reviewed' | 'resolved' | 'dismissed';

export interface Report {
  id: string;
  reporter_id: string;
  post_id?: string | null;
  comment_id?: string | null;
  reason: ReportReason;
  details?: string | null;
  status: ReportStatus;
  created_at: string;
}

export interface SupabaseConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  isConfigured: boolean;
  missingVars: string[];
}

export interface ConnectionStatus {
  state: 'idle' | 'checking' | 'connected' | 'error';
  message: string;
  timestamp?: string;
}
