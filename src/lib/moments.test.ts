import { test } from 'node:test';
import assert from 'node:assert';
import {
  isMomentActive,
  filterActiveMoments,
  calculateTimeRemaining,
  validateMomentInput,
  createMusheneMoment,
} from './moments';
import { MusheneMoment } from '../types';

test('isMomentActive correctly identifies unexpired vs expired moments', () => {
  const now = 1700000000000;

  const activeMoment: MusheneMoment = {
    id: 'm-1',
    author_id: 'a-1',
    author_name: '@juja_hawk',
    author_avatar: '⚡',
    is_persona: true,
    text: 'Street gossip testing',
    created_at: new Date(now - 1000 * 60 * 60 * 2).toISOString(),
    expires_at: new Date(now + 1000 * 60 * 60 * 22).toISOString(), // 22 hours left
  };

  const expiredMoment: MusheneMoment = {
    id: 'm-2',
    author_id: 'a-2',
    author_name: '@chapo_king',
    author_avatar: '🍜',
    is_persona: true,
    text: 'Old yesterday story',
    created_at: new Date(now - 1000 * 60 * 60 * 25).toISOString(),
    expires_at: new Date(now - 1000 * 60 * 60 * 1).toISOString(), // Expired 1 hour ago
  };

  assert.strictEqual(isMomentActive(activeMoment, now), true);
  assert.strictEqual(isMomentActive(expiredMoment, now), false);
});

test('filterActiveMoments discards expired moments and preserves newest first', () => {
  const now = 1700000000000;

  const moments: MusheneMoment[] = [
    {
      id: 'm-old',
      author_id: 'a-1',
      author_name: '@first',
      author_avatar: '🎓',
      is_persona: true,
      text: 'First post',
      created_at: new Date(now - 1000 * 60 * 60 * 10).toISOString(),
      expires_at: new Date(now + 1000 * 60 * 60 * 14).toISOString(),
    },
    {
      id: 'm-expired',
      author_id: 'a-2',
      author_name: '@expired',
      author_avatar: '💀',
      is_persona: true,
      text: 'Expired post',
      created_at: new Date(now - 1000 * 60 * 60 * 26).toISOString(),
      expires_at: new Date(now - 1000 * 60 * 60 * 2).toISOString(),
    },
    {
      id: 'm-new',
      author_id: 'a-3',
      author_name: '@newest',
      author_avatar: '🔥',
      is_persona: true,
      text: 'Fresh post',
      created_at: new Date(now - 1000 * 60 * 60 * 1).toISOString(),
      expires_at: new Date(now + 1000 * 60 * 60 * 23).toISOString(),
    },
  ];

  const filtered = filterActiveMoments(moments, now);
  assert.strictEqual(filtered.length, 2);
  assert.strictEqual(filtered[0].id, 'm-new');
  assert.strictEqual(filtered[1].id, 'm-old');
});

test('calculateTimeRemaining returns clean human-friendly time or Expired', () => {
  const now = 1700000000000;

  const in30Min = new Date(now + 1000 * 60 * 30).toISOString();
  assert.strictEqual(calculateTimeRemaining(in30Min, now), '30m left');

  const in8Hours = new Date(now + 1000 * 60 * 60 * 8).toISOString();
  assert.strictEqual(calculateTimeRemaining(in8Hours, now), '8h left');

  const alreadyPast = new Date(now - 1000 * 60).toISOString();
  assert.strictEqual(calculateTimeRemaining(alreadyPast, now), 'Expired');
});

test('validateMomentInput verifies length constraints', () => {
  assert.strictEqual(validateMomentInput('').isValid, false);
  assert.strictEqual(validateMomentInput('hi').isValid, false); // < 3 chars
  assert.strictEqual(validateMomentInput('Fresh samosas at Gate A!').isValid, true);
  assert.strictEqual(validateMomentInput('a'.repeat(300)).isValid, false); // > 280 chars
});

test('createMusheneMoment generates 24-hour expiration exactly', () => {
  const baseTime = 1700000000000;
  const moment = createMusheneMoment({
    authorId: 'u-123',
    authorName: '@campus_whisper',
    authorAvatar: '🗣️',
    isPersona: true,
    authorRealName: 'Kevin O.',
    text: 'Secret study room discovered in library basement',
    now: baseTime,
  });

  const expectedExpiry = new Date(baseTime + 24 * 60 * 60 * 1000).toISOString();
  assert.strictEqual(moment.expires_at, expectedExpiry);
  assert.strictEqual(moment.is_persona, true);
  assert.strictEqual(moment.author_real_name, 'Kevin O.');
  assert.strictEqual(moment.text, 'Secret study room discovered in library basement');
});
