-- Break mutual RLS recursion between public.profiles and public.adviser_assignments.
-- profiles_scoped_read queried adviser_assignments while academic_administrators_manage_scoped_assignments
-- queried profiles, causing "infinite recursion detected in policy for relation profiles".

create or replace function public.is_faculty_lecturer(target_user_id uuid, target_faculty text)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles adviser
    where adviser.user_id = target_user_id
      and adviser.role = 'lecturer'
      and adviser.faculty = target_faculty
  )
$$;

create or replace function public.is_assigned_adviser_for_current_student(target_adviser_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.adviser_assignments assignment
    where assignment.adviser_id = target_adviser_id
      and assignment.department = public.current_profile_department()
      and assignment.admission_session = public.current_profile_session()
      and assignment.level = public.current_profile_level()
  )
$$;

revoke all on function public.is_faculty_lecturer(uuid, text) from public, anon;
grant execute on function public.is_faculty_lecturer(uuid, text) to authenticated;

revoke all on function public.is_assigned_adviser_for_current_student(uuid) from public, anon;
grant execute on function public.is_assigned_adviser_for_current_student(uuid) to authenticated;

drop policy if exists "academic administrators manage scoped assignments" on public.adviser_assignments;
create policy "academic administrators manage scoped assignments" on public.adviser_assignments for all to authenticated
using (
  (public.current_profile_role() = 'hod'
    and department = public.current_profile_department())
  or (public.current_profile_role() = 'dean'
    and public.is_faculty_lecturer(adviser_id, public.current_profile_faculty()))
)
with check (
  public.is_department_lecturer(adviser_id, department)
  and ((public.current_profile_role() = 'hod'
    and department = public.current_profile_department())
  or (public.current_profile_role() = 'dean'
    and public.is_faculty_lecturer(adviser_id, public.current_profile_faculty())))
);

drop policy if exists "profiles scoped read" on public.profiles;
create policy "profiles scoped read" on public.profiles for select to authenticated
using (
  user_id = (select auth.uid())
  or (role = 'student' and public.can_access_student(user_id))
  or (role = 'lecturer' and public.current_profile_role() = 'hod' and department = public.current_profile_department())
  or (role = 'lecturer' and public.current_profile_role() = 'student'
    and public.is_assigned_adviser_for_current_student(profiles.user_id))
  or (public.current_profile_role() = 'lecturer' and role in ('lecturer', 'hod') and department = public.current_profile_department())
  or (role = 'dean' and public.current_profile_role() = 'hod' and faculty = public.current_profile_faculty())
  or (role = 'hod' and public.current_profile_role() = 'dean' and faculty = public.current_profile_faculty())
  or (public.current_profile_role() = 'hod' and department = public.current_profile_department())
  or (public.current_profile_role() = 'dean' and faculty = public.current_profile_faculty())
  or public.current_profile_role() = 'admin'
);
