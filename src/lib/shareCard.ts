import { FeedPost } from '../types';

export interface CardTheme {
  id: string;
  name: string;
  bgGradientStart: string;
  bgGradientEnd: string;
  accentColor: string;
  accentTextColor: string;
  textColor: string;
  secondaryTextColor: string;
  cardBg: string;
  cardBorder: string;
  tagBg: string;
  tagText: string;
}

export const CARD_THEMES: CardTheme[] = [
  {
    id: 'midnight-neon',
    name: 'Midnight Neon',
    bgGradientStart: '#090d16',
    bgGradientEnd: '#04070c',
    accentColor: '#10b981',
    accentTextColor: '#022c22',
    textColor: '#f8fafc',
    secondaryTextColor: '#94a3b8',
    cardBg: '#0f172a',
    cardBorder: '#1e293b',
    tagBg: '#064e3b',
    tagText: '#6ee7b7',
  },
  {
    id: 'hot-mushene',
    name: 'Hot Mushene',
    bgGradientStart: '#1a0508',
    bgGradientEnd: '#2d0610',
    accentColor: '#f43f5e',
    accentTextColor: '#4c0519',
    textColor: '#fff1f2',
    secondaryTextColor: '#fca5a5',
    cardBg: '#3b0816',
    cardBorder: '#881337',
    tagBg: '#e11d48',
    tagText: '#ffffff',
  },
  {
    id: 'juja-tabloid',
    name: 'Street Meme',
    bgGradientStart: '#18181b',
    bgGradientEnd: '#09090b',
    accentColor: '#facc15',
    accentTextColor: '#422006',
    textColor: '#ffffff',
    secondaryTextColor: '#d4d4d8',
    cardBg: '#27272a',
    cardBorder: '#facc15',
    tagBg: '#facc15',
    tagText: '#000000',
  },
  {
    id: 'electric-violet',
    name: 'Cyber Persona',
    bgGradientStart: '#180828',
    bgGradientEnd: '#090214',
    accentColor: '#a855f7',
    accentTextColor: '#2e1065',
    textColor: '#faf5ff',
    secondaryTextColor: '#c084fc',
    cardBg: '#240f3e',
    cardBorder: '#581c87',
    tagBg: '#7e22ce',
    tagText: '#f3e8ff',
  },
];

export function getCardTheme(themeId: string): CardTheme {
  return CARD_THEMES.find((t) => t.id === themeId) || CARD_THEMES[0];
}

/**
 * Pure text wrapping algorithm for canvas rendering.
 * Breaks text into lines without splitting words, respecting a maximum character width.
 */
export function wrapTextLines(text: string, maxCharsPerLine: number = 32): string[] {
  if (!text) return [];
  const clean = text.replace(/[\r\n]+/g, ' ').trim();
  const words = clean.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if (!currentLine) {
      currentLine = word;
    } else if (currentLine.length + 1 + word.length <= maxCharsPerLine) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

/**
 * Formats community title for the card header
 */
export function formatCardCommunityName(post: FeedPost): string {
  const comm = (post.community_name || 'JUJA (JKUAT)').toUpperCase();
  return `${comm} · CAMPUS PULSE`;
}

/**
 * Builds post URL for the status card footer
 */
export function formatCardUrl(post: FeedPost, origin?: string): string {
  const base = origin || (typeof window !== 'undefined' ? window.location.origin : 'https://laodicean.app');
  return `${base.replace(/\/$/, '')}/post/${post.id}`;
}

/**
 * Extracts punchy headline and summary for card display
 */
export function extractCardContent(post: FeedPost): {
  badgeLabel: string;
  badgeEmoji: string;
  headline: string;
  teaserSnippet: string;
  authorLabel: string;
  stampText: string;
} {
  let badgeLabel = 'CAMPUS STORY';
  let badgeEmoji = '📝';
  let stampText = 'JUJA UNFILTERED';

  switch (post.post_type) {
    case 'poll':
      badgeLabel = 'JUJA CAMPUS POLL';
      badgeEmoji = '📊';
      stampText = 'HAVE YOUR SAY';
      break;
    case 'mushene':
      badgeLabel = 'JUJA STREET MUSHENE';
      badgeEmoji = '🗣️';
      stampText = '100% RAW JUICE';
      break;
    case 'confession':
      badgeLabel = 'ANONYMOUS CONFESSION';
      badgeEmoji = '🤫';
      stampText = 'PERSONA VERIFIED';
      break;
    case 'event':
      badgeLabel = 'JUJA CAMPUS EVENT';
      badgeEmoji = '📅';
      stampText = 'GOING LIVE';
      break;
    case 'meme':
      badgeLabel = 'CAMPUS MEME';
      badgeEmoji = '😂';
      stampText = 'PURE COMEDY';
      break;
    case 'photo':
      badgeLabel = 'CAMPUS MOMENT';
      badgeEmoji = '📸';
      stampText = 'CAMPUS SIGHTS';
      break;
  }

  const headline = post.title || (post.post_type === 'poll' ? post.body : post.body.slice(0, 100));
  const teaserSnippet = post.title && post.title !== post.body ? post.body : '';

  const authorLabel = post.is_persona
    ? `${post.persona_name || 'Anonymous Persona'}`
    : `${post.author_real_name || 'Campus Student'}`;

  return {
    badgeLabel,
    badgeEmoji,
    headline,
    teaserSnippet,
    authorLabel,
    stampText,
  };
}

/**
 * Helper to draw a rounded rectangle on a canvas context
 */
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/**
 * Draws the high-impact 1080x1920 Status Card onto a canvas.
 */
export async function renderStatusCardToCanvas(
  canvas: HTMLCanvasElement,
  post: FeedPost,
  themeId: string = 'midnight-neon',
  origin?: string
): Promise<void> {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const width = 1080;
  const height = 1920;
  canvas.width = width;
  canvas.height = height;

  const theme = getCardTheme(themeId);
  const cardData = extractCardContent(post);
  const shareUrl = formatCardUrl(post, origin);
  const communityName = formatCardCommunityName(post);

  // 1. Background Gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
  bgGrad.addColorStop(0, theme.bgGradientStart);
  bgGrad.addColorStop(1, theme.bgGradientEnd);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. Meme Accent Grid / Halftone Dot Pattern (subtle street vibe)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.025)';
  for (let x = 40; x < width; x += 60) {
    for (let y = 40; y < height; y += 60) {
      ctx.beginPath();
      ctx.arc(x, y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 3. Top Decorative Glow
  const glow = ctx.createRadialGradient(width / 2, 120, 10, width / 2, 120, 600);
  glow.addColorStop(0, theme.accentColor + '33');
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, 500);

  // 4. Header Section: Community Pill & Meme Sticker Stamp
  ctx.save();
  const headerY = 110;

  // Community Tag
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  drawRoundedRect(ctx, 80, headerY, 460, 64, 32);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Green active dot
  ctx.fillStyle = theme.accentColor;
  ctx.beginPath();
  ctx.arc(114, headerY + 32, 9, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 26px system-ui, -apple-system, sans-serif';
  ctx.fillText(communityName, 140, headerY + 41);

  // Meme Sticker Stamp on Top Right (tilted)
  ctx.save();
  ctx.translate(width - 240, headerY + 30);
  ctx.rotate((6 * Math.PI) / 180);
  ctx.fillStyle = theme.accentColor;
  drawRoundedRect(ctx, -140, -28, 280, 56, 12);
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = theme.accentTextColor;
  ctx.font = '900 24px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`⚡ ${cardData.stampText}`, 0, 9);
  ctx.restore();
  ctx.restore();

  // 5. Post Type & Author Bar
  const metaY = 220;
  ctx.fillStyle = theme.tagBg;
  drawRoundedRect(ctx, 80, metaY, 340, 56, 16);
  ctx.fill();
  ctx.fillStyle = theme.tagText;
  ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
  ctx.fillText(`${cardData.badgeEmoji}  ${cardData.badgeLabel}`, 104, metaY + 37);

  // Author & Time
  ctx.fillStyle = theme.secondaryTextColor;
  ctx.font = '500 26px system-ui, -apple-system, sans-serif';
  ctx.fillText(`by ${cardData.authorLabel}`, 450, metaY + 37);

  // 6. Main Content Card Container
  const cardX = 80;
  const cardY = 320;
  const cardW = width - 160; // 920px
  const cardH = 1180;

  // Drop shadow behind card
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  drawRoundedRect(ctx, cardX + 12, cardY + 16, cardW, cardH, 40);
  ctx.fill();

  // Card background
  ctx.fillStyle = theme.cardBg;
  drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 40);
  ctx.fill();
  ctx.strokeStyle = theme.cardBorder;
  ctx.lineWidth = 4;
  ctx.stroke();

  // 7. Card Content
  let currentY = cardY + 90;

  // Event Badges if event
  if (post.post_type === 'event' && post.event_data) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    drawRoundedRect(ctx, cardX + 50, currentY, cardW - 100, 100, 24);
    ctx.fill();

    ctx.fillStyle = theme.accentColor;
    ctx.font = 'bold 30px system-ui, -apple-system, sans-serif';
    ctx.fillText(`📅 ${post.event_data.event_date || 'Upcoming'}`, cardX + 80, currentY + 62);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px system-ui, -apple-system, sans-serif';
    ctx.fillText(`📍 ${post.event_data.event_place || 'Juja Campus'}`, cardX + 520, currentY + 62);

    currentY += 150;
  }

  // Big Bold Quotation Mark Motif for Mushene & Confessions
  if (post.post_type === 'mushene' || post.post_type === 'confession') {
    ctx.fillStyle = theme.accentColor + '44';
    ctx.font = 'italic bold 160px serif';
    ctx.fillText('“', cardX + 50, currentY + 80);
    currentY += 60;
  }

  // Headline / Question
  ctx.fillStyle = theme.textColor;
  ctx.font = '900 58px system-ui, -apple-system, sans-serif';
  const headlineLines = wrapTextLines(cardData.headline, 24);
  const maxHeadlineLines = post.post_type === 'poll' ? 4 : 5;

  for (let i = 0; i < Math.min(headlineLines.length, maxHeadlineLines); i++) {
    ctx.fillText(headlineLines[i], cardX + 60, currentY);
    currentY += 76;
  }

  currentY += 30;

  // Poll Options if Poll
  if (post.post_type === 'poll' && post.poll_data?.options) {
    const totalVotes = post.poll_data.total_votes || 0;
    const options = post.poll_data.options.slice(0, 4);

    currentY += 20;

    options.forEach((opt, idx) => {
      const votes = opt.votes_count || 0;
      const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
      const optY = currentY;
      const optH = 90;
      const optW = cardW - 120;

      // Option base pill
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      drawRoundedRect(ctx, cardX + 60, optY, optW, optH, 20);
      ctx.fill();

      // Progress bar fill
      if (pct > 0) {
        ctx.fillStyle = idx === 0 ? theme.accentColor + '88' : 'rgba(255, 255, 255, 0.2)';
        drawRoundedRect(ctx, cardX + 60, optY, Math.max(30, (optW * pct) / 100), optH, 20);
        ctx.fill();
      }

      // Border
      ctx.strokeStyle = idx === 0 ? theme.accentColor : 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 2;
      drawRoundedRect(ctx, cardX + 60, optY, optW, optH, 20);
      ctx.stroke();

      // Option Letter Tag
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 30px system-ui, -apple-system, sans-serif';
      const letter = String.fromCharCode(65 + idx); // A, B, C, D
      ctx.fillText(`${letter}.`, cardX + 85, optY + 56);

      // Option Text
      ctx.font = '600 28px system-ui, -apple-system, sans-serif';
      const optText = opt.option_text || '';
      const truncatedOpt = optText.length > 32 ? optText.slice(0, 30) + '...' : optText;
      ctx.fillText(truncatedOpt, cardX + 130, optY + 56);

      // Percentage
      ctx.font = '900 32px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`${pct}%`, cardX + 60 + optW - 30, optY + 58);
      ctx.textAlign = 'left';

      currentY += 115;
    });

    // Total Votes Badge
    ctx.fillStyle = theme.secondaryTextColor;
    ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
    ctx.fillText(`🗳️ ${totalVotes} campus students voted`, cardX + 60, currentY + 20);
  } else if (cardData.teaserSnippet) {
    // Teaser / Body snippet for other posts
    ctx.fillStyle = theme.secondaryTextColor;
    ctx.font = 'normal 34px system-ui, -apple-system, sans-serif';
    const teaserLines = wrapTextLines(cardData.teaserSnippet, 34);
    for (let i = 0; i < Math.min(teaserLines.length, 4); i++) {
      ctx.fillText(teaserLines[i], cardX + 60, currentY);
      currentY += 50;
    }
  }

  // Reactions count display on the card
  const rxY = cardY + cardH - 120;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  drawRoundedRect(ctx, cardX + 50, rxY, cardW - 100, 76, 20);
  ctx.fill();

  const rx = post.reactions_count;
  const fireCount = rx?.fire ?? 0;
  const laughCount = rx?.laugh ?? 0;
  const kweliCount = rx?.relatable ?? 0;
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 26px system-ui, -apple-system, sans-serif';
  ctx.fillText(
    `🔥 ${fireCount} Fire   ·   😂 ${laughCount} Laugh   ·   🤝 ${kweliCount} Ni Kweli`,
    cardX + 80,
    rxY + 48
  );

  ctx.fillStyle = theme.accentColor;
  ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`💬 ${post.comments_count || 0} Replies`, cardX + cardW - 80, rxY + 48);
  ctx.textAlign = 'left';

  // 8. Footer Section: Laodicean Branding & Share Link
  const footerY = 1560;

  // Brand Name & Slogan
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 48px system-ui, -apple-system, sans-serif';
  ctx.fillText('LAODICEAN', 80, footerY + 50);

  ctx.fillStyle = theme.accentColor;
  ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
  ctx.fillText('JUJA CAMPUS SOCIAL FEED · UNFILTERED', 80, footerY + 90);

  // Post Link Bar at Bottom
  const linkY = 1680;
  ctx.fillStyle = '#ffffff';
  drawRoundedRect(ctx, 80, linkY, width - 160, 110, 28);
  ctx.fill();

  ctx.fillStyle = '#09090b';
  ctx.font = '900 28px system-ui, -apple-system, sans-serif';
  ctx.fillText('📲 VIEW & JOIN THE DISCUSSION ON WHATSAPP / WEB', 120, linkY + 46);

  ctx.fillStyle = '#2563eb';
  ctx.font = 'bold 26px monospace';
  const cleanLink = shareUrl.length > 50 ? shareUrl.slice(0, 48) + '...' : shareUrl;
  ctx.fillText(cleanLink, 120, linkY + 84);

  // Arrow or action pill on right of link bar
  ctx.fillStyle = theme.accentColor;
  drawRoundedRect(ctx, width - 240, linkY + 22, 120, 66, 18);
  ctx.fill();
  ctx.fillStyle = theme.accentTextColor;
  ctx.font = '900 28px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('OPEN →', width - 180, linkY + 64);
  ctx.textAlign = 'left';

  // Copyright / watermark
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.font = '500 20px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Generated with Laodicean Juja Campus Cards · Share to WhatsApp Status', width / 2, 1850);
  ctx.textAlign = 'left';
}
