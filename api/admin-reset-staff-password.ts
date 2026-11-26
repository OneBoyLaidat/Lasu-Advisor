import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  createAnonClient,
  createServiceClient,
  extractBearerToken,
  isStrongPassword,
  parseJsonBody,
  sendJson,
} from './_lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed.' });

  const { SUPABASE_URL: url, SUPABASE_ANON_KEY: anonKey, SUPABASE_SERVICE_ROLE_KEY: serviceKey } = process.env;
  if (!url || !anonKey || !serviceKey) {
    return sendJson(res, 503, { error: 'Staff password reset is not configured on the server.' });
  }

  const token = extractBearerToken(req);
  if (!token) return sendJson(res, 401, { error: 'Sign in with an authorized account.' });

  const scoped = createAnonClient(url, anonKey, token);
  const admin = createServiceClient(url, serviceKey);
  const { data: { user: actor }, error: authError } = await scoped.auth.getUser(token);
  if (authError || !actor) return sendJson(res, 401, { error: 'Your session has expired. Sign in again.' });

  const input = parseJsonBody(req);
  if (!input) return sendJson(res, 400, { error: 'Invalid request body.' });

  const staffId = String(input.staffId || '');
  const password = String(input.password || '');
  if (!isStrongPassword(password)) {
    return sendJson(res, 400, {
      error: 'Password must be at least 8 characters and include uppercase, lowercase, number, and symbol.',
    });
  }

  const { data: target, error: targetError } = await admin
    .from('profiles')
    .select('user_id,role,department,faculty')
    .eq('user_id', staffId)
    .in('role', ['lecturer', 'hod', 'dean'])
    .maybeSingle();
  if (targetError || !target) return sendJson(res, 404, { error: 'Staff account was not found.' });

  const { data: canManage, error: permissionError } = await scoped.rpc('can_provision_staff', {
    target_role: target.role,
    target_department: target.department,
    target_faculty: target.faculty,
  });
  if (permissionError || !canManage) {
    return sendJson(res, 403, { error: 'You are not authorized to reset this staff account.' });
  }

  const { error: updateError } = await admin.auth.admin.updateUserById(target.user_id, { password });
  if (updateError) return sendJson(res, 400, { error: updateError.message });

  const { error: profileError } = await admin
    .from('staff_profiles')
    .update({ must_change_password: true })
    .eq('user_id', target.user_id);
  if (profileError) return sendJson(res, 500, { error: profileError.message });

  return sendJson(res, 200, { success: true });
}
