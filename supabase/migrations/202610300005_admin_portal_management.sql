create table if not exists public.department_hod_assignments (
  department text primary key check (department in (
    'Software Engineering', 'Cybersecurity', 'Data Science',
    'Information and Communication Technology', 'Computer Science'
  )),
  hod_id uuid not null unique references public.profiles(user_id) on delete restrict,
  assigned_at timestamptz not null default now(),
  assigned_by uuid references public.profiles(user_id)
);

alter table public.department_hod_assignments enable row level security;
revoke all on table public.department_hod_assignments from public, anon;
grant select on table public.department_hod_assignments to authenticated;

drop policy if exists "system administrators read department HOD assignments" on public.department_hod_assignments;
create policy "system administrators read department HOD assignments"
  on public.department_hod_assignments for select to authenticated
  using (public.current_profile_role() = 'admin');

-- HOD changes go through a single transaction so a HOD can be moved between
-- departments without leaving duplicate assignments behind.
create or replace function public.set_department_hod(target_department text, target_hod_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  target_role text;
begin
  if public.current_profile_role() <> 'admin' then
    raise exception 'Only a system administrator can assign a department HOD';
  end if;
  if target_department not in (
    'Software Engineering', 'Cybersecurity', 'Data Science',
    'Information and Communication Technology', 'Computer Science'
  ) then
    raise exception 'Unknown department';
  end if;
  if target_hod_id is null then
    delete from public.department_hod_assignments where department = target_department;
    return;
  end if;

  select role into target_role from public.profiles where user_id = target_hod_id for update;
  if target_role is distinct from 'hod' then
    raise exception 'The selected account must have the HOD role';
  end if;

  update public.profiles set department = target_department where user_id = target_hod_id;
  delete from public.department_hod_assignments where hod_id = target_hod_id or department = target_department;
  insert into public.department_hod_assignments(department, hod_id, assigned_by)
  values (target_department, target_hod_id, auth.uid());
end;
$$;

revoke all on function public.set_department_hod(text, uuid) from public, anon;
grant execute on function public.set_department_hod(text, uuid) to authenticated;

-- Admins may edit staff records through the portal. Student identity stays
-- outside this policy and must continue to be changed through the student flow.
drop policy if exists "system administrators update staff profiles" on public.profiles;
create policy "system administrators update staff profiles"
  on public.profiles for update to authenticated
  using (public.current_profile_role() = 'admin' and role in ('lecturer', 'hod', 'dean'))
  with check (public.current_profile_role() = 'admin' and role in ('lecturer', 'hod', 'dean'));

-- If a HOD role or department changes in the profile editor, clear their old
-- slot. The administrator can then assign the profile to the correct slot.
create or replace function public.clear_stale_department_hod_assignment()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if old.role = 'hod' and (new.role <> 'hod' or new.department is distinct from old.department) then
    delete from public.department_hod_assignments
    where hod_id = old.user_id and department is distinct from new.department;
  end if;
  return new;
end;
$$;

drop trigger if exists clear_stale_department_hod_assignment_trigger on public.profiles;
create trigger clear_stale_department_hod_assignment_trigger
  after update of role, department on public.profiles
  for each row execute function public.clear_stale_department_hod_assignment();
