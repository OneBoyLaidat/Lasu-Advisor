import { createClient } from '@supabase/supabase-js';

const json = (statusCode, payload) => ({ statusCode, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }, body: JSON.stringify(payload) });

export async function handler(event) {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed.' });
  const { SUPABASE_URL: url, SUPABASE_ANON_KEY: anonKey, SUPABASE_SERVICE_ROLE_KEY: serviceKey } = process.env;
  if (!url || !anonKey || !serviceKey) return json(503, { error: 'Staff password reset is not configured on the server.' });
  const token = (event.headers.authorization || '').match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return json(401, { error: 'Sign in with an authorized account.' });
  const scoped = createClient(url, anonKey, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false, autoRefreshToken: false } });
  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: { user: actor }, error: authError } = await scoped.auth.getUser(token);
  if (authError || !actor) return json(401, { error: 'Your session has expired. Sign in again.' });
  let input;
  try { input = JSON.parse(event.body || '{}'); } catch { return json(400, { error: 'Invalid request body.' }); }
  const staffId = String(input.staffId || '');
  const password = String(input.password || '');
  if (password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9\s]/.test(password)) {
    return json(400, { error: 'Password must be at least 8 characters and include uppercase, lowercase, number, and symbol.' });
  }
  const { data: target, error: targetError } = await admin.from('profiles').select('user_id,role,department,faculty').eq('user_id', staffId).in('role', ['lecturer', 'hod', 'dean']).maybeSingle();
  if (targetError || !target) return json(404, { error: 'Staff account was not found.' });
  const { data: canManage, error: permissionError } = await scoped.rpc('can_provision_staff', {
    target_role: target.role, target_department: target.department, target_faculty: target.faculty,
  });
  if (permissionError || !canManage) return json(403, { error: 'You are not authorized to reset this staff account.' });
  const { error: updateError } = await admin.auth.admin.updateUserById(target.user_id, { password });
  if (updateError) return json(400, { error: updateError.message });
  const { error: profileError } = await admin.from('staff_profiles').update({ must_change_password: true }).eq('user_id', target.user_id);
  if (profileError) return json(500, { error: profileError.message });
  return json(200, { success: true });
}
