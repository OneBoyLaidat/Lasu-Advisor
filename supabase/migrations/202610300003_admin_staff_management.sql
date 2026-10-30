-- =========================================================================
-- LASU Advisor - Migration 202610300003: Admin Staff Management & 1AD Logic
-- Centralized administrative permissions for HODs, Faculty Deans, and Lecturers
-- =========================================================================

-- 1. Helper function: check if authenticated user has administrative oversight
create or replace function public.is_academic_admin()
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where user_id = auth.uid()
      and role in ('hod', 'dean')
  )
$$;

-- 2. Allow HODs and Deans to view all staff member profiles in their department or faculty
drop policy if exists "academic administrators read staff profiles" on public.profiles;
create policy "academic administrators read staff profiles" on public.profiles for select to authenticated
using (
  -- HODs can view all lecturers and staff in their department
  (public.current_profile_role() = 'hod' and department = public.current_profile_department())
  -- Deans can view all staff in their faculty
  or (public.current_profile_role() = 'dean' and faculty = public.current_profile_faculty())
  -- Lecturers can view peer staff members in their department
  or (public.current_profile_role() = 'lecturer' and role in ('lecturer', 'hod') and department = public.current_profile_department())
);

-- 3. Allow HODs and Deans to insert / provision new staff profiles (Lecturers, Level Advisers)
drop policy if exists "academic administrators insert staff profiles" on public.profiles;
create policy "academic administrators insert staff profiles" on public.profiles for insert to authenticated
with check (
  (public.current_profile_role() = 'hod' and department = public.current_profile_department() and role in ('lecturer'))
  or (public.current_profile_role() = 'dean' and faculty = public.current_profile_faculty() and role in ('lecturer', 'hod'))
);

-- 4. Allow HODs and Deans to update staff profiles in their departmental / faculty scope
drop policy if exists "academic administrators update staff profiles" on public.profiles;
create policy "academic administrators update staff profiles" on public.profiles for update to authenticated
using (
  (public.current_profile_role() = 'hod' and department = public.current_profile_department() and role = 'lecturer')
  or (public.current_profile_role() = 'dean' and faculty = public.current_profile_faculty() and role in ('lecturer', 'hod'))
  or (user_id = auth.uid())
);

-- 5. Enable HODs and Deans to manage cohort 1AD adviser assignments (insert, update, delete)
drop policy if exists "hods and deans manage adviser assignments" on public.adviser_assignments;
create policy "hods and deans manage adviser assignments" on public.adviser_assignments for all to authenticated
using (
  (public.current_profile_role() = 'hod' and department = public.current_profile_department())
  or (public.current_profile_role() = 'dean')
)
with check (
  (public.current_profile_role() = 'hod' and department = public.current_profile_department())
  or (public.current_profile_role() = 'dean')
);

-- 6. Grant authenticated role execution permissions on admin helper
grant execute on function public.is_academic_admin to authenticated;
