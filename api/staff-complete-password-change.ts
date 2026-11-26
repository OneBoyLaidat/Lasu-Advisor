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
    return sendJson(res, 503, { error: 'Password update is not configured on the server.' });
  }

  const token = extractBearerToken(req);
  if (!token) return sendJson(res, 401, { error: 'Sign in again to update your password.' });

  const auth = createAnonClient(url, anonKey);
  const admin = createServiceClient(url, serviceKey);
  const { data: { user }, error: authError } = await auth.auth.getUser(token);
  if (authError || !user) return sendJson(res, 401, { error: 'Your session has expired. Sign in again.' });

  const input = parseJsonBody(req);
  if (!input) return sendJson(res, 400, { error: 'Invalid request body.' });

  const password = String(input.password || '');
  if (!isStrongPassword(password)) {
    return sendJson(res, 400, {
      error: 'Password must be at least 8 characters and include uppercase, lowercase, number, and symbol.',
    });
  }

  const [{ data: profile, error: profileError }, { data: staff, error: staffError }] = await Promise.all([
    admin.from('profiles').select('role').eq('user_id', user.id).maybeSingle(),
    admin.from('staff_profiles').select('must_change_password').eq('user_id', user.id).maybeSingle(),
  ]);
  if (profileError || staffError || !profile || profile.role === 'student' || !staff?.must_change_password) {
    return sendJson(res, 403, { error: 'This account does not require an initial staff password change.' });
  }

  const { error: updateError } = await admin.auth.admin.updateUserById(user.id, { password });
  if (updateError) return sendJson(res, 400, { error: updateError.message });

  const { error: clearError } = await admin
    .from('staff_profiles')
    .update({ must_change_password: false })
    .eq('user_id', user.id);
  if (clearError) return sendJson(res, 500, { error: clearError.message });

  return sendJson(res, 200, { success: true });
}
