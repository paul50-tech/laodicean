import React from 'react';
import { ProfileBadgeType, ProfileBadgeInfo } from '../types';
import { resolveAuthorBadges, getBadgeDetails } from '../lib/badges';

interface ProfileBadgeTagProps {
  badges?: ProfileBadgeType[] | null;
  authorName?: string | null;
  personaName?: string | null;
  commentsCount?: number;
  postType?: string;
  isMemeWinner?: boolean;
  className?: string;
}

export function ProfileBadgeTag({
  badges,
  authorName,
  personaName,
  commentsCount,
  postType,
  isMemeWinner,
  className = '',
}: ProfileBadgeTagProps) {
  const resolvedBadges = resolveAuthorBadges({
    explicitBadges: badges,
    authorName,
    personaName,
    commentsCount,
    postType,
    isMemeWinner,
  });

  if (resolvedBadges.length === 0) return null;

  return (
    <div className={`inline-flex items-center gap-1 flex-wrap ${className}`}>
      {resolvedBadges.map((badge) => (
        <span
          key={badge.type}
          title={badge.description}
          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold border shadow-2xs transition-transform hover:scale-105 cursor-help ${badge.badgeClass}`}
        >
          <span role="img" aria-label={badge.label} className="text-[11px] leading-none">
            {badge.emoji}
          </span>
          <span className="font-sans text-[9px] tracking-tight whitespace-nowrap">
            {badge.label}
          </span>
        </span>
      ))}
    </div>
  );
}
