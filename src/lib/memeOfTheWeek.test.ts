import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_MEME_OF_WEEK_CONTEST,
  calculateMemeVotePercentages,
  getWinningMemeCandidate,
  voteForMemeCandidate,
  pinWinningMeme,
} from './memeOfTheWeek';

test('DEFAULT_MEME_OF_WEEK_CONTEST has 3 campus meme candidates and valid winner', () => {
  assert.equal(DEFAULT_MEME_OF_WEEK_CONTEST.candidates.length, 3);
  assert.ok(DEFAULT_MEME_OF_WEEK_CONTEST.pinnedWinnerPostId);
  assert.ok(DEFAULT_MEME_OF_WEEK_CONTEST.totalVotes > 0);

  const winner = getWinningMemeCandidate(DEFAULT_MEME_OF_WEEK_CONTEST);
  assert.ok(winner);
  assert.equal(winner.postId, DEFAULT_MEME_OF_WEEK_CONTEST.pinnedWinnerPostId);
});

test('calculateMemeVotePercentages distributes percentages cleanly to 100', () => {
  const candidates = [
    { id: '1', postId: 'p1', title: 'A', imageUrl: '', authorName: '', votesCount: 50, captionSnippet: '' },
    { id: '2', postId: 'p2', title: 'B', imageUrl: '', authorName: '', votesCount: 30, captionSnippet: '' },
    { id: '3', postId: 'p3', title: 'C', imageUrl: '', authorName: '', votesCount: 20, captionSnippet: '' },
  ];

  const p = calculateMemeVotePercentages(candidates);
  assert.equal(p['1'], 50);
  assert.equal(p['2'], 30);
  assert.equal(p['3'], 20);
});

test('voteForMemeCandidate increments vote and updates winner candidate', () => {
  const result = voteForMemeCandidate('cand-1');
  assert.equal(result.success, true);
  assert.equal(result.contest.userVotedCandidateId, 'cand-1');

  const cand1 = result.contest.candidates.find((c) => c.id === 'cand-1');
  assert.ok(cand1);
  assert.ok(cand1.votesCount > 142);
});

test('pinWinningMeme allows manual pinning of any candidate', () => {
  const result = pinWinningMeme('seed-juja-meme-2');
  assert.equal(result.success, true);
  assert.equal(result.contest.pinnedWinnerPostId, 'seed-juja-meme-2');

  const winner = getWinningMemeCandidate(result.contest);
  assert.ok(winner);
  assert.equal(winner.postId, 'seed-juja-meme-2');
});
