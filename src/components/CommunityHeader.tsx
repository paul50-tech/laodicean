import React, { useState } from 'react';
import { Community, Profile } from '../types';
import { isUserCommunityModerator, formatCommunityShareUrl } from '../lib/communities';
import { Share2, Shield, BookOpen, Check, Copy, Users, ExternalLink } from 'lucide-react';

interface CommunityHeaderProps {
  community: Community;
  currentUserProfile?: Profile | null;
  isJoined: boolean;
  onToggleJoin: () => void;
  onOpenRules: () => void;
  onOpenModTools: () => void;
}

export function CommunityHeader({
  community,
  currentUserProfile,
  isJoined,
  onToggleJoin,
  onOpenRules,
  onOpenModTools,
}: CommunityHeaderProps) {
  const [copied, setCopied] = useState(false);
  const isMod = isUserCommunityModerator(
    community,
    currentUserProfile,
    currentUserProfile?.role
  );

  const handleCopyLink = async () => {
    const url = formatCommunityShareUrl(community);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareWhatsApp = () => {
    const url = formatCommunityShareUrl(community);
    const text = encodeURIComponent(
      `Join the conversation in ${community.name} on Laodicean! 🎓\n${community.tagline || ''}\n${url}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const primaryBg = community.color || '#064e3b';
  const accentColor = community.accent_color || '#10b981';
  const bannerImage = community.banner_url || community.banner;

  return (
    <section className="relative overflow-hidden rounded-2xl bg-white border border-stone-200/90 shadow-xs">
      {/* Community Banner / Background accent */}
      <div
        className="relative h-24 sm:h-28 w-full transition-colors duration-300"
        style={{
          background: bannerImage
            ? `linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.65)), url(${bannerImage}) center/cover no-repeat`
            : `linear-gradient(135deg, ${primaryBg} 0%, ${accentColor} 100%)`,
        }}
      >
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10">
          <button
            type="button"
            onClick={handleCopyLink}
            className="px-2.5 py-1 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer border border-white/20 shadow-xs"
            title="Copy community link"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Link</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="px-2.5 py-1 rounded-full bg-emerald-600/90 hover:bg-emerald-600 text-white text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer border border-white/20 shadow-xs"
            title="Share to WhatsApp"
          >
            <Share2 className="w-3 h-3" />
            <span>WhatsApp</span>
          </button>
        </div>

        {/* Small badge top left */}
        <div className="absolute top-2.5 left-2.5 z-10">
          <span className="px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-md text-[10px] font-semibold text-white/90 border border-white/10 uppercase tracking-wider">
            Campus Community
          </span>
        </div>
      </div>

      {/* Community Meta & Details */}
      <div className="px-4 pb-4 pt-2 space-y-3">
        <div className="flex items-start justify-between gap-3 -mt-8 relative z-10">
          <div className="flex items-end gap-3 min-w-0">
            <div
              className="w-14 h-14 rounded-2xl bg-white border-2 border-white shadow-md flex items-center justify-center text-2xl shrink-0"
              style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
            >
              <span>{community.icon || '🎓'}</span>
            </div>
            <div className="min-w-0 pb-1">
              <div className="flex items-center gap-1.5">
                <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-zinc-950 truncate">
                  {community.name}
                </h1>
                {community.is_default && (
                  <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-850 border border-emerald-200">
                    Flagship
                  </span>
                )}
              </div>
              <p className="text-[11px] font-mono text-zinc-500">
                /c/{community.slug}
              </p>
            </div>
          </div>

          <div className="pt-8 shrink-0 flex items-center gap-1.5">
            {community.is_default ? (
              <span className="px-2.5 py-1 text-xs font-semibold text-emerald-850 bg-emerald-50 rounded-xl border border-emerald-200">
                Joined
              </span>
            ) : (
              <button
                type="button"
                onClick={onToggleJoin}
                className={`min-h-[34px] px-3.5 py-1 rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-xs ${
                  isJoined
                    ? 'bg-stone-100 hover:bg-stone-200 text-zinc-700 border border-stone-300'
                    : 'bg-emerald-850 hover:bg-emerald-950 text-white'
                }`}
              >
                {isJoined ? 'Joined' : '+ Join'}
              </button>
            )}
          </div>
        </div>

        {/* Tagline & Description */}
        <div className="space-y-1">
          {community.tagline && (
            <p className="text-xs sm:text-sm font-medium text-zinc-800">
              {community.tagline}
            </p>
          )}
          {community.description && (
            <p className="text-xs text-zinc-600 leading-relaxed line-clamp-2">
              {community.description}
            </p>
          )}
        </div>

        {/* Stats and Action Strip */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-100 text-xs text-zinc-600">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-[11px] text-zinc-600">
              <Users className="w-3.5 h-3.5 text-zinc-500" />
              <span><strong>{(community.member_count || 1).toLocaleString()}</strong> members</span>
            </span>
            {community.creator_name && (
              <span className="text-[11px] text-zinc-500 hidden sm:inline">
                Lead: <strong className="text-zinc-700">{community.creator_name}</strong>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenRules}
              className="px-2.5 py-1 rounded-lg text-xs font-medium text-zinc-700 hover:bg-stone-100 border border-stone-200 inline-flex items-center gap-1 transition-colors cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-zinc-500" />
              <span>Campus Rules</span>
            </button>

            {isMod && (
              <button
                type="button"
                onClick={onOpenModTools}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 inline-flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                title="Open Moderator Dashboard for this campus"
              >
                <Shield className="w-3.5 h-3.5 text-amber-700" />
                <span>Mod Tools</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
