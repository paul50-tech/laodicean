import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculatePostScore,
  rankCampusFeed,
  getTopTrendingPosts,
  computeCampusPulse,
} from './feedRanking';
import { FeedPost } from '../types';

const BASE_NOW = 1762080000000; // Fixed deterministic timestamp

function makeMockPost(overrides: Partial<FeedPost> = {}): FeedPost {
  return {
    id: `post-${Math.random().toString(36).substring(2, 7)}`,
    community_id: 'juja-id',
    community_name: 'Juja',
    community_slug: 'juja',
    post_type: 'story',
    title: 'Sample Post Title',
    body: 'Sample body text for campus post.',
    image_url: null,
    is_persona: false,
    status: 'live',
    created_at: new Date(BASE_NOW - 1000 * 60 * 60).toISOString(), // 1 hr ago
    updated_at: new Date(BASE_NOW - 1000 * 60 * 60).toISOString(),
    persona_name: '@student',
    persona_avatar: '🎓',
    author_id: 'user-1',
    author_real_name: 'Campus User',
    author_role: 'user',
    reactions_count: { laugh: 5, relatable: 10, fire: 5, total: 20 },
    comments_count: 4,
    ...overrides,
  };
}

test('calculatePostScore scores engagement and freshness accurately', () => {
  const freshViralPost = makeMockPost({
    created_at: new Date(BASE_NOW - 1000 * 60 * 30).toISOString(), // 30 min ago
    reactions_count: { laugh: 50, relatable: 50, fire: 50, total: 150 },
    comments_count: 40,
  });

  const stalePost = makeMockPost({
    created_at: new Date(BASE_NOW - 1000 * 60 * 60 * 48).toISOString(), // 48 hrs ago
    reactions_count: { laugh: 2, relatable: 2, fire: 1, total: 5 },
    comments_count: 1,
  });

  const freshScore = calculatePostScore(freshViralPost, BASE_NOW);
  const staleScore = calculatePostScore(stalePost, BASE_NOW);

  assert.equal(freshScore.isFresh, true);
  assert.equal(staleScore.isFresh, false);
  assert.ok(freshScore.velocity > staleScore.velocity);
  assert.ok(freshScore.finalScore > staleScore.finalScore);
});

test('rankCampusFeed boosts high-reaction recent posts while preserving fresh voices', () => {
  // Brand new post with 0 engagement (posted 10 mins ago) - "fresh voice"
  const brandNewPost = makeMockPost({
    id: 'post-brand-new',
    title: 'Brand New Freshman Question',
    created_at: new Date(BASE_NOW - 1000 * 60 * 10).toISOString(),
    reactions_count: { laugh: 0, relatable: 0, fire: 0, total: 0 },
    comments_count: 0,
  });

  // Recent viral post (posted 1 hour ago with 300 reactions) - "boosted trending"
  const recentViralPost = makeMockPost({
    id: 'post-recent-viral',
    title: 'Massive Gate C Boda Strike',
    created_at: new Date(BASE_NOW - 1000 * 60 * 60).toISOString(),
    reactions_count: { laugh: 100, relatable: 100, fire: 100, total: 300 },
    comments_count: 65,
  });

  // Old viral post (posted 5 days ago with 500 reactions) - should not beat recent posts
  const oldViralPost = makeMockPost({
    id: 'post-old-viral',
    title: 'Last Week Announcement',
    created_at: new Date(BASE_NOW - 1000 * 60 * 60 * 120).toISOString(),
    reactions_count: { laugh: 200, relatable: 200, fire: 100, total: 500 },
    comments_count: 80,
  });

  const ranked = rankCampusFeed([oldViralPost, brandNewPost, recentViralPost], BASE_NOW);

  assert.equal(ranked.length, 3);
  // All 3 posts must be present
  const ids = ranked.map((p) => p.id);
  assert.ok(ids.includes('post-brand-new'));
  assert.ok(ids.includes('post-recent-viral'));
  assert.ok(ids.includes('post-old-viral'));

  // The recent viral post or brand new post must beat the 5-day old post
  assert.equal(ids.indexOf('post-old-viral'), 2, 'Old post should be ranked last');
  // Both recent viral and brand new post should appear in top 2 positions
  assert.ok(ids.indexOf('post-recent-viral') < 2);
  assert.ok(ids.indexOf('post-brand-new') < 2);
});

test('getTopTrendingPosts returns top 3 highest velocity posts', () => {
  const p1 = makeMockPost({
    id: 'p-trend-1',
    title: 'High Velocity Boda',
    created_at: new Date(BASE_NOW - 1000 * 60 * 90).toISOString(), // 1.5 hrs ago
    reactions_count: { laugh: 80, relatable: 60, fire: 60, total: 200 },
    comments_count: 45,
  });

  const p2 = makeMockPost({
    id: 'p-trend-2',
    title: 'Medium Velocity Cat Memo',
    created_at: new Date(BASE_NOW - 1000 * 60 * 180).toISOString(), // 3 hrs ago
    reactions_count: { laugh: 40, relatable: 30, fire: 30, total: 100 },
    comments_count: 20,
  });

  const p3 = makeMockPost({
    id: 'p-trend-3',
    title: 'Third Trending Chapo Debate',
    created_at: new Date(BASE_NOW - 1000 * 60 * 240).toISOString(), // 4 hrs ago
    reactions_count: { laugh: 30, relatable: 25, fire: 25, total: 80 },
    comments_count: 15,
  });

  const p4 = makeMockPost({
    id: 'p-trend-4',
    title: 'Low Engagement Stale Post',
    created_at: new Date(BASE_NOW - 1000 * 60 * 60 * 24).toISOString(),
    reactions_count: { laugh: 1, relatable: 1, fire: 1, total: 3 },
    comments_count: 0,
  });

  const trending = getTopTrendingPosts([p4, p2, p3, p1], 3, BASE_NOW);

  assert.equal(trending.length, 3);
  assert.equal(trending[0].id, 'p-trend-1');
  assert.equal(trending[1].id, 'p-trend-2');
  assert.equal(trending[2].id, 'p-trend-3');
});

test('computeCampusPulse computes realistic activity metrics', () => {
  const posts = [
    makeMockPost({
      created_at: new Date(BASE_NOW - 1000 * 60 * 30).toISOString(),
      reactions_count: { laugh: 30, relatable: 40, fire: 30, total: 100 },
      comments_count: 15,
      title: 'Hall 6 Power Outage',
    }),
    makeMockPost({
      created_at: new Date(BASE_NOW - 1000 * 60 * 120).toISOString(),
      reactions_count: { laugh: 20, relatable: 30, fire: 10, total: 60 },
      comments_count: 8,
      title: 'Gate A Smokie Review',
    }),
  ];

  const pulse = computeCampusPulse(posts, BASE_NOW);

  assert.ok(pulse.reactionsLastHour >= 50);
  assert.ok(pulse.activeDiscussions >= 2);
  assert.ok(pulse.activeStudentsEstimate >= 180);
  assert.ok(pulse.topTrendingTopic.length > 0);
  assert.ok(pulse.vibeText.length > 0);
});
