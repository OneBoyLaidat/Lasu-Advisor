import { createClient } from '@supabase/supabase-js';

const json = (statusCode, payload) => ({
  statusCode,
  headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  body: JSON.stringify(payload),
});

export async function handler(event) {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed.' });
  const { SUPABASE_URL: url, SUPABASE_ANON_KEY: anonKey, SUPABASE_SERVICE_ROLE_KEY: serviceKey } = process.env;
  if (!url || !anonKey || !serviceKey) return json(503, { error: 'Staff management is not configured on the server.' });

  const token = (event.headers.authorization || '').match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return json(401, { error: 'Sign in with an authorized administrator account.' });

  const scoped = createClient(url, anonKey, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false, autoRefreshToken: false } });
  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: { user: actor }, error: authError } = await scoped.auth.getUser(token);
  if (authError || !actor) return json(401, { error: 'Your session has expired. Sign in again.' });

  let input;
  try { input = JSON.parse(event.body || '{}'); } catch { return json(400, { error: 'Invalid request body.' }); }
  const staffId = String(input.staffId || '').trim();
  if (!staffId) return json(400, { error: 'Staff ID is required.' });

  // Look up staff profile
  const { data: target, error: targetError } = await admin
    .from('profiles')
    .select('user_id,role,department,faculty')
    .or(`user_id.eq.${staffId},email.eq.${staffId}`)
    .maybeSingle();

  if (targetError || !target) return json(404, { error: 'Staff account was not found.' });

  const { data: canManage, error: permissionError } = await scoped.rpc('can_provision_staff', {
    target_role: target.role,
    target_department: target.department,
    target_faculty: target.faculty,
  });
  if (permissionError || !canManage) return json(403, { error: 'You are not authorized to revoke access for this staff account.' });

  // Delete staff associations and profile
  await admin.from('department_hod_assignments').delete().eq('hod_id', target.user_id);
  await admin.from('adviser_assignments').delete().eq('adviser_id', target.user_id);
  await admin.from('staff_profiles').delete().eq('user_id', target.user_id);
  await admin.from('profiles').delete().eq('user_id', target.user_id);

  // Remove from auth.users
  const { error: deleteUserError } = await admin.auth.admin.deleteUser(target.user_id);
  if (deleteUserError) {
    console.warn('Could not delete auth user', deleteUserError);
  }

  return json(200, { success: true, message: 'Staff access revoked successfully.' });
}
