import React, { useState } from 'react';
import { Community, FeedPost, Profile } from '../types';
import { updateCommunityRules, updateCommunityDetails } from '../lib/communities';
import { togglePostStatus } from '../lib/moderation';
import {
  Shield,
  BookOpen,
  Palette,
  EyeOff,
  Eye,
  Check,
  X,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';

interface CommunityModToolsModalProps {
  isOpen: boolean;
  community: Community;
  currentUserProfile?: Profile | null;
  communityPosts: FeedPost[];
  onClose: () => void;
  onCommunityUpdated?: (updated: Community) => void;
  onPostStatusToggled?: (postId: string, newStatus: 'live' | 'hidden') => void;
}

export function CommunityModToolsModal({
  isOpen,
  community,
  currentUserProfile,
  communityPosts,
  onClose,
  onCommunityUpdated,
  onPostStatusToggled,
}: CommunityModToolsModalProps) {
  const [activeTab, setActiveTab] = useState<'rules' | 'appearance' | 'posts'>('rules');

  // Rules Tab state
  const [rulesText, setRulesText] = useState((community.rules || []).join('\n'));
  const [savingRules, setSavingRules] = useState(false);
  const [rulesSuccess, setRulesSuccess] = useState(false);

  // Appearance Tab state
  const [tagline, setTagline] = useState(community.tagline || '');
  const [description, setDescription] = useState(community.description || '');
  const [bannerUrl, setBannerUrl] = useState(community.banner_url || community.banner || '');
  const [color, setColor] = useState(community.color || '#064e3b');
  const [accentColor, setAccentColor] = useState(community.accent_color || '#10b981');
  const [savingDetails, setSavingDetails] = useState(false);
  const [detailsSuccess, setDetailsSuccess] = useState(false);

  // Posts Tab state
  const [localPosts, setLocalPosts] = useState<FeedPost[]>(communityPosts);
  const [updatingPostId, setUpdatingPostId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSaveRules = async () => {
    setSavingRules(true);
    setRulesSuccess(false);
    try {
      const parsedRules = rulesText
        .split('\n')
        .map((r) => r.trim())
        .filter(Boolean);

      const res = await updateCommunityRules(community.slug, parsedRules);
      if (res.success && res.community) {
        setRulesSuccess(true);
        if (onCommunityUpdated) onCommunityUpdated(res.community);
        setTimeout(() => setRulesSuccess(false), 2500);
      }
    } finally {
      setSavingRules(false);
    }
  };

  const handleSaveDetails = async () => {
    setSavingDetails(true);
    setDetailsSuccess(false);
    try {
      const res = await updateCommunityDetails(community.slug, {
        tagline: tagline.trim(),
        description: description.trim(),
        banner: bannerUrl.trim() || undefined,
        banner_url: bannerUrl.trim() || undefined,
        color,
        accent_color: accentColor,
      });
      if (res.success && res.community) {
        setDetailsSuccess(true);
        if (onCommunityUpdated) onCommunityUpdated(res.community);
        setTimeout(() => setDetailsSuccess(false), 2500);
      }
    } finally {
      setSavingDetails(false);
    }
  };

  const handleToggleHide = async (post: FeedPost) => {
    const nextStatus = post.status === 'hidden' ? 'live' : 'hidden';
    setUpdatingPostId(post.id);
    try {
      await togglePostStatus(post.id, nextStatus);
      setLocalPosts((prev) =>
        prev.map((p) => (p.id === post.id ? { ...p, status: nextStatus } : p))
      );
      if (onPostStatusToggled) {
        onPostStatusToggled(post.id, nextStatus);
      }
    } finally {
      setUpdatingPostId(null);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="mod-tools-heading"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        className="w-full max-w-xl max-h-[92vh] bg-white rounded-3xl border border-stone-200/90 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-100 flex items-center justify-between shrink-0 bg-stone-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="mod-tools-heading" className="font-display text-lg font-bold text-zinc-950">
                  Moderator Tools
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                  {community.name}
                </span>
              </div>
              <p className="text-xs text-zinc-500">
                Manage community guidelines, customize appearance, and moderate posts
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-stone-200/60 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-stone-200 bg-white px-4 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('rules')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'rules'
                ? 'border-emerald-800 text-emerald-900'
                : 'border-transparent text-zinc-500 hover:text-zinc-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Community Rules</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('appearance')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'appearance'
                ? 'border-emerald-800 text-emerald-900'
                : 'border-transparent text-zinc-500 hover:text-zinc-900'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Appearance & Info</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('posts')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'posts'
                ? 'border-emerald-800 text-emerald-900'
                : 'border-transparent text-zinc-500 hover:text-zinc-900'
            }`}
          >
            <EyeOff className="w-3.5 h-3.5" />
            <span>Post Moderation ({localPosts.length})</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* TAB 1: RULES */}
          {activeTab === 'rules' && (
            <div className="space-y-4">
              <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/70 text-xs text-emerald-950 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <p>
                  Set clear, campus-specific rules for <strong>{community.name}</strong>. Members will see these rules when browsing, creating posts, and in the rules popup.
                </p>
              </div>

              {rulesSuccess && (
                <div className="p-3 rounded-xl bg-emerald-100 text-emerald-900 text-xs font-medium flex items-center gap-1.5 border border-emerald-300">
                  <Check className="w-4 h-4" />
                  <span>Community rules updated successfully!</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-800">
                  Campus Rules (One rule per line)
                </label>
                <textarea
                  rows={8}
                  value={rulesText}
                  onChange={(e) => setRulesText(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 text-xs font-mono text-zinc-900 leading-relaxed focus:outline-hidden focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-700"
                  placeholder="1. Campus-first: Keep stories relevant to our students..."
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  disabled={savingRules}
                  onClick={handleSaveRules}
                  className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{savingRules ? 'Saving...' : 'Save Rules'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: APPEARANCE */}
          {activeTab === 'appearance' && (
            <div className="space-y-4">
              {detailsSuccess && (
                <div className="p-3 rounded-xl bg-emerald-100 text-emerald-900 text-xs font-medium flex items-center gap-1.5 border border-emerald-300">
                  <Check className="w-4 h-4" />
                  <span>Community details updated successfully!</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-zinc-800">
                  Campus Tagline
                </label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="Short, catchy motto or description"
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-stone-200 text-xs text-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-700"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-zinc-800">
                  About / Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell students what this community is all about"
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-stone-200 text-xs text-zinc-900 leading-relaxed focus:outline-hidden focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-zinc-800">
                    Primary Brand Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="w-9 h-9 rounded-lg border border-stone-200 cursor-pointer p-0.5"
                    />
                    <input
                      type="text"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg border border-stone-200 text-xs font-mono uppercase"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-zinc-800">
                    Accent Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="w-9 h-9 rounded-lg border border-stone-200 cursor-pointer p-0.5"
                    />
                    <input
                      type="text"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg border border-stone-200 text-xs font-mono uppercase"
                    />
                  </div>
                </div>
              </div>

              {/* Preview Banner */}
              <div className="space-y-1 pt-1">
                <label className="block text-xs font-semibold text-zinc-800">
                  Live Banner Preview
                </label>
                <div
                  className="h-16 rounded-xl flex items-center px-4 text-white font-display text-sm font-bold shadow-xs"
                  style={{
                    background: `linear-gradient(135deg, ${color} 0%, ${accentColor} 100%)`,
                  }}
                >
                  <span className="text-xl mr-2">{community.icon || '🎓'}</span>
                  <span>{community.name}</span>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  disabled={savingDetails}
                  onClick={handleSaveDetails}
                  className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{savingDetails ? 'Saving...' : 'Save Appearance'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: POSTS MODERATION */}
          {activeTab === 'posts' && (
            <div className="space-y-3">
              <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200/70 text-xs text-amber-950 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <p>
                  As a moderator of <strong>{community.name}</strong>, you can hide posts that violate community guidelines or restore hidden posts.
                </p>
              </div>

              {localPosts.length === 0 ? (
                <div className="py-8 text-center text-xs text-zinc-500">
                  No posts found in this community yet.
                </div>
              ) : (
                localPosts.map((post) => {
                  const isHidden = post.status === 'hidden';
                  const isUpdating = updatingPostId === post.id;

                  return (
                    <div
                      key={post.id}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        isHidden
                          ? 'bg-stone-100/80 border-stone-300 opacity-75'
                          : 'bg-white border-stone-200/90 shadow-xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                            <span className="font-semibold text-zinc-800">
                              {post.is_persona ? post.persona_name : post.author_real_name || 'Anonymous'}
                            </span>
                            <span className="text-zinc-400">•</span>
                            <span className="uppercase text-[9px] font-bold px-1.5 py-0.2 rounded bg-stone-100 text-zinc-600">
                              {post.post_type}
                            </span>
                            {isHidden && (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-red-100 text-red-800 border border-red-200">
                                Hidden
                              </span>
                            )}
                          </div>

                          {post.title && (
                            <h4 className="text-xs font-bold text-zinc-950 line-clamp-1">
                              {post.title}
                            </h4>
                          )}
                          <p className="text-xs text-zinc-600 line-clamp-2 leading-relaxed">
                            {post.body}
                          </p>
                        </div>

                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() => handleToggleHide(post)}
                          className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer shadow-xs ${
                            isHidden
                              ? 'bg-emerald-800 hover:bg-emerald-900 text-white'
                              : 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'
                          }`}
                        >
                          {isHidden ? (
                            <>
                              <Eye className="w-3.5 h-3.5" />
                              <span>Unhide</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3.5 h-3.5" />
                              <span>Hide Post</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
