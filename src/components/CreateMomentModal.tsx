import React, { useState } from 'react';
import { X, Sparkles, Clock, Check, Send } from 'lucide-react';
import { MusheneMoment, Profile } from '../types';
import {
  MOMENT_GRADIENTS,
  createMusheneMoment,
  addLocalMoment,
  validateMomentInput,
} from '../lib/moments';

interface CreateMomentModalProps {
  isOpen: boolean;
  currentUserProfile?: Profile | null;
  onClose: () => void;
  onMomentCreated?: (moment: MusheneMoment) => void;
  onRequireAuth?: (message: string) => void;
}

const CAMPUS_TAGS = ['Gate A', 'Gate C', 'Hostels', 'Tech Park', 'Library', 'Stage', 'Mess'];

export function CreateMomentModal({
  isOpen,
  currentUserProfile,
  onClose,
  onMomentCreated,
  onRequireAuth,
}: CreateMomentModalProps) {
  const [text, setText] = useState('');
  const [selectedTag, setSelectedTag] = useState(CAMPUS_TAGS[0]);
  const [selectedGradient, setSelectedGradient] = useState(MOMENT_GRADIENTS[0]);
  const [postAsPersona, setPostAsPersona] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentUserProfile) {
      if (onRequireAuth) {
        onRequireAuth('Sign in with your campus account to share a 24-hour Mushene moment!');
      }
      return;
    }

    const validation = validateMomentInput(text);
    if (!validation.isValid) {
      setError(validation.error);
      return;
    }

    setSubmitting(true);
    try {
      const isPersona = postAsPersona && Boolean(currentUserProfile.persona_name);
      const authorName = isPersona
        ? currentUserProfile.persona_name
        : currentUserProfile.real_name || 'Campus Member';
      const authorAvatar = isPersona
        ? currentUserProfile.persona_avatar || '🗣️'
        : '👤';

      const moment = createMusheneMoment({
        authorId: currentUserProfile.id,
        authorName,
        authorAvatar,
        isPersona,
        authorRealName: currentUserProfile.real_name,
        text,
        tag: selectedTag,
        bgGradient: selectedGradient,
      });

      addLocalMoment(moment);
      if (onMomentCreated) {
        onMomentCreated(moment);
      }

      setText('');
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to publish moment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-moment-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-4"
    >
      <div className="relative w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl bg-white border border-stone-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚡</span>
            <div>
              <h3 id="create-moment-title" className="font-display text-sm font-bold text-zinc-950">
                New Mushene Moment
              </h3>
              <p className="text-[11px] text-zinc-400">
                Disappears in 24 hours • Live campus story
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-600 hover:bg-stone-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Card Preview */}
        <div className="p-4 bg-stone-50 border-b border-stone-100">
          <div
            className={`w-full h-36 rounded-2xl p-4 flex flex-col justify-between text-white shadow-inner bg-gradient-to-br ${selectedGradient} transition-all`}
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold flex items-center gap-1.5 drop-shadow-xs">
                <span>{postAsPersona ? currentUserProfile?.persona_avatar || '🗣️' : '👤'}</span>
                <span>
                  {postAsPersona
                    ? currentUserProfile?.persona_name || '@your_persona'
                    : currentUserProfile?.real_name || 'Your Name'}
                </span>
              </span>
              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-xs font-semibold">
                {selectedTag}
              </span>
            </div>

            <p className="font-display text-sm font-bold leading-snug line-clamp-3 text-center drop-shadow-xs">
              {text.trim() ? text : 'What street tea is brewing in Juja right now?...'}
            </p>

            <div className="flex items-center justify-between text-[10px] text-white/80">
              <span className="inline-flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" />
                <span>24h Left</span>
              </span>
              <span>Juja Street Flash</span>
            </div>
          </div>
        </div>

        {/* Form controls */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3.5 overflow-y-auto">
          {error && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Text Input */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-zinc-600 uppercase tracking-wider">
                Moment Text
              </label>
              <span
                className={`text-[10px] font-mono ${
                  text.length > 250 ? 'text-amber-600 font-bold' : 'text-zinc-400'
                }`}
              >
                {text.length}/280
              </span>
            </div>
            <textarea
              rows={3}
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={280}
              placeholder="e.g. Chapo prices dropped at Gate C, or power just came back in Hall 2!"
              className="w-full text-xs p-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800 resize-none bg-stone-50/50"
            />
          </div>

          {/* Location / Campus Tag */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-zinc-600 uppercase tracking-wider">
              Campus Spot
            </label>
            <div className="flex flex-wrap gap-1.5">
              {CAMPUS_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSelectedTag(tag)}
                  className={`cursor-pointer px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                    selectedTag === tag
                      ? 'bg-emerald-800 text-white border-emerald-800 shadow-2xs'
                      : 'bg-white text-zinc-600 border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Color Gradient Theme Picker */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-zinc-600 uppercase tracking-wider">
              Color Style
            </label>
            <div className="flex items-center gap-2">
              {MOMENT_GRADIENTS.map((gradient, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedGradient(gradient)}
                  className={`cursor-pointer w-7 h-7 rounded-full bg-gradient-to-br ${gradient} border transition-all flex items-center justify-center ${
                    selectedGradient === gradient
                      ? 'ring-2 ring-emerald-800 ring-offset-1 scale-110'
                      : 'border-white/50 opacity-80 hover:opacity-100'
                  }`}
                >
                  {selectedGradient === gradient && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Persona Toggle */}
          {currentUserProfile?.persona_name && (
            <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
              <span className="text-xs text-zinc-700 font-medium">
                Post as {currentUserProfile.persona_name}
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={postAsPersona}
                  onChange={(e) => setPostAsPersona(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-800"></div>
              </label>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || !text.trim()}
            className="cursor-pointer w-full py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 shadow-xs transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Publish 24h Moment</span>
          </button>
        </form>
      </div>
    </div>
  );
}
