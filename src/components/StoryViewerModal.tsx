import React, { useState, useEffect, useCallback } from 'react';
import { X, Clock, ChevronLeft, ChevronRight, ShieldAlert, Sparkles, Heart } from 'lucide-react';
import { MusheneMoment, Profile } from '../types';
import { calculateTimeRemaining } from '../lib/moments';

interface StoryViewerModalProps {
  isOpen: boolean;
  moments: MusheneMoment[];
  initialIndex?: number;
  currentUserProfile?: Profile | null;
  onClose: () => void;
  onRequireAuth?: (msg: string) => void;
}

export function StoryViewerModal({
  isOpen,
  moments,
  initialIndex = 0,
  currentUserProfile,
  onClose,
  onRequireAuth,
}: StoryViewerModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [reactionSpark, setReactionSpark] = useState<string | null>(null);

  useEffect(() => {
    setCurrentIndex(initialIndex);
    setProgress(0);
  }, [initialIndex, isOpen]);

  // Auto-advance progress bar timer (5 seconds per story)
  useEffect(() => {
    if (!isOpen || moments.length === 0 || isPaused) return;

    const interval = 50; // ms
    const step = (interval / 5000) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + step;
        return next >= 100 ? 100 : next;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [isOpen, moments.length, isPaused, currentIndex]);

  // Safely advance to next story or close when current story finishes
  useEffect(() => {
    if (!isOpen || moments.length === 0 || isPaused) return;
    if (progress < 100) return;

    if (currentIndex < moments.length - 1) {
      setCurrentIndex((curr) => curr + 1);
      setProgress(0);
    } else {
      onClose();
    }
  }, [progress, currentIndex, moments.length, isOpen, isPaused, onClose]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((curr) => curr - 1);
      setProgress(0);
    }
  }, [currentIndex]);

  const handleNext = useCallback(() => {
    if (currentIndex < moments.length - 1) {
      setCurrentIndex((curr) => curr + 1);
      setProgress(0);
    } else {
      onClose();
    }
  }, [currentIndex, moments.length, onClose]);

  const handleReact = (emoji: string) => {
    setReactionSpark(emoji);
    setTimeout(() => setReactionSpark(null), 1200);
  };

  // Keyboard navigation (Escape, ArrowLeft, ArrowRight)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handlePrev, handleNext, onClose]);

  if (!isOpen || moments.length === 0) return null;

  const currentMoment = moments[currentIndex] || moments[0];
  const timeRemaining = calculateTimeRemaining(currentMoment.expires_at);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="story-viewer-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-2 sm:p-4 select-none"
    >
      <div className="relative w-full max-w-sm h-[85vh] max-h-[700px] rounded-3xl overflow-hidden shadow-2xl flex flex-col bg-zinc-950 border border-white/10 text-white">
        {/* Dynamic Story Background Gradient */}
        <div
          className={`absolute inset-0 bg-gradient-to-br ${
            currentMoment.bg_gradient || 'from-amber-600 via-rose-700 to-purple-800'
          } opacity-95 transition-colors duration-500`}
        />
        {/* Subtle dark vignette overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none" />

        {/* Top Progress Bars Container */}
        <div className="relative z-20 px-3 pt-3 flex items-center gap-1.5">
          {moments.map((m, idx) => (
            <div
              key={m.id}
              className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden cursor-pointer"
              onClick={() => {
                setCurrentIndex(idx);
                setProgress(0);
              }}
            >
              <div
                className="h-full bg-white transition-all duration-75"
                style={{
                  width:
                    idx < currentIndex
                      ? '100%'
                      : idx === currentIndex
                      ? `${progress}%`
                      : '0%',
                }}
              />
            </div>
          ))}
        </div>

        {/* Header: Author Identity, Expiry Timer, Close */}
        <div className="relative z-20 px-4 pt-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-lg shrink-0 shadow-xs">
              {currentMoment.author_avatar || '🗣️'}
            </div>
            <div className="min-w-0 leading-tight">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span id="story-viewer-title" className="text-xs font-bold text-white truncate drop-shadow-xs">
                  {currentMoment.author_name}
                </span>
                {currentMoment.tag && (
                  <span className="text-[10px] font-semibold bg-white/20 backdrop-blur-md px-1.5 py-0.2 rounded-full border border-white/20">
                    {currentMoment.tag}
                  </span>
                )}
              </div>

              {/* Expiry countdown */}
              <div className="flex items-center gap-1 text-[11px] text-white/80 mt-0.5 font-medium">
                <Clock className="w-3 h-3 text-white/70" />
                <span>{timeRemaining}</span>
                <span>•</span>
                <span>24h Mushene</span>
              </div>

              {/* Admin Unmask Indicator */}
              {currentMoment.is_persona &&
                currentMoment.author_real_name &&
                currentUserProfile?.role === 'admin' && (
                  <div className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-amber-400/30 border border-amber-300 text-amber-200 text-[9px] font-mono mt-0.5">
                    <ShieldAlert className="w-2.5 h-2.5" />
                    <span>Admin: {currentMoment.author_real_name}</span>
                  </div>
                )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white/80 hover:text-white transition-colors border border-white/10"
            title="Close story"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Interactive Tap Zones & Main Content */}
        <div
          className="relative z-10 flex-1 flex flex-col justify-center px-6 sm:px-8 text-center"
          onMouseDown={() => setIsPaused(true)}
          onMouseUp={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
        >
          {/* Left / Right Invisible Tap Zones */}
          <div
            onClick={handlePrev}
            className="absolute left-0 top-0 bottom-0 w-1/3 cursor-pointer z-10"
            aria-label="Previous story"
          />
          <div
            onClick={handleNext}
            className="absolute right-0 top-0 bottom-0 w-2/3 cursor-pointer z-10"
            aria-label="Next story"
          />

          {/* Story Body Text */}
          <div className="relative z-0 pointer-events-none space-y-3">
            <span className="text-4xl sm:text-5xl opacity-40 select-none">“</span>
            <p className="font-display text-xl sm:text-2xl font-bold text-white leading-relaxed drop-shadow-md select-text">
              {currentMoment.text}
            </p>
            <span className="text-4xl sm:text-5xl opacity-40 select-none inline-block -mt-3">”</span>
          </div>

          {/* Floating Reaction Animation */}
          {reactionSpark && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-bounce text-6xl">
              {reactionSpark}
            </div>
          )}
        </div>

        {/* Navigation Arrows for accessibility */}
        <div className="relative z-20 px-3 py-1 flex items-center justify-between text-white/60 pointer-events-none">
          {currentIndex > 0 ? (
            <button
              type="button"
              onClick={handlePrev}
              className="pointer-events-auto p-1.5 rounded-full bg-black/30 hover:bg-black/50 text-white cursor-pointer"
              title="Previous story"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          ) : (
            <div className="w-7" />
          )}

          <span className="text-[10px] font-mono text-white/70">
            {currentIndex + 1} of {moments.length}
          </span>

          <button
            type="button"
            onClick={handleNext}
            className="pointer-events-auto p-1.5 rounded-full bg-black/30 hover:bg-black/50 text-white cursor-pointer"
            title="Next story"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Bottom Reaction Bar */}
        <div className="relative z-20 p-4 border-t border-white/15 bg-black/40 backdrop-blur-md flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            {['🔥', '😂', '😱', '🤝', '❤️'].map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleReact(emoji)}
                className="cursor-pointer w-9 h-9 rounded-full bg-white/10 hover:bg-white/25 active:scale-125 transition-all flex items-center justify-center text-lg border border-white/10"
                title={`React with ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>

          <span className="text-[11px] font-semibold text-white/80 bg-white/15 px-2.5 py-1 rounded-full border border-white/20">
            Juja 24h Flash
          </span>
        </div>
      </div>
    </div>
  );
}
