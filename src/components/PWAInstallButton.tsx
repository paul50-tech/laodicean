import React, { useState } from 'react';
import { Download, Smartphone, X, Share as ShareIcon, PlusSquare, CheckCircle } from 'lucide-react';
import { usePWAInstall } from '../lib/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'header' | 'banner' | 'compact';
  className?: string;
}

export function PWAInstallButton({ variant = 'header', className = '' }: PWAInstallButtonProps) {
  const { isInstallable, isInstalled, isIOS, install, installFeedback } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);

  // If already running in standalone PWA mode, don't show install buttons
  if (isInstalled) {
    return null;
  }

  // Handle click for Android/Chromium vs iOS
  const handleInstallClick = async () => {
    if (isInstallable) {
      await install();
    } else if (isIOS) {
      setShowIOSModal(true);
    } else {
      // In desktop browsers that haven't fired beforeinstallprompt yet or browsers without native prompt
      setShowIOSModal(true);
    }
  };

  return (
    <>
      {variant === 'header' && (
        <button
          type="button"
          onClick={handleInstallClick}
          className={`cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 border border-emerald-700/80 shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98] ${className}`}
          title="Install Laodicean to your home screen"
          aria-label="Install App"
        >
          <Smartphone className="w-3.5 h-3.5 text-emerald-300" />
          <span className="hidden sm:inline">Install App</span>
          <span className="sm:hidden">Install</span>
        </button>
      )}

      {variant === 'banner' && (
        <div className={`bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white rounded-2xl p-4 shadow-md border border-emerald-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${className}`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-lg shrink-0 border border-white/20">
              📱
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>Install Laodicean on Your Phone</span>
                <span className="text-[10px] bg-emerald-500/30 text-emerald-200 px-1.5 py-0.2 rounded font-mono font-bold">
                  Fast & Offline
                </span>
              </h4>
              <p className="text-[11px] text-emerald-100/90 leading-tight">
                Get full-screen access, instant zero-data loading, and offline campus posts.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleInstallClick}
            className="cursor-pointer shrink-0 w-full sm:w-auto px-4 py-2 rounded-xl bg-white text-emerald-950 font-bold text-xs inline-flex items-center justify-center gap-1.5 shadow-sm hover:bg-emerald-50 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-emerald-800" />
            <span>Add to Home Screen</span>
          </button>
        </div>
      )}

      {variant === 'compact' && (
        <button
          type="button"
          onClick={handleInstallClick}
          className={`cursor-pointer inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-900 hover:text-emerald-950 underline underline-offset-2 ${className}`}
        >
          <Smartphone className="w-3.5 h-3.5 text-emerald-700" />
          <span>Install to Home Screen</span>
        </button>
      )}

      {/* Feedback Toast if any */}
      {installFeedback && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-950 text-white border border-emerald-700 px-4 py-2.5 rounded-2xl text-xs font-medium shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{installFeedback}</span>
        </div>
      )}

      {/* iOS Safari / Browser Manual Install Modal */}
      {showIOSModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="ios-install-title"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
        >
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-800 text-white flex items-center justify-center text-sm font-bold">
                  L
                </div>
                <h3 id="ios-install-title" className="text-sm font-bold text-zinc-950">
                  Install on iPhone / iPad
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSModal(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-600 hover:bg-stone-100 transition-colors"
                aria-label="Close installation guide"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-600 leading-relaxed">
              Install <strong>Laodicean</strong> to your home screen for instant full-screen reading without the browser address bar:
            </p>

            <div className="space-y-3 bg-stone-50 p-4 rounded-2xl border border-stone-200 text-xs text-zinc-700">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-900 font-bold text-[11px] flex items-center justify-center shrink-0">
                  1
                </span>
                <p>
                  Tap the <strong className="inline-flex items-center gap-1 text-emerald-900"><ShareIcon className="w-3.5 h-3.5 text-blue-600 inline" /> Share</strong> button in Safari's bottom toolbar.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-900 font-bold text-[11px] flex items-center justify-center shrink-0">
                  2
                </span>
                <p>
                  Scroll down and tap <strong className="inline-flex items-center gap-1 text-emerald-900"><PlusSquare className="w-3.5 h-3.5 text-zinc-700 inline" /> Add to Home Screen</strong>.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-900 font-bold text-[11px] flex items-center justify-center shrink-0">
                  3
                </span>
                <p>
                  Tap <strong>Add</strong> in the top-right corner. Launch directly from your phone app grid!
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-900 hover:bg-emerald-950 text-white text-xs font-semibold cursor-pointer transition-colors shadow-xs"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
