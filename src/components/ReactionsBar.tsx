import React, { useState, useEffect } from 'react';
import { ReactionType, ReactionCounts, CAMPUS_REACTIONS, Profile } from '../types';
import {
  calculateReactionSwitch,
  getUserReactionForPost,
  persistReaction,
} from '../lib/reactions';

interface ReactionsBarProps {
  postId: string;
  initialCounts?: ReactionCounts;
  currentUserProfile?: Profile | null;
  onRequireAuth: (message: string) => void;
  onCountsChange?: (newCounts: ReactionCounts) => void;
}

export function ReactionsBar({
  postId,
  initialCounts,
  currentUserProfile,
  onRequireAuth,
  onCountsChange,
}: ReactionsBarProps) {
  const [counts, setCounts] = useState<ReactionCounts>({
    laugh: initialCounts?.laugh || 0,
    relatable: initialCounts?.relatable || 0,
    fire: initialCounts?.fire || 0,
    total: initialCounts?.total || 0,
  });

  const [userReaction, setUserReaction] = useState<ReactionType | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Load current user's reaction for this post
  useEffect(() => {
    let mounted = true;
    if (currentUserProfile?.id) {
      getUserReactionForPost(postId, currentUserProfile.id).then((reaction) => {
        if (mounted && reaction) {
          setUserReaction(reaction);
        }
      });
    } else {
      setUserReaction(null);
    }
    return () => {
      mounted = false;
    };
  }, [postId, currentUserProfile?.id]);

  const handleReactionClick = async (reactionType: ReactionType) => {
    if (!currentUserProfile?.id) {
      onRequireAuth('Sign in with your campus account to react to posts!');
      return;
    }

    if (isUpdating) return;

    // Optimistically update counts and reaction state
    const previousReaction = userReaction;
    const { newReaction, newCounts } = calculateReactionSwitch(
      previousReaction,
      reactionType,
      counts
    );

    setUserReaction(newReaction);
    setCounts(newCounts);
    onCountsChange?.(newCounts);
    setIsUpdating(true);

    try {
      await persistReaction({
        postId,
        userId: currentUserProfile.id,
        newReaction,
        previousReaction,
      });
    } catch {
      // Revert if fatal error
      setUserReaction(previousReaction);
      setCounts(counts);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div
      role="group"
      aria-label="Post reactions"
      className="flex items-center gap-1.5 sm:gap-2 flex-wrap"
    >
      {CAMPUS_REACTIONS.map((item) => {
        const isActive = userReaction === item.type;
        const count = counts[item.type] || 0;

        return (
          <button
            key={item.type}
            type="button"
            onClick={() => handleReactionClick(item.type)}
            aria-pressed={isActive}
            title={`${item.label} (${item.campusName}) - Tap to ${
              isActive ? 'remove' : 'react'
            }`}
            className={`cursor-pointer inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs transition-all select-none border ${
              isActive
                ? item.type === 'laugh'
                  ? 'bg-amber-100 border-amber-300 text-amber-950 font-bold shadow-2xs scale-102 ring-1 ring-amber-300'
                  : item.type === 'relatable'
                  ? 'bg-blue-100 border-blue-300 text-blue-950 font-bold shadow-2xs scale-102 ring-1 ring-blue-300'
                  : 'bg-orange-100 border-orange-300 text-orange-950 font-bold shadow-2xs scale-102 ring-1 ring-orange-300'
                : 'bg-stone-50/80 border-stone-200/90 text-stone-700 hover:bg-stone-100/90 hover:border-stone-300'
            }`}
          >
            <span className="text-sm" aria-hidden="true">
              {item.emoji}
            </span>
            <span className="font-medium text-[11px]">{item.campusName}</span>
            <span
              className={`font-mono text-[11px] px-1 py-0.2 rounded-md ${
                isActive
                  ? 'bg-white/80 text-zinc-900 font-bold'
                  : 'text-zinc-500 bg-stone-100'
              }`}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
