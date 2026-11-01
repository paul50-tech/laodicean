import { test } from 'node:test';
import assert from 'node:assert';
import {
  validateCommentInput,
  buildCommentTree,
  countAllComments,
} from './comments';
import { CommentWithAuthor } from '../types';

test('validateCommentInput rejects empty comments and accepts valid campus comments', () => {
  const empty = validateCommentInput('');
  assert.strictEqual(empty.isValid, false);
  assert.match(empty.error || '', /cannot be empty/);

  const whitespace = validateCommentInput('     ');
  assert.strictEqual(whitespace.isValid, false);
  assert.match(whitespace.error || '', /cannot be empty/);

  const tooLong = validateCommentInput('A'.repeat(2001));
  assert.strictEqual(tooLong.isValid, false);
  assert.match(tooLong.error || '', /2,000 characters or less/);

  const valid = validateCommentInput('Gate C chapo is the real deal.');
  assert.strictEqual(valid.isValid, true);
  assert.strictEqual(valid.error, null);
});

test('buildCommentTree organizes flat comments into nested threaded replies', () => {
  const flat: CommentWithAuthor[] = [
    {
      id: 'root-1',
      post_id: 'post-1',
      author_id: 'user-1',
      parent_id: null,
      body: 'Root comment 1',
      is_persona: false,
      created_at: '2026-10-31T01:00:00Z',
    },
    {
      id: 'reply-1',
      post_id: 'post-1',
      author_id: 'user-2',
      parent_id: 'root-1', // Reply to root-1
      body: 'Reply to root 1',
      is_persona: true,
      persona_name: '@campus_insider',
      created_at: '2026-10-31T01:05:00Z',
    },
    {
      id: 'nested-reply-1',
      post_id: 'post-1',
      author_id: 'user-3',
      parent_id: 'reply-1', // Nested reply to reply-1
      body: 'Nested reply to reply 1',
      is_persona: false,
      created_at: '2026-10-31T01:10:00Z',
    },
    {
      id: 'root-2',
      post_id: 'post-1',
      author_id: 'user-4',
      parent_id: null,
      body: 'Root comment 2',
      is_persona: true,
      persona_name: '@juja_ninja',
      created_at: '2026-10-31T01:15:00Z',
    },
  ];

  const tree = buildCommentTree(flat);

  // Expect 2 root comments
  assert.strictEqual(tree.length, 2);
  assert.strictEqual(tree[0].id, 'root-1');
  assert.strictEqual(tree[1].id, 'root-2');

  // root-1 should have 1 reply
  assert.strictEqual(tree[0].replies?.length, 1);
  const firstReply = tree[0].replies![0];
  assert.strictEqual(firstReply.id, 'reply-1');

  // reply-1 should have 1 nested reply
  assert.strictEqual(firstReply.replies?.length, 1);
  assert.strictEqual(firstReply.replies![0].id, 'nested-reply-1');

  // Total count should be 4
  assert.strictEqual(countAllComments(tree), 4);
});
