import React from 'react';
import { Home, Compass, Plus, Shield, User } from 'lucide-react';
import { Profile } from '../types';

interface BottomNavBarProps {
  profile: Profile | null;
  onNavigateHome: () => void;
  onOpenDiscover: () => void;
  onOpenComposer: () => void;
  onOpenAbout: () => void;
  onOpenProfile: () => void;
  onOpenAuth: () => void;
}

/**
 * Mobile Bottom Navigation Bar adhering to Jakob's Law of Internet UX.
 * Replicates the standard 5-tab mobile navigation pattern from Instagram, Twitter, and Reddit,
 * placing high-frequency thumb controls at the bottom of the viewport.
 */
export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  profile,
  onNavigateHome,
  onOpenDiscover,
  onOpenComposer,
  onOpenAbout,
  onOpenProfile,
  onOpenAuth,
}) => {
  return (
    <nav
      aria-label="Mobile navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FAF9F6]/95 backdrop-blur-md border-t border-stone-200 px-3 py-1.5 flex items-center justify-around safe-area-bottom shadow-lg"
    >
      {/* 1. Home / Feed */}
      <button
        type="button"
        onClick={onNavigateHome}
        className="cursor-pointer flex flex-col items-center justify-center p-1.5 text-stone-600 hover:text-emerald-800 transition-colors min-w-[56px] min-h-[44px]"
        title="Home Feed"
      >
        <Home className="w-5 h-5 text-emerald-800" />
        <span className="text-[10px] font-semibold mt-0.5 text-zinc-900">Feed</span>
      </button>

      {/* 2. Discover Communities */}
      <button
        type="button"
        onClick={onOpenDiscover}
        className="cursor-pointer flex flex-col items-center justify-center p-1.5 text-stone-600 hover:text-emerald-800 transition-colors min-w-[56px] min-h-[44px]"
        title="Discover Campus Communities"
      >
        <Compass className="w-5 h-5" />
        <span className="text-[10px] font-medium mt-0.5">Campuses</span>
      </button>

      {/* 3. Center Highlighted + Post Button */}
      <button
        type="button"
        onClick={onOpenComposer}
        className="cursor-pointer -mt-4 w-12 h-12 rounded-full bg-emerald-800 hover:bg-emerald-900 text-white flex items-center justify-center shadow-md active:scale-95 transition-all"
        title="Create Post"
      >
        <Plus className="w-6 h-6 stroke-[2.5]" />
      </button>

      {/* 4. Rules & Safety */}
      <button
        type="button"
        onClick={onOpenAbout}
        className="cursor-pointer flex flex-col items-center justify-center p-1.5 text-stone-600 hover:text-emerald-800 transition-colors min-w-[56px] min-h-[44px]"
        title="5 Golden Rules & Safety"
      >
        <Shield className="w-5 h-5 text-emerald-800" />
        <span className="text-[10px] font-medium mt-0.5">Rules</span>
      </button>

      {/* 5. Profile or Sign In */}
      {profile ? (
        <button
          type="button"
          onClick={onOpenProfile}
          className="cursor-pointer flex flex-col items-center justify-center p-1.5 text-stone-600 hover:text-emerald-800 transition-colors min-w-[56px] min-h-[44px]"
          title="Profile & Personas"
        >
          <div className="w-5 h-5 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-xs">
            {profile.persona_avatar || '🎓'}
          </div>
          <span className="text-[10px] font-medium mt-0.5 truncate max-w-[50px]">
            {profile.persona_name || 'Profile'}
          </span>
        </button>
      ) : (
        <button
          type="button"
          onClick={onOpenAuth}
          className="cursor-pointer flex flex-col items-center justify-center p-1.5 text-stone-600 hover:text-emerald-800 transition-colors min-w-[56px] min-h-[44px]"
          title="Sign In"
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-0.5">Sign In</span>
        </button>
      )}
    </nav>
  );
};
