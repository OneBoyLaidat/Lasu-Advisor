import { timingSafeEqual } from 'node:crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createServiceClient, internalEmail, isStrongPassword, normalizeIdentifier, parseJsonBody, sendJson } from './_lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed.' });

  const {
    SUPABASE_URL: url,
    SUPABASE_SERVICE_ROLE_KEY: serviceKey,
    SUPER_ADMIN_BOOTSTRAP_TOKEN: bootstrapToken,
    SUPER_ADMIN_STAFF_ID_ALLOWLIST: allowlist = '',
  } = process.env;
  if (!url || !serviceKey || !bootstrapToken) {
    return sendJson(res, 503, { error: 'Super-admin bootstrap is not configured on the server.' });
  }

  const headerValue = req.headers['x-bootstrap-token'];
  const suppliedToken = Array.isArray(headerValue) ? headerValue[0] : headerValue;
  const suppliedBuffer = Buffer.from(String(suppliedToken || ''));
  const expectedBuffer = Buffer.from(bootstrapToken);
  if (suppliedBuffer.length !== expectedBuffer.length || !timingSafeEqual(suppliedBuffer, expectedBuffer)) {
    return sendJson(res, 401, { error: 'Invalid bootstrap credential.' });
  }

  const input = parseJsonBody(req);
  if (!input) return sendJson(res, 400, { error: 'Invalid request body.' });

  const name = String(input.name || '').trim();
  const staffId = normalizeIdentifier(input.staffId || input.identifier);
  const password = String(input.password || '');
  const allowedIds = allowlist.split(',').map((entry) => normalizeIdentifier(entry)).filter(Boolean);
  if (!staffId || (allowedIds.length > 0 && !allowedIds.includes(staffId))) {
    return sendJson(res, 403, { error: 'This Staff ID is not on the bootstrap allowlist.' });
  }
  if (name.length < 2) {
    return sendJson(res, 400, { error: 'Enter a valid name and Staff ID.' });
  }
  const email = internalEmail(staffId);
  if (!isStrongPassword(password)) {
    return sendJson(res, 400, {
      error: 'Password must be at least 8 characters and include uppercase, lowercase, number, and symbol.',
    });
  }

  const service = createServiceClient(url, serviceKey);
  const { data: claimed, error: claimError } = await service.rpc('claim_super_admin_bootstrap');
  if (claimError) return sendJson(res, 500, { error: 'Bootstrap database migration is missing or failed.' });
  if (!claimed) {
    return sendJson(res, 409, { error: 'Bootstrap is already claimed or a system administrator already exists.' });
  }

  const { data: created, error: createError } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { account_type: 'student', role: 'student', full_name: name, department: 'Administration', faculty: 'LASU' },
  });
  if (createError || !created.user) {
    await service.rpc('release_super_admin_bootstrap_claim');
    return sendJson(res, 400, { error: createError?.message || 'Could not create the administrator account.' });
  }

  const { error: identityError } = await service
    .from('profiles')
    .update({ full_name: name, email, role: 'admin', department: 'Administration', faculty: 'LASU' })
    .eq('user_id', created.user.id);
  if (identityError) {
    await service.auth.admin.deleteUser(created.user.id);
    await service.rpc('release_super_admin_bootstrap_claim');
    return sendJson(res, 500, { error: identityError.message });
  }

  const { error: detailsError } = await service.from('staff_profiles').insert({
    user_id: created.user.id,
    staff_id: staffId,
    must_change_password: false,
  });
  if (detailsError) {
    await service.auth.admin.deleteUser(created.user.id);
    await service.rpc('release_super_admin_bootstrap_claim');
    return sendJson(res, 500, { error: detailsError.message });
  }

  await service.from('students').delete().eq('user_id', created.user.id);
  await service.from('super_admin_bootstrap_claims').update({ auth_user_id: created.user.id }).eq('singleton', true);
  return sendJson(res, 201, { success: true, staffId, profileId: created.user.id, portalPath: '/admin-portal' });
}
