import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  X,
  Plus,
  Shield,
  ShieldAlert,
  Sparkles,
  User,
  LogOut,
  Compass,
  ChevronDown,
  FileText,
  UserCheck,
} from 'lucide-react';
import { Profile, Community } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

export interface TopBarProps {
  profile: Profile | null;
  userEmail?: string | null;
  activeCommunity?: Community | null;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onOpenAuth: () => void;
  onOpenProfile: () => void;
  onNavigateHome?: () => void;
  onOpenAdmin?: () => void;
  onOpenAbout?: () => void;
  onOpenComposer?: () => void;
  onOpenDiscover?: () => void;
  onSignOut?: () => void;
}

/**
 * TopBar component designed according to Jakob's Law of Internet UX.
 * Implements familiar global navigation patterns from standard social platforms:
 * - Brand + Community switcher on left
 * - Omnipresent central search bar with '/' keyboard shortcut and instant clear
 * - Familiar primary "+ New Post" button
 * - Rules / About and Admin actions
 * - Standard user profile dropdown menu with avatar, persona switch, and sign out
 */
export const TopBar: React.FC<TopBarProps> = ({
  profile,
  userEmail,
  activeCommunity,
  searchQuery = '',
  onSearchChange,
  onOpenAuth,
  onOpenProfile,
  onNavigateHome,
  onOpenAdmin,
  onOpenAbout,
  onOpenComposer,
  onOpenDiscover,
  onSignOut,
}) => {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const isAdmin =
    profile?.role === 'admin' ||
    userEmail === 'pauljubilee50@gmail.com';

  const communityName = activeCommunity?.name || 'Juja';

  // Jakob's Law keyboard convention: '/' to search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        setMobileSearchOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 50);
      } else if (e.key === 'Escape') {
        if (profileMenuOpen) setProfileMenuOpen(false);
        if (mobileSearchOpen && !searchQuery) setMobileSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [profileMenuOpen, mobileSearchOpen, searchQuery]);

  // Click outside to close profile dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    if (profileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [profileMenuOpen]);

  return (
    <header className="sticky top-0 z-30 w-full bg-[#FAF9F6]/95 backdrop-blur-md border-b border-stone-200">
      <div className="max-w-6xl mx-auto h-14 px-3 sm:px-4 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Brand & Community Switcher (Familiar Reddit/Discord pattern) */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          <a
            href="/"
            onClick={(e) => {
              if (onNavigateHome) {
                e.preventDefault();
                onNavigateHome();
              }
            }}
            className="font-display text-xl sm:text-2xl font-bold tracking-tight text-zinc-950 focus-visible:outline-2 focus-visible:outline-emerald-800 rounded-sm cursor-pointer hover:text-emerald-950 transition-colors"
          >
            Laodicean
          </a>

          {/* Current Community Selector Chip */}
          <button
            type="button"
            onClick={onOpenDiscover}
            className="cursor-pointer inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-900 bg-emerald-50 hover:bg-emerald-100/90 border border-emerald-200/80 px-2 py-0.5 rounded-full transition-colors"
            title="Switch campus community or discover others"
          >
            <span className="truncate max-w-[85px] sm:max-w-[120px]">{communityName}</span>
            <ChevronDown className="w-3 h-3 text-emerald-700 shrink-0" />
          </button>
        </div>

        {/* Center: Global Search Bar (Familiar Twitter/Reddit pattern) */}
        <div className="hidden md:flex flex-1 max-w-md mx-2 relative items-center">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
              placeholder={`Search ${communityName} posts, memes, or mushene... (/)`}
              className="w-full h-9 pl-9 pr-8 text-xs bg-stone-100 hover:bg-stone-200/70 focus:bg-white rounded-full border border-transparent focus:border-emerald-600 focus:outline-none transition-all placeholder:text-stone-400 text-stone-900 shadow-2xs"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => onSearchChange && onSearchChange('')}
                className="cursor-pointer absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-0.5 rounded-full"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <kbd className="hidden lg:inline-block absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-mono text-stone-400 bg-stone-200/60 rounded border border-stone-300/60 pointer-events-none">
                /
              </kbd>
            )}
          </div>
        </div>

        {/* Right: Actions, Install, Rules & Profile (Standard Social Cluster) */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Mobile Search Toggle Icon */}
          <button
            type="button"
            onClick={() => {
              setMobileSearchOpen(!mobileSearchOpen);
              if (!mobileSearchOpen) {
                setTimeout(() => searchInputRef.current?.focus(), 100);
              }
            }}
            className="md:hidden p-2 rounded-xl text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
            title="Search campus posts"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Primary CTA: + New Post Button (Familiar Twitter/Reddit top action) */}
          {onOpenComposer && (
            <button
              type="button"
              onClick={onOpenComposer}
              className="cursor-pointer min-h-[38px] px-3 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-2xs"
              title="Create a new post, poll, meme, or mushene"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">New Post</span>
            </button>
          )}

          {/* Juja Community Rules Quick Button */}
          {onOpenAbout && (
            <button
              type="button"
              onClick={onOpenAbout}
              className="hidden sm:inline-flex cursor-pointer min-h-[38px] px-2.5 py-1 rounded-xl bg-stone-100 hover:bg-stone-200/80 text-zinc-700 text-xs font-semibold items-center gap-1 transition-colors"
              title={`${communityName} Rules & Safety`}
            >
              <Shield className="w-3.5 h-3.5 text-emerald-800 shrink-0" />
              <span className="hidden lg:inline">Rules</span>
            </button>
          )}

          {/* PWA Install Button */}
          <PWAInstallButton variant="header" />

          {/* Admin Deck Quick Button */}
          {isAdmin && onOpenAdmin && (
            <button
              type="button"
              onClick={onOpenAdmin}
              className="cursor-pointer min-h-[38px] px-2.5 py-1 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold inline-flex items-center gap-1.5 transition-colors shadow-2xs"
              title="Open Admin Moderation Deck & Persona Reveal"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
              <span className="hidden md:inline">Admin Deck</span>
            </button>
          )}

          {/* User Profile Avatar with Standard Dropdown Menu */}
          {profile ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                aria-expanded={profileMenuOpen}
                aria-haspopup="menu"
                className="min-h-[44px] flex items-center gap-2 px-2 py-1 rounded-xl hover:bg-stone-200/60 transition-colors cursor-pointer group"
                title="Account & Persona Menu"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-100/90 border border-emerald-300 flex items-center justify-center text-sm shadow-2xs">
                  {profile.persona_avatar || '🎓'}
                </div>
                <div className="text-left hidden sm:block leading-tight max-w-[100px]">
                  <span className="block text-xs font-bold text-zinc-900 group-hover:text-emerald-900 truncate">
                    {profile.persona_name}
                  </span>
                  {profile.role === 'admin' ? (
                    <span className="text-[10px] font-bold text-amber-700 inline-flex items-center gap-0.5">
                      <Sparkles className="w-2.5 h-2.5" />
                      Admin
                    </span>
                  ) : (
                    <span className="text-[10px] text-zinc-400 capitalize">
                      {profile.role || 'Member'}
                    </span>
                  )}
                </div>
                <ChevronDown className="w-3 h-3 text-stone-400 hidden sm:block" />
              </button>

              {/* Standard Popover Menu (Jakob's Law) */}
              {profileMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-1.5 w-60 bg-white rounded-2xl shadow-lg border border-stone-200/90 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100"
                >
                  {/* User Identity Header */}
                  <div className="px-3.5 py-2.5 border-b border-stone-100">
                    <p className="text-xs font-bold text-zinc-900 truncate">
                      {profile.real_name || 'Verified Comrade'}
                    </p>
                    <p className="text-[11px] font-mono text-emerald-800 truncate">
                      {profile.persona_name}
                    </p>
                    {profile.role === 'admin' && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/80 mt-1">
                        <Sparkles className="w-2.5 h-2.5 text-amber-600" />
                        Campus Super Admin
                      </span>
                    )}
                  </div>

                  {/* Menu Options */}
                  <div className="py-1 text-xs text-stone-700">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setProfileMenuOpen(false);
                        onOpenProfile();
                      }}
                      className="cursor-pointer w-full text-left px-3.5 py-2 hover:bg-stone-50 flex items-center gap-2.5 transition-colors"
                    >
                      <UserCheck className="w-4 h-4 text-emerald-800" />
                      <span>Switch / Edit Persona</span>
                    </button>

                    {onOpenDiscover && (
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setProfileMenuOpen(false);
                          onOpenDiscover();
                        }}
                        className="cursor-pointer w-full text-left px-3.5 py-2 hover:bg-stone-50 flex items-center gap-2.5 transition-colors"
                      >
                        <Compass className="w-4 h-4 text-emerald-800" />
                        <span>Discover Campus Communities</span>
                      </button>
                    )}

                    {onOpenAbout && (
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setProfileMenuOpen(false);
                          onOpenAbout();
                        }}
                        className="cursor-pointer w-full text-left px-3.5 py-2 hover:bg-stone-50 flex items-center gap-2.5 transition-colors"
                      >
                        <FileText className="w-4 h-4 text-stone-500" />
                        <span>5 Golden Rules & Safety</span>
                      </button>
                    )}

                    {isAdmin && onOpenAdmin && (
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setProfileMenuOpen(false);
                          onOpenAdmin();
                        }}
                        className="cursor-pointer w-full text-left px-3.5 py-2 hover:bg-amber-50/70 text-amber-900 font-semibold flex items-center gap-2.5 transition-colors"
                      >
                        <ShieldAlert className="w-4 h-4 text-amber-700" />
                        <span>Admin Moderation Deck</span>
                      </button>
                    )}
                  </div>

                  {/* Sign Out Action */}
                  {onSignOut && (
                    <div className="pt-1 border-t border-stone-100">
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setProfileMenuOpen(false);
                          onSignOut();
                        }}
                        className="cursor-pointer w-full text-left px-3.5 py-2 text-xs text-rose-700 hover:bg-rose-50 flex items-center gap-2.5 transition-colors"
                      >
                        <LogOut className="w-4 h-4 text-rose-600" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
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

      {/* Expandable Mobile Search Row */}
      {mobileSearchOpen && (
        <div className="md:hidden px-3 pb-2.5 pt-1 border-t border-stone-100 bg-[#FAF9F6]">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
              placeholder={`Search ${communityName} posts...`}
              className="w-full h-9 pl-9 pr-8 text-xs bg-stone-100 focus:bg-white rounded-full border border-stone-200 focus:border-emerald-600 focus:outline-none transition-all placeholder:text-stone-400 text-stone-900"
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange && onSearchChange('')}
                className="cursor-pointer absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-0.5 rounded-full"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
