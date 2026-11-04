import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SEED_COMMUNITIES,
  SEED_COMMUNITY_REQUESTS,
  getCommunityBySlug,
  isUserCommunityModerator,
  requestNewCommunity,
  approveCommunityRequest,
  rejectCommunityRequest,
  formatCommunityShareUrl,
  JUJA_COMMUNITY_ID,
} from './communities';
import { Profile } from '../types';

test('getCommunityBySlug resolves Juja by default or fallback', () => {
  const defaultComm = getCommunityBySlug(undefined);
  assert.equal(defaultComm.slug, 'juja');
  assert.equal(defaultComm.name, 'Juja (JKUAT)');
  assert.equal(defaultComm.color, '#064e3b');

  const rongai = getCommunityBySlug('rongai');
  assert.equal(rongai.slug, 'rongai');
  assert.equal(rongai.name, 'Rongai (MMU & CUEA)');

  const unknown = getCommunityBySlug('nonexistent-slug');
  assert.equal(unknown.slug, 'juja');
});

test('isUserCommunityModerator correctly evaluates Super Admin and Community Creators', () => {
  const rongai = SEED_COMMUNITIES.find((c) => c.slug === 'rongai')!;

  // 1. Super Admin by email
  const superAdminByEmail = isUserCommunityModerator(rongai, null, 'pauljubilee50@gmail.com');
  assert.equal(superAdminByEmail, true);

  // 2. Super Admin by role
  const adminProfile: Profile = {
    id: 'random-admin-id',
    real_name: 'Admin User',
    persona_name: '@admin',
    role: 'admin',
    created_at: '',
    updated_at: '',
  };
  assert.equal(isUserCommunityModerator(rongai, adminProfile), true);

  // 3. Creator of the community is a moderator
  const creatorProfile: Profile = {
    id: 'user-mmu-creator',
    real_name: 'Cyrus Maina',
    persona_name: '@rongai_lion',
    role: 'user',
    created_at: '',
    updated_at: '',
  };
  assert.equal(isUserCommunityModerator(rongai, creatorProfile), true);

  // 4. Regular unrelated student is not a moderator
  const studentProfile: Profile = {
    id: 'random-student-id',
    real_name: 'Student Name',
    persona_name: '@student',
    role: 'user',
    created_at: '',
    updated_at: '',
  };
  assert.equal(isUserCommunityModerator(rongai, studentProfile), false);
});

test('requestNewCommunity validates inputs cleanly and generates slugs', () => {
  // Empty name
  const badName = requestNewCommunity({
    name: '  ',
    slug: '',
    tagline: 'Short tagline',
    description: 'Long description of university campus',
    color: '#064e3b',
    icon: '🎓',
    requesterId: 'user-1',
    requesterName: 'Student 1',
  });
  assert.equal(badName.success, false);
  assert.ok(badName.error?.includes('at least 3 characters'));

  // Valid request
  const valid = requestNewCommunity({
    name: 'Daystar Athi River',
    slug: 'daystar-athi',
    tagline: 'Valley Comrades & Communications Leaders',
    description: 'Daystar Athi River campus stories, chapel discussions, and shuttle updates.',
    color: '#0284c7',
    icon: '⭐',
    requesterId: 'user-daystar',
    requesterName: 'Esther Mutua',
    requesterPersona: '@daystar_star',
  });
  assert.equal(valid.success, true);
  assert.ok(valid.request);
  assert.equal(valid.request.slug, 'daystar-athi');
  assert.equal(valid.request.status, 'pending');
});

test('approveCommunityRequest turns pending request into active community and appoints creator as moderator', () => {
  const req = SEED_COMMUNITY_REQUESTS[0];
  const approved = approveCommunityRequest(req.id, JUJA_COMMUNITY_ID);
  assert.equal(approved.success, true);
  assert.ok(approved.community);
  assert.equal(approved.community.status, 'approved');
  assert.equal(approved.community.created_by, req.requester_id);
  assert.ok(approved.community.moderator_ids.includes(req.requester_id!));

  // Re-approving fails gracefully
  const doubleApprove = approveCommunityRequest(req.id);
  assert.equal(doubleApprove.success, false);
});

test('rejectCommunityRequest records rejection reason cleanly', () => {
  const req = SEED_COMMUNITY_REQUESTS[0];
  const rejected = rejectCommunityRequest(req.id, 'Duplicate university community.');
  assert.equal(rejected.success, true);
});

test('formatCommunityShareUrl formats clean link with origin', () => {
  const rongai = SEED_COMMUNITIES.find((c) => c.slug === 'rongai')!;
  const url = formatCommunityShareUrl(rongai, 'https://laodicean.app');
  assert.equal(url, 'https://laodicean.app/?c=rongai');
});
