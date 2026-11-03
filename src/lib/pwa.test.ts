import test from 'node:test';
import assert from 'node:assert/strict';
import {
  saveOfflineFeedCache,
  getOfflineFeedCache,
  isStandaloneDisplayMode,
  formatInstallPromptOutcome,
} from './pwaHelpers';
import { FeedPost } from '../types';

test('saveOfflineFeedCache and getOfflineFeedCache safely store and retrieve posts in memory / storage', () => {
  const samplePosts: FeedPost[] = [
    {
      id: 'cache-test-1',
      community_id: 'juja-id',
      community_name: 'Juja',
      community_slug: 'juja',
      post_type: 'story',
      title: 'Offline Test Title',
      body: 'Testing offline feed persistence during campus network drops.',
      is_persona: false,
      persona_name: '@campus_pulse',
      persona_avatar: '🎓',
      author_role: 'user',
      status: 'live',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      reactions_count: { laugh: 5, relatable: 10, fire: 3, total: 18 },
      comments_count: 4,
    },
  ];

  saveOfflineFeedCache(samplePosts);
  const retrieved = getOfflineFeedCache();
  assert.ok(Array.isArray(retrieved));
  assert.strictEqual(retrieved.length, 1);
  assert.strictEqual(retrieved[0].id, 'cache-test-1');
  assert.strictEqual(retrieved[0].title, 'Offline Test Title');
});

test('isStandaloneDisplayMode correctly returns false in non-browser environment', () => {
  const result = isStandaloneDisplayMode();
  assert.strictEqual(typeof result, 'boolean');
  assert.strictEqual(result, false);
});

test('formatInstallPromptOutcome returns clean human readable status', () => {
  assert.strictEqual(formatInstallPromptOutcome('accepted'), 'App successfully installed to home screen!');
  assert.strictEqual(formatInstallPromptOutcome('dismissed'), 'Installation cancelled. You can install anytime from the header.');
  assert.strictEqual(formatInstallPromptOutcome(undefined), 'Installation not supported or already installed.');
});
