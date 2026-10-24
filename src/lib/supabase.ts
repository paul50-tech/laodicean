import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Reads Supabase credentials from Vite environment variables.
 * When deployed on Vercel, set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
 * in Project Settings -> Environment Variables.
 */
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() ?? '';
const supabaseAnonKey =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() ?? '';

export const isSupabaseConfigured =
  Boolean(supabaseUrl && supabaseAnonKey) &&
  supabaseUrl.startsWith('http') &&
  !supabaseUrl.includes('YOUR_PROJECT');

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Returns the canonical public domain for WhatsApp share links.
 * Defaults to https://laodicean.online so shared links always point to your live domain.
 */
export function getCanonicalSiteOrigin(): string {
  const configured = (import.meta.env.VITE_SITE_URL as string | undefined)?.trim();
  if (configured && configured.startsWith('http')) {
    return configured.replace(/\/+$/, '');
  }
  return 'https://laodicean.online';
}
