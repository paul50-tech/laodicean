import React, { useState } from 'react';
import { User, Sparkles, AlertCircle, Check } from 'lucide-react';
import { DEFAULT_AVATARS, formatPersonaName, updateProfile, validatePersonaName, validateRealName } from '../lib/auth';
import { Profile } from '../types';

interface OnboardingModalProps {
  profile: Profile;
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated: (updated: Profile) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  profile,
  isOpen,
  onClose,
  onProfileUpdated,
}) => {
  const [realName, setRealName] = useState(profile.real_name || '');
  const [enablePersona, setEnablePersona] = useState(Boolean(profile.persona_name));
  const [personaName, setPersonaName] = useState(profile.persona_name ? profile.persona_name.replace(/^@/, '') : '');
  const [selectedAvatar, setSelectedAvatar] = useState(profile.persona_avatar || DEFAULT_AVATARS[0].emoji);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const nameError = validateRealName(realName);
    if (nameError) {
      setError(nameError);
      return;
    }

    if (enablePersona) {
      const pError = validatePersonaName(personaName);
      if (pError) {
        setError(pError);
        return;
      }
    }

    setLoading(true);

    const finalPersonaName = enablePersona
      ? formatPersonaName(personaName)
      : profile.persona_name || `@juja_${profile.id.slice(0, 6)}`;

    const result = await updateProfile({
      userId: profile.id,
      realName: realName.trim(),
      personaName: finalPersonaName,
      personaAvatar: enablePersona ? selectedAvatar : profile.persona_avatar,
    });

    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    onProfileUpdated({
      ...profile,
      real_name: realName.trim(),
      persona_name: finalPersonaName,
      persona_avatar: enablePersona ? selectedAvatar : profile.persona_avatar,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        className="w-full max-w-md bg-[#FAF9F6] rounded-t-3xl sm:rounded-2xl border border-stone-200 p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="space-y-1.5 text-center">
          <div className="w-10 h-10 mx-auto rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center">
            <Sparkles className="w-5 h-5" aria-hidden="true" />
          </div>
          <h2 id="onboarding-title" className="font-display text-xl font-bold text-zinc-950">
            Customize Your Identity
          </h2>
          <p className="text-xs text-zinc-600 max-w-xs mx-auto">
            Choose your real display name, and optionally create a persona for campus mushene and confessions.
          </p>
        </div>

        {error && (
          <div role="alert" className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Real Display Name */}
          <div className="space-y-1">
            <label htmlFor="onboarding-real-name" className="block text-xs font-semibold text-zinc-800">
              Real Display Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
              <input
                id="onboarding-real-name"
                type="text"
                required
                value={realName}
                onChange={(e) => setRealName(e.target.value)}
                placeholder="e.g. Paul Jubilee"
                className="w-full h-11 pl-9 pr-3 rounded-xl border border-stone-300 bg-white text-sm text-zinc-900 focus:outline-none focus:border-emerald-800 focus:ring-1 focus:ring-emerald-800"
              />
            </div>
            <p className="text-[11px] text-zinc-500">
              Visible on your standard blog stories and verified announcements.
            </p>
          </div>

          {/* Optional Persona Toggle */}
          <div className="pt-2 border-t border-stone-200">
            <label className="flex items-center justify-between cursor-pointer py-1">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-zinc-900">Campus Persona</span>
                <p className="text-[11px] text-zinc-500">
                  Post anonymously in confessions and mushene
                </p>
              </div>
              <input
                type="checkbox"
                checked={enablePersona}
                onChange={(e) => setEnablePersona(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-800 focus:ring-emerald-800 border-stone-300 cursor-pointer"
              />
            </label>
          </div>

          {/* Persona fields (if enabled) */}
          {enablePersona && (
            <div className="space-y-3 p-3.5 bg-stone-100/70 border border-stone-200/80 rounded-xl animate-in slide-in-from-top-2 duration-150">
              <div className="space-y-1">
                <label htmlFor="onboarding-persona-name" className="block text-xs font-semibold text-zinc-800">
                  Persona Handle
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-zinc-400">@</span>
                  <input
                    id="onboarding-persona-name"
                    type="text"
                    value={personaName}
                    onChange={(e) => setPersonaName(e.target.value)}
                    placeholder="juja_falcon"
                    className="w-full h-10 pl-7 pr-3 rounded-lg border border-stone-300 bg-white text-sm text-zinc-900 font-mono focus:outline-none focus:border-emerald-800"
                  />
                </div>
              </div>

              {/* Simple Avatar Picker */}
              <div className="space-y-1.5">
                <span className="block text-[11px] font-semibold text-zinc-700">
                  Choose Persona Avatar
                </span>
                <div className="grid grid-cols-4 gap-2">
                  {DEFAULT_AVATARS.map((avatar) => {
                    const isSelected = selectedAvatar === avatar.emoji;
                    return (
                      <button
                        key={avatar.id}
                        type="button"
                        onClick={() => setSelectedAvatar(avatar.emoji)}
                        className={`min-h-[44px] flex flex-col items-center justify-center p-1.5 rounded-lg border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-50 border-emerald-700 shadow-xs ring-1 ring-emerald-700'
                            : 'bg-white border-stone-200 hover:border-stone-300'
                        }`}
                      >
                        <span className="text-xl" role="img" aria-label={avatar.label}>
                          {avatar.emoji}
                        </span>
                        <span className="text-[10px] text-zinc-600 font-medium">
                          {avatar.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white text-sm font-semibold transition-colors cursor-pointer inline-flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Saving Profile...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" aria-hidden="true" />
                  <span>Save & Continue</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
