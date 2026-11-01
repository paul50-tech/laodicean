import React, { useState, useEffect } from 'react';
import { Plus, Flame, Clock, Sparkles } from 'lucide-react';
import { MusheneMoment, Profile } from '../types';
import { getLocalMoments, calculateTimeRemaining } from '../lib/moments';
import { StoryViewerModal } from './StoryViewerModal';
import { CreateMomentModal } from './CreateMomentModal';

interface MusheneStoriesBarProps {
  currentUserProfile?: Profile | null;
  onRequireAuth: (message: string) => void;
}

export function MusheneStoriesBar({
  currentUserProfile,
  onRequireAuth,
}: MusheneStoriesBarProps) {
  const [moments, setMoments] = useState<MusheneMoment[]>([]);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Load and listen for changes
  useEffect(() => {
    setMoments(getLocalMoments());

    const handleUpdate = () => {
      setMoments(getLocalMoments());
    };

    window.addEventListener('mushene-moments-changed', handleUpdate);
    // Periodically prune expired moments every minute
    const interval = setInterval(() => {
      setMoments(getLocalMoments());
    }, 60000);

    return () => {
      window.removeEventListener('mushene-moments-changed', handleUpdate);
      clearInterval(interval);
    };
  }, []);

  const handleOpenStory = (index: number) => {
    setSelectedStoryIndex(index);
    setViewerOpen(true);
  };

  const handleOpenCreate = () => {
    if (!currentUserProfile) {
      onRequireAuth('Sign in with your campus account to share a 24-hour Mushene moment!');
      return;
    }
    setCreateModalOpen(true);
  };

  return (
    <section aria-labelledby="stories-bar-heading" className="space-y-2">
      {/* Stories Bar Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-md bg-rose-100 text-rose-700 flex items-center justify-center text-xs">
            <Flame className="w-3.5 h-3.5 fill-rose-600 text-rose-600" />
          </div>
          <h2
            id="stories-bar-heading"
            className="font-display text-xs sm:text-sm font-bold text-zinc-950 flex items-center gap-1"
          >
            <span>24h Mushene Moments</span>
            <span className="text-[10px] font-normal text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded-full border border-rose-200/80 font-mono">
              Live Flash
            </span>
          </h2>
        </div>

        <span className="text-[10px] text-zinc-400 font-medium">
          Vanishes after 1 day
        </span>
      </div>

      {/* Horizontal Carousel Tray */}
      <div className="bg-white border border-stone-200/90 rounded-2xl p-3 shadow-2xs">
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar scroll-smooth py-0.5">
          {/* User's "Add Mushene Moment" Button */}
          <button
            type="button"
            onClick={handleOpenCreate}
            className="cursor-pointer flex flex-col items-center gap-1.5 shrink-0 group focus:outline-none"
            title="Post a 24-hour Mushene Moment"
          >
            <div className="relative w-14 h-14 rounded-full border-2 border-dashed border-emerald-600/70 hover:border-emerald-700 bg-emerald-50/50 flex items-center justify-center text-emerald-800 transition-all group-hover:scale-105 shadow-2xs">
              <span className="text-xl">
                {currentUserProfile?.persona_avatar || '🗣️'}
              </span>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-800 border-2 border-white flex items-center justify-center text-white shadow-xs">
                <Plus className="w-3 h-3 stroke-[3]" />
              </div>
            </div>
            <span className="text-[10px] font-bold text-zinc-800 group-hover:text-emerald-900 truncate max-w-[62px]">
              Add Flash
            </span>
          </button>

          {/* Active 24-hour Stories */}
          {moments.map((moment, idx) => {
            const timeLeft = calculateTimeRemaining(moment.expires_at);

            return (
              <button
                key={moment.id}
                type="button"
                onClick={() => handleOpenStory(idx)}
                className="cursor-pointer flex flex-col items-center gap-1.5 shrink-0 group focus:outline-none"
                title={`${moment.author_name}: "${moment.text}" (${timeLeft})`}
              >
                {/* Avatar with dynamic vibrant gradient ring */}
                <div className="relative p-0.5 rounded-full bg-gradient-to-tr from-rose-500 via-orange-400 to-amber-400 group-hover:scale-105 transition-transform shadow-2xs">
                  <div className="w-13 h-13 rounded-full bg-white p-0.5 flex items-center justify-center">
                    <div
                      className={`w-full h-full rounded-full flex items-center justify-center text-xl bg-gradient-to-br ${
                        moment.bg_gradient || 'from-amber-600 to-rose-700'
                      } text-white`}
                    >
                      {moment.author_avatar || '🎭'}
                    </div>
                  </div>

                  {/* 24h Expiry indicator badge on bottom right */}
                  <div className="absolute -bottom-1 -right-0.5 bg-zinc-950/90 text-[8px] font-mono font-bold text-amber-300 px-1 py-0.2 rounded-full border border-amber-400/40 shadow-xs flex items-center gap-0.5">
                    <span>{timeLeft}</span>
                  </div>
                </div>

                <div className="text-center leading-tight">
                  <span className="block text-[10px] font-bold text-zinc-900 group-hover:text-emerald-900 truncate max-w-[64px]">
                    {moment.author_name}
                  </span>
                  {moment.tag && (
                    <span className="text-[9px] text-zinc-400 truncate max-w-[60px] block">
                      {moment.tag}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Fullscreen Story Viewer Modal */}
      <StoryViewerModal
        isOpen={viewerOpen}
        moments={moments}
        initialIndex={selectedStoryIndex}
        currentUserProfile={currentUserProfile}
        onClose={() => setViewerOpen(false)}
        onRequireAuth={onRequireAuth}
      />

      {/* Create Story Modal */}
      <CreateMomentModal
        isOpen={createModalOpen}
        currentUserProfile={currentUserProfile}
        onClose={() => setCreateModalOpen(false)}
        onMomentCreated={(newMoment) => {
          setMoments((prev) => [newMoment, ...prev]);
        }}
        onRequireAuth={onRequireAuth}
      />
    </section>
  );
}
