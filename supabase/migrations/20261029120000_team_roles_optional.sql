-- ============================================================================
-- Team: roles are assigned by an admin, not by a trigger
--
-- An invited account starts with `role = 'admin'` and no `admin_role_id`, so it
-- appears in the team list as "—" and holds no capability until an admin picks a
-- role for it. The default-owner trigger made that impossible.
-- ============================================================================

alter table public.admin_invites
  alter column admin_role_id drop not null;

drop trigger if exists profiles_assign_admin_role on public.profiles;
drop function if exists public.assign_default_admin_role();
