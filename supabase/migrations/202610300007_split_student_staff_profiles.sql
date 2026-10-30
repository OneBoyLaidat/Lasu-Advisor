-- Keep shared identity and authorization in profiles. Store student and staff
-- attributes in separate tables so role-specific data cannot bleed across.
create table if not exists public.students (
  user_id uuid primary key references public.profiles(user_id) on delete cascade,
  matric_no text unique,
  level text,
  admission_session text,
  avatar_url text,
  phone text,
  has_uploaded_transcript boolean not null default false,
  transcript_file_name text,
  result_prompt_dismissed_semester text,
  created_at timestamptz not null default now()
);

create table if not exists public.staff_profiles (
  user_id uuid primary key references public.profiles(user_id) on delete cascade,
  staff_id text unique,
  level text,
  admission_session text,
  avatar_url text,
  phone text,
  must_change_password boolean not null default false,
  created_at timestamptz not null default now()
);

insert into public.students(user_id, matric_no, level, admission_session, avatar_url, phone, has_uploaded_transcript, transcript_file_name, result_prompt_dismissed_semester)
select user_id, matric_no, level, admission_session, avatar_url, phone, coalesce(has_uploaded_transcript,false), transcript_file_name, result_prompt_dismissed_semester
from public.profiles where role = 'student' on conflict (user_id) do nothing;

insert into public.staff_profiles(user_id, staff_id, level, admission_session, avatar_url, phone, must_change_password)
select user_id, staff_id, level, admission_session, avatar_url, phone, coalesce(must_change_password,false)
from public.profiles where role <> 'student' on conflict (user_id) do nothing;

alter table public.students enable row level security;
alter table public.staff_profiles enable row level security;
create policy students_read_self_or_scoped_staff on public.students for select to authenticated
using (user_id = auth.uid() or exists (
  select 1 from public.profiles viewer join public.profiles owner on owner.user_id = students.user_id
  where viewer.user_id = auth.uid() and (
    viewer.role = 'admin' or
    (viewer.role = 'hod' and viewer.department = owner.department) or
    (viewer.role = 'lecturer' and exists (
      select 1 from public.adviser_assignments assignment where assignment.adviser_id = viewer.user_id
        and assignment.department = owner.department and assignment.admission_session = students.admission_session and assignment.level = students.level
    ))
  )
));
create policy students_insert_self on public.students for insert to authenticated
with check (user_id = auth.uid() and exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.role = 'student'));
create policy students_update_self_or_admin on public.students for update to authenticated
using (user_id = auth.uid() or public.current_profile_role() = 'admin')
with check (user_id = auth.uid() or public.current_profile_role() = 'admin');

create policy staff_profiles_read_scoped on public.staff_profiles for select to authenticated
using (user_id = auth.uid() or exists (
  select 1 from public.profiles viewer join public.profiles owner on owner.user_id = staff_profiles.user_id
  where viewer.user_id = auth.uid() and (
    viewer.role = 'admin' or
    (viewer.role = 'dean' and viewer.faculty = owner.faculty) or
    (viewer.role = 'hod' and viewer.department = owner.department)
  )
));
create policy staff_profiles_manage_admin on public.staff_profiles for all to authenticated
using (public.current_profile_role() = 'admin') with check (public.current_profile_role() = 'admin');

drop policy if exists students_insert_self on public.students;
grant select, update on public.students to authenticated;
grant select, update on public.staff_profiles to authenticated;
grant all on public.students, public.staff_profiles to service_role;

create or replace function public.current_profile_session() returns text
language sql stable security definer set search_path = public as $$
  select coalesce((select admission_session from public.students where user_id = auth.uid()),
    (select admission_session from public.staff_profiles where user_id = auth.uid()))
$$;
create or replace function public.current_profile_level() returns text
language sql stable security definer set search_path = public as $$
  select coalesce((select level from public.students where user_id = auth.uid()),
    (select level from public.staff_profiles where user_id = auth.uid()))
$$;

create or replace function public.can_access_student(target_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles student join public.students details on details.user_id = student.user_id
    where student.user_id = target_user_id and student.role = 'student' and (
      (public.current_profile_role() = 'hod' and student.department = public.current_profile_department())
      or exists (
        select 1 from public.adviser_assignments assignment
        where assignment.adviser_id = auth.uid() and assignment.department = student.department
          and assignment.admission_session = details.admission_session and assignment.level = details.level
      )
    )
  )
$$;

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
    select distinct on (record.user_id) record.user_id, record.cgpa, record.courses
    from public.student_results record join scoped_students scoped on scoped.user_id = record.user_id
    order by record.user_id, record.created_at desc
  ), course_rows as (
    select course_data.course->>'code' as code, coalesce(course_data.course->>'title','') as title,
      coalesce(course_data.course->>'status','') = 'Passed' as passed
    from latest_results result_row cross join lateral jsonb_array_elements(result_row.courses) as course_data(course)
    where nullif(course_data.course->>'code','') is not null
  ), course_aggregates as (
    select code, max(title) as title, count(*)::integer as attempts,
      round(100.0 * count(*) filter (where passed) / nullif(count(*),0))::integer as pass_rate
    from course_rows group by code
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

create policy staff_profiles_self_update on public.staff_profiles for update to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());

create or replace function public.protect_role_specific_profile_data()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.role() = 'authenticated' and public.current_profile_role() <> 'admin' and pg_trigger_depth() = 1 then
    if tg_table_name = 'students' and (
      new.matric_no is distinct from old.matric_no or new.level is distinct from old.level
      or new.admission_session is distinct from old.admission_session
      or new.has_uploaded_transcript is distinct from old.has_uploaded_transcript
      or new.transcript_file_name is distinct from old.transcript_file_name
    ) then raise exception 'Only trusted result processing can change student identity, cohort, and transcript fields'; end if;
    if tg_table_name = 'staff_profiles' and (
      new.staff_id is distinct from old.staff_id or new.level is distinct from old.level
      or new.admission_session is distinct from old.admission_session
      or new.must_change_password is distinct from old.must_change_password
    ) then raise exception 'Only authorized management can change staff identity, cohort, and password enrollment fields'; end if;
  end if;
  return new;
end;
$$;
create trigger protect_student_details before update on public.students for each row execute function public.protect_role_specific_profile_data();
create trigger protect_staff_details before update on public.staff_profiles for each row execute function public.protect_role_specific_profile_data();
revoke all on function public.protect_role_specific_profile_data() from public, anon, authenticated;

-- The signup trigger now writes a shared identity row and a student-only row.
create or replace function public.create_student_profile()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- Auth metadata is user supplied during signup, so never trust a requested role.
  -- Trusted server provisioning converts this initial student row after createUser.
  if new.raw_user_meta_data->>'account_type' is distinct from 'student' then return new; end if;
  insert into public.profiles(user_id, full_name, email, role, department, faculty)
  values(new.id, coalesce(new.raw_user_meta_data->>'full_name',''), new.email, 'student',
    coalesce(new.raw_user_meta_data->>'department',''), coalesce(new.raw_user_meta_data->>'faculty',''))
  on conflict (user_id) do nothing;
  insert into public.students(user_id, matric_no, level, admission_session, avatar_url, phone)
  values(new.id, nullif(new.raw_user_meta_data->>'matric_no',''), nullif(new.raw_user_meta_data->>'level',''),
    nullif(new.raw_user_meta_data->>'admission_session',''), nullif(new.raw_user_meta_data->>'avatar_url',''), nullif(new.raw_user_meta_data->>'phone',''))
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create or replace function public.protect_profile_role_and_cohort()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.role() = 'authenticated' and public.current_profile_role() <> 'admin' and (
    new.role is distinct from old.role or new.department is distinct from old.department
    or new.faculty is distinct from old.faculty or new.user_id is distinct from old.user_id
  ) then raise exception 'Only authorized management can change role or organizational assignments'; end if;
  return new;
end;
$$;

drop policy if exists "system administrators read department HOD assignments" on public.department_hod_assignments;
create policy "management reads scoped department HOD assignments" on public.department_hod_assignments
for select to authenticated using (
  public.current_profile_role() = 'admin' or exists (
    select 1 from public.profiles viewer
    where viewer.user_id = auth.uid() and (
      (viewer.role = 'hod' and viewer.department = department_hod_assignments.department) or
      (viewer.role = 'dean' and viewer.faculty = (select owner.faculty from public.profiles owner where owner.department = department_hod_assignments.department limit 1))
    )
  )
);

create or replace function public.mark_profile_transcript_uploaded()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.students set has_uploaded_transcript = true, transcript_file_name = new.file_name
  where user_id = new.user_id;
  return new;
end;
$$;

update public.students s set has_uploaded_transcript = true, transcript_file_name = (
  select r.file_name from public.student_results r where r.user_id = s.user_id order by r.created_at desc limit 1
) where exists (select 1 from public.student_results r where r.user_id = s.user_id);

drop index if exists public.profiles_department_cohort_idx;
create index if not exists profiles_department_user_idx on public.profiles(department, user_id);
create index if not exists students_session_level_idx on public.students(admission_session, level);

-- All application code and dependent database functions have moved role-specific fields.
alter table public.profiles drop column if exists matric_no;
alter table public.profiles drop column if exists staff_id;
alter table public.profiles drop column if exists level;
alter table public.profiles drop column if exists admission_session;
alter table public.profiles drop column if exists avatar_url;
alter table public.profiles drop column if exists phone;
alter table public.profiles drop column if exists has_uploaded_transcript;
alter table public.profiles drop column if exists transcript_file_name;
alter table public.profiles drop column if exists result_prompt_dismissed_semester;
alter table public.profiles drop column if exists must_change_password;
