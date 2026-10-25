-- ============================================================================
-- Profile moderation audit
--
-- Reject and suspend decisions must carry a reason. Keep a history instead of
-- overwriting a single column so an admin can see why an account was actioned
-- and the member can be shown the latest explanation.
-- ============================================================================

create table public.profile_moderation_events (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  admin_id uuid references public.profiles (id) on delete set null,
  decision public.approval_status not null,
  reason text,
  created_at timestamptz not null default now(),
  constraint profile_moderation_events_decision
    check (decision in ('approved', 'rejected', 'suspended')),
  constraint profile_moderation_events_reason_length
    check (reason is null or char_length(reason) <= 500),
  constraint profile_moderation_events_reason_required
    check (
      decision = 'approved'
      or (reason is not null and char_length(pg_catalog.btrim(reason)) >= 10)
    )
);

create index profile_moderation_events_profile_created_idx
  on public.profile_moderation_events (profile_id, created_at desc);

alter table public.profile_moderation_events enable row level security;

create policy "profile_moderation_events_select_own"
  on public.profile_moderation_events for select
  to authenticated
  using (profile_id = (select auth.uid()));

create policy "profile_moderation_events_select_admin"
  on public.profile_moderation_events for select
  to authenticated
  using (public.is_admin());

create policy "profile_moderation_events_insert_admin"
  on public.profile_moderation_events for insert
  to authenticated
  with check (public.is_admin());

grant select, insert on public.profile_moderation_events to authenticated;
grant all privileges on public.profile_moderation_events to service_role;
