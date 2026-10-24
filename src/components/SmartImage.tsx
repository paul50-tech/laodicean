import React, { useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';

interface SmartImageProps {
  src: string;
  alt: string;
  sizeKb?: number;
  liteMode: boolean;
  aspectClassName?: string;
  priority?: boolean;
}

/**
 * Weak-data resilient image component:
 * 1. In Lite Data Mode, defers downloading images until the reader taps to load.
 * 2. Implements the Zero-Broken-Image policy with a clean editorial fallback if loading fails.
 */
export const SmartImage: React.FC<SmartImageProps> = ({
  src,
  alt,
  sizeKb = 45,
  liteMode,
  aspectClassName = 'aspect-[4/3]',
  priority = false,
}) => {
  const [revealedInLite, setRevealedInLite] = useState(false);
  const [hasError, setHasError] = useState(false);

  if (liteMode && !revealedInLite) {
    return (
      <div
        className={`w-full ${aspectClassName} rounded-xl bg-stone-100 border border-stone-200/90 p-5 flex flex-col items-center justify-center text-center gap-3`}
      >
        <p className="text-xs text-zinc-600 max-w-sm line-clamp-2">{alt}</p>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setRevealedInLite(true);
          }}
          className="min-h-[44px] px-4 py-2 rounded-lg bg-white border border-stone-300 hover:border-emerald-700 text-xs font-semibold text-zinc-900 inline-flex items-center gap-2 transition-colors cursor-pointer"
        >
          <ImageIcon className="w-4 h-4 text-emerald-800 shrink-0" aria-hidden="true" />
          <span className="font-mono tabular-nums whitespace-nowrap">
            Load photo · ~{sizeKb} KB
          </span>
        </button>
      </div>
    );
  }

  if (hasError) {
    return (
      <div
        className={`w-full ${aspectClassName} rounded-xl bg-gradient-to-br from-stone-100 to-stone-200/70 border border-stone-200 p-6 flex flex-col items-center justify-center text-center gap-2`}
      >
        <ImageIcon className="w-6 h-6 text-stone-500" aria-hidden="true" />
        <p className="text-xs font-medium text-zinc-700 max-w-xs">{alt}</p>
      </div>
    );
  }

  return (
    <div className={`w-full ${aspectClassName} overflow-hidden rounded-xl bg-stone-100`}>
      <img
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onError={() => setHasError(true)}
        className="w-full h-full object-cover transition-opacity duration-150"
      />
    </div>
  );
};
