-- ============================================================================
-- Admin invitations (ADR 0002)
--
-- The owner creates an account by generating a one-time Supabase invite link
-- (`auth.admin.generateLink`) and sharing it out of band: no SMTP, and the admin
-- never learns the password. The role and email are staged here first, because
-- the invite is accepted before the person exists in `auth.users`.
-- ============================================================================

create table public.admin_invites (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  admin_role_id uuid not null references public.admin_roles (id) on delete cascade,
  invited_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  constraint admin_invites_email_format check (email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$')
);

alter table public.admin_invites enable row level security;

create policy "admin_invites_manage"
  on public.admin_invites for all
  to authenticated
  using (public.has_capability('admins.manage'))
  with check (public.has_capability('admins.manage'));

revoke all on public.admin_invites from anon;
grant select, insert, update, delete on public.admin_invites to authenticated;
grant all privileges on public.admin_invites to service_role;
