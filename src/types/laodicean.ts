/**
 * Core domain types for Laodicean (laodicean.online).
 * Kept small, clear, and directly aligned with supabase/schema.sql.
 */

export enum PostType {
  Story = 'story',
  Gist = 'gist',
  Photo = 'photo',
  Notice = 'notice',
}

export interface Community {
  slug: string;
  name: string;
  subtitle: string;
  description: string;
  region: string;
  memberCount: number;
  isActive: boolean;
  bannerUrl?: string;
}

export interface PostComment {
  id: string;
  postId: string;
  authorName: string;
  authorHandle: string;
  body: string;
  createdAt: string;
}

export interface Post {
  id: string;
  slug: string;
  communitySlug: string;
  postType: PostType;
  title?: string;
  body: string;
  spot: string;
  authorName: string;
  authorHandle: string;
  authorCourse?: string;
  imageUrl?: string;
  imageAlt?: string;
  imageKb?: number;
  likesCount: number;
  commentsCount: number;
  likedByMe?: boolean;
  createdAt: string;
}

export interface CommunityRequest {
  id: string;
  proposedName: string;
  proposedSlug: string;
  campusOrArea: string;
  reason: string;
  requesterContact: string;
  status: 'pending' | 'approved' | 'declined';
  createdAt: string;
}

export interface CampusUser {
  id: string;
  name: string;
  handle: string;
  course: string;
  email: string;
}

export interface PostDraftInput {
  communitySlug: string;
  postType: PostType;
  title: string;
  body: string;
  spot: string;
  imageUrl?: string;
  imageAlt?: string;
  imageKb?: number;
}

export interface CommunityRequestInput {
  proposedName: string;
  campusOrArea: string;
  reason: string;
  requesterContact: string;
}

export type AppRoute =
  | { view: 'feed'; communitySlug: string | null }
  | { view: 'post'; postSlug: string }
  | { view: 'communities'; focusRequestForm?: boolean };
