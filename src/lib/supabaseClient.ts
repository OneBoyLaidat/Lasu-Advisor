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
    return 'Could not reach Supabase. Check that VITE_SUPABASE_URL is the active project URL and VITE_SUPABASE_ANON_KEY is its anon/publishable key in Netlify, then trigger a new deploy. Also check Supabase → Authentication → URL Configuration includes this site URL.';
  }
  return error instanceof Error ? error.message : 'Could not connect to Supabase. Check the project URL and network connection.';
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
