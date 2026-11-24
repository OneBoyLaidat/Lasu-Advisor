-- Index the settings foreign key so deletes/updates of referenced profiles stay efficient.
create index if not exists academic_settings_updated_by_idx
  on public.academic_settings(updated_by) where updated_by is not null;

-- Keep helper RPCs unavailable to anonymous callers. Trigger/event-trigger functions
-- remain invocable by their owning trigger, while application authorization helpers
-- are granted only to signed-in users.
revoke all on function public.can_provision_staff(text, text, text) from public, anon;
grant execute on function public.can_provision_staff(text, text, text) to authenticated;
revoke all on function public.is_academic_admin() from public, anon;
grant execute on function public.is_academic_admin() to authenticated;
revoke all on function public.clear_stale_department_hod_assignment() from public, anon, authenticated;
revoke all on function public.protect_system_admin_role() from public, anon, authenticated;
revoke all on function public.rls_auto_enable() from public, anon, authenticated;
