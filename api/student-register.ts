import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  createServiceClient,
  internalEmail,
  isStrongPassword,
  normalizeIdentifier,
  parseJsonBody,
  sendJson,
} from './_lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed.' });

  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return sendJson(res, 503, { error: 'Student registration is not configured on the server.' });
  }

  const input = parseJsonBody(req);
  if (!input) return sendJson(res, 400, { error: 'Invalid request body.' });

  const name = String(input.name || '').trim();
  const matricNo = normalizeIdentifier(input.matricNo);
  const password = String(input.password || '');
  const department = String(input.department || '').trim();
  const faculty = String(input.faculty || '').trim();

  if (name.length < 2 || !matricNo || !department || !faculty) {
    return sendJson(res, 400, {
      error: 'Name, matriculation/registration number, department, and faculty are required.',
    });
  }
  if (!isStrongPassword(password)) {
    return sendJson(res, 400, {
      error: 'Password must be at least 8 characters and include uppercase, lowercase, number, and symbol.',
    });
  }

  const admin = createServiceClient(url, serviceKey);
  const { data: existing } = await admin.from('students').select('user_id').eq('matric_no', matricNo).maybeSingle();
  if (existing) {
    return sendJson(res, 409, { error: 'An account already uses this matriculation or registration number.' });
  }

  const { data: created, error } = await admin.auth.admin.createUser({
    email: internalEmail(matricNo),
    password,
    email_confirm: true,
    user_metadata: {
      account_type: 'student',
      full_name: name,
      department,
      faculty,
      matric_no: matricNo,
      level: input.level || null,
      admission_session: input.admissionSession || null,
    },
  });

  if (error || !created.user) {
    return sendJson(res, 400, { error: error?.message || 'Could not create the student account.' });
  }

  return sendJson(res, 201, { success: true });
}
