alter table public.profiles
  add column if not exists must_change_password boolean not null default false;

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('student', 'lecturer', 'hod', 'dean', 'admin'));

create or replace function public.protect_profile_role_and_cohort()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is not null and auth.uid() = old.user_id and pg_trigger_depth() = 1 and (
    new.role is distinct from old.role or new.department is distinct from old.department
    or new.faculty is distinct from old.faculty or new.matric_no is distinct from old.matric_no
    or new.staff_id is distinct from old.staff_id or new.level is distinct from old.level
    or new.email is distinct from old.email or new.admission_session is distinct from old.admission_session
    or new.has_uploaded_transcript is distinct from old.has_uploaded_transcript
    or new.transcript_file_name is distinct from old.transcript_file_name
    or new.must_change_password is distinct from old.must_change_password
  ) then
    raise exception 'Identity, authorization, cohort, and password enrollment fields can only be changed by a trusted server operation';
  end if;
  return new;
end;
$$;

drop policy if exists "system administrators read staff profiles" on public.profiles;
create policy "system administrators read staff profiles" on public.profiles for select to authenticated
using (public.current_profile_role() = 'admin');

drop policy if exists "academic administrators insert staff profiles" on public.profiles;
create policy "system administrators insert staff profiles" on public.profiles for insert to authenticated
with check (public.current_profile_role() = 'admin');

-- Only a system administrator can provision staff accounts.
create or replace function public.can_provision_staff(
  target_role text,
  target_department text,
  target_faculty text
)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles actor
    where actor.user_id = auth.uid()
      and actor.role = 'admin'
      and target_role in ('lecturer', 'hod', 'dean')
      and nullif(target_department, '') is not null
      and nullif(target_faculty, '') is not null
  );
$$;

grant execute on function public.can_provision_staff(text, text, text) to authenticated;

create or replace function public.is_academic_admin()
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.profiles where user_id = auth.uid() and role in ('hod', 'dean', 'admin'));
$$;
grant execute on function public.is_academic_admin() to authenticated;
