import { createClient } from '@supabase/supabase-js';

const json = (statusCode, payload) => ({
  statusCode,
  headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  body: JSON.stringify(payload),
});

export async function handler(event) {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed.' });
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anonKey || !serviceKey) return json(503, { error: 'Staff provisioning is not configured on the server.' });

  const bearer = event.headers.authorization || event.headers.Authorization || '';
  const token = bearer.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return json(401, { error: 'Sign in with an authorized staff account.' });

  const authClient = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const adminClient = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: { user: actor }, error: authError } = await authClient.auth.getUser(token);
  if (authError || !actor) return json(401, { error: 'Your session has expired. Sign in again.' });

  let input;
  try { input = JSON.parse(event.body || '{}'); } catch { return json(400, { error: 'Invalid request body.' }); }
  const name = String(input.name || '').trim();
  const email = String(input.email || '').trim().toLowerCase();
  const staffId = String(input.staffId || '').trim().toUpperCase();
  const role = String(input.role || '');
  const department = String(input.department || '').trim();
  const faculty = String(input.faculty || '').trim();
  const password = String(input.password || '');
  if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !staffId || !department || !faculty) {
    return json(400, { error: 'Enter a valid name, email, staff ID, department, and faculty.' });
  }
  if (!['lecturer', 'hod', 'dean'].includes(role)) return json(400, { error: 'Choose a valid staff role.' });
  if (password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9\s]/.test(password)) {
    return json(400, { error: 'Password must be at least 8 characters and include uppercase, lowercase, number, and symbol.' });
  }
  // Run the scope check under the actor JWT so auth.uid() represents the caller.
  const scopedClient = createClient(url, anonKey, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false, autoRefreshToken: false } });
  const { data: canProvision, error: scopeError } = await scopedClient.rpc('can_provision_staff', {
    target_role: role, target_department: department, target_faculty: faculty,
  });
  if (scopeError || !canProvision) return json(403, { error: 'Only a system administrator can register staff accounts.' });

  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email, password, email_confirm: true,
    user_metadata: { account_type: 'student', full_name: name, role: 'student', department, faculty },
  });
  if (createError || !created.user) return json(400, { error: createError?.message || 'Could not create staff login.' });

  const profile = {
    user_id: created.user.id, full_name: name, email, role, department, faculty,
  };
  const { error: profileError } = await adminClient.from('profiles').update(profile).eq('user_id', created.user.id);
  if (profileError) {
    await adminClient.auth.admin.deleteUser(created.user.id);
    return json(400, { error: profileError.message });
  }
  const { error: detailsError } = await adminClient.from('staff_profiles').insert({
    user_id: created.user.id, staff_id: staffId, level: input.level || null,
    admission_session: input.assignedSession || null, phone: input.phone || null, must_change_password: true,
  });
  if (detailsError) {
    await adminClient.auth.admin.deleteUser(created.user.id);
    return json(400, { error: detailsError.message });
  }
  await adminClient.from('students').delete().eq('user_id', created.user.id);
  return json(201, { success: true, staff: { id: created.user.id, ...profile, staff_id: staffId, level: input.level || null, phone: input.phone || null } });
}
