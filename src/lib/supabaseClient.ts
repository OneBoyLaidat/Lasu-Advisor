import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Safe check for Supabase environment variables
const env = (import.meta as any).env || {};
const supabaseUrl = (env.VITE_SUPABASE_URL || '').trim();
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || '';

function validateSupabaseConfiguration(): string | null {
  if (!supabaseUrl || !supabaseAnonKey) {
    return 'Live authentication is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in the deployment environment, then rebuild the site.';
  }
  try {
    const parsedUrl = new URL(supabaseUrl);
    if (!['https:', 'http:'].includes(parsedUrl.protocol) || !parsedUrl.hostname || parsedUrl.hostname.includes('placeholder')) {
      return 'VITE_SUPABASE_URL is invalid. Use the Project URL from Supabase → Project Settings → API.';
    }
  } catch {
    return 'VITE_SUPABASE_URL is invalid. Use the Project URL from Supabase → Project Settings → API.';
  }
  if (supabaseAnonKey.toLowerCase().includes('placeholder')) {
    return 'VITE_SUPABASE_ANON_KEY is still a placeholder. Set the anon/publishable key from Supabase → Project Settings → API.';
  }
  return null;
}

export const supabaseConfigurationError = validateSupabaseConfiguration();
export const isSupabaseConfigured = supabaseConfigurationError === null;

export function describeSupabaseConnectionError(error: unknown): string {
  if (error instanceof TypeError && /fetch/i.test(error.message)) {
    return 'Could not reach Supabase. Check that VITE_SUPABASE_URL is the active project URL and VITE_SUPABASE_ANON_KEY is its anon/publishable key, then trigger a new deploy. Also check Supabase → Authentication → URL Configuration includes this site URL.';
  }
  if (error instanceof Error && error.message) return error.message;
  if (error && typeof error === 'object') {
    const errObj = error as { message?: unknown; details?: unknown; hint?: unknown; code?: unknown };
    const parts = [errObj.message, errObj.details, errObj.hint]
      .filter((part): part is string => typeof part === 'string' && part.trim().length > 0);
    if (parts.length > 0) return parts.join(' — ');
    if (typeof errObj.code === 'string' && errObj.code.trim().length > 0) {
      return `Supabase error (${errObj.code}).`;
    }
  }
  return 'Could not connect to Supabase. Check the project URL and network connection.';
}

export let supabase: SupabaseClient | null = null;

if (isSupabaseConfigured) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  } catch (err) {
    console.warn('Supabase initialization failed, falling back to local storage engine.', err);
    supabase = null;
  }
}

export function getSupabaseClient(): SupabaseClient | null {
  return supabase;
}
