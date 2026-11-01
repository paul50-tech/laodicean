import { test } from 'node:test';
import assert from 'node:assert';
import { validatePostInput } from './posts';

test('validatePostInput correctly validates Story posts', () => {
  // Empty story body is rejected
  const emptyStory = validatePostInput({
    postType: 'story',
    title: 'Juja Night Market',
    body: '   ',
  });
  assert.strictEqual(emptyStory.isValid, false);
  assert.match(emptyStory.error || '', /write some text/);

  // Short story body (<5 chars) is rejected
  const shortStory = validatePostInput({
    postType: 'story',
    title: 'Short',
    body: 'Hey',
  });
  assert.strictEqual(shortStory.isValid, false);
  assert.match(shortStory.error || '', /at least 5 characters/);

  // Valid story without title
  const validNoTitle = validatePostInput({
    postType: 'story',
    body: 'The Gate A chapo spot just brought back fresh stew!',
  });
  assert.strictEqual(validNoTitle.isValid, true);
  assert.strictEqual(validNoTitle.error, null);

  // Valid story with title and optional image
  const validFull = validatePostInput({
    postType: 'story',
    title: 'Gate A Update',
    body: 'The Gate A chapo spot just brought back fresh stew!',
    hasImage: true,
  });
  assert.strictEqual(validFull.isValid, true);
  assert.strictEqual(validFull.error, null);

  // Title over 150 characters is rejected
  const longTitle = validatePostInput({
    postType: 'story',
    title: 'A'.repeat(151),
    body: 'A valid body text for the story.',
  });
  assert.strictEqual(longTitle.isValid, false);
  assert.match(longTitle.error || '', /150 characters or less/);
});

test('validatePostInput correctly validates Photo posts', () => {
  // Photo post without image is rejected
  const noImage = validatePostInput({
    postType: 'photo',
    title: 'Library sunset',
    body: 'Look at the JKUAT library sunset.',
    hasImage: false,
  });
  assert.strictEqual(noImage.isValid, false);
  assert.match(noImage.error || '', /select an image to upload/);

  // Photo post with image and caption is valid
  const validPhoto = validatePostInput({
    postType: 'photo',
    title: 'Library sunset',
    body: 'Look at the JKUAT library sunset.',
    hasImage: true,
  });
  assert.strictEqual(validPhoto.isValid, true);
  assert.strictEqual(validPhoto.error, null);

  // Photo post with image and title only is valid
  const validPhotoTitleOnly = validatePostInput({
    postType: 'photo',
    title: 'Sunset over Hall 4',
    body: '',
    hasImage: true,
  });
  assert.strictEqual(validPhotoTitleOnly.isValid, true);
  assert.strictEqual(validPhotoTitleOnly.error, null);

  // Photo post with image but neither title nor caption is rejected
  const noTextAtAll = validatePostInput({
    postType: 'photo',
    title: '',
    body: '',
    hasImage: true,
  });
  assert.strictEqual(noTextAtAll.isValid, false);
  assert.match(noTextAtAll.error || '', /caption or title/);
});

test('truncateTeaser correctly detects short vs long texts and truncates cleanly', async () => {
  const { truncateTeaser } = await import('./posts');

  // Empty string
  const empty = truncateTeaser('');
  assert.strictEqual(empty.teaser, '');
  assert.strictEqual(empty.isTruncated, false);

  // Short text under threshold
  const shortText = 'Chapo beans at Gate C are 40 bob.';
  const shortResult = truncateTeaser(shortText, 100);
  assert.strictEqual(shortResult.teaser, shortText);
  assert.strictEqual(shortResult.isTruncated, false);

  // Long text over threshold
  const longText =
    'Yesterday our project supervisor looked at our solar desalination prototype, sighed heavily, took off his spectacles, and asked: "Did you construct this or did it happen to you by accident?". We had been awake for 38 straight hours in the workshop surviving on instant coffee and cold chapos.';
  const longResult = truncateTeaser(longText, 80);
  assert.strictEqual(longResult.isTruncated, true);
  assert.ok(longResult.teaser.endsWith('...'));
  assert.ok(longResult.teaser.length <= 85);
});

test('validatePostInput correctly validates Mushene posts', () => {
  // Empty mushene is rejected
  const empty = validatePostInput({
    postType: 'mushene',
    body: '   ',
  });
  assert.strictEqual(empty.isValid, false);
  assert.match(empty.error || '', /write your street Mushene story/);

  // Mushene under 5 characters is rejected
  const short = validatePostInput({
    postType: 'mushene',
    body: 'goss',
  });
  assert.strictEqual(short.isValid, false);

  // Punchy valid Mushene
  const validMushene = validatePostInput({
    postType: 'mushene',
    title: 'Gate C drama',
    body: 'Chapo guy at Gate C reduced diameter by 2cm and students brought a geometry ruler!',
  });
  assert.strictEqual(validMushene.isValid, true);
  assert.strictEqual(validMushene.error, null);
});

test('validatePostInput correctly validates Event posts', () => {
  // Missing title is rejected
  const noTitle = validatePostInput({
    postType: 'event',
    title: '',
    body: 'Great event happening',
    eventDate: 'Friday, Nov 7',
    eventPlace: 'Tech Park',
  });
  assert.strictEqual(noTitle.isValid, false);
  assert.match(noTitle.error || '', /title for the event/);

  // Missing date is rejected
  const noDate = validatePostInput({
    postType: 'event',
    title: 'JKUAT Hackathon',
    body: 'Coding all night in tech park',
    eventDate: '',
    eventPlace: 'Tech Park',
  });
  assert.strictEqual(noDate.isValid, false);
  assert.match(noDate.error || '', /specify the date and time/);

  // Missing place is rejected
  const noPlace = validatePostInput({
    postType: 'event',
    title: 'JKUAT Hackathon',
    body: 'Coding all night in tech park',
    eventDate: 'Friday, Nov 7 • 2:00 PM',
    eventPlace: '   ',
  });
  assert.strictEqual(noPlace.isValid, false);
  assert.match(noPlace.error || '', /specify the campus place/);

  // Missing description is rejected
  const noDesc = validatePostInput({
    postType: 'event',
    title: 'JKUAT Hackathon',
    body: '',
    eventDate: 'Friday, Nov 7 • 2:00 PM',
    eventPlace: 'Tech Park',
  });
  assert.strictEqual(noDesc.isValid, false);
  assert.match(noDesc.error || '', /description of what will happen/);

  // Valid event
  const validEvent = validatePostInput({
    postType: 'event',
    title: 'JKUAT Annual Tech Expo 2026',
    body: 'Join student innovators demoing solar IoT prototypes and campus web apps. Free chapos and pizza for builders!',
    eventDate: 'Friday, Nov 7 • 9:00 AM - 5:00 PM',
    eventPlace: 'Tech Park Hall 1',
  });
  assert.strictEqual(validEvent.isValid, true);
  assert.strictEqual(validEvent.error, null);
});

test('filterFeedPosts filters by post type correctly', async () => {
  const { filterFeedPosts, SEED_JUJA_POSTS } = await import('./posts');

  // 'all' returns all posts
  const allPosts = filterFeedPosts(SEED_JUJA_POSTS, 'all');
  assert.strictEqual(allPosts.length, SEED_JUJA_POSTS.length);

  // 'event' returns only events
  const events = filterFeedPosts(SEED_JUJA_POSTS, 'event');
  assert.ok(events.length >= 2);
  assert.ok(events.every((p) => p.post_type === 'event'));

  // 'poll' returns only polls
  const polls = filterFeedPosts(SEED_JUJA_POSTS, 'poll');
  assert.ok(polls.length > 0);
  assert.ok(polls.every((p) => p.post_type === 'poll'));

  // 'mushene' returns only mushene
  const mushene = filterFeedPosts(SEED_JUJA_POSTS, 'mushene');
  assert.ok(mushene.length >= 2);
  assert.ok(mushene.every((p) => p.post_type === 'mushene'));

  // 'confession' returns only confessions
  const confessions = filterFeedPosts(SEED_JUJA_POSTS, 'confession');
  assert.ok(confessions.length > 0);
  assert.ok(confessions.every((p) => p.post_type === 'confession'));

  // 'meme' returns only memes
  const memes = filterFeedPosts(SEED_JUJA_POSTS, 'meme');
  assert.ok(memes.length > 0);
  assert.ok(memes.every((p) => p.post_type === 'meme'));
});

test('SEED_JUJA_POSTS are valid, newest first, and belong to Juja', async () => {
  const { SEED_JUJA_POSTS } = await import('./posts');

  assert.ok(SEED_JUJA_POSTS.length >= 8);
  for (const post of SEED_JUJA_POSTS) {
    assert.strictEqual(post.community_slug, 'juja');
    assert.strictEqual(post.status, 'live');
    assert.ok(post.reactions_count);
    assert.strictEqual(
      post.reactions_count.total,
      post.reactions_count.laugh + post.reactions_count.relatable + post.reactions_count.fire
    );
    assert.ok(typeof post.comments_count === 'number');
    if (post.is_persona) {
      assert.ok(post.persona_name.startsWith('@'));
    }
  }

  // Ensure timestamps are descending (newest first)
  for (let i = 0; i < SEED_JUJA_POSTS.length - 1; i++) {
    const timeA = new Date(SEED_JUJA_POSTS[i].created_at).getTime();
    const timeB = new Date(SEED_JUJA_POSTS[i + 1].created_at).getTime();
    assert.ok(timeA >= timeB, `Post ${i} should be newer than or equal to Post ${i + 1}`);
  }
});
