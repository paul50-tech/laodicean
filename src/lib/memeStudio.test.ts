import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MEME_TEMPLATES,
  SHENG_STICKERS,
  getMemeFontSize,
  wrapMemeLines,
} from './memeStudio';

test('MEME_TEMPLATES has valid campus templates with default copy and gradients', () => {
  assert.ok(MEME_TEMPLATES.length >= 5);
  for (const t of MEME_TEMPLATES) {
    assert.ok(t.id, 'Template missing id');
    assert.ok(t.name, 'Template missing name');
    assert.ok(t.category, 'Template missing category');
    assert.ok(t.defaultTop, 'Template missing defaultTop');
    assert.ok(t.defaultBottom, 'Template missing defaultBottom');
    assert.equal(t.bgGradient.length, 2, 'Template gradient must have 2 stops');
    assert.ok(t.emoji, 'Template missing emoji');
  }
});

test('SHENG_STICKERS contains authentic Nairobi and Sheng phrases', () => {
  assert.ok(SHENG_STICKERS.length >= 8);
  const ids = SHENG_STICKERS.map((s) => s.id);
  assert.ok(ids.includes('kanyaga'), 'Missing Kanyaga sticker');
  assert.ok(ids.includes('mboka'), 'Missing Mboka sticker');
  assert.ok(ids.includes('dust_gang'), 'Missing Juja dust gang sticker');
  assert.ok(ids.includes('chapo_dengu'), 'Missing Chapo dengu sticker');

  for (const s of SHENG_STICKERS) {
    assert.ok(s.text.length > 3);
    assert.ok(s.bgColor.startsWith('#'));
    assert.ok(s.color.startsWith('#'));
  }
});

test('getMemeFontSize scales accurately by selected size', () => {
  const small = getMemeFontSize('small', 800);
  const medium = getMemeFontSize('medium', 800);
  const large = getMemeFontSize('large', 800);

  assert.equal(small, 36);
  assert.equal(medium, 46);
  assert.equal(large, 56);
  assert.ok(small < medium && medium < large);
});

test('wrapMemeLines wraps long text cleanly into uppercase chunks', () => {
  const singleLine = 'KANYAGA TWENDE';
  assert.deepEqual(wrapMemeLines(singleLine, 20), ['KANYAGA TWENDE']);

  const multiLine = 'WHEN YOU STUDY HARD FOR CALCULUS BUT EXAM COMES FROM ANOTHER UNIVERSE';
  const lines = wrapMemeLines(multiLine, 25);
  assert.ok(lines.length > 1);
  assert.equal(lines.join(' '), multiLine);
});

test('validatePostInput correctly validates Meme posts', async () => {
  const { validatePostInput } = await import('./posts');

  const valid = validatePostInput({
    title: 'GATE C SURVIVAL',
    body: 'Only real ones know',
    postType: 'meme',
    hasImage: true,
  });
  assert.equal(valid.isValid, true);

  const missingImage = validatePostInput({
    title: 'GATE C SURVIVAL',
    body: 'Only real ones know',
    postType: 'meme',
    hasImage: false,
  });
  assert.equal(missingImage.isValid, false);
  assert.match(missingImage.error || '', /meme image/i);
});

