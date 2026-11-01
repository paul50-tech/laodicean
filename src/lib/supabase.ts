import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SupabaseConfig } from '../types';

/**
 * Extracts the project reference ID from a Supabase JWT anon key.
 * This provides auto-recovery if the user accidentally inputs their publishable key into the URL field.
 */
export function extractProjectRefFromJwt(jwt: string): string | null {
  try {
    const parts = jwt.trim().split('.');
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const json =
      typeof atob !== 'undefined'
        ? atob(padded)
        : typeof Buffer !== 'undefined'
          ? Buffer.from(padded, 'base64').toString('utf-8')
          : null;
    if (!json) return null;
    const payload = JSON.parse(json);
    return typeof payload.ref === 'string' && payload.ref.length > 3 ? payload.ref : null;
  } catch {
    return null;
  }
}

/**
 * Resolves Supabase credentials from either Vite (VITE_) or Next.js (NEXT_PUBLIC_) environment variables.
 * Pure function so it can be verified in automated unit tests.
 */
export function resolveSupabaseConfig(env: Record<string, string | undefined>): SupabaseConfig {
  let supabaseUrl = (
    env.VITE_SUPABASE_URL ||
    env.NEXT_PUBLIC_SUPABASE_URL ||
    ''
  ).trim();

  const supabaseAnonKey = (
    env.VITE_SUPABASE_ANON_KEY ||
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ''
  ).trim();

  // If the URL is missing or was filled with a publishable token instead of a URL,
  // recover the project URL from the JWT ref
  if ((!supabaseUrl || !supabaseUrl.startsWith('http')) && supabaseAnonKey) {
    const ref = extractProjectRefFromJwt(supabaseAnonKey);
    if (ref) {
      supabaseUrl = `https://${ref}.supabase.co`;
    }
  }

  const missingVars: string[] = [];
  if (!supabaseUrl || !supabaseUrl.startsWith('http')) {
    missingVars.push('SUPABASE_URL');
  }
  if (!supabaseAnonKey || supabaseAnonKey.length < 10) {
    missingVars.push('SUPABASE_ANON_KEY');
  }

  const isConfigured =
    missingVars.length === 0 &&
    !supabaseUrl.includes('YOUR_PROJECT') &&
    !supabaseUrl.includes('your-project-id');

  return {
    supabaseUrl,
    supabaseAnonKey,
    isConfigured,
    missingVars,
  };
}

// Safely gather runtime environment variables (works in Vite, Next.js, and Node test runner)
const runtimeEnv: Record<string, string | undefined> = {
  ...(typeof import.meta !== 'undefined' && import.meta.env ? (import.meta.env as Record<string, string | undefined>) : {}),
  ...(typeof process !== 'undefined' && process.env ? process.env : {}),
};

export const currentConfig = resolveSupabaseConfig(runtimeEnv);

export const isSupabaseConfigured = currentConfig.isConfigured;

/**
 * Global Supabase client instance.
 * Initialized only when valid configuration is present.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(currentConfig.supabaseUrl, currentConfig.supabaseAnonKey)
  : null;

/**
 * Pings Supabase to verify credentials work against the actual Supabase project.
 */
export async function testSupabaseConnection(): Promise<{
  success: boolean;
  message: string;
}> {
  if (!supabase) {
    return {
      success: false,
      message: 'Supabase client is not initialized. Please provide your Project URL and Anon Key.',
    };
  }

  try {
    // Ping Supabase auth health or getSession
    const { error } = await supabase.auth.getSession();
    if (error) {
      return {
        success: false,
        message: `Connection error: ${error.message}`,
      };
    }
    return {
      success: true,
      message: `Connected successfully to Supabase (${currentConfig.supabaseUrl})!`,
    };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Unknown connection error.',
    };
  }
}
