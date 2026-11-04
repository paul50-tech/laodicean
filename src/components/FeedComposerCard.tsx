import React from 'react';
import { Profile, Community, PostType } from '../types';
import { Image as ImageIcon, BarChart2, HelpCircle, Flame } from 'lucide-react';

interface FeedComposerCardProps {
  currentUserProfile?: Profile | null;
  activeCommunity?: Community | null;
  onOpenComposer: (initialType?: PostType) => void;
  onOpenMemeStudio?: () => void;
}

/**
 * Standard Feed Composer Card ("What's on your mind?")
 * Conforms to Jakob's Law of Internet UX (universal social pattern on Reddit, Twitter, Facebook, LinkedIn).
 * Provides a familiar 1-tap entry point with direct attachment shortcuts.
 */
export const FeedComposerCard: React.FC<FeedComposerCardProps> = ({
  currentUserProfile,
  activeCommunity,
  onOpenComposer,
  onOpenMemeStudio,
}) => {
  const commName = activeCommunity?.name || 'Juja';

  return (
    <div className="bg-white border border-stone-200/90 rounded-2xl p-3 sm:p-4 shadow-xs space-y-3">
      {/* Top Input Prompt */}
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-full bg-emerald-100/80 border border-emerald-300 flex items-center justify-center text-sm shrink-0 shadow-2xs">
          {currentUserProfile?.persona_avatar || '🎓'}
        </div>

        <button
          type="button"
          onClick={() => onOpenComposer()}
          className="cursor-pointer flex-1 text-left px-3.5 py-2 rounded-full bg-stone-100 hover:bg-stone-200/70 border border-transparent hover:border-stone-200 text-stone-500 hover:text-stone-700 text-xs sm:text-sm font-normal transition-all"
        >
          <span>What's happening in {commName}? Share news, ask, or meme...</span>
        </button>
      </div>

      {/* Quick Attachment Triggers (Familiar Social Pattern) */}
      <div className="pt-2 border-t border-stone-100 grid grid-cols-4 gap-1 sm:gap-2">
        {/* Photo / Meme */}
        <button
          type="button"
          onClick={() => {
            if (onOpenMemeStudio) {
              onOpenMemeStudio();
            } else {
              onOpenComposer('meme');
            }
          }}
          className="cursor-pointer min-h-[38px] flex items-center justify-center gap-1 sm:gap-1.5 px-1 py-1.5 rounded-xl hover:bg-stone-100 text-stone-700 transition-colors text-[11px] sm:text-xs font-semibold"
          title="Create or post a campus meme"
        >
          <span className="text-sm">😂</span>
          <span className="hidden xs:inline">Meme</span>
        </button>

        {/* Campus Poll */}
        <button
          type="button"
          onClick={() => onOpenComposer('poll')}
          className="cursor-pointer min-h-[38px] flex items-center justify-center gap-1 sm:gap-1.5 px-1 py-1.5 rounded-xl hover:bg-stone-100 text-stone-700 transition-colors text-[11px] sm:text-xs font-semibold"
          title="Start a campus poll"
        >
          <BarChart2 className="w-3.5 h-3.5 text-blue-600" />
          <span className="hidden xs:inline">Poll</span>
        </button>

        {/* Ask Juja Question */}
        <button
          type="button"
          onClick={() => onOpenComposer('ask_juja')}
          className="cursor-pointer min-h-[38px] flex items-center justify-center gap-1 sm:gap-1.5 px-1 py-1.5 rounded-xl hover:bg-stone-100 text-stone-700 transition-colors text-[11px] sm:text-xs font-semibold"
          title="Ask a campus question"
        >
          <HelpCircle className="w-3.5 h-3.5 text-cyan-600" />
          <span className="hidden xs:inline">Question</span>
        </button>

        {/* Juja Street Mushene */}
        <button
          type="button"
          onClick={() => onOpenComposer('mushene')}
          className="cursor-pointer min-h-[38px] flex items-center justify-center gap-1 sm:gap-1.5 px-1 py-1.5 rounded-xl hover:bg-stone-100 text-stone-700 transition-colors text-[11px] sm:text-xs font-semibold"
          title="Drop anonymous street mushene"
        >
          <Flame className="w-3.5 h-3.5 text-rose-600" />
          <span className="hidden xs:inline">Mushene</span>
        </button>
      </div>
    </div>
  );
};
