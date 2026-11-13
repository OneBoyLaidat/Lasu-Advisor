-- student_results is the source of truth for whether a transcript exists and
-- which file was uploaded. These two student columns duplicated that state
-- and could drift when a result row was removed or corrected.
drop trigger if exists mark_profile_transcript_uploaded_trigger on public.student_results;

drop function if exists public.mark_profile_transcript_uploaded();

alter table public.students
  drop column if exists has_uploaded_transcript,
  drop column if exists transcript_file_name;

create or replace function public.protect_role_specific_profile_data()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.role() = 'authenticated' and public.current_profile_role() <> 'admin' and pg_trigger_depth() = 1 then
    if tg_table_name = 'students' then
      if new.matric_no is distinct from old.matric_no
        or new.level is distinct from old.level
        or new.admission_session is distinct from old.admission_session then
        raise exception 'Only authorized management can change student identity and cohort fields';
      end if;
    elsif tg_table_name = 'staff_profiles' then
      if new.staff_id is distinct from old.staff_id
        or new.level is distinct from old.level
        or new.admission_session is distinct from old.admission_session
        or new.must_change_password is distinct from old.must_change_password then
        raise exception 'Only authorized management can change staff identity, cohort, and password enrollment fields';
      end if;
    end if;
  end if;
  return new;
end;
$$;
