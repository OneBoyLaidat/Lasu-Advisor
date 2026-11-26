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

  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anonKey || !serviceKey) {
    return sendJson(res, 503, { error: 'Staff provisioning is not configured on the server.' });
  }

  const token = extractBearerToken(req);
  if (!token) return sendJson(res, 401, { error: 'Sign in with an authorized staff account.' });

  const authClient = createAnonClient(url, anonKey);
  const adminClient = createServiceClient(url, serviceKey);
  const { data: { user: actor }, error: authError } = await authClient.auth.getUser(token);
  if (authError || !actor) return sendJson(res, 401, { error: 'Your session has expired. Sign in again.' });

  const input = parseJsonBody(req);
  if (!input) return sendJson(res, 400, { error: 'Invalid request body.' });

  const name = String(input.name || '').trim();
  const staffId = normalizeIdentifier(input.staffId);
  const email = internalEmail(staffId);
  const role = String(input.role || '');
  const department = String(input.department || '').trim();
  const faculty = String(input.faculty || '').trim();
  const password = String(input.password || '');

  if (name.length < 2 || !staffId || !department || !faculty) {
    return sendJson(res, 400, { error: 'Enter a valid name, staff ID, department, and faculty.' });
  }
  if (!['lecturer', 'hod', 'dean'].includes(role)) {
    return sendJson(res, 400, { error: 'Choose a valid staff role.' });
  }
  if (!isStrongPassword(password)) {
    return sendJson(res, 400, {
      error: 'Password must be at least 8 characters and include uppercase, lowercase, number, and symbol.',
    });
  }

  const scopedClient = createAnonClient(url, anonKey, token);
  const { data: canProvision, error: scopeError } = await scopedClient.rpc('can_provision_staff', {
    target_role: role,
    target_department: department,
    target_faculty: faculty,
  });
  if (scopeError || !canProvision) {
    return sendJson(res, 403, { error: 'Only a system administrator can register staff accounts.' });
  }

  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { account_type: 'staff', full_name: name, role, department, faculty },
  });
  if (createError || !created.user) {
    return sendJson(res, 400, { error: createError?.message || 'Could not create staff login.' });
  }

  const profile = { user_id: created.user.id, full_name: name, email, role, department, faculty };
  const { error: profileError } = await adminClient.from('profiles').update(profile).eq('user_id', created.user.id);
  if (profileError) {
    await adminClient.auth.admin.deleteUser(created.user.id);
    return sendJson(res, 400, { error: profileError.message });
  }

  const { error: detailsError } = await adminClient.from('staff_profiles').insert({
    user_id: created.user.id,
    staff_id: staffId,
    level: input.level || null,
    admission_session: input.assignedSession || null,
    phone: input.phone || null,
    must_change_password: true,
  });
  if (detailsError) {
    await adminClient.auth.admin.deleteUser(created.user.id);
    return sendJson(res, 400, { error: detailsError.message });
  }

  await adminClient.from('students').delete().eq('user_id', created.user.id);
  return sendJson(res, 201, {
    success: true,
    staff: {
      id: created.user.id,
      ...profile,
      staff_id: staffId,
      level: input.level || null,
      phone: input.phone || null,
    },
  });
}
