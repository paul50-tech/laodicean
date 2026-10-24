import React, { useState } from 'react';
import { Check, Copy, ExternalLink, X } from 'lucide-react';
import { buildWhatsAppShareData } from '../lib/feedLogic';
import { getCanonicalSiteOrigin } from '../lib/supabase';
import { Post } from '../types/laodicean';

interface WhatsAppShareSheetProps {
  post: Post | null;
  onClose: () => void;
}

/**
 * WhatsApp-first share sheet.
 * Pre-formats the post headline, snippet, community spot, and canonical laodicean.online link
 * so pasting or forwarding into JKUAT class/hostel WhatsApp groups looks clean immediately.
 */
export const WhatsAppShareSheet: React.FC<WhatsAppShareSheetProps> = ({
  post,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!post) return null;

  const shareData = buildWhatsAppShareData(post, getCanonicalSiteOrigin());

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareData.messageText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="whatsapp-share-heading"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-[#FAF9F6] rounded-t-3xl sm:rounded-2xl border border-stone-200 p-5 sm:p-6 space-y-4 shadow-xl"
      >
        <div className="flex items-center justify-between gap-4">
          <h2
            id="whatsapp-share-heading"
            className="font-display text-lg font-bold text-zinc-950"
          >
            Share on WhatsApp
          </h2>
          <button
            type="button"
            aria-label="Close share sheet"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] rounded-lg inline-flex items-center justify-center text-zinc-600 hover:bg-stone-200/70 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <p className="text-xs text-zinc-600">
          Formatted for WhatsApp groups and statuses with a direct reading link:
        </p>

        <pre className="p-3.5 rounded-xl bg-white border border-stone-200 text-xs text-zinc-800 whitespace-pre-wrap font-sans leading-relaxed">
          {shareData.messageText}
        </pre>

        <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
          <a
            href={shareData.whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 min-h-[44px] px-4 py-2.5 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
          >
            <span>Open WhatsApp</span>
            <ExternalLink className="w-4 h-4 shrink-0" aria-hidden="true" />
          </a>

          <button
            type="button"
            onClick={handleCopy}
            className="min-h-[44px] px-4 py-2.5 rounded-lg border border-stone-300 bg-white hover:border-zinc-900 text-zinc-900 text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-700" aria-hidden="true" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" aria-hidden="true" />
                <span>Copy WhatsApp Text</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
