import { createClient } from '@supabase/supabase-js';

const json = (statusCode, payload) => ({
  statusCode,
  headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  body: JSON.stringify(payload),
});

export async function handler(event) {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed.' });
  const { SUPABASE_URL: url, SUPABASE_ANON_KEY: anonKey, SUPABASE_SERVICE_ROLE_KEY: serviceKey } = process.env;
  if (!url || !anonKey || !serviceKey) return json(503, { error: 'Administrator provisioning is not configured on the server.' });

  const token = (event.headers.authorization || '').match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return json(401, { error: 'Sign in with a system administrator account.' });
  const sessionClient = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const serviceClient = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: { user: actor }, error: authError } = await sessionClient.auth.getUser(token);
  if (authError || !actor) return json(401, { error: 'Your session has expired. Sign in again.' });

  const { data: actorProfile, error: actorProfileError } = await serviceClient.from('profiles')
    .select('role').eq('user_id', actor.id).maybeSingle();
  if (actorProfileError || actorProfile?.role !== 'admin') return json(403, { error: 'Only a signed-in system administrator can register administrators.' });

  let input;
  try { input = JSON.parse(event.body || '{}'); } catch { return json(400, { error: 'Invalid request body.' }); }
  const name = String(input.name || '').trim();
  const email = String(input.email || '').trim().toLowerCase();
  const staffId = String(input.staffId || '').trim().toUpperCase();
  const department = String(input.department || '').trim();
  const faculty = String(input.faculty || '').trim();
  const phone = String(input.phone || '').trim();
  const password = String(input.password || '');
  if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !staffId || !department || !faculty) {
    return json(400, { error: 'Enter a valid name, email, staff ID, department, and faculty.' });
  }
  if (password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9\s]/.test(password)) {
    return json(400, { error: 'Password must be at least 8 characters and include uppercase, lowercase, number, and symbol.' });
  }

  const { data: created, error: createError } = await serviceClient.auth.admin.createUser({
    email, password, email_confirm: true,
    user_metadata: {
      account_type: 'staff', full_name: name, role: 'admin', staff_id: staffId,
      department, faculty, phone: phone || null, must_change_password: true,
    },
  });
  if (createError || !created.user) return json(400, { error: createError?.message || 'Could not create the administrator login.' });

  const { error: profileError } = await serviceClient.from('profiles').insert({
    user_id: created.user.id, full_name: name, email, role: 'admin', staff_id: staffId,
    department, faculty, phone: phone || null, must_change_password: true,
  });
  if (profileError) {
    await serviceClient.auth.admin.deleteUser(created.user.id);
    return json(400, { error: profileError.message });
  }
  return json(201, { success: true, administratorId: created.user.id });
}
