-- LASU Advisor uses a Matriculation/Registration Number as the sole
-- user-facing credential. `profiles.email` remains an internal Supabase Auth
-- implementation field and is never collected from or sent to users.

alter table public.student_results
  add column if not exists document_identifier text;

-- Prevent any result record from claiming an identifier other than the
-- authenticated student's canonical registration number.
create or replace function public.verify_result_document_identifier()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  account_identifier text;
begin
  select upper(regexp_replace(btrim(matric_no), '[[:space:]]+', '', 'g'))
    into account_identifier
  from public.students
  where user_id = new.user_id;

  if account_identifier is null or account_identifier = '' then
    raise exception 'The authenticated student does not have a matriculation or registration number';
  end if;

  new.document_identifier := upper(regexp_replace(btrim(coalesce(new.document_identifier, '')), '[[:space:]]+', '', 'g'));
  if new.document_identifier = '' then
    raise exception 'A verified document matriculation or registration number is required';
  end if;
  if new.document_identifier <> account_identifier then
    raise exception 'The document identifier does not match the authenticated student account';
  end if;
  return new;
end;
$$;

drop trigger if exists verify_result_document_identifier_trigger on public.student_results;
create trigger verify_result_document_identifier_trigger
before insert or update of user_id, document_identifier on public.student_results
for each row execute function public.verify_result_document_identifier();

revoke all on function public.verify_result_document_identifier() from public, anon, authenticated;

-- Existing historical uploads predate identifier capture. Keep them readable,
-- but require an identifier for every new upload.
comment on column public.student_results.document_identifier is
  'Matriculation or registration number extracted from the uploaded PDF and verified against public.students.';
