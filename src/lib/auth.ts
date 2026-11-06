import { Profile, UserRole } from '../types';
import { isSupabaseConfigured, supabase } from './supabase';

export const ADMIN_EMAIL = 'pauljubilee50@gmail.com';

export const DEFAULT_AVATARS = [
  { id: 'grad_cap', emoji: '🎓', label: 'Scholar' },
  { id: 'lightning', emoji: '⚡', label: 'Spark' },
  { id: 'lion', emoji: '🦁', label: 'Simba' },
  { id: 'food', emoji: '🍜', label: 'Chapo' },
  { id: 'rocket', emoji: '🚀', label: 'Builder' },
  { id: 'music', emoji: '🎧', label: 'Beats' },
  { id: 'coffee', emoji: '☕', label: 'Brew' },
  { id: 'plant', emoji: '🌱', label: 'Grow' },
];

/**
 * Validates real display name input.
 */
export function validateRealName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return 'Please enter your real display name.';
  if (trimmed.length < 2) return 'Name must be at least 2 characters.';
  if (trimmed.length > 50) return 'Name must be under 50 characters.';
  return null;
}

/**
 * Formats and validates a persona handle/name (e.g. "@juja_hawk").
 */
export function formatPersonaName(name: string): string {
  const clean = name.trim().replace(/^@+/, '').replace(/\s+/g, '_').toLowerCase();
  return clean ? `@${clean}` : '';
}

export function validatePersonaName(name: string): string | null {
  const clean = name.trim().replace(/^@+/, '');
  if (!clean) return 'Please provide a persona name.';
  if (clean.length < 3) return 'Persona name must be at least 3 characters.';
  if (clean.length > 25) return 'Persona name must be under 25 characters.';
  if (!/^[a-zA-Z0-9_]+$/.test(clean)) {
    return 'Persona name can only contain letters, numbers, and underscores.';
  }
  return null;
}

/**
 * Checks if a given email is the designated admin account.
 */
export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

/**
 * Sign up with email and password.
 */
export async function signUpWithPassword(params: {
  email: string;
  password: string;
  realName: string;
  personaName?: string;
  personaAvatar?: string;
}): Promise<{ user: any; session: any; error: string | null }> {
  if (!supabase) {
    return {
      user: null,
      session: null,
      error: 'Supabase client is not initialized. Please verify your environment variables.',
    };
  }

  const isAdmin = isAdminEmail(params.email);
  const personaName = params.personaName
    ? formatPersonaName(params.personaName)
    : `juja_${Math.random().toString(36).slice(2, 8)}`;

  const { data, error } = await supabase.auth.signUp({
    email: params.email.trim(),
    password: params.password,
    options: {
      data: {
        real_name: params.realName.trim(),
        persona_name: personaName,
        persona_avatar: params.personaAvatar || DEFAULT_AVATARS[0].emoji,
        role: isAdmin ? 'admin' : 'user',
      },
    },
  });

  if (error) {
    return { user: null, session: null, error: error.message };
  }

  return { user: data.user, session: data.session, error: null };
}

/**
 * Sign in with email and password.
 */
export async function signInWithPassword(params: {
  email: string;
  password: string;
}): Promise<{ user: any; session: any; error: string | null }> {
  if (!supabase) {
    return {
      user: null,
      session: null,
      error: 'Supabase client is not initialized. Please verify your environment variables.',
    };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: params.email.trim(),
    password: params.password,
  });

  if (error) {
    return { user: null, session: null, error: error.message };
  }

  return { user: data.user, session: data.session, error: null };
}

/**
 * Initiates Google OAuth sign-in.
 */
export async function signInWithGoogle(): Promise<{ error: string | null }> {
  if (!supabase) {
    return { error: 'Supabase client is not initialized.' };
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

/**
 * Sign out of current session.
 */
export async function signOut(): Promise<{ error: string | null }> {
  if (!supabase) {
    return { error: null };
  }

  const { error } = await supabase.auth.signOut();
  return { error: error ? error.message : null };
}

/**
 * Fetches user profile from public.profiles table.
 */
export async function fetchProfile(userId: string, email?: string | null): Promise<Profile | null> {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error || !data) {
      // If table doesn't have the row yet, construct a safe fallback from user meta
      const isAdmin = isAdminEmail(email);
      return {
        id: userId,
        real_name: isAdmin ? 'Campus Administrator' : (email?.split('@')[0] || 'Campus User'),
        persona_name: isAdmin ? '@campus_admin' : `@juja_${userId.slice(0, 5)}`,
        persona_avatar: DEFAULT_AVATARS[0].emoji,
        role: isAdmin ? 'admin' : 'user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    // Ensure admin role for designated admin email
    if (isAdminEmail(email) && data.role !== 'admin') {
      await supabase.from('profiles').update({ role: 'admin' }).eq('id', userId);
      data.role = 'admin';
    }

    // Prevent exposing internal admin real name in UI
    if (data.role === 'admin' && (/paul\s*jubilee/i.test(data.real_name) || data.real_name === 'pauljubilee50')) {
      data.real_name = 'Campus Administrator';
    }

    return data as Profile;
  } catch {
    return null;
  }
}

/**
 * Updates profile details (real name, persona name, avatar).
 */
export async function updateProfile(params: {
  userId: string;
  realName: string;
  personaName: string;
  personaAvatar?: string | null;
  role?: UserRole;
}): Promise<{ success: boolean; error: string | null }> {
  if (!supabase) {
    return { success: false, error: 'Supabase is not configured.' };
  }

  const updatePayload: Partial<Profile> = {
    real_name: params.realName.trim(),
    persona_name: formatPersonaName(params.personaName),
    persona_avatar: params.personaAvatar,
    updated_at: new Date().toISOString(),
  };

  if (params.role) {
    updatePayload.role = params.role;
  }

  const { error } = await supabase
    .from('profiles')
    .update(updatePayload)
    .eq('id', params.userId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
}
