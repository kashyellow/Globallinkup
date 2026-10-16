-- ============================================================================
-- S1 fixes — audit follow-ups (docs/plan/api-layer/s1-audit-fixes.md)
--
--  F-1  connections: enforce the request/accept/decline state machine in RLS so
--       a requester cannot accept their own request (which leaked contact info).
--  F-2  are_connected(): stop it being a connection-existence oracle.
--  F-3  posts: a non-admin cannot revert an admin's moderation action.
--  CA-1 date_of_birth moves to a private table; age is exposed via profile_age().
--  CA-4 columns the UI renders that had no schema home.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- F-1 — connections state machine (the parties are immutable; only legal
-- transitions are allowed, and only by the correct side).
-- ----------------------------------------------------------------------------
create or replace function public.protect_connection_transitions()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- The two parties never change for the lifetime of the row.
  new.requester_id = old.requester_id;
  new.recipient_id = old.recipient_id;

  if new.status = old.status or public.is_admin() then
    return new;
  end if;

  -- The recipient answers an inbound request.
  if old.status = 'requested'
    and new.status in ('accepted', 'declined')
    and old.recipient_id = (select auth.uid()) then
    return new;
  end if;

  -- Either party may disconnect an accepted connection (OQ-3).
  if old.status = 'accepted'
    and new.status = 'declined'
    and (
      old.requester_id = (select auth.uid())
      or old.recipient_id = (select auth.uid())
    ) then
    return new;
  end if;

  -- Only the original requester may re-request after a decline (FR-5.6).
  if old.status = 'declined'
    and new.status = 'requested'
    and old.requester_id = (select auth.uid()) then
    return new;
  end if;

  raise exception 'illegal connection transition % -> %', old.status, new.status
    using errcode = '42501';
end;
$$;

create trigger connections_protect_transitions
  before update on public.connections
  for each row execute function public.protect_connection_transitions();

-- ----------------------------------------------------------------------------
-- F-2 — are_connected() may only be asked about the caller (or by an admin).
-- ----------------------------------------------------------------------------
create or replace function public.are_connected(a uuid, b uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select
    (select auth.uid()) is not null
    and (
      a = (select auth.uid())
      or b = (select auth.uid())
      or public.is_admin()
    )
    and exists (
      select 1
      from public.connections c
      where c.status = 'accepted'
        and (
          (c.requester_id = a and c.recipient_id = b)
          or (c.requester_id = b and c.recipient_id = a)
        )
    );
$$;

-- ----------------------------------------------------------------------------
-- F-3 — a non-admin may soft-delete their own post, but cannot un-remove one
-- and cannot touch the moderation audit fields.
-- ----------------------------------------------------------------------------
create or replace function public.protect_post_moderation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if public.is_admin() then
    return new;
  end if;

  if new.moderation_status <> old.moderation_status
    and not (old.moderation_status = 'visible' and new.moderation_status = 'removed') then
    raise exception 'illegal post moderation transition % -> %',
      old.moderation_status, new.moderation_status
      using errcode = '42501';
  end if;

  new.removed_by = old.removed_by;
  new.removed_at = old.removed_at;
  return new;
end;
$$;

create trigger posts_protect_moderation
  before update on public.posts
  for each row execute function public.protect_post_moderation();

-- ----------------------------------------------------------------------------
-- CA-4 — columns the UI renders that had no schema home.
-- ----------------------------------------------------------------------------
alter table public.profiles
  add column headline text,
  add constraint profiles_headline_length
    check (headline is null or char_length(headline) <= 120);

alter table public.connections
  add column intro text,
  add column topic text,
  add constraint connections_intro_length
    check (intro is null or char_length(intro) <= 2000),
  add constraint connections_topic_length
    check (topic is null or char_length(topic) <= 120);

alter table public.marketplace_products
  add column sku text,
  add column summary text,
  add column origin_label text,
  add column badge text,
  add column specs jsonb not null default '{}'::jsonb;

create unique index marketplace_products_sku_idx
  on public.marketplace_products (sku)
  where sku is not null;

-- ----------------------------------------------------------------------------
-- CA-1 — date_of_birth is private; only the derived age is public.
-- ----------------------------------------------------------------------------
create table public.profile_private (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  date_of_birth date,
  updated_at timestamptz not null default now()
);

create trigger profile_private_set_updated_at
  before update on public.profile_private
  for each row execute function public.set_updated_at();

alter table public.profile_private enable row level security;

create policy "profile_private_select_own"
  on public.profile_private for select
  to authenticated
  using (profile_id = (select auth.uid()));

create policy "profile_private_select_admin"
  on public.profile_private for select
  to authenticated
  using (public.is_admin());

create policy "profile_private_write_own"
  on public.profile_private for all
  to authenticated
  using (profile_id = (select auth.uid()))
  with check (profile_id = (select auth.uid()));

create policy "profile_private_write_admin"
  on public.profile_private for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Move any existing data, then drop the public column.
insert into public.profile_private (profile_id, date_of_birth)
select id, date_of_birth
from public.profiles
where date_of_birth is not null;

alter table public.profiles drop column date_of_birth;

create or replace function public.profile_age(p_profile_id uuid)
returns integer
language sql
security definer
stable
set search_path = ''
as $$
  select case
    when pp.date_of_birth is null then null
    else extract(year from pg_catalog.age(pp.date_of_birth))::integer
  end
  from public.profile_private pp
  where pp.profile_id = p_profile_id;
$$;

revoke all on function public.profile_age(uuid) from public;
grant execute on function public.profile_age(uuid) to authenticated, service_role;

grant select, insert, update, delete on public.profile_private to authenticated;
grant all privileges on public.profile_private to service_role;
