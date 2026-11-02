import test from 'node:test';
import assert from 'node:assert/strict';
import { isPostFollowed, toggleFollowPost, getFollowedPostIds } from './postNotifications';

test('isPostFollowed returns boolean cleanly', () => {
  const result = isPostFollowed('seed-test-id');
  assert.equal(typeof result, 'boolean');
});

test('toggleFollowPost toggles post subscription status', () => {
  const postId = `test-post-${Date.now()}`;
  const first = toggleFollowPost(postId);
  assert.equal(first.isFollowed, true);

  const second = toggleFollowPost(postId);
  assert.equal(second.isFollowed, false);
});
