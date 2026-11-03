import React, { useState } from 'react';
import { Profile } from '../types';
import { requestNewCommunity } from '../lib/communities';
import { Plus, X, Sparkles, CheckCircle2, Shield, Info, Palette } from 'lucide-react';

interface RequestCommunityModalProps {
  isOpen: boolean;
  currentUserProfile?: Profile | null;
  onClose: () => void;
  onRequestSubmitted?: () => void;
}

const COLOR_PRESETS = [
  { name: 'Emerald', primary: '#064e3b', accent: '#10b981' },
  { name: 'Royal Navy', primary: '#1e3a8a', accent: '#3b82f6' },
  { name: 'Terracotta', primary: '#9a3412', accent: '#f97316' },
  { name: 'Purple', primary: '#581c87', accent: '#a855f7' },
  { name: 'Crimson', primary: '#831843', accent: '#ec4899' },
  { name: 'Forest', primary: '#14532d', accent: '#22c55e' },
  { name: 'Teal', primary: '#134e4a', accent: '#14b8a6' },
  { name: 'Slate', primary: '#1e293b', accent: '#64748b' },
];

const EMOJI_PRESETS = ['🎓', '🏛️', '📚', '⚡', '🦅', '🦁', '🌾', '🌊', '🔬', '💡', '🏆', '🏕️'];

export function RequestCommunityModal({
  isOpen,
  currentUserProfile,
  onClose,
  onRequestSubmitted,
}: RequestCommunityModalProps) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLOR_PRESETS[0]);
  const [selectedEmoji, setSelectedEmoji] = useState(EMOJI_PRESETS[0]);
  const [requesterName, setRequesterName] = useState(
    currentUserProfile?.real_name || ''
  );
  const [rulesText, setRulesText] = useState(
    '1. Campus-first: Keep discussions relevant to our university.\n2. Respect privacy: No non-consensual personal photos.\n3. Zero cyberbullying or tribalism.\n4. Meme ethics: Good faith humor only.\n5. Event accuracy: Verify dates before posting.'
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  // Auto-generate slug when name changes if user hasn't manually edited slug
  const handleNameChange = (val: string) => {
    setName(val);
    const generated = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setSlug(generated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please enter your campus community name.');
      return;
    }
    if (!slug.trim()) {
      setError('Please enter a short URL identifier (slug).');
      return;
    }

    const rules = rulesText
      .split('\n')
      .map((r) => r.trim())
      .filter(Boolean);

    setLoading(true);
    try {
      const res = await requestNewCommunity({
        name: name.trim(),
        slug: slug.trim().toLowerCase(),
        tagline: tagline.trim() || undefined,
        description: description.trim() || undefined,
        color: selectedColor.primary,
        accent_color: selectedColor.accent,
        icon: selectedEmoji,
        rules,
        requester_name: requesterName.trim() || currentUserProfile?.real_name || 'Campus Member',
        requester_id: currentUserProfile?.id,
        requester_persona: currentUserProfile?.persona_name,
      });

      if (!res.success) {
        setError(res.error || 'Failed to submit community request.');
        return;
      }

      setSuccess(true);
      if (onRequestSubmitted) {
        onRequestSubmitted();
      }
    } catch (err: any) {
      setError(err?.message || 'Unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="request-modal-heading"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        className="w-full max-w-lg max-h-[92vh] bg-white rounded-3xl border border-stone-200/90 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-100 flex items-center justify-between shrink-0 bg-stone-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-800 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 id="request-modal-heading" className="font-display text-lg font-bold text-zinc-950">
                Request New Campus
              </h2>
              <p className="text-xs text-zinc-500">
                Launch a verified space for your university or satellite campus
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {success ? (
            <div className="py-8 text-center space-y-3.5">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="font-display text-xl font-bold text-zinc-950">
                Request Submitted for &quot;{name}&quot;!
              </h3>
              <p className="text-xs sm:text-sm text-zinc-600 max-w-md mx-auto leading-relaxed">
                Your campus proposal has been added to the Admin Approval queue.
                Once approved by the site admin, this community will go live and you will automatically become its official moderator with powers to manage campus rules and hide flagged posts.
              </p>
              <div className="p-3 bg-stone-50 border border-stone-200 rounded-2xl text-xs text-zinc-600 max-w-sm mx-auto text-left space-y-1">
                <p><strong>URL preview:</strong> <span className="font-mono text-emerald-800">/c/{slug}</span></p>
                <p><strong>Appointed Lead:</strong> {requesterName || 'You'}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="mt-4 px-6 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold shadow-xs cursor-pointer"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                  {error}
                </div>
              )}

              {/* Moderator perk callout */}
              <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200/70 flex items-start gap-2.5 text-xs text-amber-950">
                <Shield className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-semibold text-amber-900">Creator Moderator Status</p>
                  <p className="text-[11px] text-amber-800/90 leading-relaxed">
                    When your campus is approved by the admin, you will receive moderator badges and tools to customize campus rules, update taglines, and hide inappropriate posts.
                  </p>
                </div>
              </div>

              {/* Campus Name */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-zinc-800">
                  Campus Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Egerton University - Njoro Campus"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 text-xs text-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-700"
                />
              </div>

              {/* Slug */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-zinc-800">
                    URL Slug *
                  </label>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    /c/{slug || 'campus'}
                  </span>
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. egerton-njoro"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 text-xs font-mono text-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-700"
                />
              </div>

              {/* Tagline */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-zinc-800">
                  Campus Tagline
                </label>
                <input
                  type="text"
                  placeholder="e.g. Tatton farm vibes, engineering grinds & gate tales"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 text-xs text-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-700"
                />
              </div>

              {/* Visual Theme: Emoji & Color presets */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                {/* Emoji */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-800">
                    Campus Emoji Icon
                  </label>
                  <div className="flex flex-wrap gap-1.5 p-2 bg-stone-50 rounded-xl border border-stone-200">
                    {EMOJI_PRESETS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setSelectedEmoji(emoji)}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-base transition-all cursor-pointer ${
                          selectedEmoji === emoji
                            ? 'bg-white shadow-xs border border-emerald-600 ring-2 ring-emerald-500/30'
                            : 'hover:bg-white/80'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-800 flex items-center gap-1">
                    <Palette className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Theme Color ({selectedColor.name})</span>
                  </label>
                  <div className="flex flex-wrap gap-1.5 p-2 bg-stone-50 rounded-xl border border-stone-200">
                    {COLOR_PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => setSelectedColor(preset)}
                        className={`w-7 h-7 rounded-lg transition-all cursor-pointer border ${
                          selectedColor.name === preset.name
                            ? 'ring-2 ring-offset-1 ring-zinc-950 scale-110'
                            : 'opacity-80 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: preset.primary }}
                        title={preset.name}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Live Preview Box */}
              <div
                className="p-3.5 rounded-2xl text-white space-y-1 transition-colors"
                style={{
                  background: `linear-gradient(135deg, ${selectedColor.primary} 0%, ${selectedColor.accent} 100%)`,
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{selectedEmoji}</span>
                  <div className="min-w-0">
                    <p className="font-display text-xs font-bold truncate">
                      {name || 'Your Campus Community'}
                    </p>
                    <p className="text-[10px] text-white/80 font-mono">
                      /c/{slug || 'campus'}
                    </p>
                  </div>
                </div>
                <p className="text-[11px] text-white/90 italic truncate">
                  &quot;{tagline || 'Campus stories, memes & discussions'}&quot;
                </p>
              </div>

              {/* Initial Rules */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-zinc-800">
                  Campus Community Rules (One per line)
                </label>
                <textarea
                  rows={4}
                  value={rulesText}
                  onChange={(e) => setRulesText(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 text-xs text-zinc-900 leading-relaxed font-mono focus:outline-hidden focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-700"
                />
              </div>

              {/* Requester Identity */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-zinc-800">
                  Your Name / Contact Info
                </label>
                <input
                  type="text"
                  placeholder="e.g. Brian Otieno (3rd Year Rep)"
                  value={requesterName}
                  onChange={(e) => setRequesterName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 text-xs text-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-700"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-600 hover:bg-stone-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {loading ? 'Submitting...' : 'Submit Campus Request'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
