-- Keep the active session in one canonical row so every client uses the same value.
create table if not exists public.academic_settings (
  singleton boolean primary key default true check (singleton),
  active_session text not null check (
    active_session ~ '^(19|20)[0-9]{2}/(19|20)[0-9]{2}$'
    and split_part(active_session, '/', 2)::integer = split_part(active_session, '/', 1)::integer + 1
  ),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(user_id) on delete set null
);

insert into public.academic_settings(singleton, active_session)
select true,
  case when extract(month from current_date) >= 7
    then extract(year from current_date)::integer::text || '/' || (extract(year from current_date)::integer + 1)::text
    else (extract(year from current_date)::integer - 1)::text || '/' || extract(year from current_date)::integer::text
  end
on conflict (singleton) do nothing;

alter table public.academic_settings enable row level security;
revoke all on public.academic_settings from anon, authenticated;
grant select on public.academic_settings to anon, authenticated;
grant update (active_session, updated_at, updated_by) on public.academic_settings to authenticated;
drop policy if exists "active academic session is readable" on public.academic_settings;
create policy "active academic session is readable" on public.academic_settings
  for select to anon, authenticated using (singleton);
drop policy if exists "system administrators advance academic session" on public.academic_settings;
create policy "system administrators advance academic session" on public.academic_settings
  for update to authenticated
  using (public.current_profile_role() = 'admin')
  with check (public.current_profile_role() = 'admin');

create or replace function public.advance_academic_session()
returns text language plpgsql security invoker set search_path = public as $$
declare current_session text; start_year integer; next_session text;
begin
  if public.current_profile_role() is distinct from 'admin' then
    raise exception 'Only a system administrator can advance the academic session' using errcode = '42501';
  end if;
  select active_session into current_session from public.academic_settings where singleton for update;
  if current_session is null then raise exception 'Active academic session is not configured'; end if;
  start_year := split_part(current_session, '/', 1)::integer + 1;
  next_session := start_year::text || '/' || (start_year + 1)::text;
  update public.academic_settings
    set active_session = next_session, updated_at = now(), updated_by = auth.uid()
    where singleton;
  return next_session;
end;
$$;
revoke all on function public.advance_academic_session() from public, anon;
grant execute on function public.advance_academic_session() to authenticated;

-- Normalize legacy values before adding case/whitespace-insensitive constraints.
update public.profiles set email = lower(btrim(email)) where email is not null;
update public.students set matric_no = nullif(upper(btrim(matric_no)), '') where matric_no is not null;
create unique index if not exists profiles_email_normalized_uidx
  on public.profiles (lower(btrim(email))) where email is not null;
create unique index if not exists students_matric_no_normalized_uidx
  on public.students (upper(btrim(matric_no))) where nullif(btrim(matric_no), '') is not null;

-- Auth metadata remains untrusted; only student self-signup creates these rows.
create or replace function public.create_student_profile()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.raw_user_meta_data->>'account_type' is distinct from 'student' then return new; end if;
  insert into public.profiles(user_id, full_name, email, role, department, faculty)
  values(new.id, btrim(coalesce(new.raw_user_meta_data->>'full_name','')), lower(btrim(new.email)), 'student',
    btrim(coalesce(new.raw_user_meta_data->>'department','')), btrim(coalesce(new.raw_user_meta_data->>'faculty','')))
  on conflict (user_id) do nothing;
  insert into public.students(user_id, matric_no, level, admission_session, avatar_url, phone)
  values(new.id, nullif(upper(btrim(new.raw_user_meta_data->>'matric_no')), ''), nullif(btrim(new.raw_user_meta_data->>'level'), ''),
    nullif(btrim(new.raw_user_meta_data->>'admission_session'), ''), nullif(btrim(new.raw_user_meta_data->>'avatar_url'), ''), nullif(btrim(new.raw_user_meta_data->>'phone'), ''))
  on conflict (user_id) do nothing;
  return new;
end;
$$;
revoke all on function public.create_student_profile() from public, anon, authenticated;

-- Let connected admin pages refresh when another authorized client changes these rows.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'profiles') then alter publication supabase_realtime add table public.profiles; end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'staff_profiles') then alter publication supabase_realtime add table public.staff_profiles; end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'department_hod_assignments') then alter publication supabase_realtime add table public.department_hod_assignments; end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'academic_settings') then alter publication supabase_realtime add table public.academic_settings; end if;
  end if;
end;
$$;
