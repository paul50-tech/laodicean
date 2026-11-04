import React from 'react';
import { Community, Profile, FeedPost } from '../types';
import { Shield, Sparkles, Users, Calendar, Compass, Plus, ExternalLink } from 'lucide-react';
import { isCommunityJoined } from '../lib/communities';

interface DesktopCommunitySidebarProps {
  community: Community;
  currentUserProfile?: Profile | null;
  onToggleJoin: (slug: string) => void;
  onOpenRules: () => void;
  onOpenDiscover: () => void;
  onRequestCommunity: () => void;
  onOpenModTools?: () => void;
  trendingPosts?: FeedPost[];
  onSelectPost?: (post: FeedPost) => void;
}

/**
 * Desktop Community Right Sidebar adhering to Jakob's Law of Internet UX.
 * Replicates the familiar Reddit 'About Community' & Twitter 'What's Happening'
 * sidebar structure on desktop screens, reducing cognitive friction for new users.
 */
export const DesktopCommunitySidebar: React.FC<DesktopCommunitySidebarProps> = ({
  community,
  currentUserProfile,
  onToggleJoin,
  onOpenRules,
  onOpenDiscover,
  onRequestCommunity,
  onOpenModTools,
  trendingPosts = [],
  onSelectPost,
}) => {
  const isJoined = isCommunityJoined(community.slug);
  const isModerator =
    currentUserProfile?.role === 'admin' ||
    (currentUserProfile?.id && community.moderator_ids?.includes(currentUserProfile.id)) ||
    currentUserProfile?.role === 'moderator';

  return (
    <aside aria-label="Community information and trending topics" className="space-y-4">
      {/* 1. About Community Card (Reddit Pattern) */}
      <div className="bg-white border border-stone-200/90 rounded-2xl overflow-hidden shadow-xs">
        {/* Banner with Community Accent Color */}
        <div
          className="h-16 w-full relative"
          style={{ backgroundColor: community.color || community.accent_color || '#065f46' }}
        >
          <div className="absolute inset-0 bg-black/15" />
          <div className="absolute top-2 right-3 text-[10px] font-mono text-white/90 bg-black/30 px-2 py-0.5 rounded-full backdrop-blur-xs font-bold">
            c/{community.slug}
          </div>
        </div>

        {/* Community Info Body */}
        <div className="p-4 pt-0 relative space-y-3">
          {/* Avatar floating above border */}
          <div className="-mt-7 flex items-end justify-between">
            <div className="w-14 h-14 rounded-2xl bg-white border-2 border-white shadow-sm flex items-center justify-center text-2xl">
              {community.icon || '🏛️'}
            </div>

            {/* Join / Leave Primary Action Button */}
            <button
              type="button"
              onClick={() => onToggleJoin(community.slug)}
              className={`cursor-pointer px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shadow-2xs ${
                isJoined
                  ? 'bg-stone-100 text-stone-700 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 border border-stone-200'
                  : 'bg-emerald-800 text-white hover:bg-emerald-900'
              }`}
            >
              {isJoined ? 'Joined ✓' : '+ Join'}
            </button>
          </div>

          {/* Name & Tagline */}
          <div className="space-y-1">
            <h2 className="font-display text-base font-bold text-zinc-950 leading-tight">
              {community.name}
            </h2>
            <p className="text-xs text-zinc-600 leading-relaxed">
              {community.description || 'The central campus collective for student stories, questions, polls, and street mushene.'}
            </p>
          </div>

          {/* Quick Stats (Members & Campus Location) */}
          <div className="pt-2 border-t border-stone-100 grid grid-cols-2 gap-2 text-xs text-zinc-500">
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-emerald-800" />
              <span>
                <strong className="font-bold text-zinc-900">
                  {((community.member_count || 1240) + (isJoined ? 1 : 0)).toLocaleString()}
                </strong>{' '}
                members
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-zinc-400" />
              <span>Est. {community.created_at ? new Date(community.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : '2026'}</span>
            </div>
          </div>

          {/* Action Links: Rules, Moderator Tools */}
          <div className="pt-2 border-t border-stone-100 flex flex-col gap-1.5 text-xs">
            <button
              type="button"
              onClick={onOpenRules}
              className="cursor-pointer w-full text-left py-1.5 px-2 rounded-xl text-emerald-900 hover:bg-emerald-50/80 font-semibold flex items-center justify-between transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-800" />
                <span>5 Golden Rules & Guidelines</span>
              </span>
              <ExternalLink className="w-3 h-3 text-emerald-700" />
            </button>

            {isModerator && onOpenModTools && (
              <button
                type="button"
                onClick={onOpenModTools}
                className="cursor-pointer w-full text-left py-1.5 px-2 rounded-xl text-amber-900 hover:bg-amber-50/80 font-bold flex items-center justify-between transition-colors bg-amber-50/40 border border-amber-200/60"
              >
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Community Mod Tools</span>
                </span>
                <span className="text-[10px] bg-amber-200/80 px-1.5 py-0.2 rounded font-mono">Mod</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Discover Other Campuses Card */}
      <div className="bg-stone-50/80 border border-stone-200/90 rounded-2xl p-4 space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-xs font-bold text-zinc-900 flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-emerald-800" />
            <span>Campus Network</span>
          </h3>
          <button
            type="button"
            onClick={onOpenDiscover}
            className="cursor-pointer text-[11px] font-semibold text-emerald-800 hover:text-emerald-950"
          >
            Browse All
          </button>
        </div>
        <p className="text-[11px] text-zinc-600 leading-relaxed">
          Switch between university communities across Kenya including Rongai, Madaraka, and Parklands, or launch your own.
        </p>
        <button
          type="button"
          onClick={onRequestCommunity}
          className="cursor-pointer w-full py-1.5 px-3 rounded-xl bg-white hover:bg-stone-100 border border-stone-200 text-stone-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
        >
          <Plus className="w-3.5 h-3.5 text-emerald-800" />
          <span>Request New Campus</span>
        </button>
      </div>

      {/* 3. Community Rules Quick Reference */}
      <div className="bg-white border border-stone-200/90 rounded-2xl p-4 space-y-2 text-xs">
        <h3 className="font-display font-bold text-zinc-900 flex items-center gap-1.5">
          <span>📜</span>
          <span>Community Standards</span>
        </h3>
        <ol className="list-decimal list-inside space-y-1 text-[11px] text-zinc-600 leading-snug">
          <li>Respect comrades & keep mushene non-defamatory.</li>
          <li>Zero harassment or private data leaks (doxxing).</li>
          <li>Keep persona accountability under admin unmasking.</li>
          <li>No targeted poll defamation against real students.</li>
          <li>Help answer comrade questions in Ask Juja.</li>
        </ol>
      </div>
    </aside>
  );
};
