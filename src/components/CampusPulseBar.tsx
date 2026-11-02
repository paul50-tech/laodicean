import React, { useMemo } from 'react';
import { FeedPost } from '../types';
import { computeCampusPulse } from '../lib/feedRanking';
import { Activity, Flame, MessageSquare, Zap } from 'lucide-react';

interface CampusPulseBarProps {
  posts: FeedPost[];
  className?: string;
}

export function CampusPulseBar({ posts, className = '' }: CampusPulseBarProps) {
  const pulse = useMemo(() => computeCampusPulse(posts), [posts]);

  return (
    <div
      aria-label="Campus live pulse activity"
      className={`bg-white border border-stone-200/90 rounded-2xl p-2.5 sm:px-3.5 sm:py-2.5 shadow-2xs flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 text-xs text-zinc-600 ${className}`}
    >
      <div className="flex items-center gap-2 min-w-0">
        {/* Animated green pulse beacon */}
        <span className="relative flex h-2.5 w-2.5 shrink-0" aria-hidden="true">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600" />
        </span>

        <span className="font-display font-bold text-zinc-950 flex items-center gap-1 shrink-0">
          <span>Campus Pulse</span>
          <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-semibold">
            Live
          </span>
        </span>

        <span className="hidden sm:inline text-stone-300" aria-hidden="true">•</span>

        {/* Live reaction metrics */}
        <p className="text-[11px] text-zinc-700 truncate">
          <span className="font-bold text-zinc-950">{pulse.reactionsLastHour}</span> reactions in last hour
        </p>

        <span className="hidden xs:inline text-stone-300" aria-hidden="true">•</span>

        {/* Active discussions count */}
        <p className="hidden xs:flex items-center gap-1 text-[11px] text-zinc-700 truncate">
          <MessageSquare className="w-3 h-3 text-zinc-400 shrink-0" aria-hidden="true" />
          <span><strong className="font-bold text-zinc-950">{pulse.activeDiscussions}</strong> active threads</span>
        </p>
      </div>

      {/* Campus Vibe badge */}
      <div className="flex items-center gap-2 shrink-0 ml-auto sm:ml-0">
        <span className="text-[11px] font-medium text-zinc-700 bg-amber-50/80 border border-amber-200/80 text-amber-900 px-2 py-0.5 rounded-full flex items-center gap-1">
          <Flame className="w-3 h-3 text-amber-600 fill-amber-500/20" aria-hidden="true" />
          <span className="font-semibold">{pulse.vibeText}</span>
        </span>
      </div>
    </div>
  );
}
