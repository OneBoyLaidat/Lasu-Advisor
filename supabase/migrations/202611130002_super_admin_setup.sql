-- Super Admin Profile and Permissions Setup
-- Provisions the super admin profile in Supabase and grants full administrative access.

-- 1. Ensure email confirmation and metadata in auth.users if present
do $$
begin
  if exists (select 1 from auth.users where email = 'admin@lasu.edu.ng') then
    update auth.users
    set email_confirmed_at = coalesce(email_confirmed_at, now()),
        raw_user_meta_data = raw_user_meta_data || '{"role":"admin","account_type":"staff","full_name":"LASU System Admin","department":"Computer Science","faculty":"Computing & Information Technology"}'::jsonb
    where email = 'admin@lasu.edu.ng';
  end if;
end $$;

-- 2. Upsert profile in public.profiles with role = 'admin'
insert into public.profiles (user_id, full_name, email, role, department, faculty)
select id, 'LASU System Admin', 'admin@lasu.edu.ng', 'admin', 'Computer Science', 'Computing & Information Technology'
from auth.users where email = 'admin@lasu.edu.ng'
on conflict (user_id) do update set
  role = 'admin',
  full_name = 'LASU System Admin',
  department = 'Computer Science',
  faculty = 'Computing & Information Technology';

-- 3. Upsert staff_profiles row for the admin
insert into public.staff_profiles (user_id, staff_id, must_change_password)
select id, 'ADMIN/SYS/001', false
from auth.users where email = 'admin@lasu.edu.ng'
on conflict (user_id) do update set
  staff_id = 'ADMIN/SYS/001',
  must_change_password = false;

-- 4. Clean up any students table row created by triggers for this admin
delete from public.students
where user_id in (select id from auth.users where email = 'admin@lasu.edu.ng');

-- 5. Mark super admin bootstrap claim as claimed
insert into public.super_admin_bootstrap_claims (singleton, claimed_at, auth_user_id)
select true, now(), id
from auth.users where email = 'admin@lasu.edu.ng'
on conflict (singleton) do update set
  auth_user_id = coalesce(public.super_admin_bootstrap_claims.auth_user_id, excluded.auth_user_id);
