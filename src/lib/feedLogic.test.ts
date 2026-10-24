import test from 'node:test';
import assert from 'node:assert/strict';
import { Post, PostType } from '../types/laodicean';
import {
  buildWhatsAppShareData,
  estimateReadingMinutes,
  filterAndSearchPosts,
  paginatePosts,
  parseRoute,
  slugify,
  validateCampusProfile,
  validateCommunityRequest,
  validatePostDraft,
} from './feedLogic';

const samplePosts: Post[] = [
  {
    id: '1',
    slug: 'gate-c-chapo-spots',
    communitySlug: 'juja',
    postType: PostType.Story,
    title: 'Eating Under KES 180 Around Gate C',
    body: 'Fresh chapatis and beans right past the stage save every evening after CATs.',
    spot: 'Gate C',
    authorName: 'Wanjiku',
    authorHandle: '@shiku',
    likesCount: 24,
    commentsCount: 4,
    createdAt: '2026-10-24T12:00:00.000Z',
  },
  {
    id: '2',
    slug: 'calculator-found-elb',
    communitySlug: 'juja',
    postType: PostType.Gist,
    body: 'Found a Casio calculator in ELB 004 and left it with the lab tech.',
    spot: 'Engineering',
    authorName: 'Brian',
    authorHandle: '@brayo',
    likesCount: 15,
    commentsCount: 2,
    createdAt: '2026-10-24T14:00:00.000Z',
  },
  {
    id: '3',
    slug: 'roommate-gachororo',
    communitySlug: 'juja',
    postType: PostType.Notice,
    title: 'Roommate Wanted off Gachororo Road',
    body: 'Looking for one chill roommate to split a 1BR 7 mins from Gate C.',
    spot: 'Gachororo',
    authorName: 'Kelvin',
    authorHandle: '@kevo',
    likesCount: 6,
    commentsCount: 1,
    createdAt: '2026-10-24T10:00:00.000Z',
  },
];

test('slugify generates clean URL slugs for posts and communities', () => {
  assert.equal(slugify("Mama Njeri's Gate C Chapo Guide!"), 'mama-njeris-gate-c-chapo-guide');
  assert.equal(slugify('  Kahawa Sukari  '), 'kahawa-sukari');
});

test('estimateReadingMinutes returns 1 min minimum and scales by 200 wpm', () => {
  assert.equal(estimateReadingMinutes('Short gist.'), 1);
  const fourHundredWords = new Array(405).fill('campus').join(' ');
  assert.equal(estimateReadingMinutes(fourHundredWords), 3);
});

test('filterAndSearchPosts mixes all post types chronologically by default and supports optional chips', () => {
  const mixed = filterAndSearchPosts(samplePosts);
  assert.equal(mixed.length, 3);
  assert.equal(mixed[0].id, '2'); // newest first

  const storiesOnly = filterAndSearchPosts(samplePosts, { postType: PostType.Story });
  assert.equal(storiesOnly.length, 1);
  assert.equal(storiesOnly[0].slug, 'gate-c-chapo-spots');

  const spotFiltered = filterAndSearchPosts(samplePosts, { spot: 'engineering' });
  assert.equal(spotFiltered.length, 1);
  assert.equal(spotFiltered[0].authorHandle, '@brayo');

  const searched = filterAndSearchPosts(samplePosts, { searchQuery: 'casio' });
  assert.equal(searched.length, 1);
  assert.equal(searched[0].id, '2');
});

test('paginatePosts slices endless scroll pages and reports remaining count', () => {
  const page1 = paginatePosts(samplePosts, 1, 2);
  assert.equal(page1.visiblePosts.length, 2);
  assert.equal(page1.hasMore, true);
  assert.equal(page1.remainingCount, 1);

  const page2 = paginatePosts(samplePosts, 2, 2);
  assert.equal(page2.visiblePosts.length, 3);
  assert.equal(page2.hasMore, false);
  assert.equal(page2.remainingCount, 0);
});

test('buildWhatsAppShareData produces canonical laodicean.online link and wa.me deep link', () => {
  const share = buildWhatsAppShareData(samplePosts[0], 'https://laodicean.online/');
  assert.equal(share.canonicalUrl, 'https://laodicean.online/p/gate-c-chapo-spots');
  assert.ok(share.messageText.includes('*Eating Under KES 180 Around Gate C*'));
  assert.ok(share.messageText.includes('c/juja'));
  assert.ok(share.whatsappHref.startsWith('https://wa.me/?text='));
});

test('validatePostDraft enforces required fields per post type without silent fallbacks', () => {
  assert.match(
    validatePostDraft({
      communitySlug: 'juja',
      postType: PostType.Story,
      title: '',
      body: 'Plenty of body text here for a campus story.',
      spot: 'Gate C',
    }) ?? '',
    /headline/i
  );

  assert.match(
    validatePostDraft({
      communitySlug: 'juja',
      postType: PostType.Photo,
      title: '',
      body: 'Sunset over Engineering block',
      spot: 'Engineering',
    }) ?? '',
    /photo/i
  );

  assert.equal(
    validatePostDraft({
      communitySlug: 'juja',
      postType: PostType.Gist,
      title: '',
      body: 'Eduroam is flying outside the Old Library right now.',
      spot: 'Library',
    }),
    null
  );
});

test('validateCommunityRequest blocks duplicate slugs and empty fields', () => {
  assert.match(
    validateCommunityRequest(
      {
        proposedName: 'Juja',
        campusOrArea: 'JKUAT',
        reason: 'Already active campus community here',
        requesterContact: '+254712345678',
      },
      ['juja']
    ) ?? '',
    /already exists/i
  );

  assert.equal(
    validateCommunityRequest(
      {
        proposedName: 'Rongai',
        campusOrArea: 'Multimedia University & Ongata Rongai',
        reason: 'Students around MMU need a fast spot for campus stories and house notices.',
        requesterContact: 'wanjiku@mmu.ac.ke',
      },
      ['juja']
    ),
    null
  );
});

test('validateCampusProfile and parseRoute handle handles and clean URLs', () => {
  assert.equal(
    validateCampusProfile({
      name: 'Amina Hassan',
      handle: '@amina_254',
      email: 'amina@students.jkuat.ac.ke',
    }),
    null
  );

  assert.deepEqual(parseRoute('/c/juja'), { view: 'feed', communitySlug: 'juja' });
  assert.deepEqual(parseRoute('/p/gate-c-chapo-spots'), {
    view: 'post',
    postSlug: 'gate-c-chapo-spots',
  });
  assert.deepEqual(parseRoute('/request-community'), {
    view: 'communities',
    focusRequestForm: true,
  });
});
