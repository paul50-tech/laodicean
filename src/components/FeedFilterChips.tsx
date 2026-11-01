import React from 'react';
import { FeedFilter } from '../types';
import { Flame, MessageCircle, HelpCircle, FileText, Image as ImageIcon, Sparkles } from 'lucide-react';

interface FeedFilterChipsProps {
  currentFilter: FeedFilter;
  onSelectFilter: (filter: FeedFilter) => void;
  counts?: Partial<Record<FeedFilter, number>>;
}

interface FilterChipConfig {
  id: FeedFilter;
  label: string;
  icon?: React.ReactNode;
  emoji?: string;
}

const CHIPS: FilterChipConfig[] = [
  { id: 'all', label: 'All', emoji: '✨' },
  { id: 'mushene', label: 'Mushene', emoji: '🗣️' },
  { id: 'event', label: 'Events', emoji: '📅' },
  { id: 'poll', label: 'Polls', emoji: '📊' },
  { id: 'confession', label: 'Confessions', emoji: '🤫' },
  { id: 'meme', label: 'Memes', emoji: '😂' },
  { id: 'story', label: 'Stories', emoji: '📝' },
  { id: 'photo', label: 'Photos', emoji: '📸' },
];

export function FeedFilterChips({
  currentFilter,
  onSelectFilter,
}: FeedFilterChipsProps) {
  return (
    <div
      role="toolbar"
      aria-label="Filter Juja feed by post type"
      className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 -mx-1 px-1"
    >
      {CHIPS.map((chip) => {
        const isActive = currentFilter === chip.id;
        return (
          <button
            key={chip.id}
            type="button"
            onClick={() => onSelectFilter(chip.id)}
            aria-pressed={isActive}
            className={`cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 select-none ${
              isActive
                ? 'bg-emerald-800 text-white shadow-xs font-semibold'
                : 'bg-white border border-stone-200/90 text-stone-700 hover:bg-stone-100 hover:text-stone-900'
            }`}
          >
            <span className="text-xs" aria-hidden="true">
              {chip.emoji}
            </span>
            <span>{chip.label}</span>
          </button>
        );
      })}
    </div>
  );
}
