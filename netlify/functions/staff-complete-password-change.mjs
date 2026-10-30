import { createClient } from '@supabase/supabase-js';

const json = (statusCode, payload) => ({ statusCode, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }, body: JSON.stringify(payload) });

export async function handler(event) {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed.' });
  const { SUPABASE_URL: url, SUPABASE_ANON_KEY: anonKey, SUPABASE_SERVICE_ROLE_KEY: serviceKey } = process.env;
  if (!url || !anonKey || !serviceKey) return json(503, { error: 'Password update is not configured on the server.' });
  const token = (event.headers.authorization || '').match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return json(401, { error: 'Sign in again to update your password.' });
  const auth = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: { user }, error: authError } = await auth.auth.getUser(token);
  if (authError || !user) return json(401, { error: 'Your session has expired. Sign in again.' });
  let input;
  try { input = JSON.parse(event.body || '{}'); } catch { return json(400, { error: 'Invalid request body.' }); }
  const password = String(input.password || '');
  if (password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9\s]/.test(password)) {
    return json(400, { error: 'Password must be at least 8 characters and include uppercase, lowercase, number, and symbol.' });
  }
  const { data: profile, error: profileError } = await admin.from('profiles').select('must_change_password,role').eq('user_id', user.id).maybeSingle();
  if (profileError || !profile || !profile.must_change_password || profile.role === 'student') return json(403, { error: 'This account does not require an initial staff password change.' });
  const { error: updateError } = await admin.auth.admin.updateUserById(user.id, { password });
  if (updateError) return json(400, { error: updateError.message });
  const { error: clearError } = await admin.from('profiles').update({ must_change_password: false }).eq('user_id', user.id);
  if (clearError) return json(500, { error: clearError.message });
  return json(200, { success: true });
}
