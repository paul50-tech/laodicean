import React from 'react';
import { Community } from '../types';
import { Compass, Plus, Users, Sparkles } from 'lucide-react';

interface YourCommunitiesRowProps {
  communities: Community[];
  joinedSlugs: string[];
  activeSlug: string;
  onSelectCommunity: (slug: string) => void;
  onOpenDiscover: () => void;
  onRequestCommunity: () => void;
}

export function YourCommunitiesRow({
  communities,
  joinedSlugs,
  activeSlug,
  onSelectCommunity,
  onOpenDiscover,
  onRequestCommunity,
}: YourCommunitiesRowProps) {
  // Filter only joined communities, ensuring at least Juja is always present
  const joinedList = communities.filter((c) =>
    c.is_default || joinedSlugs.includes(c.slug)
  );

  return (
    <div className="w-full bg-white border border-stone-200/90 rounded-2xl p-2.5 sm:p-3 shadow-xs space-y-2">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-800">
          <Users className="w-3.5 h-3.5 text-emerald-800" aria-hidden="true" />
          <span>Your Communities</span>
          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-850">
            {joinedList.length}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onOpenDiscover}
            className="px-2.5 py-1 rounded-lg text-[11px] font-medium text-emerald-800 hover:text-emerald-950 hover:bg-emerald-50 inline-flex items-center gap-1 transition-colors cursor-pointer"
            title="Browse and join campus communities"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Discover</span>
          </button>
          <button
            type="button"
            onClick={onRequestCommunity}
            className="px-2 py-1 rounded-lg text-[11px] font-medium text-zinc-600 hover:text-zinc-900 hover:bg-stone-100 inline-flex items-center gap-1 transition-colors cursor-pointer"
            title="Request a new campus community"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Request</span>
          </button>
        </div>
      </div>

      {/* Horizontal Scroll Strip */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 no-scrollbar scroll-smooth">
        {joinedList.map((comm) => {
          const isActive = comm.slug === activeSlug;
          return (
            <button
              key={comm.id}
              type="button"
              onClick={() => onSelectCommunity(comm.slug)}
              className={`shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                isActive
                  ? 'bg-emerald-900 text-white border-emerald-950 shadow-xs ring-2 ring-emerald-600/30 font-semibold'
                  : 'bg-stone-50 hover:bg-stone-100 text-zinc-700 border-stone-200/90'
              }`}
              style={
                isActive && comm.color
                  ? { backgroundColor: comm.color, borderColor: comm.color }
                  : undefined
              }
            >
              <span className="text-sm shrink-0" role="img" aria-label={comm.name}>
                {comm.icon || '🎓'}
              </span>
              <span className="truncate max-w-[130px]">{comm.name}</span>
              {comm.is_default && (
                <span
                  className={`text-[9px] px-1 py-0.2 rounded font-bold uppercase tracking-wider ${
                    isActive ? 'bg-white/20 text-white' : 'bg-stone-200 text-stone-700'
                  }`}
                >
                  Flagship
                </span>
              )}
            </button>
          );
        })}

        {/* Quick action to explore more */}
        <button
          type="button"
          onClick={onOpenDiscover}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-dashed border-stone-300 hover:border-emerald-500 hover:bg-emerald-50/50 text-zinc-500 hover:text-emerald-900 text-xs transition-colors cursor-pointer"
        >
          <Sparkles className="w-3 h-3 text-emerald-700" />
          <span>More campuses</span>
        </button>
      </div>
    </div>
  );
}
