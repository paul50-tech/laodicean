import test from 'node:test';
import assert from 'node:assert/strict';
import {
  containsBannedWords,
  DEFAULT_BANNED_WORDS,
} from './bannedWords';

test('containsBannedWords detects single banned word with word boundaries', () => {
  const result = containsBannedWords('Hello campus, this is an illegal doxx attempt', ['doxx']);
  assert.strictEqual(result.hasBannedWord, true);
  assert.strictEqual(result.matchedWord, 'doxx');
});

test('containsBannedWords does not false-positive on partial word containing substring', () => {
  // "orthodox" contains "dox", but "doxx" shouldn't trigger
  const result = containsBannedWords('The orthodox church in Juja', ['doxx']);
  assert.strictEqual(result.hasBannedWord, false);
});

test('containsBannedWords detects multi-word restricted phrases', () => {
  const result = containsBannedWords(
    'Anyone interested in exam leak for third year engineering?',
    DEFAULT_BANNED_WORDS
  );
  assert.strictEqual(result.hasBannedWord, true);
  assert.strictEqual(result.matchedWord, 'exam leak');
});

test('containsBannedWords returns false for clean student discussion', () => {
  const cleanText = 'Studying in the library for tomorrow 8 AM lecture at Tech Park with chapos.';
  const result = containsBannedWords(cleanText, DEFAULT_BANNED_WORDS);
  assert.strictEqual(result.hasBannedWord, false);
  assert.strictEqual(result.matchedWord, undefined);
});
