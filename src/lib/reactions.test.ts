import { test } from 'node:test';
import assert from 'node:assert';
import { calculateReactionSwitch } from './reactions';
import { ReactionCounts } from '../types';

test('calculateReactionSwitch handles first reaction correctly', () => {
  const initialCounts: ReactionCounts = { laugh: 5, relatable: 3, fire: 8, total: 16 };

  // Reacting with "laugh"
  const result = calculateReactionSwitch(null, 'laugh', initialCounts);
  assert.strictEqual(result.newReaction, 'laugh');
  assert.strictEqual(result.newCounts.laugh, 6);
  assert.strictEqual(result.newCounts.relatable, 3);
  assert.strictEqual(result.newCounts.fire, 8);
  assert.strictEqual(result.newCounts.total, 17);
});

test('calculateReactionSwitch toggles off when clicking active reaction', () => {
  const initialCounts: ReactionCounts = { laugh: 6, relatable: 3, fire: 8, total: 17 };

  // User currently has 'laugh' and clicks 'laugh' again
  const result = calculateReactionSwitch('laugh', 'laugh', initialCounts);
  assert.strictEqual(result.newReaction, null);
  assert.strictEqual(result.newCounts.laugh, 5);
  assert.strictEqual(result.newCounts.relatable, 3);
  assert.strictEqual(result.newCounts.fire, 8);
  assert.strictEqual(result.newCounts.total, 16);
});

test('calculateReactionSwitch switches one reaction per user per post smoothly', () => {
  const initialCounts: ReactionCounts = { laugh: 5, relatable: 10, fire: 2, total: 17 };

  // User currently has 'relatable' ("ni kweli") and switches to 'fire'
  const result = calculateReactionSwitch('relatable', 'fire', initialCounts);
  assert.strictEqual(result.newReaction, 'fire');
  assert.strictEqual(result.newCounts.relatable, 9); // Decremented old
  assert.strictEqual(result.newCounts.fire, 3); // Incremented new
  assert.strictEqual(result.newCounts.laugh, 5); // Unchanged
  assert.strictEqual(result.newCounts.total, 17); // Total remains 17!
});

test('calculateReactionSwitch prevents negative counts', () => {
  const initialCounts: ReactionCounts = { laugh: 0, relatable: 0, fire: 0, total: 0 };

  const result = calculateReactionSwitch('laugh', 'laugh', initialCounts);
  assert.strictEqual(result.newReaction, null);
  assert.strictEqual(result.newCounts.laugh, 0);
  assert.strictEqual(result.newCounts.total, 0);
});
