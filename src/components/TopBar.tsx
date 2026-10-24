import React from 'react';
import { PenLine } from 'lucide-react';
import { AppRoute, CampusUser, PostType } from '../types/laodicean';

interface TopBarProps {
  route: AppRoute;
  activePostType: PostType | null;
  currentUser: CampusUser | null;
  onNavigateFeed: (communitySlug: string | null, postType?: PostType | null) => void;
  onNavigateCommunities: (focusRequestForm?: boolean) => void;
  onOpenComposer: () => void;
  onOpenAuth: () => void;
}

/**
 * Top navigation bar following the strict 3-zone Top Bar Contract on desktop
 * and a compact <=48px header on mobile to stay well within the 15% sticky height budget.
 */
export const TopBar: React.FC<TopBarProps> = ({
  route,
  activePostType,
  currentUser,
  onNavigateFeed,
  onNavigateCommunities,
  onOpenComposer,
  onOpenAuth,
}) => {
  const isFeedActive = route.view === 'feed' && activePostType === null;
  const isStoriesActive = route.view === 'feed' && activePostType === PostType.Story;
  const isCommunitiesActive = route.view === 'communities';

  return (
    <header className="sticky top-0 z-30 h-12 md:h-16 bg-[#FAF9F6]/92 backdrop-blur-md border-b border-stone-200/90">
      <div className="max-w-6xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            onNavigateFeed(null, null);
          }}
          className="font-display text-xl md:text-2xl font-bold tracking-tight text-zinc-900 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-800 rounded-sm"
        >
          Laodicean
        </a>

        {/* Zone 2: 4 concise single-line navigation links on desktop */}
        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-zinc-600"
        >
          <a
            href="/c/juja"
            onClick={(e) => {
              e.preventDefault();
              onNavigateFeed('juja', null);
            }}
            className={`py-1 whitespace-nowrap shrink-0 transition-colors border-b-2 ${
              isFeedActive
                ? 'text-zinc-950 border-emerald-700'
                : 'border-transparent hover:text-zinc-950 hover:border-stone-300'
            }`}
          >
            Juja Feed
          </a>
          <a
            href="/c/juja"
            onClick={(e) => {
              e.preventDefault();
              onNavigateFeed('juja', PostType.Story);
            }}
            className={`py-1 whitespace-nowrap shrink-0 transition-colors border-b-2 ${
              isStoriesActive
                ? 'text-zinc-950 border-emerald-700'
                : 'border-transparent hover:text-zinc-950 hover:border-stone-300'
            }`}
          >
            Stories
          </a>
          <a
            href="/communities"
            onClick={(e) => {
              e.preventDefault();
              onNavigateCommunities(false);
            }}
            className={`py-1 whitespace-nowrap shrink-0 transition-colors border-b-2 ${
              isCommunitiesActive
                ? 'text-zinc-950 border-emerald-700'
                : 'border-transparent hover:text-zinc-950 hover:border-stone-300'
            }`}
          >
            Communities
          </a>
          <button
            type="button"
            onClick={onOpenAuth}
            className="py-1 whitespace-nowrap shrink-0 text-zinc-600 hover:text-zinc-950 transition-colors cursor-pointer"
          >
            {currentUser ? currentUser.handle : 'Sign In'}
          </button>
        </nav>

        {/* Zone 3: 1 primary CTA action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onOpenComposer}
            className="min-h-[40px] md:min-h-[40px] px-4 py-2 rounded-lg bg-emerald-800 hover:bg-emerald-900 active:scale-[0.98] text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-2 transition-all whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
          >
            <PenLine className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Write Post</span>
          </button>
        </div>
      </div>
    </header>
  );
};
