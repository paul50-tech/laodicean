import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateGuestBloggerInput,
  createGuestBloggerAccount,
  approvePendingPost,
  sendBackPendingPost,
  SEED_GUEST_BLOGGERS,
  SEED_PENDING_POSTS,
} from './guestBloggers';

test('SEED_GUEST_BLOGGERS has valid preconfigured campus partner accounts', () => {
  assert.ok(SEED_GUEST_BLOGGERS.length >= 2);
  for (const blogger of SEED_GUEST_BLOGGERS) {
    assert.ok(blogger.id);
    assert.ok(blogger.display_name);
    assert.ok(blogger.email.includes('@'));
    assert.ok(blogger.persona_name.startsWith('@'));
    assert.equal(blogger.require_review, true);
    assert.equal(blogger.status, 'active');
  }
});

test('SEED_PENDING_POSTS has valid submissions awaiting admin review', () => {
  assert.ok(SEED_PENDING_POSTS.length >= 2);
  for (const post of SEED_PENDING_POSTS) {
    assert.ok(post.id);
    assert.equal(post.status, 'pending');
    assert.equal(post.author_role, 'guest_blogger');
    assert.ok(post.title);
    assert.ok(post.body);
  }
});

test('validateGuestBloggerInput validates display name, email and persona', () => {
  const valid = validateGuestBloggerInput({
    display_name: 'Jane Doe',
    email: 'jane@jkuat.ac.ke',
    persona_name: '@jane_lens',
    bio: 'Campus photographer',
  });
  assert.equal(valid.isValid, true);
  assert.equal(valid.error, null);

  const missingName = validateGuestBloggerInput({
    display_name: '',
    email: 'jane@jkuat.ac.ke',
    persona_name: '@jane_lens',
  });
  assert.equal(missingName.isValid, false);
  assert.match(missingName.error || '', /name.*at least 2 characters/i);

  const invalidEmail = validateGuestBloggerInput({
    display_name: 'Jane Doe',
    email: 'not-an-email',
    persona_name: '@jane_lens',
  });
  assert.equal(invalidEmail.isValid, false);
  assert.match(invalidEmail.error || '', /valid email/i);

  const missingPersona = validateGuestBloggerInput({
    display_name: 'Jane Doe',
    email: 'jane@jkuat.ac.ke',
    persona_name: ' ',
  });
  assert.equal(missingPersona.isValid, false);
  assert.match(missingPersona.error || '', /persona or alias/i);
});

test('approvePendingPost approves a pending post and returns it as live', () => {
  const targetId = SEED_PENDING_POSTS[0].id;
  const result = approvePendingPost(targetId, 'admin');

  assert.equal(result.success, true);
  assert.ok(result.approvedPost);
  assert.equal(result.approvedPost.id, targetId);
  assert.equal(result.approvedPost.status, 'live');
  assert.ok(result.approvedPost.reviewed_at);
});

test('sendBackPendingPost enforces feedback notes and sets status to rejected', () => {
  const targetId = SEED_PENDING_POSTS[1].id;

  const noFeedback = sendBackPendingPost(targetId, '');
  assert.equal(noFeedback.success, false);
  assert.match(noFeedback.error || '', /provide editorial notes/i);

  const withFeedback = sendBackPendingPost(targetId, 'Please tone down the all-caps and add safety advice.');
  assert.equal(withFeedback.success, true);
  assert.ok(withFeedback.updatedPost);
  assert.equal(withFeedback.updatedPost.status, 'rejected');
  assert.equal(withFeedback.updatedPost.review_feedback, 'Please tone down the all-caps and add safety advice.');
});
