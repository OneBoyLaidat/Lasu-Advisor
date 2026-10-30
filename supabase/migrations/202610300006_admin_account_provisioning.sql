-- Administrator Auth accounts are provisioned only by a trusted server
-- function using the Supabase service-role key.
drop policy if exists "system administrators insert staff profiles" on public.profiles;
create policy "system administrators insert staff profiles"
  on public.profiles for insert to authenticated
  with check (
    public.current_profile_role() = 'admin'
    and role in ('lecturer', 'hod', 'dean')
  );

drop policy if exists "system administrators update staff profiles" on public.profiles;
create policy "system administrators update staff profiles"
  on public.profiles for update to authenticated
  using (public.current_profile_role() = 'admin' and role in ('lecturer', 'hod', 'dean', 'admin'))
  with check (public.current_profile_role() = 'admin' and role in ('lecturer', 'hod', 'dean', 'admin'));

create or replace function public.protect_system_admin_role()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if new.role = 'admin' and auth.uid() is not null and coalesce(auth.role(), '') <> 'service_role' then
    if tg_op = 'INSERT' then
      raise exception 'Administrator accounts can only be created by the trusted service-role provisioning function';
    elsif old.role is distinct from 'admin' then
      raise exception 'Administrator accounts can only be created by the trusted service-role provisioning function';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_system_admin_role_trigger on public.profiles;
create trigger protect_system_admin_role_trigger
  before insert or update of role on public.profiles
  for each row execute function public.protect_system_admin_role();
