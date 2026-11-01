import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculatePollPercentages,
  validatePollInput,
  recordLocalPollVote,
  SEED_JUJA_POLL_DATA,
} from './polls';
import { PollWithResults } from '../types';

test('calculatePollPercentages handles zero total votes safely', () => {
  const options = [
    { id: 'opt-1', votes_count: 0 },
    { id: 'opt-2', votes_count: 0 },
    { id: 'opt-3', votes_count: 0 },
  ];

  const percentages = calculatePollPercentages(options);
  assert.equal(percentages['opt-1'], 0);
  assert.equal(percentages['opt-2'], 0);
  assert.equal(percentages['opt-3'], 0);
});

test('calculatePollPercentages calculates 100% when only one option has votes', () => {
  const options = [
    { id: 'opt-1', votes_count: 10 },
    { id: 'opt-2', votes_count: 0 },
  ];

  const percentages = calculatePollPercentages(options);
  assert.equal(percentages['opt-1'], 100);
  assert.equal(percentages['opt-2'], 0);
});

test('calculatePollPercentages computes multi-option distribution', () => {
  const options = [
    { id: 'opt-1', votes_count: 50 },
    { id: 'opt-2', votes_count: 25 },
    { id: 'opt-3', votes_count: 25 },
  ];

  const percentages = calculatePollPercentages(options);
  assert.equal(percentages['opt-1'], 50);
  assert.equal(percentages['opt-2'], 25);
  assert.equal(percentages['opt-3'], 25);
});

test('validatePollInput enforces question requirements', () => {
  const emptyQ = validatePollInput({
    question: '   ',
    options: ['Gate A', 'Gate C'],
  });
  assert.equal(emptyQ.isValid, false);
  assert.ok(emptyQ.error?.includes('poll question'));

  const shortQ = validatePollInput({
    question: 'Why?',
    options: ['Yes', 'No'],
  });
  assert.equal(shortQ.isValid, false);
  assert.ok(shortQ.error?.includes('at least 5 characters'));
});

test('validatePollInput enforces 2 to 6 options requirement', () => {
  // Only 1 option
  const oneOpt = validatePollInput({
    question: 'Best chapo spot in Juja?',
    options: ['Only Gate C'],
  });
  assert.equal(oneOpt.isValid, false);
  assert.ok(oneOpt.error?.includes('at least 2 options'));

  // 7 options (exceeds max 6)
  const sevenOpts = validatePollInput({
    question: 'Best chapo spot in Juja?',
    options: ['Opt 1', 'Opt 2', 'Opt 3', 'Opt 4', 'Opt 5', 'Opt 6', 'Opt 7'],
  });
  assert.equal(sevenOpts.isValid, false);
  assert.ok(sevenOpts.error?.includes('more than 6 options'));

  // Valid 2 to 6 options
  const validTwo = validatePollInput({
    question: 'Best study library in JKUAT?',
    options: ['Postgrad Library', 'Main Library'],
  });
  assert.equal(validTwo.isValid, true);
  assert.equal(validTwo.error, null);

  const validFour = validatePollInput({
    question: 'Preferred breakfast combo?',
    options: ['Mandazi + Tea', 'Chapo + Ndengu', 'Smokie Pasua', 'Samosa'],
  });
  assert.equal(validFour.isValid, true);
});

test('validatePollInput rejects duplicate options', () => {
  const duplicate = validatePollInput({
    question: 'Where should we go tonight?',
    options: ['Gate A Smokie', 'Gate C Chapo', 'gate a smokie'],
  });
  assert.equal(duplicate.isValid, false);
  assert.ok(duplicate.error?.includes('Duplicate option'));
});

test('recordLocalPollVote increments count, updates percentage bars, and sets user voted option', () => {
  const testPoll: PollWithResults = {
    id: 'test-poll-1',
    post_id: 'test-post-1',
    question: 'Where is the best smokie pasua?',
    options: [
      {
        id: 'opt-1',
        poll_id: 'test-poll-1',
        option_text: 'Gate A',
        position: 0,
        votes_count: 1,
        percentage: 50,
      },
      {
        id: 'opt-2',
        poll_id: 'test-poll-1',
        option_text: 'Gate C',
        position: 1,
        votes_count: 1,
        percentage: 50,
      },
    ],
    total_votes: 2,
    user_voted_option_id: null,
  };

  const res = recordLocalPollVote(testPoll, 'opt-1', 'user-123');
  assert.equal(res.success, true);
  assert.equal(res.poll.total_votes, 3);
  assert.equal(res.poll.user_voted_option_id, 'opt-1');

  const opt1 = res.poll.options.find((o) => o.id === 'opt-1');
  const opt2 = res.poll.options.find((o) => o.id === 'opt-2');

  assert.equal(opt1?.votes_count, 2);
  assert.equal(opt1?.percentage, 67); // 2/3 = 67%
  assert.equal(opt2?.votes_count, 1);
  assert.equal(opt2?.percentage, 33); // 1/3 = 33%
});

test('recordLocalPollVote prevents double voting on the same poll', () => {
  const votedPoll: PollWithResults = {
    ...SEED_JUJA_POLL_DATA,
    user_voted_option_id: 'opt-gate-c-chapo',
  };

  const attempt = recordLocalPollVote(votedPoll, 'opt-gate-a-smokie', 'user-456');
  assert.equal(attempt.success, false);
  assert.ok(attempt.error?.includes('already voted'));
});
