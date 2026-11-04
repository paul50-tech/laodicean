import React, { useState, useMemo } from 'react';
import { Community } from '../types';
import {
  Compass,
  Search,
  Users,
  Check,
  Plus,
  ArrowRight,
  ShieldCheck,
  X,
  BookOpen,
} from 'lucide-react';

interface DiscoverCommunitiesModalProps {
  isOpen: boolean;
  communities: Community[];
  joinedSlugs: string[];
  activeSlug: string;
  onClose: () => void;
  onSelectCommunity: (slug: string) => void;
  onToggleJoin: (slug: string) => void;
  onRequestCommunity: () => void;
}

export function DiscoverCommunitiesModal({
  isOpen,
  communities,
  joinedSlugs,
  activeSlug,
  onClose,
  onSelectCommunity,
  onToggleJoin,
  onRequestCommunity,
}: DiscoverCommunitiesModalProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCommunities = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return communities;
    return communities.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q) ||
        (c.tagline && c.tagline.toLowerCase().includes(q)) ||
        (c.description && c.description.toLowerCase().includes(q))
    );
  }, [communities, searchQuery]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="discover-heading"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        className="w-full max-w-lg max-h-[90vh] bg-white rounded-3xl border border-stone-200/90 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-100 flex items-center justify-between shrink-0 bg-stone-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-800 text-white flex items-center justify-center shadow-xs">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h2 id="discover-heading" className="font-display text-lg font-bold text-zinc-950">
                Discover Campuses
              </h2>
              <p className="text-xs text-zinc-500">
                Explore, join, or switch between university communities across Kenya
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-750 hover:bg-stone-200/60 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Request Callout */}
        <div className="p-4 border-b border-stone-100 space-y-3 shrink-0 bg-white">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by campus name, location, or tag..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-stone-100/80 border border-stone-200 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-700 transition-all"
            />
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-200/80">
            <div className="text-[11px] text-emerald-950">
              <span className="font-semibold">Missing your university?</span> Request a new space for your campus!
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                onRequestCommunity();
              }}
              className="px-2.5 py-1 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-[11px] font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer shrink-0 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Request</span>
            </button>
          </div>
        </div>

        {/* Community List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {filteredCommunities.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="text-3xl">🔍</div>
              <p className="text-sm font-semibold text-zinc-800">
                No campuses found matching &quot;{searchQuery}&quot;
              </p>
              <p className="text-xs text-zinc-500 max-w-xs mx-auto">
                Be the first to bring Laodicean to your campus by requesting a new community!
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onRequestCommunity();
                }}
                className="mt-2 px-4 py-2 rounded-xl bg-emerald-850 text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Request &quot;{searchQuery}&quot; Campus</span>
              </button>
            </div>
          ) : (
            filteredCommunities.map((comm) => {
              const isJoined = comm.is_default || joinedSlugs.includes(comm.slug);
              const isCurrent = comm.slug === activeSlug;

              return (
                <div
                  key={comm.id}
                  className={`rounded-2xl border transition-all overflow-hidden ${
                    isCurrent
                      ? 'border-emerald-800/80 ring-2 ring-emerald-600/20 shadow-sm bg-white'
                      : 'border-stone-200/90 hover:border-stone-300 bg-white'
                  }`}
                >
                  {/* Card mini-banner */}
                  {(() => {
                    const bannerImg = comm.banner_url || comm.banner;
                    return (
                      <div
                        className="h-14 w-full flex items-center justify-between px-3.5 text-white relative"
                        style={{
                          background: bannerImg
                            ? `linear-gradient(to right, rgba(0,0,0,0.4), rgba(0,0,0,0.7)), url(${bannerImg}) center/cover`
                            : `linear-gradient(90deg, ${comm.color || '#064e3b'} 0%, ${comm.accent_color || '#10b981'} 100%)`,
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-2xl drop-shadow-xs">{comm.icon || '🎓'}</span>
                          <div>
                            <h3 className="font-display text-sm font-bold drop-shadow-xs flex items-center gap-1.5">
                              <span>{comm.name}</span>
                              {comm.is_default && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-white/20 text-white font-bold uppercase tracking-wider">
                                  Flagship
                                </span>
                              )}
                            </h3>
                            <p className="text-[10px] text-white/80 font-mono">/c/{comm.slug}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 text-[11px] bg-black/30 backdrop-blur-xs px-2 py-0.5 rounded-full border border-white/20">
                          <Users className="w-3 h-3" />
                          <span>{(comm.member_count || 1).toLocaleString()}</span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Card Body */}
                  <div className="p-3.5 space-y-2.5">
                    {comm.tagline && (
                      <p className="text-xs font-medium text-zinc-900">{comm.tagline}</p>
                    )}
                    {comm.description && (
                      <p className="text-[11px] text-zinc-600 line-clamp-2 leading-relaxed">
                        {comm.description}
                      </p>
                    )}

                    {/* Rule preview */}
                    {comm.rules && comm.rules.length > 0 && (
                      <div className="p-2 rounded-lg bg-stone-50 border border-stone-200/70 text-[10px] text-zinc-600 flex items-start gap-1.5">
                        <BookOpen className="w-3 h-3 text-emerald-800 shrink-0 mt-0.5" />
                        <span className="line-clamp-1 italic">
                          Rule: {comm.rules[0]}
                        </span>
                      </div>
                    )}

                    {/* Card Actions */}
                    <div className="flex items-center justify-between pt-1 gap-2">
                      <div>
                        {comm.is_default ? (
                          <span className="text-[11px] font-semibold text-emerald-850 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200">
                            Default Member
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onToggleJoin(comm.slug)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-medium inline-flex items-center gap-1 transition-colors cursor-pointer ${
                              isJoined
                                ? 'bg-stone-100 hover:bg-stone-200 text-zinc-700 border border-stone-300'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-850 border border-emerald-300 font-semibold'
                            }`}
                          >
                            {isJoined ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-700" />
                                <span>Joined</span>
                              </>
                            ) : (
                              <>
                                <Plus className="w-3 h-3" />
                                <span>Join</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          onSelectCommunity(comm.slug);
                          onClose();
                        }}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer shadow-xs ${
                          isCurrent
                            ? 'bg-emerald-850 text-white'
                            : 'bg-zinc-900 hover:bg-zinc-800 text-white'
                        }`}
                      >
                        <span>{isCurrent ? 'Current Campus' : 'Enter Campus'}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
