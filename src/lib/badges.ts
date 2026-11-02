/**
 * Campus Profile Badges for Laodicean.
 * 
 * Supports simple, highly recognizable status achievements:
 * - 📖 Top Storyteller: Prolific publisher of engaging campus chronicles and stories
 * - 💬 Top Commenter: Active contributor in comment discussions & mushene
 * - 🏆 Meme Champion: Winner of Juja Meme of the Week or high-heat campus memes
 */

import { ProfileBadgeType, ProfileBadgeInfo } from '../types';

export const BADGE_DEFINITIONS: Record<ProfileBadgeType, ProfileBadgeInfo> = {
  top_storyteller: {
    type: 'top_storyteller',
    label: 'Top Storyteller',
    emoji: '📖',
    description: 'Consistently publishes engaging long-form campus chronicles & stories',
    badgeClass: 'bg-amber-50 text-amber-900 border-amber-300/80',
  },
  top_commenter: {
    type: 'top_commenter',
    label: 'Top Commenter',
    emoji: '💬',
    description: 'Active contributor across campus discussions, replies & mushene',
    badgeClass: 'bg-blue-50 text-blue-900 border-blue-300/80',
  },
  meme_champion: {
    type: 'meme_champion',
    label: 'Meme Champion',
    emoji: '🏆',
    description: 'Winner of Juja Meme of the Week and viral street humor',
    badgeClass: 'bg-purple-50 text-purple-900 border-purple-300/80',
  },
};

/**
 * Returns the badge metadata for a given badge type.
 */
export function getBadgeDetails(type: ProfileBadgeType): ProfileBadgeInfo {
  return BADGE_DEFINITIONS[type] || BADGE_DEFINITIONS.top_commenter;
}

/**
 * Resolves profile badges for an author, combining explicit badges and
 * heuristic reputation achievements.
 */
export function resolveAuthorBadges(params: {
  explicitBadges?: ProfileBadgeType[] | null;
  authorName?: string | null;
  personaName?: string | null;
  commentsCount?: number;
  postType?: string;
  isMemeWinner?: boolean;
}): ProfileBadgeInfo[] {
  const resultTypes = new Set<ProfileBadgeType>();

  // 1. Explicit badges
  if (params.explicitBadges && Array.isArray(params.explicitBadges)) {
    params.explicitBadges.forEach((b) => resultTypes.add(b));
  }

  // 2. Meme of the week winner badge
  if (params.isMemeWinner) {
    resultTypes.add('meme_champion');
  }

  // 3. Known campus persona recognition
  const pName = (params.personaName || '').toLowerCase();
  const aName = (params.authorName || '').toLowerCase();

  if (pName.includes('clutch_coder') || pName.includes('stage_watcher') || pName.includes('dust')) {
    resultTypes.add('meme_champion');
  }

  if (pName.includes('engineer_sam') || aName.includes('faith mwangi') || pName.includes('inspector')) {
    resultTypes.add('top_storyteller');
  }

  if (pName.includes('backrow_scholar') || pName.includes('chapo_crusader') || (params.commentsCount && params.commentsCount >= 15)) {
    resultTypes.add('top_commenter');
  }

  // Map to full badge metadata
  return Array.from(resultTypes).map((type) => getBadgeDetails(type));
}
