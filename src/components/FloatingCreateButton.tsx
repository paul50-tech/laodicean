import React from 'react';
import { Plus } from 'lucide-react';

interface FloatingCreateButtonProps {
  onOpenComposer: () => void;
}

export function FloatingCreateButton({ onOpenComposer }: FloatingCreateButtonProps) {
  return (
    <div className="fixed bottom-6 right-5 sm:bottom-8 sm:right-8 z-40">
      <button
        type="button"
        onClick={onOpenComposer}
        aria-label="Create new post in Juja"
        title="Create new post in Juja"
        className="group relative flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-emerald-800 hover:bg-emerald-700 active:scale-95 text-white shadow-lg hover:shadow-xl shadow-emerald-950/20 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-4 focus:ring-emerald-800/25"
      >
        <span className="sr-only">New Post</span>
        <Plus className="w-7 h-7 sm:w-8 sm:h-8 transition-transform group-hover:rotate-90 duration-200" />

        {/* Small badge / indicator */}
        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-60"></span>
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500 border-2 border-white"></span>
        </span>
      </button>
    </div>
  );
}
