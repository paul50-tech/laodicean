import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generatePostShareUrl,
  generatePostTeaser,
  generatePostShareDetails,
  DEFAULT_CANONICAL_DOMAIN,
  DEFAULT_CAMPUS_IMAGE,
} from './seo';
import { fetchPostById, SEED_JUJA_POSTS } from './posts';
import { FeedPost } from '../types';

test('generatePostShareUrl constructs proper URL with canonical fallback and origin', () => {
  const url1 = generatePostShareUrl('post-123', 'https://laodicean.online');
  assert.equal(url1, 'https://laodicean.online/p/post-123');

  const url2 = generatePostShareUrl('post-456', 'https://laodicean.online/');
  assert.equal(url2, 'https://laodicean.online/p/post-456');

  const urlCustom = generatePostShareUrl('juja-cool', 'http://localhost:3000');
  assert.equal(urlCustom, 'http://localhost:3000/p/juja-cool');
});

test('generatePostTeaser cleanly shortens text and avoids mid-word breaks', () => {
  const shortText = 'Chapo at Gate C is top tier.';
  assert.equal(generatePostTeaser(shortText, 100), shortText);

  const longText =
    'The Engineering workshop compressor was turned on at 4am this morning and caused three whole hostels in Hall 6 to wonder if an earthquake hit Juja or if practicals started early.';
  const teaser = generatePostTeaser(longText, 60);

  assert.ok(teaser.length <= 65);
  assert.ok(teaser.endsWith('...'));
  // Ensure no awkward mid-word breaks
  assert.ok(!teaser.includes('earthquak...'));
});

test('generatePostShareDetails builds WhatsApp link, formatted teaser and tags', () => {
  const samplePost: FeedPost = {
    id: 'test-seed-1',
    community_id: '00000000-0000-0000-0000-000000000001',
    community_name: 'Juja',
    community_slug: 'juja',
    post_type: 'mushene',
    title: 'The Great Gate C Chapo Controversy',
    body: 'So apparently the chapo guy at Gate C has been secretly reducing diameter by 2cm.',
    is_persona: true,
    persona_name: '@gate_c_inspector',
    persona_avatar: '🕵️',
    author_role: 'user',
    status: 'live',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    image_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5',
  };

  const details = generatePostShareDetails(samplePost, 'https://laodicean.online');

  assert.equal(details.title, 'The Great Gate C Chapo Controversy');
  assert.equal(details.shareUrl, 'https://laodicean.online/p/test-seed-1');
  assert.ok(details.authorLabel.includes('@gate_c_inspector'));
  assert.ok(details.whatsappUrl.startsWith('https://api.whatsapp.com/send?text='));
  assert.ok(details.shareText.includes('The Great Gate C Chapo Controversy'));
  assert.ok(details.shareText.includes('https://laodicean.online/p/test-seed-1'));
  assert.equal(details.imageUrl, samplePost.image_url);
});

test('generatePostShareDetails falls back gracefully when image or title is absent', () => {
  const anonymousPost: FeedPost = {
    id: 'anon-post-2',
    community_id: '00000000-0000-0000-0000-000000000001',
    community_name: 'Juja',
    community_slug: 'juja',
    post_type: 'confession',
    body: 'I actually enjoy 7am calculus lectures in ELB.',
    is_persona: false,
    author_real_name: 'Brian Mwangi',
    persona_name: '',
    author_role: 'user',
    status: 'live',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const details = generatePostShareDetails(anonymousPost, 'https://laodicean.online');

  assert.ok(details.title.includes('CONFESSION'));
  assert.equal(details.imageUrl, DEFAULT_CAMPUS_IMAGE);
  assert.equal(details.authorLabel, 'Brian Mwangi');
});

test('fetchPostById retrieves seed post by ID', async () => {
  const seedPost = await fetchPostById('seed-juja-1');
  assert.ok(seedPost);
  assert.equal(seedPost.id, 'seed-juja-1');
  assert.equal(seedPost.community_name, 'Juja');
});

test('fetchPostById returns null for nonexistent post when db is offline', async () => {
  const nonExistent = await fetchPostById('seed-non-existent-999');
  assert.equal(nonExistent, null);
});
