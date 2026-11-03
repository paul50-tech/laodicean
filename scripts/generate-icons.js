import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

// Ensure public directory exists
const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Minimal CRC32 table calculation
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c >>> 0;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const toCrc = chunk.subarray(4, 8 + len);
  const crcVal = crc32(toCrc);
  chunk.writeUInt32BE(crcVal, 8 + len);
  return chunk;
}

/**
 * Creates an RGBA PNG buffer with an emerald background, gold badge & styled letter L
 */
function createPngIcon(size, isMaskable = false) {
  const width = size;
  const height = size;
  const rawBytes = Buffer.alloc((width * 4 + 1) * height);

  const cx = width / 2;
  const cy = height / 2;
  const radius = isMaskable ? width * 0.48 : width * 0.44;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * (width * 4 + 1);
    rawBytes[rowOffset] = 0; // Filter: None

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Default background: Emerald green gradient (#064E3B to #047857)
      const gradRatio = (x + y) / (width + height);
      let r = Math.round(6 + gradRatio * 20); // ~#064e3b -> #1a6b4c
      let g = Math.round(78 + gradRatio * 42);
      let b = Math.round(59 + gradRatio * 28);
      let a = 255;

      if (!isMaskable && dist > radius) {
        // Antialiased circle edge for standard icon
        const edge = dist - radius;
        if (edge < 1.5) {
          a = Math.max(0, Math.min(255, Math.round((1.5 - edge) / 1.5 * 255)));
        } else {
          a = 0;
        }
      }

      // Draw stylized golden mortarboard cap & letter 'L' in center
      // Normalize coords to [-1, 1] relative to center
      const nx = dx / (width * 0.5);
      const ny = dy / (height * 0.5);

      // Gold campus accent dot/cap (around top: ny between -0.45 and -0.25)
      const capDist = Math.hypot(nx, ny + 0.35);
      if (capDist < 0.16) {
        r = 245; // Amber/Gold #f59e0b
        g = 158;
        b = 11;
      }

      // Bold stylized 'L' shape:
      // Vertical bar: nx between -0.22 and -0.06, ny between -0.15 and 0.35
      const inVertical = nx >= -0.22 && nx <= -0.06 && ny >= -0.15 && ny <= 0.35;
      // Horizontal bar: nx between -0.22 and 0.24, ny between 0.21 and 0.35
      const inHorizontal = nx >= -0.22 && nx <= 0.24 && ny >= 0.21 && ny <= 0.35;
      // Small pulse dot / sparkle on the right
      const inSparkle = Math.hypot(nx - 0.20, ny - 0.05) < 0.08;

      if (inVertical || inHorizontal || inSparkle) {
        r = 255;
        g = 255;
        b = 255;
        a = 255;
      }

      rawBytes[pxOffset] = r;
      rawBytes[pxOffset + 1] = g;
      rawBytes[pxOffset + 2] = b;
      rawBytes[pxOffset + 3] = a;
    }
  }

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // IDAT chunk
  const compressed = zlib.deflateSync(rawBytes, { level: 9 });
  const idatChunk = makeChunk('IDAT', compressed);

  // IEND chunk
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Generate the required icon sizes
const icons = [
  { file: 'pwa-192x192.png', size: 192, maskable: false },
  { file: 'pwa-512x512.png', size: 512, maskable: false },
  { file: 'pwa-maskable-512x512.png', size: 512, maskable: true },
  { file: 'apple-touch-icon.png', size: 180, maskable: true },
  { file: 'favicon-32x32.png', size: 32, maskable: false },
];

for (const icon of icons) {
  const filePath = path.join(publicDir, icon.file);
  const buf = createPngIcon(icon.size, icon.maskable);
  fs.writeFileSync(filePath, buf);
  console.log(`Generated: ${icon.file} (${buf.length} bytes)`);
}
