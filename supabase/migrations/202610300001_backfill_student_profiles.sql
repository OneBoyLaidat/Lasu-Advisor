-- Repair student accounts created before the profile trigger was installed.
-- Run after 202610290001_lasu_advisor_live_data.sql.
insert into public.profiles (
  user_id,
  full_name,
  email,
  role,
  department,
  faculty,
  matric_no,
  level,
  admission_session
)
select
  account.id,
  coalesce(nullif(account.raw_user_meta_data->>'full_name', ''), split_part(account.email, '@', 1)),
  account.email,
  'student',
  coalesce(account.raw_user_meta_data->>'department', ''),
  coalesce(account.raw_user_meta_data->>'faculty', ''),
  nullif(account.raw_user_meta_data->>'matric_no', ''),
  nullif(account.raw_user_meta_data->>'level', ''),
  nullif(account.raw_user_meta_data->>'admission_session', '')
from auth.users account
where account.raw_user_meta_data->>'account_type' = 'student'
  and account.email is not null
  and not exists (
    select 1 from public.profiles profile where profile.user_id = account.id
  )
on conflict (user_id) do nothing;
