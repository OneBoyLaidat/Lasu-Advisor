-- =============================================================================
-- LASU Advisor — Default test profiles for all 5 roles
-- Password for every account: LasuTest@123
-- Run in Supabase Dashboard -> SQL Editor (runs as service role, bypasses RLS)
-- Safe to run multiple times (idempotent via ON CONFLICT DO UPDATE / DO NOTHING)
-- =============================================================================

-- ── 1. STUDENT — CSC/21/0045 (Michael Adebayo) ───────────────────────────────
do $$ declare uid uuid; begin
  uid := coalesce(
    (select id from auth.users where email = 'id-csc-21-0045@lasu.edu.ng' limit 1),
    gen_random_uuid()
  );

  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, confirmation_token, recovery_token,
    email_change_token_new, email_change,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values (
    uid, '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'id-csc-21-0045@lasu.edu.ng',
    extensions.crypt('LasuTest@123', extensions.gen_salt('bf')),
    now(), '', '', '', '',
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Michael Adebayo"}'::jsonb,
    now(), now()
  ) on conflict (id) do update
    set encrypted_password = extensions.crypt('LasuTest@123', extensions.gen_salt('bf')),
        email_confirmed_at = coalesce(auth.users.email_confirmed_at, now()),
        updated_at = now();

  insert into auth.identities (user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (uid, uid::text, jsonb_build_object('sub', uid::text, 'email', 'id-csc-21-0045@lasu.edu.ng'), 'email', now(), now(), now())
  on conflict (provider_id, provider) do nothing;

  insert into public.profiles (user_id, full_name, email, role, department, faculty)
  values (uid, 'Michael Adebayo', 'id-csc-21-0045@lasu.edu.ng', 'student', 'Computer Science', 'Faculty of Computing & Information Technology')
  on conflict (user_id) do update
    set full_name = excluded.full_name, role = excluded.role,
        department = excluded.department, faculty = excluded.faculty;

  insert into public.students (user_id, matric_no, level, admission_session)
  values (uid, 'CSC/21/0045', '300 Level', '2021/2022')
  on conflict (user_id) do update
    set matric_no = excluded.matric_no, level = excluded.level,
        admission_session = excluded.admission_session;
end $$;


-- ── 2. LECTURER — STAFF/CSC/088 (Dr. Sarah Jenkins) ─────────────────────────
do $$ declare uid uuid; begin
  uid := coalesce(
    (select id from auth.users where email = 'id-staff-csc-088@lasu.edu.ng' limit 1),
    gen_random_uuid()
  );

  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, confirmation_token, recovery_token,
    email_change_token_new, email_change,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values (
    uid, '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'id-staff-csc-088@lasu.edu.ng',
    extensions.crypt('LasuTest@123', extensions.gen_salt('bf')),
    now(), '', '', '', '',
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Dr. Sarah Jenkins"}'::jsonb,
    now(), now()
  ) on conflict (id) do update
    set encrypted_password = extensions.crypt('LasuTest@123', extensions.gen_salt('bf')),
        email_confirmed_at = coalesce(auth.users.email_confirmed_at, now()),
        updated_at = now();

  insert into auth.identities (user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (uid, uid::text, jsonb_build_object('sub', uid::text, 'email', 'id-staff-csc-088@lasu.edu.ng'), 'email', now(), now(), now())
  on conflict (provider_id, provider) do nothing;

  insert into public.profiles (user_id, full_name, email, role, department, faculty)
  values (uid, 'Dr. Sarah Jenkins', 'id-staff-csc-088@lasu.edu.ng', 'lecturer', 'Computer Science', 'Faculty of Computing & Information Technology')
  on conflict (user_id) do update
    set full_name = excluded.full_name, role = excluded.role,
        department = excluded.department, faculty = excluded.faculty;

  insert into public.staff_profiles (user_id, staff_id, must_change_password)
  values (uid, 'STAFF/CSC/088', false)
  on conflict (user_id) do update
    set staff_id = excluded.staff_id, must_change_password = false;
end $$;


-- ── 3. HOD — HOD/CSC/012 (Dr. James Miller) ──────────────────────────────────
do $$ declare uid uuid; begin
  uid := coalesce(
    (select id from auth.users where email = 'id-hod-csc-012@lasu.edu.ng' limit 1),
    gen_random_uuid()
  );

  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, confirmation_token, recovery_token,
    email_change_token_new, email_change,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values (
    uid, '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'id-hod-csc-012@lasu.edu.ng',
    extensions.crypt('LasuTest@123', extensions.gen_salt('bf')),
    now(), '', '', '', '',
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Dr. James Miller"}'::jsonb,
    now(), now()
  ) on conflict (id) do update
    set encrypted_password = extensions.crypt('LasuTest@123', extensions.gen_salt('bf')),
        email_confirmed_at = coalesce(auth.users.email_confirmed_at, now()),
        updated_at = now();

  insert into auth.identities (user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (uid, uid::text, jsonb_build_object('sub', uid::text, 'email', 'id-hod-csc-012@lasu.edu.ng'), 'email', now(), now(), now())
  on conflict (provider_id, provider) do nothing;

  insert into public.profiles (user_id, full_name, email, role, department, faculty)
  values (uid, 'Dr. James Miller', 'id-hod-csc-012@lasu.edu.ng', 'hod', 'Computer Science', 'Faculty of Computing & Information Technology')
  on conflict (user_id) do update
    set full_name = excluded.full_name, role = excluded.role,
        department = excluded.department, faculty = excluded.faculty;

  insert into public.staff_profiles (user_id, staff_id, must_change_password)
  values (uid, 'HOD/CSC/012', false)
  on conflict (user_id) do update
    set staff_id = excluded.staff_id, must_change_password = false;
end $$;


-- ── 4. DEAN — DEAN/CIT/001 (Prof. A. Chen) ───────────────────────────────────
do $$ declare uid uuid; begin
  uid := coalesce(
    (select id from auth.users where email = 'id-dean-cit-001@lasu.edu.ng' limit 1),
    gen_random_uuid()
  );

  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, confirmation_token, recovery_token,
    email_change_token_new, email_change,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values (
    uid, '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'id-dean-cit-001@lasu.edu.ng',
    extensions.crypt('LasuTest@123', extensions.gen_salt('bf')),
    now(), '', '', '', '',
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Prof. A. Chen"}'::jsonb,
    now(), now()
  ) on conflict (id) do update
    set encrypted_password = extensions.crypt('LasuTest@123', extensions.gen_salt('bf')),
        email_confirmed_at = coalesce(auth.users.email_confirmed_at, now()),
        updated_at = now();

  insert into auth.identities (user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (uid, uid::text, jsonb_build_object('sub', uid::text, 'email', 'id-dean-cit-001@lasu.edu.ng'), 'email', now(), now(), now())
  on conflict (provider_id, provider) do nothing;

  insert into public.profiles (user_id, full_name, email, role, department, faculty)
  values (uid, 'Prof. A. Chen', 'id-dean-cit-001@lasu.edu.ng', 'dean', 'Computer Science', 'Faculty of Computing & Information Technology')
  on conflict (user_id) do update
    set full_name = excluded.full_name, role = excluded.role,
        department = excluded.department, faculty = excluded.faculty;

  insert into public.staff_profiles (user_id, staff_id, must_change_password)
  values (uid, 'DEAN/CIT/001', false)
  on conflict (user_id) do update
    set staff_id = excluded.staff_id, must_change_password = false;
end $$;


-- ── 5. ADMIN — ADMIN/SYS/001 (LASU System Admin) ─────────────────────────────
do $$ declare uid uuid; begin
  uid := coalesce(
    (select id from auth.users where email = 'id-admin-sys-001@lasu.edu.ng' limit 1),
    gen_random_uuid()
  );

  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, confirmation_token, recovery_token,
    email_change_token_new, email_change,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values (
    uid, '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'id-admin-sys-001@lasu.edu.ng',
    extensions.crypt('LasuTest@123', extensions.gen_salt('bf')),
    now(), '', '', '', '',
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"LASU System Admin"}'::jsonb,
    now(), now()
  ) on conflict (id) do update
    set encrypted_password = extensions.crypt('LasuTest@123', extensions.gen_salt('bf')),
        email_confirmed_at = coalesce(auth.users.email_confirmed_at, now()),
        updated_at = now();

  insert into auth.identities (user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (uid, uid::text, jsonb_build_object('sub', uid::text, 'email', 'id-admin-sys-001@lasu.edu.ng'), 'email', now(), now(), now())
  on conflict (provider_id, provider) do nothing;

  -- profiles: role = 'admin' requires service_role context (bypasses protect_system_admin_role trigger)
  insert into public.profiles (user_id, full_name, email, role, department, faculty)
  values (uid, 'LASU System Admin', 'id-admin-sys-001@lasu.edu.ng', 'admin', 'Administration', 'Central Administration')
  on conflict (user_id) do update
    set full_name = excluded.full_name, role = excluded.role,
        department = excluded.department, faculty = excluded.faculty;

  insert into public.staff_profiles (user_id, staff_id, must_change_password)
  values (uid, 'ADMIN/SYS/001', false)
  on conflict (user_id) do update
    set staff_id = excluded.staff_id, must_change_password = false;
end $$;
