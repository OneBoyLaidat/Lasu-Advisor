-- Idempotent seed script for testing all 5 LASU Advisor roles on live Supabase (lasuadvisor.vercel.app).
-- Run this in Supabase Dashboard -> SQL Editor.
-- Default login password for all 5 test accounts: LasuTest@123

do $$
declare
  seed record;
  target_user_id uuid;
begin
  for seed in
    select * from (values
      ('student',  'Michael Adebayo',   'CSC/21/0045',  'id-csc-21-0045@lasu.edu.ng',   'Computer Science', 'Faculty of Computing & Information Technology', '300 Level', '2021/2022'),
      ('lecturer', 'Dr. Sarah Jenkins', 'STAFF/CSC/088','id-staff-csc-088@lasu.edu.ng', 'Computer Science', 'Faculty of Computing & Information Technology', '300 Level', '2021/2022'),
      ('hod',      'Dr. James Miller',  'HOD/CSC/012',  'id-hod-csc-012@lasu.edu.ng',   'Computer Science', 'Faculty of Computing & Information Technology', null,        null),
      ('dean',     'Prof. A. Chen',     'DEAN/CIT/001', 'id-dean-cit-001@lasu.edu.ng',  'Computer Science', 'Faculty of Computing & Information Technology', null,        null),
      ('admin',    'LASU System Admin', 'ADMIN/SYS/001','id-admin-sys-001@lasu.edu.ng', 'Computer Science', 'Faculty of Computing & Information Technology', null,        null)
    ) as t(role_name, full_name, identifier, auth_email, department, faculty, level_name, admission_session)
  loop
    select id into target_user_id from auth.users where email = seed.auth_email limit 1;

    if target_user_id is null then
      target_user_id := gen_random_uuid();
      insert into auth.users (
        id,
        instance_id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        confirmation_token,
        recovery_token,
        email_change_token_new,
        email_change,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at
      )
      values (
        target_user_id,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        seed.auth_email,
        extensions.crypt('LasuTest@123', extensions.gen_salt('bf')),
        now(),
        '',
        '',
        '',
        '',
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', seed.full_name),
        now(),
        now()
      );
    else
      update auth.users
      set encrypted_password = extensions.crypt('LasuTest@123', extensions.gen_salt('bf')),
          email_confirmed_at = coalesce(email_confirmed_at, now()),
          confirmation_token = coalesce(confirmation_token, ''),
          recovery_token = coalesce(recovery_token, ''),
          email_change_token_new = coalesce(email_change_token_new, ''),
          email_change = coalesce(email_change, ''),
          updated_at = now()
      where id = target_user_id;
    end if;

    insert into auth.identities (
      id,
      user_id,
      provider_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    )
    values (
      gen_random_uuid(),
      target_user_id,
      target_user_id::text,
      jsonb_build_object('sub', target_user_id::text, 'email', seed.auth_email),
      'email',
      now(),
      now(),
      now()
    )
    on conflict (provider_id, provider) do nothing;

    insert into public.profiles (user_id, full_name, email, role, department, faculty)
    values (target_user_id, seed.full_name, seed.auth_email, seed.role_name, seed.department, seed.faculty)
    on conflict (user_id) do update
      set full_name = excluded.full_name,
          email = excluded.email,
          role = excluded.role,
          department = excluded.department,
          faculty = excluded.faculty;

    if seed.role_name = 'student' then
      insert into public.students (user_id, matric_no, level, admission_session)
      values (target_user_id, seed.identifier, seed.level_name, seed.admission_session)
      on conflict (user_id) do update
        set matric_no = excluded.matric_no,
            level = excluded.level,
            admission_session = excluded.admission_session;
    else
      insert into public.staff_profiles (user_id, staff_id, level, admission_session, must_change_password)
      values (target_user_id, seed.identifier, seed.level_name, seed.admission_session, false)
      on conflict (user_id) do update
        set staff_id = excluded.staff_id,
            level = excluded.level,
            admission_session = excluded.admission_session,
            must_change_password = false;
    end if;
  end loop;
end $$;
