import { test } from 'node:test';
import assert from 'node:assert';
import {
  calculateDimensions,
  formatFileSize,
  calculateSavingsPercent,
} from './imageCompression';

test('calculateDimensions maintains aspect ratio within bounding box', () => {
  // Portrait 3000x4000
  const portrait = calculateDimensions(3000, 4000, 1200, 1200);
  assert.strictEqual(portrait.height, 1200);
  assert.strictEqual(portrait.width, 900);

  // Landscape 4000x2000
  const landscape = calculateDimensions(4000, 2000, 1200, 1200);
  assert.strictEqual(landscape.width, 1200);
  assert.strictEqual(landscape.height, 600);

  // Already smaller image 600x400
  const small = calculateDimensions(600, 400, 1200, 1200);
  assert.strictEqual(small.width, 600);
  assert.strictEqual(small.height, 400);

  // Square 2400x2400
  const square = calculateDimensions(2400, 2400, 1200, 1200);
  assert.strictEqual(square.width, 1200);
  assert.strictEqual(square.height, 1200);
});

test('formatFileSize produces clean human-readable units', () => {
  assert.strictEqual(formatFileSize(0), '0 B');
  assert.strictEqual(formatFileSize(512), '512 B');
  assert.strictEqual(formatFileSize(1024), '1.0 KB');
  assert.strictEqual(formatFileSize(153600), '150.0 KB');
  assert.strictEqual(formatFileSize(3.4 * 1024 * 1024), '3.4 MB');
});

test('calculateSavingsPercent accurately computes compression efficiency', () => {
  // 5MB down to 150KB
  const orig = 5 * 1024 * 1024;
  const comp = 150 * 1024;
  const savings = calculateSavingsPercent(orig, comp);
  assert.strictEqual(savings, 97);

  // No change or negative savings
  assert.strictEqual(calculateSavingsPercent(1000, 1000), 0);
  assert.strictEqual(calculateSavingsPercent(1000, 1500), 0);
  assert.strictEqual(calculateSavingsPercent(0, 100), 0);
});
