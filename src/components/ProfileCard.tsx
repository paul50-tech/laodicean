import React from 'react';
import { ShieldCheck, Edit3, LogOut, Sparkles, UserCheck } from 'lucide-react';
import { Profile } from '../types';

interface ProfileCardProps {
  profile: Profile;
  userEmail?: string | null;
  onEditPersona: () => void;
  onSignOut: () => void;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({
  profile,
  userEmail,
  onEditPersona,
  onSignOut,
}) => {
  const isAdmin = profile.role === 'admin';
  const displayName =
    isAdmin || /paul\s*jubilee/i.test(profile.real_name) || profile.real_name === 'pauljubilee50'
      ? 'Campus Administrator'
      : profile.real_name;

  const displayEmail =
    userEmail && !/pauljubilee/i.test(userEmail)
      ? userEmail
      : isAdmin
      ? 'Moderator Account'
      : null;

  return (
    <div className="bg-white border border-stone-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
      {/* Top Banner / Avatar Lockup */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-2xl shrink-0 shadow-2xs">
            {profile.persona_avatar || '🎓'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-lg font-bold text-zinc-950">
                {displayName}
              </h2>
            </div>
            <p className="text-xs font-mono font-medium text-emerald-800">
              {profile.persona_name}
            </p>
            {displayEmail && (
              <p className="text-[11px] text-zinc-400 mt-0.5 truncate max-w-[200px]">
                {displayEmail}
              </p>
            )}
          </div>
        </div>

        {/* Role Badge */}
        {isAdmin ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-amber-700" aria-hidden="true" />
            <span>Admin</span>
          </span>
        ) : profile.role === 'moderator' ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200 shrink-0">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-700" aria-hidden="true" />
            <span>Moderator</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-stone-100 text-zinc-700 shrink-0">
            <UserCheck className="w-3.5 h-3.5 text-zinc-500" aria-hidden="true" />
            <span>Member</span>
          </span>
        )}
      </div>

      {/* Admin Privileges Explanation */}
      {isAdmin && (
        <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-950 space-y-1">
          <p className="font-bold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-amber-800" aria-hidden="true" />
            <span>Admin Privileges Active</span>
          </p>
          <p className="text-[11px] leading-relaxed text-amber-900">
            As an admin, you can view the real identity behind all persona posts, approve/reject community requests, and moderate flagged campus reports.
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-stone-100">
        <button
          type="button"
          onClick={onEditPersona}
          className="min-h-[44px] px-3 py-2 rounded-xl border border-stone-300 hover:border-zinc-900 text-zinc-800 text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <Edit3 className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Edit Persona</span>
        </button>

        <button
          type="button"
          onClick={onSignOut}
          className="min-h-[44px] px-3 py-2 rounded-xl border border-stone-200 hover:border-red-300 hover:bg-red-50 hover:text-red-700 text-zinc-600 text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};
