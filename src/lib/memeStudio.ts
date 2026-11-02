export interface MemeTemplate {
  id: string;
  name: string;
  category: string;
  defaultTop: string;
  defaultBottom: string;
  bgGradient: [string, string];
  emoji: string;
  svgDataUri?: string;
  presetSticker?: string;
}

export interface ShengSticker {
  id: string;
  text: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

export interface ActiveSticker {
  id: string;
  text: string;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  color: string;
  bgColor: string;
  borderColor: string;
}

export interface MemeEditorState {
  templateId: string;
  customImageUrl?: string | null;
  topText: string;
  bottomText: string;
  fontSize: 'small' | 'medium' | 'large';
  textColor: 'white' | 'yellow' | 'cyan';
  stickers: ActiveSticker[];
  includeWatermark: boolean;
}

export const SHENG_STICKERS: ShengSticker[] = [
  {
    id: 'kanyaga',
    text: 'KANYAGA TWENDE! 🚀',
    color: '#022c22',
    bgColor: '#10b981',
    borderColor: '#ffffff',
  },
  {
    id: 'mboka',
    text: 'MBOKA NI MBOKA 💼',
    color: '#422006',
    bgColor: '#facc15',
    borderColor: '#ffffff',
  },
  {
    id: 'kumenuka',
    text: 'KUMENUKA HUKU 🔥',
    color: '#ffffff',
    bgColor: '#dc2626',
    borderColor: '#ffffff',
  },
  {
    id: 'sina_maoni',
    text: 'SINA MAONI 🤐',
    color: '#ffffff',
    bgColor: '#4b5563',
    borderColor: '#ffffff',
  },
  {
    id: 'weh_mzee',
    text: 'WEH MZEE! 😂',
    color: '#3b0764',
    bgColor: '#c084fc',
    borderColor: '#ffffff',
  },
  {
    id: 'dust_gang',
    text: 'JUJA DUST GANG 🌪️',
    color: '#ffffff',
    bgColor: '#d97706',
    borderColor: '#ffffff',
  },
  {
    id: 'hii_imeenda',
    text: 'HII IMEENDA 🏃💨',
    color: '#ffffff',
    bgColor: '#2563eb',
    borderColor: '#ffffff',
  },
  {
    id: 'chapo_dengu',
    text: 'CHAPO DENGU SUPREMACY 🫓',
    color: '#052e16',
    bgColor: '#86efac',
    borderColor: '#ffffff',
  },
  {
    id: 'mapema_best',
    text: 'MAPEMA NDIO BEST ⏰',
    color: '#431407',
    bgColor: '#fdba74',
    borderColor: '#ffffff',
  },
  {
    id: 'form_ni_gani',
    text: 'FORM NI GANI? 🤔',
    color: '#ffffff',
    bgColor: '#7c3aed',
    borderColor: '#ffffff',
  },
];

export const MEME_TEMPLATES: MemeTemplate[] = [
  {
    id: 'juja_dust',
    name: 'Juja Stage Dust',
    category: 'Campus Reality',
    defaultTop: 'STEPPING OUT OF GATE C',
    defaultBottom: 'RETURNING LOOKING LIKE A POWDERED DOUGHNUT',
    bgGradient: ['#78350f', '#451a03'],
    emoji: '🌪️',
    presetSticker: 'dust_gang',
  },
  {
    id: 'hall1_cat',
    name: '8 AM Hall 1 CAT',
    category: 'Academics',
    defaultTop: 'LECTURER: "CAT STARTS AT 8:00 AM SHARP"',
    defaultBottom: 'ME AT GATE A BUYING SMOKIE PASUA AT 8:05',
    bgGradient: ['#1e1b4b', '#312e81'],
    emoji: '⏰',
    presetSticker: 'kumenuka',
  },
  {
    id: 'chapo_investigation',
    name: 'Gate C Chapo Economics',
    category: 'Food Drama',
    defaultTop: 'WHEN INFLATION HITS JUJA',
    defaultBottom: 'CHAPO GETS SMALLER BUT PRICE STAYS 20 BOB',
    bgGradient: ['#14532d', '#052e16'],
    emoji: '🫓',
    presetSticker: 'chapo_dengu',
  },
  {
    id: 'indomie_vs_container',
    name: 'Hostel Chef vs Container',
    category: 'Student Life',
    defaultTop: 'TELLING MYSELF I WILL COOK IN THE HOSTEL',
    defaultBottom: '10 MINUTES LATER AT CONTAINER CHIPS MWITU',
    bgGradient: ['#831843', '#500724'],
    emoji: '🍟',
    presetSticker: 'hii_imeenda',
  },
  {
    id: 'exam_week',
    name: 'Semester Exam Mode',
    category: 'Panic',
    defaultTop: 'SEMESTER WAS 14 WEEKS LONG',
    defaultBottom: 'WHY AM I LEARNING THE WHOLE SYLLABUS AT 3 AM?',
    bgGradient: ['#3f3f46', '#18181b'],
    emoji: '📚',
    presetSticker: 'kanyaga',
  },
  {
    id: 'custom_upload',
    name: 'Upload Own Photo',
    category: 'Custom',
    defaultTop: 'WHEN YOU REALIZE',
    defaultBottom: 'TODAY IS NOT FRIDAY',
    bgGradient: ['#0f172a', '#020617'],
    emoji: '📸',
  },
];

/**
 * Calculates font size in pixels based on selection and canvas width
 */
export function getMemeFontSize(size: 'small' | 'medium' | 'large', canvasWidth: number): number {
  const scale = canvasWidth / 800;
  switch (size) {
    case 'small':
      return Math.round(36 * scale);
    case 'large':
      return Math.round(56 * scale);
    case 'medium':
    default:
      return Math.round(46 * scale);
  }
}

/**
 * Breaks text into uppercase lines that fit within a maximum width
 */
export function wrapMemeLines(
  text: string,
  ctxOrMaxWidth?: { measureText?: (t: string) => { width: number } } | number | null,
  customMaxWidth?: number
): string[] {
  if (!text) return [];
  const words = text.toUpperCase().replace(/[\r\n]+/g, ' ').trim().split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  const ctx = typeof ctxOrMaxWidth === 'object' ? ctxOrMaxWidth : null;
  const maxWidth = typeof ctxOrMaxWidth === 'number' ? ctxOrMaxWidth : (customMaxWidth ?? 720);

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const lineWidth = ctx && typeof ctx.measureText === 'function'
      ? ctx.measureText(testLine).width
      : (maxWidth <= 60 ? testLine.length : testLine.length * 24);

    if (lineWidth > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

/**
 * Renders bold impact meme text with black stroke and white fill
 */
export function drawMemeText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  fontSize: number,
  fillColor: string = '#ffffff'
) {
  ctx.save();
  ctx.font = `900 ${fontSize}px Impact, "Arial Black", "Trebuchet MS", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const lines = wrapMemeLines(text, ctx, maxWidth);
  const lineHeight = fontSize * 1.15;
  const startY = y - ((lines.length - 1) * lineHeight) / 2;

  lines.forEach((line, index) => {
    const lineY = startY + index * lineHeight;

    // Thick black stroke
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = Math.max(4, fontSize * 0.14);
    ctx.lineJoin = 'miter';
    ctx.miterLimit = 2;
    ctx.strokeText(line, x, lineY);

    // Color fill
    ctx.fillStyle = fillColor;
    ctx.fillText(line, x, lineY);
  });

  ctx.restore();
}

/**
 * Renders a Sheng/Nairobi sticker badge onto canvas
 */
export function drawSticker(
  ctx: CanvasRenderingContext2D,
  sticker: ActiveSticker,
  canvasWidth: number,
  canvasHeight: number
) {
  ctx.save();

  ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
  const metrics = ctx.measureText(sticker.text);
  const textWidth = metrics.width;
  const paddingX = 20;
  const paddingY = 12;
  const badgeWidth = textWidth + paddingX * 2;
  const badgeHeight = 44;

  let x = 0;
  let y = 0;
  let rotation = 0;

  switch (sticker.position) {
    case 'top-left':
      x = 50;
      y = 120;
      rotation = -4;
      break;
    case 'top-right':
      x = canvasWidth - badgeWidth - 50;
      y = 120;
      rotation = 4;
      break;
    case 'bottom-left':
      x = 50;
      y = canvasHeight - badgeHeight - 130;
      rotation = 3;
      break;
    case 'bottom-right':
      x = canvasWidth - badgeWidth - 50;
      y = canvasHeight - badgeHeight - 130;
      rotation = -3;
      break;
    case 'center':
    default:
      x = (canvasWidth - badgeWidth) / 2;
      y = (canvasHeight - badgeHeight) / 2;
      rotation = 0;
      break;
  }

  ctx.translate(x + badgeWidth / 2, y + badgeHeight / 2);
  ctx.rotate((rotation * Math.PI) / 180);

  // Sticker shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.beginPath();
  ctx.roundRect(-badgeWidth / 2 + 4, -badgeHeight / 2 + 5, badgeWidth, badgeHeight, 12);
  ctx.fill();

  // Sticker background
  ctx.fillStyle = sticker.bgColor;
  ctx.beginPath();
  ctx.roundRect(-badgeWidth / 2, -badgeHeight / 2, badgeWidth, badgeHeight, 12);
  ctx.fill();

  // White border
  ctx.strokeStyle = sticker.borderColor || '#ffffff';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Text
  ctx.fillStyle = sticker.color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(sticker.text, 0, 1);

  ctx.restore();
}

/**
 * Draws the watermark in the bottom corner
 */
export function drawWatermark(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  ctx.save();
  const text = '⚡ LAODICEAN · JUJA';
  ctx.font = 'bold 15px system-ui, -apple-system, sans-serif';
  const metrics = ctx.measureText(text);
  const badgeW = metrics.width + 24;
  const badgeH = 28;
  const x = width - badgeW - 20;
  const y = height - badgeH - 20;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
  ctx.beginPath();
  ctx.roundRect(x, y, badgeW, badgeH, 8);
  ctx.fill();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + 12, y + badgeH / 2);
  ctx.restore();
}

/**
 * Full canvas renderer for Meme Studio.
 */
export async function renderMemeCanvas(
  canvas: HTMLCanvasElement,
  state: MemeEditorState,
  imageElement?: HTMLImageElement | null
): Promise<void> {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const width = 800;
  const height = 800;
  canvas.width = width;
  canvas.height = height;

  const template = MEME_TEMPLATES.find((t) => t.id === state.templateId) || MEME_TEMPLATES[0];

  // 1. Draw Background Image or Dynamic Gradient
  if (imageElement && imageElement.complete && imageElement.naturalWidth > 0) {
    // Fill background with black
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    // Draw image maintaining cover aspect ratio
    const imgRatio = imageElement.naturalWidth / imageElement.naturalHeight;
    const canvasRatio = width / height;
    let sWidth = imageElement.naturalWidth;
    let sHeight = imageElement.naturalHeight;
    let sx = 0;
    let sy = 0;

    if (imgRatio > canvasRatio) {
      sWidth = imageElement.naturalHeight * canvasRatio;
      sx = (imageElement.naturalWidth - sWidth) / 2;
    } else {
      sHeight = imageElement.naturalWidth / canvasRatio;
      sy = (imageElement.naturalHeight - sHeight) / 2;
    }

    ctx.drawImage(imageElement, sx, sy, sWidth, sHeight, 0, 0, width, height);

    // Subtle dark gradient overlay at top and bottom to make meme text pop
    const topGrad = ctx.createLinearGradient(0, 0, 0, 180);
    topGrad.addColorStop(0, 'rgba(0,0,0,0.4)');
    topGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = topGrad;
    ctx.fillRect(0, 0, width, 180);

    const btmGrad = ctx.createLinearGradient(0, height - 180, 0, height);
    btmGrad.addColorStop(0, 'transparent');
    btmGrad.addColorStop(1, 'rgba(0,0,0,0.4)');
    ctx.fillStyle = btmGrad;
    ctx.fillRect(0, height - 180, width, 180);
  } else {
    // Render Template Graphic
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, template.bgGradient[0]);
    grad.addColorStop(1, template.bgGradient[1]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Subtle grid pattern
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    for (let x = 30; x < width; x += 40) {
      for (let y = 30; y < height; y += 40) {
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Large Center Template Emoji / Graphic
    ctx.save();
    ctx.font = '160px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(template.emoji, width / 2, height / 2);
    ctx.restore();
  }

  // 2. Draw Top Text
  const fontSize = getMemeFontSize(state.fontSize, width);
  const textColorMap = {
    white: '#ffffff',
    yellow: '#facc15',
    cyan: '#38bdf8',
  };
  const fillColor = textColorMap[state.textColor] || '#ffffff';

  if (state.topText.trim()) {
    drawMemeText(
      ctx,
      state.topText,
      width / 2,
      75,
      width - 60,
      fontSize,
      fillColor
    );
  }

  // 3. Draw Bottom Text
  if (state.bottomText.trim()) {
    drawMemeText(
      ctx,
      state.bottomText,
      width / 2,
      height - 75,
      width - 60,
      fontSize,
      fillColor
    );
  }

  // 4. Draw Active Sheng Stickers
  state.stickers.forEach((sticker) => {
    drawSticker(ctx, sticker, width, height);
  });

  // 5. Draw Watermark
  if (state.includeWatermark) {
    drawWatermark(ctx, width, height);
  }
}
