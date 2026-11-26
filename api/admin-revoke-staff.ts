import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  createAnonClient,
  createServiceClient,
  extractBearerToken,
  parseJsonBody,
  sendJson,
} from './_lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed.' });

  const { SUPABASE_URL: url, SUPABASE_ANON_KEY: anonKey, SUPABASE_SERVICE_ROLE_KEY: serviceKey } = process.env;
  if (!url || !anonKey || !serviceKey) {
    return sendJson(res, 503, { error: 'Staff management is not configured on the server.' });
  }

  const token = extractBearerToken(req);
  if (!token) return sendJson(res, 401, { error: 'Sign in with an authorized administrator account.' });

  const scoped = createAnonClient(url, anonKey, token);
  const admin = createServiceClient(url, serviceKey);
  const { data: { user: actor }, error: authError } = await scoped.auth.getUser(token);
  if (authError || !actor) return sendJson(res, 401, { error: 'Your session has expired. Sign in again.' });

  const input = parseJsonBody(req);
  if (!input) return sendJson(res, 400, { error: 'Invalid request body.' });

  const staffId = String(input.staffId || '').trim();
  if (!staffId) return sendJson(res, 400, { error: 'Staff ID is required.' });

  const { data: target, error: targetError } = await admin
    .from('profiles')
    .select('user_id,role,department,faculty')
    .or(`user_id.eq.${staffId},email.eq.${staffId}`)
    .maybeSingle();
  if (targetError || !target) return sendJson(res, 404, { error: 'Staff account was not found.' });

  const { data: canManage, error: permissionError } = await scoped.rpc('can_provision_staff', {
    target_role: target.role,
    target_department: target.department,
    target_faculty: target.faculty,
  });
  if (permissionError || !canManage) {
    return sendJson(res, 403, { error: 'You are not authorized to revoke access for this staff account.' });
  }

  await admin.from('department_hod_assignments').delete().eq('hod_id', target.user_id);
  await admin.from('adviser_assignments').delete().eq('adviser_id', target.user_id);
  await admin.from('staff_profiles').delete().eq('user_id', target.user_id);
  await admin.from('profiles').delete().eq('user_id', target.user_id);

  const { error: deleteUserError } = await admin.auth.admin.deleteUser(target.user_id);
  if (deleteUserError) {
    console.warn('Could not delete auth user', deleteUserError);
  }

  return sendJson(res, 200, { success: true, message: 'Staff access revoked successfully.' });
}
