import test from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateRateLimit,
  RATE_LIMIT_CONFIGS,
  RateLimitConfig,
} from './rateLimit';

test('evaluateRateLimit allows action when timestamp history is empty', () => {
  const config = RATE_LIMIT_CONFIGS.post;
  const result = evaluateRateLimit([], config, 100000);
  assert.strictEqual(result.allowed, true);
  assert.strictEqual(result.waitSeconds, 0);
  assert.strictEqual(result.message, null);
  assert.strictEqual(result.remainingInWindow, 2);
});

test('evaluateRateLimit allows actions within limit', () => {
  const config = RATE_LIMIT_CONFIGS.post; // max 2 per 3 min
  const now = 500000;
  const history = [now - 60000]; // 1 action 1 min ago
  const result = evaluateRateLimit(history, config, now);
  assert.strictEqual(result.allowed, true);
  assert.strictEqual(result.remainingInWindow, 1);
});

test('evaluateRateLimit blocks action when limit is reached and calculates waitSeconds', () => {
  const config = RATE_LIMIT_CONFIGS.post; // max 2 in 180s (180,000ms)
  const now = 500000;
  // Two actions: one 30s ago, one 60s ago
  const history = [now - 60000, now - 30000];
  const result = evaluateRateLimit(history, config, now);

  assert.strictEqual(result.allowed, false);
  // Oldest in window was at now - 60000. It expires at now - 60000 + 180000 = now + 120000 (120s)
  assert.strictEqual(result.waitSeconds, 120);
  assert.ok(result.message?.includes('120s'));
  assert.ok(result.message?.includes('Anti-Spam'));
  assert.strictEqual(result.remainingInWindow, 0);
});

test('evaluateRateLimit ignores timestamps older than the sliding window', () => {
  const config = RATE_LIMIT_CONFIGS.comment; // max 5 per 120s (120,000ms)
  const now = 1000000;
  // 5 old timestamps (> 120s ago) and 1 recent timestamp (10s ago)
  const history = [
    now - 200000,
    now - 190000,
    now - 180000,
    now - 150000,
    now - 130000,
    now - 10000,
  ];

  const result = evaluateRateLimit(history, config, now);
  assert.strictEqual(result.allowed, true);
  assert.strictEqual(result.remainingInWindow, 4);
});
