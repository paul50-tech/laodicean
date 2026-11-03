import test from 'node:test';
import assert from 'node:assert';
import {
  validateReportInput,
  submitReport,
  validateReportInput as validateReport,
  SEED_REPORTS,
  SEED_PERSONAS_DIRECTORY,
  getLocalReports,
  shouldAutoHide,
} from './moderation';
import { ReportReason } from '../types';

test('validateReportInput accepts valid reasons and optional details under 500 chars', () => {
  const validReasons: ReportReason[] = [
    'spam',
    'harassment',
    'hate_speech',
    'misinformation',
    'other',
  ];

  for (const r of validReasons) {
    const res = validateReportInput(r, 'This violates campus rules');
    assert.strictEqual(res.isValid, true);
    assert.strictEqual(res.error, null);
  }
});

test('validateReportInput rejects invalid reasons or excessive details', () => {
  const badReason = validateReportInput('bad_reason');
  assert.strictEqual(badReason.isValid, false);
  assert.match(badReason.error || '', /valid reason/);

  const longDetails = 'a'.repeat(505);
  const badDetails = validateReportInput('spam', longDetails);
  assert.strictEqual(badDetails.isValid, false);
  assert.match(badDetails.error || '', /500 characters or less/);
});

test('SEED_REPORTS contains valid initial reports with target snippets', () => {
  assert.ok(SEED_REPORTS.length >= 2);
  const first = SEED_REPORTS[0];
  assert.strictEqual(first.status, 'pending');
  assert.ok(first.target_snippet.length > 0);
  assert.ok(first.target_author_real_name);
  assert.ok(first.target_author_persona);
});

test('SEED_PERSONAS_DIRECTORY maps personas to real names for admin unmasking', () => {
  assert.ok(SEED_PERSONAS_DIRECTORY.length >= 3);
  const scholar = SEED_PERSONAS_DIRECTORY.find((p) => p.persona_name === '@backrow_scholar');
  assert.ok(scholar);
  assert.strictEqual(scholar.real_name, 'Kevin Omondi');

  const inspector = SEED_PERSONAS_DIRECTORY.find((p) => p.persona_name === '@gate_c_inspector');
  assert.ok(inspector);
  assert.strictEqual(inspector.real_name, 'Joy Wambui');
});

test('shouldAutoHide correctly evaluates report threshold', () => {
  assert.strictEqual(shouldAutoHide(1, 3), false);
  assert.strictEqual(shouldAutoHide(2, 3), false);
  assert.strictEqual(shouldAutoHide(3, 3), true);
  assert.strictEqual(shouldAutoHide(5, 3), true);
  assert.strictEqual(shouldAutoHide(2, 2), true);
});

