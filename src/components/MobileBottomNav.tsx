import React from 'react';
import { Compass, Home, PenSquare, User } from 'lucide-react';
import { AppRoute, CampusUser } from '../types/laodicean';

interface MobileBottomNavProps {
  route: AppRoute;
  currentUser: CampusUser | null;
  onNavigateFeed: () => void;
  onOpenComposer: () => void;
  onNavigateCommunities: () => void;
  onOpenAuth: () => void;
}

/**
 * Ergonomic thumb-zone bottom bar for smartphone viewports (< md).
 * Height is 56px (h-14); combined with the 48px mobile TopBar = 104px (<12.5% of 844px screen).
 */
export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  route,
  currentUser,
  onNavigateFeed,
  onOpenComposer,
  onNavigateCommunities,
  onOpenAuth,
}) => {
  const isFeed = route.view === 'feed' || route.view === 'post';
  const isCommunities = route.view === 'communities';

  return (
    <nav
      aria-label="Mobile bottom navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 h-14 bg-[#FAF9F6]/95 backdrop-blur-md border-t border-stone-200"
    >
      <div className="grid grid-cols-4 h-full max-w-lg mx-auto">
        <button
          type="button"
          onClick={onNavigateFeed}
          className={`min-h-[44px] flex flex-col items-center justify-center transition-colors cursor-pointer ${
            isFeed ? 'text-emerald-800 font-semibold' : 'text-zinc-600 hover:text-zinc-900'
          }`}
        >
          <Home className="w-5 h-5" aria-hidden="true" />
          <span className="text-[11px] leading-tight mt-0.5 whitespace-nowrap">Juja Feed</span>
        </button>

        <button
          type="button"
          onClick={onOpenComposer}
          className="min-h-[44px] flex flex-col items-center justify-center text-zinc-600 hover:text-zinc-900 transition-colors cursor-pointer"
        >
          <PenSquare className="w-5 h-5" aria-hidden="true" />
          <span className="text-[11px] leading-tight mt-0.5 whitespace-nowrap">Write</span>
        </button>

        <button
          type="button"
          onClick={onNavigateCommunities}
          className={`min-h-[44px] flex flex-col items-center justify-center transition-colors cursor-pointer ${
            isCommunities ? 'text-emerald-800 font-semibold' : 'text-zinc-600 hover:text-zinc-900'
          }`}
        >
          <Compass className="w-5 h-5" aria-hidden="true" />
          <span className="text-[11px] leading-tight mt-0.5 whitespace-nowrap">Communities</span>
        </button>

        <button
          type="button"
          onClick={onOpenAuth}
          className="min-h-[44px] flex flex-col items-center justify-center text-zinc-600 hover:text-zinc-900 transition-colors cursor-pointer"
        >
          <User className="w-5 h-5" aria-hidden="true" />
          <span className="text-[11px] leading-tight mt-0.5 truncate max-w-[76px]">
            {currentUser ? currentUser.handle : 'Sign In'}
          </span>
        </button>
      </div>
    </nav>
  );
};
