import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  createAnonClient,
  createServiceClient,
  extractBearerToken,
  internalEmail,
  isStrongPassword,
  normalizeIdentifier,
  parseJsonBody,
  sendJson,
} from './_lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed.' });

  const { SUPABASE_URL: url, SUPABASE_ANON_KEY: anonKey, SUPABASE_SERVICE_ROLE_KEY: serviceKey } = process.env;
  if (!url || !anonKey || !serviceKey) {
    return sendJson(res, 503, { error: 'Administrator provisioning is not configured on the server.' });
  }

  const token = extractBearerToken(req);
  if (!token) return sendJson(res, 401, { error: 'Sign in with a system administrator account.' });

  const sessionClient = createAnonClient(url, anonKey);
  const serviceClient = createServiceClient(url, serviceKey);
  const { data: { user: actor }, error: authError } = await sessionClient.auth.getUser(token);
  if (authError || !actor) return sendJson(res, 401, { error: 'Your session has expired. Sign in again.' });

  const { data: actorProfile, error: actorProfileError } = await serviceClient
    .from('profiles')
    .select('role')
    .eq('user_id', actor.id)
    .maybeSingle();
  if (actorProfileError || actorProfile?.role !== 'admin') {
    return sendJson(res, 403, { error: 'Only a signed-in system administrator can register administrators.' });
  }

  const input = parseJsonBody(req);
  if (!input) return sendJson(res, 400, { error: 'Invalid request body.' });

  const name = String(input.name || '').trim();
  const staffId = normalizeIdentifier(input.staffId);
  const email = internalEmail(staffId);
  const department = String(input.department || '').trim();
  const faculty = String(input.faculty || '').trim();
  const phone = String(input.phone || '').trim();
  const password = String(input.password || '');

  if (name.length < 2 || !staffId || !department || !faculty) {
    return sendJson(res, 400, { error: 'Enter a valid name, staff ID, department, and faculty.' });
  }
  if (!isStrongPassword(password)) {
    return sendJson(res, 400, {
      error: 'Password must be at least 8 characters and include uppercase, lowercase, number, and symbol.',
    });
  }

  const { data: created, error: createError } = await serviceClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { account_type: 'student', full_name: name, role: 'student', department, faculty },
  });
  if (createError || !created.user) {
    return sendJson(res, 400, { error: createError?.message || 'Could not create the administrator login.' });
  }

  const { error: profileError } = await serviceClient
    .from('profiles')
    .update({ full_name: name, email, role: 'admin', department, faculty })
    .eq('user_id', created.user.id);
  if (profileError) {
    await serviceClient.auth.admin.deleteUser(created.user.id);
    return sendJson(res, 400, { error: profileError.message });
  }

  const { error: detailsError } = await serviceClient.from('staff_profiles').insert({
    user_id: created.user.id,
    staff_id: staffId,
    phone: phone || null,
    must_change_password: true,
  });
  if (detailsError) {
    await serviceClient.auth.admin.deleteUser(created.user.id);
    return sendJson(res, 400, { error: detailsError.message });
  }

  await serviceClient.from('students').delete().eq('user_id', created.user.id);
  return sendJson(res, 201, { success: true, administratorId: created.user.id });
}
