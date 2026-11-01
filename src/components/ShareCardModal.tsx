import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Download,
  Share2,
  Copy,
  Check,
  Smartphone,
  Sparkles,
  Palette,
  MessageCircle,
  ExternalLink,
} from 'lucide-react';
import { FeedPost } from '../types';
import { CARD_THEMES, renderStatusCardToCanvas, formatCardUrl } from '../lib/shareCard';

interface ShareCardModalProps {
  post: FeedPost | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ShareCardModal({ post, isOpen, onClose }: ShareCardModalProps) {
  const [selectedTheme, setSelectedTheme] = useState('midnight-neon');
  const [generating, setGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Keyboard navigation & escape listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Re-generate card canvas when post or theme changes
  useEffect(() => {
    if (!isOpen || !post) return;

    let active = true;
    setGenerating(true);

    async function generate() {
      const canvas = canvasRef.current;
      if (!canvas || !post) return;

      try {
        await renderStatusCardToCanvas(canvas, post, selectedTheme);
        if (!active) return;

        const dataUrl = canvas.toDataURL('image/png', 0.95);
        setPreviewUrl(dataUrl);
      } catch (err) {
        console.error('Failed to generate card canvas:', err);
      } finally {
        if (active) setGenerating(false);
      }
    }

    generate();

    return () => {
      active = false;
    };
  }, [isOpen, post, selectedTheme]);

  if (!isOpen || !post) return null;

  const cardShareUrl = formatCardUrl(post);

  // Helper to convert canvas to blob
  const getCanvasBlob = async (): Promise<Blob | null> => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/png', 0.95);
    });
  };

  // 1. Download full resolution 1080x1920 card
  const handleDownload = async () => {
    const blob = await getCanvasBlob();
    if (!blob) return;

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `laodicean-${post.post_type}-${post.id.slice(0, 8)}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setStatusMessage('Card downloaded! Ready for WhatsApp Status.');
    setTimeout(() => setStatusMessage(null), 3500);
  };

  // 2. Share directly to WhatsApp Status or Chats
  const handleWhatsAppShare = async () => {
    setStatusMessage(null);
    const blob = await getCanvasBlob();

    // Check if device supports Web Share API with files
    const file = blob
      ? new File([blob], `laodicean-${post.id}.png`, { type: 'image/png' })
      : null;

    if (
      file &&
      typeof navigator !== 'undefined' &&
      navigator.canShare &&
      navigator.canShare({ files: [file] })
    ) {
      try {
        await navigator.share({
          files: [file],
          title: post.title || 'Juja Campus Pulse',
          text: `Check this out on Laodicean Juja: ${cardShareUrl}`,
        });
        return;
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
      }
    }

    // Fallback: download card and open WhatsApp with direct link
    if (blob) {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `laodicean-status-${post.id.slice(0, 8)}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }

    const whatsappMessage = encodeURIComponent(
      `🔥 *${post.title || 'Juja Campus Talk'}*\n\nRead more & vote on Laodicean:\n${cardShareUrl}`
    );
    window.open(`https://wa.me/?text=${whatsappMessage}`, '_blank', 'noopener,noreferrer');

    setStatusMessage('Card saved! Attach to your WhatsApp status now.');
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // 3. Copy Card Image to Clipboard
  const handleCopyImage = async () => {
    try {
      const blob = await getCanvasBlob();
      if (!blob) return;

      if (typeof ClipboardItem !== 'undefined') {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
        setCopied(true);
        setStatusMessage('Image copied to clipboard!');
        setTimeout(() => {
          setCopied(false);
          setStatusMessage(null);
        }, 3000);
      } else {
        handleDownload();
      }
    } catch {
      handleDownload();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-card-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-zinc-950/85 backdrop-blur-md overflow-y-auto"
    >
      {/* Hidden high-res canvas rendering offscreen */}
      <canvas ref={canvasRef} className="hidden" />

      <div className="relative w-full max-w-lg bg-stone-900 border border-stone-800 rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col max-h-[95vh] text-white my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h2 id="share-card-modal-title" className="font-display text-sm sm:text-base font-bold text-white flex items-center gap-1.5">
                <span>WhatsApp Status Card</span>
                <span className="text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800/80 px-1.5 py-0.2 rounded font-bold">
                  1080×1920
                </span>
              </h2>
              <p className="text-[11px] text-stone-400">
                Bold, meme-ready status graphic for Juja
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-stone-800 text-stone-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close card generator"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Toast Message */}
        {statusMessage && (
          <div className="mb-3 p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Center: Live 9:16 Status Preview Container */}
        <div className="flex-1 flex items-center justify-center min-h-[300px] max-h-[460px] bg-stone-950/80 rounded-2xl p-2.5 border border-stone-800/90 relative overflow-hidden group">
          {generating ? (
            <div className="flex flex-col items-center gap-2 text-stone-400">
              <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
              <span className="text-xs font-mono">Generating 1080×1920 card...</span>
            </div>
          ) : previewUrl ? (
            <div className="relative h-full aspect-[9/16] rounded-xl overflow-hidden shadow-2xl border-2 border-white/10 group-hover:border-emerald-500/50 transition-colors">
              <img
                src={previewUrl}
                alt="Laodicean Status Card Preview"
                className="w-full h-full object-contain"
              />
              <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-[9px] font-mono text-white/90 px-1.5 py-0.5 rounded font-bold border border-white/20">
                9:16
              </div>
            </div>
          ) : null}
        </div>

        {/* Meme Theme Palette Selector */}
        <div className="mt-3.5 space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-emerald-400" />
            <span>Card Theme Style</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {CARD_THEMES.map((theme) => {
              const isSelected = selectedTheme === theme.id;
              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => setSelectedTheme(theme.id)}
                  className={`cursor-pointer px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border ${
                    isSelected
                      ? 'bg-emerald-500 text-stone-950 border-emerald-400 shadow-xs font-bold'
                      : 'bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-700 hover:text-white'
                  }`}
                >
                  <span
                    className="w-3 h-3 rounded-full border border-black/30 shrink-0"
                    style={{ backgroundColor: theme.accentColor }}
                  />
                  <span className="truncate">{theme.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Buttons: WhatsApp & Download */}
        <div className="mt-4 pt-3 border-t border-stone-800 flex flex-col sm:flex-row items-center gap-2.5">
          {/* WhatsApp Direct Share */}
          <button
            type="button"
            onClick={handleWhatsAppShare}
            className="cursor-pointer w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-98"
            title="Share directly to WhatsApp Status or Chats"
          >
            <MessageCircle className="w-4 h-4 fill-white text-emerald-600" />
            <span>Share to WhatsApp</span>
          </button>

          {/* Download 1080x1920 PNG */}
          <button
            type="button"
            onClick={handleDownload}
            className="cursor-pointer w-full sm:w-auto py-2.5 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 border border-stone-700 transition-colors"
            title="Download full 1080x1920 PNG"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Download</span>
          </button>

          {/* Copy Image to Clipboard */}
          <button
            type="button"
            onClick={handleCopyImage}
            className="cursor-pointer w-full sm:w-auto py-2.5 px-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white font-semibold text-xs flex items-center justify-center gap-1.5 border border-stone-700 transition-colors"
            title="Copy status image to clipboard"
          >
            {copied ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <Copy className="w-4 h-4 text-stone-400" />
            )}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
