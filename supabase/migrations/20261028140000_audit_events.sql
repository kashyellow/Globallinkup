-- ============================================================================
-- Audit trail (ADR 0003)
--
-- Append-only, ids and actions only. No emails, names, contact channels,
-- birthdays, captions, comment bodies, image paths, IPs or user agents: the
-- point is to know what an admin did, not to keep a second copy of the data.
--
-- Reads are gated by `audit.read`. Writes go through `record_audit()`, which
-- stamps the actor and their role slug; clients hold no insert/update/delete
-- grant, so rows cannot be forged, edited or removed from the app.
-- ============================================================================

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  occurred_at timestamptz not null default now(),
  actor_id uuid references public.profiles (id) on delete set null,
  actor_role text,
  action text not null,
  target_type text,
  target_id uuid,
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  constraint audit_events_action_format
    check (action ~ '^[a-z]+\.[a-z_]+$' and char_length(action) <= 60),
  constraint audit_events_reason_length
    check (reason is null or char_length(reason) <= 500)
);

create index audit_events_occurred_idx on public.audit_events (occurred_at desc);
create index audit_events_actor_idx on public.audit_events (actor_id, occurred_at desc);

alter table public.audit_events enable row level security;

create policy "audit_events_select_reader"
  on public.audit_events for select
  to authenticated
  using (public.has_capability('audit.read'));

revoke insert, update, delete on public.audit_events from anon, authenticated;

create or replace function public.record_audit(
  p_action text,
  p_target_type text default null,
  p_target_id uuid default null,
  p_reason text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_role text;
  v_id uuid;
begin
  if v_actor is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  if not (
    public.has_capability('posts.moderate')
    or public.has_capability('members.review')
    or public.has_capability('interests.review')
    or public.has_capability('marketplace.manage')
    or public.has_capability('reports.manage')
    or public.has_capability('settings.manage')
    or public.has_capability('admins.manage')
  ) then
    raise exception 'not an admin' using errcode = '42501';
  end if;

  select r.slug into v_role
  from public.profiles p
  join public.admin_roles r on r.id = p.admin_role_id
  where p.id = v_actor;

  insert into public.audit_events (actor_id, actor_role, action, target_type, target_id, reason, metadata)
  values (v_actor, v_role, p_action, p_target_type, p_target_id, p_reason, coalesce(p_metadata, '{}'::jsonb))
  returning id into v_id;

  return v_id;
end;
$$;

comment on function public.record_audit(text, text, uuid, text, jsonb) is
  'Append one audit row for the calling admin. Metadata is ids and state only, never content.';

revoke all on function public.record_audit(text, text, uuid, text, jsonb) from public, anon;
grant execute on function public.record_audit(text, text, uuid, text, jsonb) to authenticated, service_role;

-- Retention: 12 months, called by the same daily job as the content purge.
create or replace function public.purge_audit_events()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_rows integer;
begin
  delete from public.audit_events
  where occurred_at < pg_catalog.now() - interval '12 months';
  get diagnostics v_rows = row_count;
  return v_rows;
end;
$$;

revoke all on function public.purge_audit_events() from public, anon, authenticated;
grant execute on function public.purge_audit_events() to service_role;
