import test from 'node:test';
import assert from 'node:assert/strict';
import { BADGE_DEFINITIONS, getBadgeDetails, resolveAuthorBadges } from './badges';

test('BADGE_DEFINITIONS contains top storyteller, top commenter, and meme champion', () => {
  assert.ok(BADGE_DEFINITIONS.top_storyteller);
  assert.ok(BADGE_DEFINITIONS.top_commenter);
  assert.ok(BADGE_DEFINITIONS.meme_champion);

  assert.equal(BADGE_DEFINITIONS.top_storyteller.emoji, '📖');
  assert.equal(BADGE_DEFINITIONS.top_commenter.emoji, '💬');
  assert.equal(BADGE_DEFINITIONS.meme_champion.emoji, '🏆');
});

test('resolveAuthorBadges correctly honors explicit badges', () => {
  const badges = resolveAuthorBadges({
    explicitBadges: ['top_storyteller', 'meme_champion'],
  });

  const types = badges.map((b) => b.type);
  assert.equal(badges.length, 2);
  assert.ok(types.includes('top_storyteller'));
  assert.ok(types.includes('meme_champion'));
});

test('resolveAuthorBadges automatically awards meme champion when post is meme of week winner', () => {
  const badges = resolveAuthorBadges({
    isMemeWinner: true,
  });

  assert.ok(badges.some((b) => b.type === 'meme_champion'));
});

test('resolveAuthorBadges recognizes prominent campus personas', () => {
  const storyteller = resolveAuthorBadges({ personaName: '@engineer_sam' });
  assert.ok(storyteller.some((b) => b.type === 'top_storyteller'));

  const commenter = resolveAuthorBadges({ personaName: '@backrow_scholar' });
  assert.ok(commenter.some((b) => b.type === 'top_commenter'));

  const memeChamp = resolveAuthorBadges({ personaName: '@clutch_coder' });
  assert.ok(memeChamp.some((b) => b.type === 'meme_champion'));
});
