import test from 'node:test';
import assert from 'node:assert/strict';
import {
  wrapTextLines,
  formatCardCommunityName,
  formatCardUrl,
  extractCardContent,
  getCardTheme,
  CARD_THEMES,
} from './shareCard';
import { FeedPost } from '../types';

test('wrapTextLines splits text cleanly into lines within char limit', () => {
  const sample = 'The quick brown fox jumps over the lazy dog in Juja campus';
  const lines = wrapTextLines(sample, 20);

  assert.ok(lines.length > 1);
  for (const line of lines) {
    assert.ok(line.length <= 25, `Line too long: ${line}`);
  }
  // All words preserved
  assert.equal(lines.join(' '), sample);
});

test('wrapTextLines handles empty and short strings gracefully', () => {
  assert.deepEqual(wrapTextLines(''), []);
  assert.deepEqual(wrapTextLines('Hello Juja'), ['Hello Juja']);
});

test('formatCardCommunityName formats community title with fallback', () => {
  const dummyPost: FeedPost = {
    id: 'post-1',
    community_id: 'comm-1',
    community_name: 'Juja JKUAT',
    community_slug: 'juja',
    author_id: 'auth-1',
    is_persona: false,
    persona_name: '',
    author_real_name: 'John',
    author_role: 'user',
    post_type: 'story',
    title: 'Hello',
    body: 'World',
    status: 'live',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    reactions_count: { laugh: 0, relatable: 0, fire: 0, total: 0 },
  };

  assert.equal(formatCardCommunityName(dummyPost), 'JUJA JKUAT · CAMPUS PULSE');

  const fallbackPost = { ...dummyPost, community_name: '' };
  assert.equal(formatCardCommunityName(fallbackPost), 'JUJA (JKUAT) · CAMPUS PULSE');
});

test('formatCardUrl constructs valid post URL with origin', () => {
  const dummyPost: FeedPost = {
    id: 'post-test-123',
    community_id: 'comm-1',
    community_name: 'Juja',
    community_slug: 'juja',
    author_id: 'auth-1',
    is_persona: false,
    persona_name: '',
    author_role: 'user',
    post_type: 'mushene',
    body: 'Street talk',
    status: 'live',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    reactions_count: { laugh: 0, relatable: 0, fire: 0, total: 0 },
  };

  const url = formatCardUrl(dummyPost, 'https://laodicean.app');
  assert.equal(url, 'https://laodicean.app/post/post-test-123');
});

test('extractCardContent sets appropriate badge and stamp for different post types', () => {
  const pollPost: FeedPost = {
    id: 'poll-1',
    community_id: 'comm-1',
    community_name: 'Juja',
    community_slug: 'juja',
    author_id: 'auth-1',
    is_persona: true,
    persona_name: 'Voter X',
    author_role: 'user',
    post_type: 'poll',
    body: 'Which gate has the best food?',
    status: 'live',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    reactions_count: { laugh: 5, relatable: 10, fire: 2, total: 17 },
  };

  const pollContent = extractCardContent(pollPost);
  assert.equal(pollContent.badgeLabel, 'JUJA CAMPUS POLL');
  assert.equal(pollContent.badgeEmoji, '📊');
  assert.equal(pollContent.authorLabel, 'Voter X');

  const mushenePost: FeedPost = {
    ...pollPost,
    post_type: 'mushene',
    title: 'Boda rates',
    body: 'Stage guy asked for 100 bob',
  };

  const musheneContent = extractCardContent(mushenePost);
  assert.equal(musheneContent.badgeLabel, 'JUJA STREET MUSHENE');
  assert.equal(musheneContent.badgeEmoji, '🗣️');
  assert.equal(musheneContent.stampText, '100% RAW JUICE');
});

test('getCardTheme resolves valid themes and falls back to default', () => {
  const neon = getCardTheme('midnight-neon');
  assert.equal(neon.id, 'midnight-neon');

  const hot = getCardTheme('hot-mushene');
  assert.equal(hot.id, 'hot-mushene');

  const fallback = getCardTheme('nonexistent-theme');
  assert.equal(fallback.id, CARD_THEMES[0].id);
});
