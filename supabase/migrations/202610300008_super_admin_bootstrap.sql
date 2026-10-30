create table if not exists public.super_admin_bootstrap_claims (
  singleton boolean primary key default true check (singleton),
  claimed_at timestamptz not null default now(),
  auth_user_id uuid
);
alter table public.super_admin_bootstrap_claims enable row level security;
revoke all on public.super_admin_bootstrap_claims from public, anon, authenticated;
grant all on public.super_admin_bootstrap_claims to service_role;

create or replace function public.claim_super_admin_bootstrap()
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from public.profiles where role = 'admin') then return false; end if;
  insert into public.super_admin_bootstrap_claims(singleton) values (true)
  on conflict (singleton) do nothing;
  return found;
end;
$$;

create or replace function public.release_super_admin_bootstrap_claim()
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.profiles where role = 'admin') then
    delete from public.super_admin_bootstrap_claims where singleton = true;
  end if;
end;
$$;

revoke all on function public.claim_super_admin_bootstrap() from public, anon, authenticated;
revoke all on function public.release_super_admin_bootstrap_claim() from public, anon, authenticated;
grant execute on function public.claim_super_admin_bootstrap() to service_role;
grant execute on function public.release_super_admin_bootstrap_claim() to service_role;
