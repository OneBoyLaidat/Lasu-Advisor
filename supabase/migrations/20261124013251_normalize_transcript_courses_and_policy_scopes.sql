-- Store transcript courses relationally for analytics and filtering while
-- retaining the JSON snapshot during the compatibility window for older app builds.
create table if not exists public.student_result_courses (
  result_id bigint not null references public.student_results(id) on delete cascade,
  course_position integer not null check (course_position >= 0),
  code text not null default '',
  title text not null default '',
  units numeric(4,1) not null default 0 check (units >= 0 and units <= 99),
  grade text not null default '-',
  score text not null default '',
  status text not null default 'In Progress',
  semester text not null default '',
  academic_year text not null default '',
  gp_points numeric(6,2) not null default 0 check (gp_points >= 0),
  ca_score numeric(6,2),
  exam_score numeric(6,2),
  is_missing_code boolean not null default false,
  is_missing_title boolean not null default false,
  is_missing_units boolean not null default false,
  is_missing_score boolean not null default false,
  is_missing_grade boolean not null default false,
  is_manually_added boolean not null default false,
  primary key (result_id, course_position)
);

create index if not exists student_result_courses_code_idx
  on public.student_result_courses (code) where code <> '';

alter table public.student_result_courses enable row level security;
drop policy if exists "course rows follow result access" on public.student_result_courses;
create policy "course rows follow result access" on public.student_result_courses
  for select to authenticated
  using (exists (
    select 1 from public.student_results result
    where result.id = student_result_courses.result_id
      and (result.user_id = (select auth.uid()) or public.can_access_student(result.user_id))
  ));
revoke all on public.student_result_courses from anon, authenticated;
grant select on public.student_result_courses to authenticated;

create or replace function public.sync_student_result_courses()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.student_result_courses where result_id = new.id;
  insert into public.student_result_courses (
    result_id, course_position, code, title, units, grade, score, status,
    semester, academic_year, gp_points, ca_score, exam_score,
    is_missing_code, is_missing_title, is_missing_units, is_missing_score,
    is_missing_grade, is_manually_added
  )
  select
    new.id,
    (item.ordinality - 1)::integer,
    coalesce(item.course->>'code', ''),
    coalesce(item.course->>'title', ''),
    coalesce(nullif(item.course->>'units', '')::numeric, 0),
    coalesce(item.course->>'grade', '-'),
    coalesce(item.course->>'score', ''),
    coalesce(item.course->>'status', 'In Progress'),
    coalesce(item.course->>'semester', ''),
    coalesce(item.course->>'academicYear', ''),
    coalesce(nullif(item.course->>'gpPoints', '')::numeric, 0),
    nullif(item.course->>'caScore', '')::numeric,
    nullif(item.course->>'examScore', '')::numeric,
    coalesce((item.course->>'isMissingCode')::boolean, false),
    coalesce((item.course->>'isMissingTitle')::boolean, false),
    coalesce((item.course->>'isMissingUnits')::boolean, false),
    coalesce((item.course->>'isMissingScore')::boolean, false),
    coalesce((item.course->>'isMissingGrade')::boolean, false),
    coalesce((item.course->>'isManuallyAdded')::boolean, false)
  from jsonb_array_elements(coalesce(new.courses, '[]'::jsonb)) with ordinality as item(course, ordinality);
  return new;
end;
$$;
revoke all on function public.sync_student_result_courses() from public, anon, authenticated;
drop trigger if exists sync_student_result_courses_trigger on public.student_results;
create trigger sync_student_result_courses_trigger
  after insert or update on public.student_results
  for each row execute function public.sync_student_result_courses();

insert into public.student_result_courses (
  result_id, course_position, code, title, units, grade, score, status,
  semester, academic_year, gp_points, ca_score, exam_score,
  is_missing_code, is_missing_title, is_missing_units, is_missing_score,
  is_missing_grade, is_manually_added
)
select
  result.id,
  (item.ordinality - 1)::integer,
  coalesce(item.course->>'code', ''),
  coalesce(item.course->>'title', ''),
  coalesce(nullif(item.course->>'units', '')::numeric, 0),
  coalesce(item.course->>'grade', '-'),
  coalesce(item.course->>'score', ''),
  coalesce(item.course->>'status', 'In Progress'),
  coalesce(item.course->>'semester', ''),
  coalesce(item.course->>'academicYear', ''),
  coalesce(nullif(item.course->>'gpPoints', '')::numeric, 0),
  nullif(item.course->>'caScore', '')::numeric,
  nullif(item.course->>'examScore', '')::numeric,
  coalesce((item.course->>'isMissingCode')::boolean, false),
  coalesce((item.course->>'isMissingTitle')::boolean, false),
  coalesce((item.course->>'isMissingUnits')::boolean, false),
  coalesce((item.course->>'isMissingScore')::boolean, false),
  coalesce((item.course->>'isMissingGrade')::boolean, false),
  coalesce((item.course->>'isManuallyAdded')::boolean, false)
from public.student_results result
cross join lateral jsonb_array_elements(coalesce(result.courses, '[]'::jsonb)) with ordinality as item(course, ordinality)
on conflict (result_id, course_position) do update set
  code = excluded.code, title = excluded.title, units = excluded.units,
  grade = excluded.grade, score = excluded.score, status = excluded.status,
  semester = excluded.semester, academic_year = excluded.academic_year,
  gp_points = excluded.gp_points, ca_score = excluded.ca_score, exam_score = excluded.exam_score,
  is_missing_code = excluded.is_missing_code, is_missing_title = excluded.is_missing_title,
  is_missing_units = excluded.is_missing_units, is_missing_score = excluded.is_missing_score,
  is_missing_grade = excluded.is_missing_grade, is_manually_added = excluded.is_manually_added;

-- Foreign-key lookup indexes used by assignment joins and delete/update checks.
create index if not exists adviser_assignments_adviser_id_idx on public.adviser_assignments(adviser_id);
create index if not exists department_hod_assignments_assigned_by_idx on public.department_hod_assignments(assigned_by) where assigned_by is not null;

-- Consolidate permissive policies so overlapping rules remain auditable.
drop policy if exists "adviser assignments visible to their adviser" on public.adviser_assignments;
drop policy if exists "students read assigned adviser" on public.adviser_assignments;
create policy "adviser assignments scoped read" on public.adviser_assignments for select to authenticated
using (
  adviser_id = (select auth.uid())
  or (public.current_profile_role() = 'student'
    and department = public.current_profile_department()
    and admission_session = public.current_profile_session()
    and nullif(substring(level from '^[0-9]+'), '')::integer <=
      nullif(substring(public.current_profile_level() from '^[0-9]+'), '')::integer)
);

drop policy if exists "hod manages own department assignments" on public.adviser_assignments;
drop policy if exists "hods and deans manage adviser assignments" on public.adviser_assignments;
create policy "academic administrators manage scoped assignments" on public.adviser_assignments for all to authenticated
using (
  (public.current_profile_role() = 'hod'
    and department = public.current_profile_department())
  or (public.current_profile_role() = 'dean'
    and exists (select 1 from public.profiles adviser
      where adviser.user_id = adviser_assignments.adviser_id
        and adviser.role = 'lecturer' and adviser.faculty = public.current_profile_faculty()))
)
with check (
  is_department_lecturer(adviser_id, department)
  and ((public.current_profile_role() = 'hod'
    and department = public.current_profile_department())
  or (public.current_profile_role() = 'dean'
    and exists (select 1 from public.profiles adviser
      where adviser.user_id = adviser_assignments.adviser_id
        and adviser.role = 'lecturer' and adviser.faculty = public.current_profile_faculty())))
);

drop policy if exists "academic administrators read staff profiles" on public.profiles;
drop policy if exists "profile self and authorized staff read" on public.profiles;
drop policy if exists "student reads current and past assigned adviser profiles" on public.profiles;
drop policy if exists "system administrators read staff profiles" on public.profiles;
create policy "profiles scoped read" on public.profiles for select to authenticated
using (
  user_id = (select auth.uid())
  or (role = 'student' and public.can_access_student(user_id))
  or (role = 'lecturer' and public.current_profile_role() = 'hod' and department = public.current_profile_department())
  or (role = 'lecturer' and public.current_profile_role() = 'student' and exists (
    select 1 from public.adviser_assignments assignment
    where assignment.adviser_id = profiles.user_id
      and assignment.department = public.current_profile_department()
      and assignment.admission_session = public.current_profile_session()
      and assignment.level = public.current_profile_level()))
  or (public.current_profile_role() = 'lecturer' and role in ('lecturer', 'hod') and department = public.current_profile_department())
  or (role = 'dean' and public.current_profile_role() = 'hod' and faculty = public.current_profile_faculty())
  or (role = 'hod' and public.current_profile_role() = 'dean' and faculty = public.current_profile_faculty())
  or (public.current_profile_role() = 'hod' and department = public.current_profile_department())
  or (public.current_profile_role() = 'dean' and faculty = public.current_profile_faculty())
  or public.current_profile_role() = 'admin'
);

drop policy if exists "academic administrators update staff profiles" on public.profiles;
drop policy if exists "profile self update" on public.profiles;
drop policy if exists "system administrators update staff profiles" on public.profiles;
create policy "profiles scoped update" on public.profiles for update to authenticated
using (
  user_id = (select auth.uid())
  or (public.current_profile_role() = 'hod' and department = public.current_profile_department() and role = 'lecturer')
  or (public.current_profile_role() = 'dean' and faculty = public.current_profile_faculty() and role in ('lecturer', 'hod'))
  or (public.current_profile_role() = 'admin' and role in ('lecturer', 'hod', 'dean', 'admin'))
)
with check (
  user_id = (select auth.uid())
  or (public.current_profile_role() = 'hod' and department = public.current_profile_department() and role = 'lecturer')
  or (public.current_profile_role() = 'dean' and faculty = public.current_profile_faculty() and role in ('lecturer', 'hod'))
  or (public.current_profile_role() = 'admin' and role in ('lecturer', 'hod', 'dean', 'admin'))
);

-- Course analytics now reads the normalized child rows.
create or replace function public.get_academic_analytics()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare viewer_role text := public.current_profile_role(); result jsonb;
begin
  if viewer_role not in ('lecturer', 'hod', 'dean') then raise exception 'Academic analytics are restricted to authorized academic staff'; end if;
  with scoped_students as (
    select student.user_id from public.profiles student join public.students details on details.user_id = student.user_id
    where student.role = 'student' and (
      (viewer_role = 'hod' and student.department = public.current_profile_department())
      or (viewer_role = 'dean' and student.faculty = public.current_profile_faculty())
      or (viewer_role = 'lecturer' and exists (
        select 1 from public.adviser_assignments assignment where assignment.adviser_id = auth.uid()
          and assignment.department = student.department and assignment.admission_session = details.admission_session and assignment.level = details.level
      ))
    )
  ), latest_results as (
    select distinct on (record.user_id) record.id, record.user_id, record.cgpa
    from public.student_results record join scoped_students scoped on scoped.user_id = record.user_id
    order by record.user_id, record.created_at desc
  ), course_aggregates as (
    select course.code, max(course.title) as title, count(*)::integer as attempts,
      round(100.0 * count(*) filter (where course.status = 'Passed') / nullif(count(*),0))::integer as pass_rate
    from latest_results result_row
    join public.student_result_courses course on course.result_id = result_row.id
    where nullif(course.code, '') is not null
    group by course.code
  )
  select jsonb_build_object(
    'studentCount', (select count(*)::integer from scoped_students),
    'studentsWithResults', (select count(*)::integer from latest_results),
    'meanCgpa', (select round(avg(cgpa),2) from latest_results),
    'classifications', jsonb_build_array(
      jsonb_build_object('name','First Class','count',(select count(*)::integer from latest_results where cgpa >= 4.5)),
      jsonb_build_object('name','Second Class Upper','count',(select count(*)::integer from latest_results where cgpa >= 3.5 and cgpa < 4.5)),
      jsonb_build_object('name','Second Class Lower','count',(select count(*)::integer from latest_results where cgpa >= 2.4 and cgpa < 3.5)),
      jsonb_build_object('name','Third Class','count',(select count(*)::integer from latest_results where cgpa >= 1.5 and cgpa < 2.4)),
      jsonb_build_object('name','Pass','count',(select count(*)::integer from latest_results where cgpa < 1.5))
    ),
    'courses', coalesce((select jsonb_agg(jsonb_build_object('code',code,'title',title,'attempts',attempts,'passRate',pass_rate) order by code) from course_aggregates),'[]'::jsonb)
  ) into result;
  return result;
end;
$$;
revoke all on function public.get_academic_analytics() from public, anon;
grant execute on function public.get_academic_analytics() to authenticated;
