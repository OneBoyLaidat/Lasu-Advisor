import { createClient } from '@supabase/supabase-js';

const json = (statusCode, payload) => ({ statusCode, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }, body: JSON.stringify(payload) });
const normalize = (value) => String(value || '').trim().toUpperCase().replace(/\s+/g, '').replace(/[^A-Z0-9/_-]/g, '');
const internalEmail = (identifier) => `id-${normalize(identifier).replace(/[^A-Z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').toLowerCase()}@accounts.lasu.invalid`;
const strongPassword = (value) => value.length >= 8 && /[A-Z]/.test(value) && /[a-z]/.test(value) && /[0-9]/.test(value) && /[^A-Za-z0-9\s]/.test(value);

export async function handler(event) {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed.' });
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return json(503, { error: 'Student registration is not configured on the server.' });
  let input;
  try { input = JSON.parse(event.body || '{}'); } catch { return json(400, { error: 'Invalid request body.' }); }
  const name = String(input.name || '').trim();
  const matricNo = normalize(input.matricNo);
  const password = String(input.password || '');
  const department = String(input.department || '').trim();
  const faculty = String(input.faculty || '').trim();
  if (name.length < 2 || !matricNo || !department || !faculty) return json(400, { error: 'Name, matriculation/registration number, department, and faculty are required.' });
  if (!strongPassword(password)) return json(400, { error: 'Password must be at least 8 characters and include uppercase, lowercase, number, and symbol.' });
  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: existing } = await admin.from('students').select('user_id').eq('matric_no', matricNo).maybeSingle();
  if (existing) return json(409, { error: 'An account already uses this matriculation or registration number.' });
  const { data: created, error } = await admin.auth.admin.createUser({
    email: internalEmail(matricNo), password, email_confirm: true,
    user_metadata: { account_type: 'student', full_name: name, department, faculty, matric_no: matricNo, level: input.level || null, admission_session: input.admissionSession || null },
  });
  if (error || !created.user) return json(400, { error: error?.message || 'Could not create the student account.' });
  return json(201, { success: true });
}
