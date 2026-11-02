import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Download,
  Upload,
  Sparkles,
  Send,
  Plus,
  Trash2,
  Check,
  Type,
  Smile,
  Image as ImageIcon,
} from 'lucide-react';
import {
  MEME_TEMPLATES,
  SHENG_STICKERS,
  MemeEditorState,
  ActiveSticker,
  renderMemeCanvas,
} from '../lib/memeStudio';

interface MemeEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostMeme: (imageFile: File, imageUrl: string, caption: string) => void;
}

export function MemeEditorModal({
  isOpen,
  onClose,
  onPostMeme,
}: MemeEditorModalProps) {
  const [templateId, setTemplateId] = useState(MEME_TEMPLATES[0].id);
  const [topText, setTopText] = useState(MEME_TEMPLATES[0].defaultTop);
  const [bottomText, setBottomText] = useState(MEME_TEMPLATES[0].defaultBottom);
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [textColor, setTextColor] = useState<'white' | 'yellow' | 'cyan'>('white');
  const [stickers, setStickers] = useState<ActiveSticker[]>([
    {
      id: 'sticker-default',
      text: 'JUJA DUST GANG 🌪️',
      position: 'top-right',
      color: '#ffffff',
      bgColor: '#d97706',
      borderColor: '#ffffff',
    },
  ]);
  const [includeWatermark, setIncludeWatermark] = useState(true);
  const [customImageSrc, setCustomImageSrc] = useState<string | null>(null);
  const [customImageElement, setCustomImageElement] = useState<HTMLImageElement | null>(null);
  const [caption, setCaption] = useState('');
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  // When template changes, update default copy unless custom image is active
  const handleSelectTemplate = (id: string) => {
    setTemplateId(id);
    const tmpl = MEME_TEMPLATES.find((t) => t.id === id);
    if (tmpl && id !== 'custom_upload') {
      setTopText(tmpl.defaultTop);
      setBottomText(tmpl.defaultBottom);
      setCustomImageSrc(null);
      setCustomImageElement(null);

      // Add preset sticker if defined
      if (tmpl.presetSticker) {
        const found = SHENG_STICKERS.find((s) => s.id === tmpl.presetSticker);
        if (found) {
          setStickers([
            {
              id: `sticker-${Date.now()}`,
              text: found.text,
              position: 'top-right',
              color: found.color,
              bgColor: found.bgColor,
              borderColor: found.borderColor,
            },
          ]);
        }
      }
    } else if (id === 'custom_upload') {
      fileInputRef.current?.click();
    }
  };

  // Handle custom image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      setCustomImageSrc(src);
      setTemplateId('custom_upload');

      const img = new Image();
      img.onload = () => {
        setCustomImageElement(img);
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  // Re-render canvas whenever state changes
  useEffect(() => {
    if (!isOpen) return;

    let active = true;

    async function draw() {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const state: MemeEditorState = {
        templateId,
        customImageUrl: customImageSrc,
        topText,
        bottomText,
        fontSize,
        textColor,
        stickers,
        includeWatermark,
      };

      await renderMemeCanvas(canvas, state, customImageElement);
      if (!active) return;

      setPreviewDataUrl(canvas.toDataURL('image/png', 0.95));
    }

    draw();

    return () => {
      active = false;
    };
  }, [
    isOpen,
    templateId,
    customImageSrc,
    customImageElement,
    topText,
    bottomText,
    fontSize,
    textColor,
    stickers,
    includeWatermark,
  ]);

  if (!isOpen) return null;

  // Add a Sheng sticker
  const handleAddSticker = (sheng: typeof SHENG_STICKERS[0]) => {
    if (stickers.length >= 4) return;

    const positions: ActiveSticker['position'][] = [
      'top-right',
      'top-left',
      'bottom-left',
      'bottom-right',
      'center',
    ];
    const nextPos = positions[stickers.length % positions.length];

    setStickers((prev) => [
      ...prev,
      {
        id: `sticker-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        text: sheng.text,
        position: nextPos,
        color: sheng.color,
        bgColor: sheng.bgColor,
        borderColor: sheng.borderColor,
      },
    ]);
  };

  const handleRemoveSticker = (id: string) => {
    setStickers((prev) => prev.filter((s) => s.id !== id));
  };

  const handleChangeStickerPosition = (id: string, pos: ActiveSticker['position']) => {
    setStickers((prev) =>
      prev.map((s) => (s.id === id ? { ...s, position: pos } : s))
    );
  };

  // Helper to convert canvas to blob
  const getCanvasBlob = async (): Promise<Blob | null> => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/png', 0.95);
    });
  };

  // Download meme as PNG
  const handleDownload = async () => {
    const blob = await getCanvasBlob();
    if (!blob) return;

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `juja-meme-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  // Post meme to feed
  const handlePostToFeed = async () => {
    const blob = await getCanvasBlob();
    if (!blob || !previewDataUrl) return;

    const file = new File([blob], `juja_meme_${Date.now()}.png`, { type: 'image/png' });
    const finalCaption = caption.trim() || `${topText} — ${bottomText}`;

    onPostMeme(file, previewDataUrl, finalCaption);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="meme-studio-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-zinc-950/80 backdrop-blur-md overflow-y-auto"
    >
      {/* Hidden high-res canvas */}
      <canvas ref={canvasRef} className="hidden" />
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        className="hidden"
      />

      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh] my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-stone-100 flex items-center justify-between bg-stone-50/70 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xl">😂</span>
            <div>
              <h2
                id="meme-studio-title"
                className="font-display text-sm sm:text-base font-bold text-zinc-950 flex items-center gap-1.5"
              >
                <span>Juja Meme Studio</span>
                <span className="text-[10px] font-bold font-mono bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded-full border border-amber-300">
                  Sheng & Street
                </span>
              </h2>
              <p className="text-[11px] text-zinc-500">
                Create & customize campus memes with Sheng stickers
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-stone-200/70 text-zinc-400 hover:text-zinc-700 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close Meme Studio"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Main 2-Column Layout on larger screens */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left: Meme Canvas Live Preview */}
            <div className="space-y-2">
              <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-zinc-950 border-2 border-stone-800 shadow-md flex items-center justify-center group">
                {previewDataUrl ? (
                  <img
                    src={previewDataUrl}
                    alt="Juja Campus Meme Preview"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
                )}
                <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] text-white/90 font-mono font-bold">
                  800×800
                </div>
              </div>

              {/* Watermark Toggle */}
              <label className="flex items-center justify-between text-xs text-zinc-600 p-2 rounded-xl bg-stone-50 border border-stone-200 cursor-pointer">
                <span className="font-medium flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Include "⚡ Laodicean · Juja" watermark</span>
                </span>
                <input
                  type="checkbox"
                  checked={includeWatermark}
                  onChange={(e) => setIncludeWatermark(e.target.checked)}
                  className="rounded text-emerald-800 focus:ring-emerald-700 w-4 h-4 cursor-pointer"
                />
              </label>
            </div>

            {/* Right: Text & Template Controls */}
            <div className="space-y-3">
              {/* Template Selector Bar */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                  Template or Photo
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {MEME_TEMPLATES.map((tmpl) => {
                    const isSelected = templateId === tmpl.id;
                    return (
                      <button
                        key={tmpl.id}
                        type="button"
                        onClick={() => handleSelectTemplate(tmpl.id)}
                        className={`cursor-pointer p-2 rounded-xl border text-[11px] font-semibold flex flex-col items-center gap-1 transition-all text-center leading-tight ${
                          isSelected
                            ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                            : 'bg-stone-50 text-zinc-700 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        <span className="text-base">{tmpl.emoji}</span>
                        <span className="truncate w-full text-[10px]">{tmpl.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Top Text Field */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 flex items-center justify-between">
                  <span>Top Meme Text</span>
                  <span className="text-[10px] font-mono text-zinc-400">UPPERCASE</span>
                </label>
                <input
                  type="text"
                  value={topText}
                  onChange={(e) => setTopText(e.target.value)}
                  placeholder="e.g. STEPPING OUT OF GATE C"
                  className="w-full px-3 py-2 text-xs font-bold uppercase bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800"
                />
              </div>

              {/* Bottom Text Field */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 flex items-center justify-between">
                  <span>Bottom Meme Text</span>
                  <span className="text-[10px] font-mono text-zinc-400">UPPERCASE</span>
                </label>
                <input
                  type="text"
                  value={bottomText}
                  onChange={(e) => setBottomText(e.target.value)}
                  placeholder="e.g. RETURNING LOOKING LIKE A DOUGHNUT"
                  className="w-full px-3 py-2 text-xs font-bold uppercase bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800"
                />
              </div>

              {/* Text Styling: Size & Color */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase text-zinc-500">
                    Text Size
                  </label>
                  <div className="flex rounded-lg border border-stone-200 overflow-hidden text-xs">
                    {(['small', 'medium', 'large'] as const).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setFontSize(s)}
                        className={`flex-1 py-1.5 capitalize text-center font-semibold cursor-pointer ${
                          fontSize === s
                            ? 'bg-emerald-800 text-white'
                            : 'bg-white text-zinc-600 hover:bg-stone-50'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase text-zinc-500">
                    Text Color
                  </label>
                  <div className="flex rounded-lg border border-stone-200 overflow-hidden text-xs">
                    {(['white', 'yellow', 'cyan'] as const).map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setTextColor(c)}
                        className={`flex-1 py-1.5 capitalize text-center font-semibold cursor-pointer ${
                          textColor === c
                            ? 'bg-emerald-800 text-white'
                            : 'bg-white text-zinc-600 hover:bg-stone-50'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sheng & Nairobi Stickers Section */}
          <div className="space-y-2 pt-2 border-t border-stone-100">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-700 flex items-center gap-1.5">
                <Smile className="w-3.5 h-3.5 text-amber-500" />
                <span>Sheng & Nairobi Stickers (Tap to Add)</span>
              </label>
              <span className="text-[10px] font-mono text-zinc-400">
                {stickers.length}/4 Active
              </span>
            </div>

            {/* Sticker Badges Palette */}
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1 bg-stone-50 rounded-2xl border border-stone-200">
              {SHENG_STICKERS.map((sheng) => (
                <button
                  key={sheng.id}
                  type="button"
                  onClick={() => handleAddSticker(sheng)}
                  disabled={stickers.length >= 4}
                  className="cursor-pointer text-xs font-bold px-2.5 py-1.5 rounded-xl border shadow-2xs hover:scale-105 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: sheng.bgColor,
                    color: sheng.color,
                    borderColor: sheng.borderColor,
                  }}
                  title="Click to stamp sticker onto meme"
                >
                  {sheng.text}
                </button>
              ))}
            </div>

            {/* Active Stickers Position Manager */}
            {stickers.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <p className="text-[10px] font-semibold uppercase text-zinc-400">
                  Active Stickers On Canvas
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {stickers.map((stk) => (
                    <div
                      key={stk.id}
                      className="flex items-center justify-between gap-2 p-2 bg-white border border-stone-200 rounded-xl text-xs shadow-2xs"
                    >
                      <span className="truncate font-bold text-zinc-800 text-[11px]">
                        {stk.text}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        <select
                          value={stk.position}
                          onChange={(e) =>
                            handleChangeStickerPosition(
                              stk.id,
                              e.target.value as ActiveSticker['position']
                            )
                          }
                          className="text-[10px] font-medium bg-stone-100 rounded-lg px-1.5 py-1 border border-stone-200 focus:outline-none"
                        >
                          <option value="top-right">Top Right</option>
                          <option value="top-left">Top Left</option>
                          <option value="bottom-right">Bottom Right</option>
                          <option value="bottom-left">Bottom Left</option>
                          <option value="center">Center</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => handleRemoveSticker(stk.id)}
                          className="p-1 text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                          title="Remove sticker"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Feed Post Caption Input */}
          <div className="space-y-1 pt-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              Optional Caption for Juja Feed
            </label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="e.g. Pure Juja campus reality 😂"
              maxLength={150}
              className="w-full px-3.5 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800"
            />
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="px-5 py-3 border-t border-stone-100 bg-stone-50/70 flex flex-col sm:flex-row items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Download Button */}
            <button
              type="button"
              onClick={handleDownload}
              className="cursor-pointer flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-white border border-stone-200 hover:bg-stone-100 text-zinc-700 text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
            >
              {downloadSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 text-emerald-800" />
                  <span>Download Meme</span>
                </>
              )}
            </button>
          </div>

          {/* Post to Feed Button */}
          <button
            type="button"
            onClick={handlePostToFeed}
            className="cursor-pointer w-full sm:w-auto px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-98"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Post Meme to Feed</span>
          </button>
        </div>
      </div>
    </div>
  );
}
