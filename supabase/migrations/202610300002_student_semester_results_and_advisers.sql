alter table public.profiles
  add column if not exists result_prompt_dismissed_semester text;

alter table public.student_results
  add column if not exists semester_key text;

-- Let a student see adviser assignments for their own admission cohort at
-- their current or earlier academic levels, so the inbox can list past advisers.
drop policy if exists "students read assigned adviser" on public.adviser_assignments;
create policy "students read assigned adviser" on public.adviser_assignments for select to authenticated
using (
  public.current_profile_role() = 'student'
  and department = public.current_profile_department()
  and admission_session = public.current_profile_session()
  and nullif(substring(level from '^[0-9]+'), '')::integer <=
    nullif(substring(public.current_profile_level() from '^[0-9]+'), '')::integer
);

drop policy if exists "student reads current and past assigned adviser profiles" on public.profiles;
create policy "student reads current and past assigned adviser profiles" on public.profiles for select to authenticated
using (
  public.current_profile_role() = 'student'
  and role = 'lecturer'
  and exists (
    select 1 from public.adviser_assignments assignment
    where assignment.adviser_id = user_id
      and assignment.department = public.current_profile_department()
      and assignment.admission_session = public.current_profile_session()
      and nullif(substring(assignment.level from '^[0-9]+'), '')::integer <=
        nullif(substring(public.current_profile_level() from '^[0-9]+'), '')::integer
  )
);

create or replace function public.can_message(target_user_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles recipient
    where recipient.user_id = target_user_id and (
      (public.current_profile_role() = 'student' and recipient.role = 'lecturer' and exists (
        select 1 from public.adviser_assignments assignment
        where assignment.adviser_id = recipient.user_id
          and assignment.department = public.current_profile_department()
          and assignment.admission_session = public.current_profile_session()
          and nullif(substring(assignment.level from '^[0-9]+'), '')::integer <=
            nullif(substring(public.current_profile_level() from '^[0-9]+'), '')::integer
      ))
      or (public.current_profile_role() = 'lecturer' and recipient.role = 'student' and public.can_access_student(target_user_id))
      or (public.current_profile_role() = 'hod' and recipient.role in ('lecturer', 'dean') and (
        (recipient.role = 'dean' and recipient.faculty = public.current_profile_faculty())
        or (recipient.role = 'lecturer' and recipient.department = public.current_profile_department())
      ))
      or (public.current_profile_role() = 'dean' and recipient.role = 'hod' and recipient.faculty = public.current_profile_faculty())
    )
  )
$$;

create or replace function public.get_academic_analytics()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  viewer_role text := public.current_profile_role();
  result jsonb;
begin
  if viewer_role not in ('lecturer', 'hod', 'dean') then
    raise exception 'Academic analytics are restricted to authorized academic staff';
  end if;

  with scoped_students as (
    select student.user_id
    from public.profiles student
    where student.role = 'student'
      and (
        (viewer_role = 'hod' and student.department = public.current_profile_department())
        or (viewer_role = 'dean' and student.faculty = public.current_profile_faculty())
        or (viewer_role = 'lecturer' and exists (
          select 1 from public.adviser_assignments assignment
          where assignment.adviser_id = auth.uid()
            and assignment.department = student.department
            and assignment.admission_session = student.admission_session
            and assignment.level = student.level
        ))
      )
  ), latest_results as (
    select distinct on (record.user_id)
      record.user_id,
      record.cgpa,
      record.courses
    from public.student_results record
    join scoped_students scoped on scoped.user_id = record.user_id
    order by record.user_id, record.created_at desc
  ), course_rows as (
    select
      course_data.course->>'code' as code,
      coalesce(course_data.course->>'title', '') as title,
      coalesce(course_data.course->>'status', '') = 'Passed' as passed
    from latest_results result_row
    cross join lateral jsonb_array_elements(result_row.courses) as course_data(course)
    where nullif(course_data.course->>'code', '') is not null
  ), course_aggregates as (
    select code, max(title) as title, count(*)::integer as attempts,
      round(100.0 * count(*) filter (where passed) / nullif(count(*), 0))::integer as pass_rate
    from course_rows
    group by code
  )
  select jsonb_build_object(
    'studentCount', (select count(*)::integer from scoped_students),
    'studentsWithResults', (select count(*)::integer from latest_results),
    'meanCgpa', (select round(avg(cgpa), 2) from latest_results),
    'classifications', jsonb_build_array(
      jsonb_build_object('name', 'First Class', 'count', (select count(*)::integer from latest_results where cgpa >= 4.5)),
      jsonb_build_object('name', 'Second Class Upper', 'count', (select count(*)::integer from latest_results where cgpa >= 3.5 and cgpa < 4.5)),
      jsonb_build_object('name', 'Second Class Lower', 'count', (select count(*)::integer from latest_results where cgpa >= 2.4 and cgpa < 3.5)),
      jsonb_build_object('name', 'Third Class', 'count', (select count(*)::integer from latest_results where cgpa >= 1.5 and cgpa < 2.4)),
      jsonb_build_object('name', 'Pass', 'count', (select count(*)::integer from latest_results where cgpa < 1.5))
    ),
    'courses', coalesce((select jsonb_agg(jsonb_build_object('code', code, 'title', title, 'attempts', attempts, 'passRate', pass_rate) order by code) from course_aggregates), '[]'::jsonb)
  ) into result;

  return result;
end
$$;

revoke all on function public.get_academic_analytics() from public, anon;
grant execute on function public.get_academic_analytics() to authenticated;
