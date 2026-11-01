import React, { useState } from 'react';
import { FeedPost } from '../types';
import { generatePostShareDetails } from '../lib/seo';
import {
  X,
  Share2,
  Copy,
  Check,
  Smartphone,
  ExternalLink,
  MessageCircle,
  Sparkles,
} from 'lucide-react';
import { ShareCardModal } from './ShareCardModal';

interface ShareModalProps {
  post: FeedPost | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ShareModal({ post, isOpen, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const [shareCardOpen, setShareCardOpen] = useState(false);

  if (!isOpen || !post) return null;

  const shareDetails = generatePostShareDetails(post);
  const canUseNativeShare =
    typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareDetails.shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = shareDetails.shareUrl;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } catch (err) {
        setShareError('Could not copy link automatically. Please copy the URL below.');
      }
      document.body.removeChild(textarea);
    }
  };

  const handleNativeShare = async () => {
    setShareError(null);
    if (!canUseNativeShare) {
      handleCopyLink();
      return;
    }

    try {
      await navigator.share({
        title: shareDetails.title,
        text: shareDetails.shareText,
        url: shareDetails.shareUrl,
      });
      // Optionally close modal after successful native share
      onClose();
    } catch (err: any) {
      // User cancelled or share failed
      if (err?.name !== 'AbortError') {
        setShareError('Native sharing was cancelled or unavailable.');
      }
    }
  };

  const handleOpenWhatsApp = () => {
    window.open(shareDetails.whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-zinc-950/60 backdrop-blur-xs transition-opacity"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl border border-stone-200 animate-in fade-in slide-in-from-bottom duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-800 flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h2 id="share-modal-title" className="font-display text-base font-bold text-zinc-950">
                Share Campus Post
              </h2>
              <p className="text-[11px] text-zinc-500">
                Juja · {post.community_name || 'JKUAT'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-stone-100 text-zinc-400 hover:text-zinc-700 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close share sheet"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* WhatsApp Link Preview Card Mockup */}
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
            WhatsApp Link Preview
          </p>
          <div className="bg-[#f0f2f5] border border-stone-200/90 rounded-xl overflow-hidden p-2.5 flex items-start gap-3">
            <div className="w-16 h-16 rounded-lg bg-stone-200 overflow-hidden shrink-0 border border-stone-300">
              <img
                src={shareDetails.imageUrl}
                alt="Post thumbnail"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div className="min-w-0 flex-1 space-y-0.5">
              <span className="text-[10px] font-mono font-medium text-emerald-800 block truncate">
                laodicean.online/p/{post.id}
              </span>
              <p className="text-xs font-bold text-zinc-900 leading-tight line-clamp-2">
                {shareDetails.title}
              </p>
              <p className="text-[11px] text-zinc-600 line-clamp-2 leading-relaxed">
                {shareDetails.teaser}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons: Phone Share, WhatsApp, Status Card, and Copy */}
        <div className="space-y-2 pt-1">
          {/* WhatsApp Status Meme Card Generator */}
          <button
            type="button"
            onClick={() => setShareCardOpen(true)}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs border border-emerald-600/40"
          >
            <Smartphone className="w-4 h-4 text-emerald-300" />
            <span>Generate Status Card (1080×1920)</span>
            <span className="text-[10px] bg-emerald-500/30 text-emerald-100 px-1.5 py-0.2 rounded font-mono ml-auto">
              WhatsApp
            </span>
          </button>

          {/* Native Phone Share Sheet (if supported) */}
          {canUseNativeShare && (
            <button
              type="button"
              onClick={handleNativeShare}
              className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
            >
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span>Open Phone Share Sheet (All Apps)</span>
            </button>
          )}

          {/* WhatsApp Direct Share */}
          <button
            type="button"
            onClick={handleOpenWhatsApp}
            className="w-full py-2.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Share directly to WhatsApp</span>
            <ExternalLink className="w-3.5 h-3.5 ml-auto opacity-75" />
          </button>

          {/* Copy Post Link Button */}
          <button
            type="button"
            onClick={handleCopyLink}
            className={`w-full py-2.5 px-4 rounded-xl font-medium text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border ${
              copied
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold'
                : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-zinc-700'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600 animate-in zoom-in-75 duration-150" />
                <span>Link Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-zinc-500" />
                <span>Copy Post Link</span>
              </>
            )}
          </button>
        </div>

        {/* Share URL field for easy manual copy */}
        <div className="pt-2 border-t border-stone-100 space-y-1">
          <label className="text-[10px] font-medium text-zinc-500">
            Direct Post Link
          </label>
          <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-200 rounded-xl p-1.5 px-2.5 text-xs">
            <input
              type="text"
              readOnly
              value={shareDetails.shareUrl}
              onFocus={(e) => e.target.select()}
              className="flex-1 bg-transparent border-none outline-hidden text-[11px] font-mono text-zinc-700 truncate"
            />
            <button
              type="button"
              onClick={handleCopyLink}
              className="text-[10px] font-semibold text-emerald-800 hover:text-emerald-950 px-2 py-0.5 rounded bg-white border border-stone-200 shrink-0 cursor-pointer"
            >
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>

        {shareError && (
          <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200 text-center">
            {shareError}
          </p>
        )}
      </div>

      {/* 1080x1920 Status Card Modal */}
      <ShareCardModal
        post={post}
        isOpen={shareCardOpen}
        onClose={() => setShareCardOpen(false)}
      />
    </div>
  );
}
