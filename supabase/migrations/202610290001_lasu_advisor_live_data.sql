create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  role text not null default 'student' check (role in ('student', 'lecturer', 'hod', 'dean')),
  department text not null default '',
  faculty text not null default '',
  matric_no text unique,
  staff_id text unique,
  level text,
  admission_session text,
  avatar_url text,
  phone text,
  has_uploaded_transcript boolean not null default false,
  transcript_file_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.adviser_assignments (
  adviser_id uuid not null references public.profiles(user_id) on delete cascade,
  department text not null,
  admission_session text not null,
  level text not null,
  primary key (department, admission_session, level)
);

create table if not exists public.student_results (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  file_name text not null,
  file_path text,
  document_student_name text not null,
  courses jsonb not null default '[]'::jsonb,
  cgpa numeric(4,2) not null,
  created_at timestamptz not null default now()
);

create table if not exists public.messages (
  id bigint generated always as identity primary key,
  sender_id uuid not null references public.profiles(user_id) on delete cascade,
  recipient_id uuid not null references public.profiles(user_id) on delete cascade,
  body text not null check (length(body) between 1 and 10000),
  thread_key text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  check (sender_id <> recipient_id)
);

create or replace function public.current_profile_role()
returns text language sql stable security definer set search_path = public
as $$ select role from public.profiles where user_id = auth.uid() $$;

create or replace function public.current_profile_department()
returns text language sql stable security definer set search_path = public
as $$ select department from public.profiles where user_id = auth.uid() $$;

create or replace function public.current_profile_faculty()
returns text language sql stable security definer set search_path = public
as $$ select faculty from public.profiles where user_id = auth.uid() $$;

create or replace function public.current_profile_session()
returns text language sql stable security definer set search_path = public
as $$ select admission_session from public.profiles where user_id = auth.uid() $$;

create or replace function public.current_profile_level()
returns text language sql stable security definer set search_path = public
as $$ select level from public.profiles where user_id = auth.uid() $$;

create or replace function public.current_profile_name()
returns text language sql stable security definer set search_path = public
as $$ select full_name from public.profiles where user_id = auth.uid() $$;

create or replace function public.has_own_result_document(target_path text)
returns boolean language sql stable security definer set search_path = public, storage
as $$
  select target_path is not null and exists (
    select 1 from storage.objects object
    where object.bucket_id = 'result-documents'
      and object.name = target_path
      and (storage.foldername(object.name))[1] = auth.uid()::text
  )
$$;

create or replace function public.is_department_lecturer(target_user_id uuid, target_department text)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles lecturer
    where lecturer.user_id = target_user_id
      and lecturer.role = 'lecturer'
      and lecturer.department = target_department
  )
$$;

create or replace function public.can_access_student(target_user_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles student
    where student.user_id = target_user_id and student.role = 'student'
    and (
      (public.current_profile_role() = 'hod' and student.department = public.current_profile_department())
      or exists (
        select 1 from public.adviser_assignments assignment
        where assignment.adviser_id = auth.uid()
          and assignment.department = student.department
          and assignment.admission_session = student.admission_session
          and assignment.level = student.level
      )
    )
  )
$$;

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
          and assignment.level = public.current_profile_level()
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

create or replace function public.create_student_profile()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if new.raw_user_meta_data->>'account_type' is distinct from 'student' then
    return new;
  end if;
  insert into public.profiles(user_id, full_name, email, role, department, faculty, matric_no, level, admission_session)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    'student',
    coalesce(new.raw_user_meta_data->>'department', ''),
    coalesce(new.raw_user_meta_data->>'faculty', ''),
    nullif(new.raw_user_meta_data->>'matric_no', ''),
    nullif(new.raw_user_meta_data->>'level', ''),
    nullif(new.raw_user_meta_data->>'admission_session', '')
  ) on conflict (user_id) do nothing;
  return new;
end
$$;

drop trigger if exists on_auth_user_created_lasu_profile on auth.users;
create trigger on_auth_user_created_lasu_profile after insert on auth.users
for each row execute procedure public.create_student_profile();

create or replace function public.protect_profile_role_and_cohort()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is not null and auth.uid() = old.user_id and pg_trigger_depth() = 1 and (
    new.role is distinct from old.role or new.department is distinct from old.department
    or new.faculty is distinct from old.faculty or new.matric_no is distinct from old.matric_no
    or new.staff_id is distinct from old.staff_id or new.level is distinct from old.level
    or new.email is distinct from old.email
    or new.admission_session is distinct from old.admission_session
    or new.has_uploaded_transcript is distinct from old.has_uploaded_transcript
    or new.transcript_file_name is distinct from old.transcript_file_name
  ) then
    raise exception 'Identity, role, cohort, and transcript verification fields can only be changed by an administrator or trusted database trigger';
  end if;
  return new;
end
$$;
drop trigger if exists protect_profile_role_and_cohort_trigger on public.profiles;
create trigger protect_profile_role_and_cohort_trigger before update on public.profiles
for each row execute procedure public.protect_profile_role_and_cohort();

create or replace function public.protect_message_read_receipt()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if new.id is distinct from old.id
    or new.sender_id is distinct from old.sender_id
    or new.recipient_id is distinct from old.recipient_id
    or new.body is distinct from old.body
    or new.thread_key is distinct from old.thread_key
    or new.created_at is distinct from old.created_at
    or (old.read_at is not null and new.read_at is distinct from old.read_at)
  then
    raise exception 'Messages are immutable; recipients may only mark unread messages as read';
  end if;
  return new;
end
$$;
drop trigger if exists protect_message_read_receipt_trigger on public.messages;
create trigger protect_message_read_receipt_trigger before update on public.messages
for each row execute procedure public.protect_message_read_receipt();

create or replace function public.mark_profile_transcript_uploaded()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  update public.profiles set has_uploaded_transcript = true, transcript_file_name = new.file_name
  where user_id = new.user_id;
  return new;
end
$$;
drop trigger if exists mark_profile_transcript_uploaded_trigger on public.student_results;
create trigger mark_profile_transcript_uploaded_trigger after insert on public.student_results
for each row execute procedure public.mark_profile_transcript_uploaded();

update public.profiles profile
set has_uploaded_transcript = true,
    transcript_file_name = (
      select result.file_name from public.student_results result
      where result.user_id = profile.user_id
      order by result.created_at desc limit 1
    )
where exists (select 1 from public.student_results result where result.user_id = profile.user_id);

revoke all on function public.current_profile_role() from public, anon;
revoke all on function public.current_profile_department() from public, anon;
revoke all on function public.current_profile_faculty() from public, anon;
revoke all on function public.current_profile_session() from public, anon;
revoke all on function public.current_profile_level() from public, anon;
revoke all on function public.current_profile_name() from public, anon;
revoke all on function public.has_own_result_document(text) from public, anon;
revoke all on function public.is_department_lecturer(uuid, text) from public, anon;
revoke all on function public.can_access_student(uuid) from public, anon;
revoke all on function public.can_message(uuid) from public, anon;
grant execute on function public.current_profile_role() to authenticated;
grant execute on function public.current_profile_department() to authenticated;
grant execute on function public.current_profile_faculty() to authenticated;
grant execute on function public.current_profile_session() to authenticated;
grant execute on function public.current_profile_level() to authenticated;
grant execute on function public.current_profile_name() to authenticated;
grant execute on function public.has_own_result_document(text) to authenticated;
grant execute on function public.is_department_lecturer(uuid, text) to authenticated;
grant execute on function public.can_access_student(uuid) to authenticated;
grant execute on function public.can_message(uuid) to authenticated;
revoke all on function public.create_student_profile() from public, anon, authenticated;
revoke all on function public.protect_profile_role_and_cohort() from public, anon, authenticated;
revoke all on function public.protect_message_read_receipt() from public, anon, authenticated;
revoke all on function public.mark_profile_transcript_uploaded() from public, anon, authenticated;

alter table public.profiles enable row level security;
alter table public.adviser_assignments enable row level security;
alter table public.student_results enable row level security;
alter table public.messages enable row level security;

insert into storage.buckets (id, name, public) values ('result-documents', 'result-documents', false) on conflict (id) do nothing;

drop policy if exists "profile self and authorized staff read" on public.profiles;
create policy "profile self and authorized staff read" on public.profiles for select to authenticated
using (
  user_id = auth.uid()
  or (role = 'student' and public.can_access_student(user_id))
  or (role = 'lecturer' and public.current_profile_role() = 'hod' and department = public.current_profile_department())
  or (role = 'lecturer' and public.current_profile_role() = 'student' and exists (
    select 1 from public.adviser_assignments assignment where assignment.adviser_id = user_id
      and assignment.department = public.current_profile_department()
      and assignment.admission_session = public.current_profile_session()
      and assignment.level = public.current_profile_level()
  ))
  or (role = 'dean' and public.current_profile_role() = 'hod' and faculty = public.current_profile_faculty())
  or (role = 'hod' and public.current_profile_role() = 'dean' and faculty = public.current_profile_faculty())
);
drop policy if exists "profile self update" on public.profiles;
create policy "profile self update" on public.profiles for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "adviser assignments visible to their adviser" on public.adviser_assignments;
create policy "adviser assignments visible to their adviser" on public.adviser_assignments for select to authenticated using (adviser_id = auth.uid());
drop policy if exists "students read assigned adviser" on public.adviser_assignments;
create policy "students read assigned adviser" on public.adviser_assignments for select to authenticated
using (public.current_profile_role() = 'student' and department = public.current_profile_department() and admission_session = public.current_profile_session() and level = public.current_profile_level());
drop policy if exists "hod manages own department assignments" on public.adviser_assignments;
create policy "hod manages own department assignments" on public.adviser_assignments for all to authenticated
using (public.current_profile_role() = 'hod' and department = public.current_profile_department())
with check (
  public.current_profile_role() = 'hod'
  and department = public.current_profile_department()
  and public.is_department_lecturer(adviser_id, department)
);

drop policy if exists "student results scoped read" on public.student_results;
create policy "student results scoped read" on public.student_results for select to authenticated
using (user_id = auth.uid() or public.can_access_student(user_id));
drop policy if exists "student results own insert" on public.student_results;
create policy "student results own insert" on public.student_results for insert to authenticated
with check (
  user_id = auth.uid()
  and document_student_name = public.current_profile_name()
  and public.has_own_result_document(file_path)
);
drop policy if exists "hod scoped result update" on public.student_results;
create policy "hod scoped result update" on public.student_results for update to authenticated
using (public.current_profile_role() = 'hod' and public.can_access_student(user_id))
with check (public.current_profile_role() = 'hod' and public.can_access_student(user_id));

drop policy if exists "participants read messages" on public.messages;
create policy "participants read messages" on public.messages for select to authenticated
using (sender_id = auth.uid() or recipient_id = auth.uid());
drop policy if exists "allowed direct message insert" on public.messages;
create policy "allowed direct message insert" on public.messages for insert to authenticated
with check (sender_id = auth.uid() and public.can_message(recipient_id));
drop policy if exists "recipient marks messages read" on public.messages;
create policy "recipient marks messages read" on public.messages for update to authenticated
using (recipient_id = auth.uid()) with check (recipient_id = auth.uid());

drop policy if exists "student owns result files" on storage.objects;
create policy "student owns result files" on storage.objects for all to authenticated
using (bucket_id = 'result-documents' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'result-documents' and (storage.foldername(name))[1] = auth.uid()::text);

create index if not exists profiles_department_cohort_idx on public.profiles(department, admission_session, level);
create index if not exists student_results_user_created_idx on public.student_results(user_id, created_at desc);
create index if not exists messages_thread_created_idx on public.messages(thread_key, created_at);
create index if not exists messages_sender_created_idx on public.messages(sender_id, created_at);
create index if not exists messages_recipient_created_idx on public.messages(recipient_id, created_at);
