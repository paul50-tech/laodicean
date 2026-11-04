import React, { useState, useRef, useEffect } from 'react';
import { FeedFilter } from '../types';
import { ChevronDown, Check } from 'lucide-react';

interface FeedFilterChipsProps {
  currentFilter: FeedFilter;
  onSelectFilter: (filter: FeedFilter) => void;
  counts?: Partial<Record<FeedFilter, number>>;
}

interface FilterTabConfig {
  id: FeedFilter;
  label: string;
  emoji?: string;
}

const PRIMARY_TABS: FilterTabConfig[] = [
  { id: 'all', label: 'For You', emoji: '✨' },
  { id: 'mushene', label: 'Mushene', emoji: '🗣️' },
  { id: 'ask_juja', label: 'Ask Juja', emoji: '❓' },
  { id: 'poll', label: 'Polls', emoji: '📊' },
  { id: 'meme', label: 'Memes', emoji: '😂' },
];

const SECONDARY_OPTIONS: FilterTabConfig[] = [
  { id: 'event', label: 'Events & Expos', emoji: '📅' },
  { id: 'confession', label: 'Campus Confessions', emoji: '🤫' },
  { id: 'story', label: 'Deep Stories', emoji: '📝' },
  { id: 'photo', label: 'Photo Moments', emoji: '📸' },
];

/**
 * Standard Feed Filter Tabs adhering to Jakob's Law of Internet UX.
 * Mimics familiar Twitter / Reddit tab navigation:
 * High-frequency categories as direct tabs, secondary tags in a clean 'More' dropdown.
 */
export function FeedFilterChips({
  currentFilter,
  onSelectFilter,
}: FeedFilterChipsProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const activeSecondary = SECONDARY_OPTIONS.find((opt) => opt.id === currentFilter);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  return (
    <div
      role="tablist"
      aria-label="Feed filter tabs"
      className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 -mx-1 px-1 border-b border-stone-200/80 pb-2.5"
    >
      {PRIMARY_TABS.map((tab) => {
        const isActive = currentFilter === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            type="button"
            onClick={() => onSelectFilter(tab.id)}
            className={`cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all shrink-0 select-none ${
              isActive
                ? 'bg-emerald-800 text-white font-bold shadow-xs'
                : 'bg-stone-100 hover:bg-stone-200/70 text-stone-700 font-medium'
            }`}
          >
            <span className="text-xs" aria-hidden="true">
              {tab.emoji}
            </span>
            <span>{tab.label}</span>
          </button>
        );
      })}

      {/* 'More' Filter Dropdown for Events, Confessions, Stories & Photos */}
      <div className="relative shrink-0" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          aria-expanded={dropdownOpen}
          className={`cursor-pointer inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs transition-all select-none ${
            activeSecondary
              ? 'bg-emerald-800 text-white font-bold shadow-xs'
              : 'bg-stone-100 hover:bg-stone-200/70 text-stone-700 font-medium'
          }`}
        >
          {activeSecondary ? (
            <>
              <span>{activeSecondary.emoji}</span>
              <span>{activeSecondary.label}</span>
            </>
          ) : (
            <span>More</span>
          )}
          <ChevronDown className="w-3 h-3 shrink-0" />
        </button>

        {dropdownOpen && (
          <div
            role="menu"
            className="absolute left-0 mt-1.5 w-48 bg-white rounded-2xl shadow-lg border border-stone-200/90 py-1.5 z-40 animate-in fade-in zoom-in-95 duration-100"
          >
            {SECONDARY_OPTIONS.map((opt) => {
              const isOptionActive = currentFilter === opt.id;
              return (
                <button
                  key={opt.id}
                  role="menuitem"
                  type="button"
                  onClick={() => {
                    onSelectFilter(opt.id);
                    setDropdownOpen(false);
                  }}
                  className="cursor-pointer w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-stone-50 transition-colors"
                >
                  <span className="flex items-center gap-2 text-stone-800">
                    <span>{opt.emoji}</span>
                    <span className={isOptionActive ? 'font-bold text-emerald-900' : 'font-normal'}>
                      {opt.label}
                    </span>
                  </span>
                  {isOptionActive && <Check className="w-3.5 h-3.5 text-emerald-800" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
