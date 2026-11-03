import React, { useState } from 'react';
import { WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useOnlineStatus } from '../lib/useOnlineStatus';

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();
  const [retrying, setRetrying] = useState(false);

  const handleRetry = () => {
    setRetrying(true);
    setTimeout(() => {
      setRetrying(false);
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    }, 600);
  };

  if (isOnline) {
    return null;
  }

  return (
    <aside
      aria-label="Offline status"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-40 bg-zinc-950/95 text-white border border-amber-500/50 rounded-2xl p-3.5 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-4 duration-300"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
            <WifiOff className="w-4 h-4" />
          </div>
          <div className="min-w-0 leading-tight">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <p className="text-xs font-bold text-white">Offline Mode</p>
            </div>
            <p className="text-[11px] text-zinc-300 truncate">
              Viewing cached Juja campus feed.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleRetry}
          disabled={retrying}
          className="cursor-pointer shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition-colors shadow-2xs disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${retrying ? 'animate-spin' : ''}`} />
          <span>Retry</span>
        </button>
      </div>
    </aside>
  );
}
