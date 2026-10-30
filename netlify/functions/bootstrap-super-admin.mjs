import { createClient } from '@supabase/supabase-js';
import { timingSafeEqual } from 'node:crypto';

const json = (statusCode, payload) => ({
  statusCode,
  headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  body: JSON.stringify(payload),
});

export async function handler(event) {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed.' });
  const { SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: serviceKey, SUPER_ADMIN_BOOTSTRAP_TOKEN: bootstrapToken, SUPER_ADMIN_EMAIL_ALLOWLIST: allowlist = '' } = process.env;
  if (!url || !serviceKey || !bootstrapToken) return json(503, { error: 'Super-admin bootstrap is not configured on the server.' });
  const suppliedToken = event.headers['x-bootstrap-token'] || event.headers['X-Bootstrap-Token'];
  const suppliedBuffer = Buffer.from(String(suppliedToken || ''));
  const expectedBuffer = Buffer.from(bootstrapToken);
  if (suppliedBuffer.length !== expectedBuffer.length || !timingSafeEqual(suppliedBuffer, expectedBuffer)) return json(401, { error: 'Invalid bootstrap credential.' });
  let input;
  try { input = JSON.parse(event.body || '{}'); } catch { return json(400, { error: 'Invalid request body.' }); }
  const name = String(input.name || '').trim();
  const email = String(input.email || '').trim().toLowerCase();
  const password = String(input.password || '');
  const allowedEmails = allowlist.split(',').map((entry) => entry.trim().toLowerCase()).filter(Boolean);
  if (!allowedEmails.includes(email)) return json(403, { error: 'This email address is not on the bootstrap allowlist.' });
  if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json(400, { error: 'Enter a valid name and allowed email address.' });
  if (password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9\s]/.test(password)) {
    return json(400, { error: 'Password must be at least 8 characters and include uppercase, lowercase, number, and symbol.' });
  }
  const service = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: claimed, error: claimError } = await service.rpc('claim_super_admin_bootstrap');
  if (claimError) return json(500, { error: 'Bootstrap database migration is missing or failed.' });
  if (!claimed) return json(409, { error: 'Bootstrap is already claimed or a system administrator already exists.' });

  const { data: created, error: createError } = await service.auth.admin.createUser({
    email, password, email_confirm: true,
    user_metadata: { account_type: 'student', role: 'student', full_name: name, department: 'Administration', faculty: 'LASU' },
  });
  if (createError || !created.user) {
    await service.rpc('release_super_admin_bootstrap_claim');
    return json(400, { error: createError?.message || 'Could not create the administrator account.' });
  }

  const { error: identityError } = await service.from('profiles').update({ full_name: name, email, role: 'admin', department: 'Administration', faculty: 'LASU' }).eq('user_id', created.user.id);
  if (identityError) {
    await service.auth.admin.deleteUser(created.user.id);
    await service.rpc('release_super_admin_bootstrap_claim');
    return json(500, { error: identityError.message });
  }
  const { error: detailsError } = await service.from('staff_profiles').insert({ user_id: created.user.id, must_change_password: false });
  if (detailsError) {
    await service.auth.admin.deleteUser(created.user.id);
    await service.rpc('release_super_admin_bootstrap_claim');
    return json(500, { error: detailsError.message });
  }
  await service.from('students').delete().eq('user_id', created.user.id);
  await service.from('super_admin_bootstrap_claims').update({ auth_user_id: created.user.id }).eq('singleton', true);
  return json(201, { success: true, email, profileId: created.user.id, portalPath: '/admin-portal' });
}
