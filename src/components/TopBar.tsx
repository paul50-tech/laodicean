import React from 'react';
import { User, Sparkles, ShieldAlert } from 'lucide-react';
import { Profile } from '../types';

interface TopBarProps {
  profile: Profile | null;
  userEmail?: string | null;
  onOpenAuth: () => void;
  onOpenProfile: () => void;
  onNavigateHome?: () => void;
  onOpenAdmin?: () => void;
}

/**
 * TopBar component for Laodicean.
 * Mobile-first header displaying the brand and user session state.
 */
export const TopBar: React.FC<TopBarProps> = ({
  profile,
  userEmail,
  onOpenAuth,
  onOpenProfile,
  onNavigateHome,
  onOpenAdmin,
}) => {
  const isAdmin =
    profile?.role === 'admin' ||
    userEmail === 'pauljubilee50@gmail.com';
  return (
    <header className="sticky top-0 z-30 w-full bg-[#FAF9F6]/95 backdrop-blur-md border-b border-stone-200">
      <div className="max-w-md md:max-w-xl mx-auto h-14 px-4 flex items-center justify-between">
        {/* Brand Zone */}
        <div className="flex items-center gap-2">
          <a
            href="/"
            onClick={(e) => {
              if (onNavigateHome) {
                e.preventDefault();
                onNavigateHome();
              }
            }}
            className="font-display text-2xl font-bold tracking-tight text-zinc-950 focus-visible:outline-2 focus-visible:outline-emerald-800 rounded-sm cursor-pointer hover:text-emerald-950 transition-colors"
          >
            Laodicean
          </a>
          <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full">
            Juja
          </span>
        </div>

        {/* User Session & Admin Action */}
        <div className="flex items-center gap-2">
          {isAdmin && onOpenAdmin && (
            <button
              type="button"
              onClick={onOpenAdmin}
              className="cursor-pointer min-h-[38px] px-2.5 py-1 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold inline-flex items-center gap-1.5 transition-colors shadow-2xs"
              title="Open Admin Moderation Deck & Persona Reveal"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
              <span>Admin Deck</span>
            </button>
          )}

          {profile ? (
            <button
              type="button"
              onClick={onOpenProfile}
              className="min-h-[44px] flex items-center gap-2 px-2.5 py-1 rounded-xl hover:bg-stone-200/60 transition-colors cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-100/80 border border-emerald-300 flex items-center justify-center text-sm shadow-2xs">
                {profile.persona_avatar || '🎓'}
              </div>
              <div className="text-left hidden sm:block leading-tight">
                <span className="block text-xs font-bold text-zinc-900 group-hover:text-emerald-900">
                  {profile.persona_name}
                </span>
                {profile.role === 'admin' && (
                  <span className="text-[10px] font-bold text-amber-700 inline-flex items-center gap-0.5">
                    <Sparkles className="w-2.5 h-2.5" />
                    Admin
                  </span>
                )}
              </div>
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="min-h-[44px] px-3.5 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <User className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
