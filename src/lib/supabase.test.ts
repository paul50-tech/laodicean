import test from 'node:test';
import assert from 'node:assert/strict';
import { extractProjectRefFromJwt, resolveSupabaseConfig } from './supabase';

const mockAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRieWZmdmhxd3lnc2F1cXVneWJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI4NTU0MzAsImV4cCI6MjEwODQzMTQzMH0.IWlN8NpVtUJy8Cbu1bs_VtzYlWTzXKGSujJxfo4byV8';

test('extractProjectRefFromJwt extracts ref from standard Supabase JWT', () => {
  const ref = extractProjectRefFromJwt(mockAnonKey);
  assert.equal(ref, 'tbyffvhqwygsauqugyba');
});

test('auto-recovers project URL if user accidentally pasted non-URL into VITE_SUPABASE_URL', () => {
  const config = resolveSupabaseConfig({
    VITE_SUPABASE_URL: 'sb_publishable_88bKVpm9o-8Qv6jzggNaeA_nDgBneSL',
    VITE_SUPABASE_ANON_KEY: mockAnonKey,
  });

  assert.equal(config.isConfigured, true);
  assert.equal(config.supabaseUrl, 'https://tbyffvhqwygsauqugyba.supabase.co');
  assert.equal(config.missingVars.length, 0);
});

test('identifies missing variables when env is empty', () => {
  const config = resolveSupabaseConfig({});
  assert.equal(config.isConfigured, false);
  assert.deepEqual(config.missingVars, ['SUPABASE_URL', 'SUPABASE_ANON_KEY']);
});

test('resolves standard Vite format variables (VITE_SUPABASE_*)', () => {
  const config = resolveSupabaseConfig({
    VITE_SUPABASE_URL: 'https://xyzcompany.supabase.co',
    VITE_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummykey123456789',
  });
  assert.equal(config.isConfigured, true);
  assert.equal(config.supabaseUrl, 'https://xyzcompany.supabase.co');
  assert.equal(config.missingVars.length, 0);
});

test('resolves Next.js format variables (NEXT_PUBLIC_SUPABASE_*)', () => {
  const config = resolveSupabaseConfig({
    NEXT_PUBLIC_SUPABASE_URL: 'https://jkuatcampus.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.nextjskey123456789',
  });
  assert.equal(config.isConfigured, true);
  assert.equal(config.supabaseUrl, 'https://jkuatcampus.supabase.co');
  assert.equal(config.missingVars.length, 0);
});
