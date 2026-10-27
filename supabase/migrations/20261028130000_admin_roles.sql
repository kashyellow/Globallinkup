-- ============================================================================
-- Granular admin roles (ADR 0002)
--
-- A role is a named set of capabilities. `is_admin()` keeps its meaning as "full
-- admin" by mapping to the `owner` role (which holds `admins.manage`), so any
-- policy not migrated yet stays owner-only — fail closed, never widened.
--
-- `has_capability()` is the only new gate. Policies that a sub-admin may use now
-- call it with their area; everything else still calls `is_admin()`.
-- ============================================================================

create table public.admin_roles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  capabilities text[] not null default '{}',
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
  add column admin_role_id uuid references public.admin_roles (id) on delete set null;

insert into public.admin_roles (slug, name, description, capabilities, is_system)
values (
  'owner',
  'Owner',
  'Full platform control',
  array[
    'members.review',
    'posts.moderate',
    'comments.moderate',
    'interests.review',
    'reports.manage',
    'marketplace.manage',
    'admins.manage',
    'settings.manage',
    'audit.read'
  ],
  true
);

update public.profiles
set admin_role_id = (select id from public.admin_roles where slug = 'owner')
where role = 'admin' and admin_role_id is null;

create or replace function public.has_capability(p_capability text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    join public.admin_roles r on r.id = p.admin_role_id
    where p.id = (select auth.uid())
      and p.role = 'admin'
      and p.approval_status = 'approved'
      and p_capability = any (r.capabilities)
  );
$$;

comment on function public.has_capability(text) is
  'True when the caller is an approved admin whose role includes the capability.';

revoke all on function public.has_capability(text) from public, anon;
grant execute on function public.has_capability(text) to authenticated, service_role;

-- `is_admin()` = owner. Anything not yet migrated to a capability stays
-- owner-only instead of leaking to every sub-admin.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.has_capability('admins.manage');
$$;

-- Seeds and bootstrap insert `role = 'admin'` without a role id (the seed runs
-- after migrations), so the default owner role is applied by trigger. Demoting
-- an account clears the role.
create or replace function public.assign_default_admin_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role = 'admin' then
    if new.admin_role_id is null then
      select r.id into new.admin_role_id
      from public.admin_roles r
      where r.slug = 'owner';
    end if;
  else
    new.admin_role_id := null;
  end if;
  return new;
end;
$$;

create trigger profiles_assign_admin_role
  before insert or update of role, admin_role_id on public.profiles
  for each row execute function public.assign_default_admin_role();

-- ----------------------------------------------------------------------------
-- Guards
-- ----------------------------------------------------------------------------

create or replace function public.protect_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Service-role / seed (no JWT) and member reviewers may change anything.
  if (select auth.uid()) is null or public.has_capability('members.review') then
    return new;
  end if;

  -- The owner may resubmit after a rejection (FR-2.5) and nothing else.
  if old.approval_status = 'rejected' and new.approval_status = 'pending' then
    new.role = old.role;
    new.reviewed_at = old.reviewed_at;
    new.reviewed_by = old.reviewed_by;
    return new;
  end if;

  new.role = old.role;
  new.approval_status = old.approval_status;
  new.submitted_at = old.submitted_at;
  new.reviewed_at = old.reviewed_at;
  new.reviewed_by = old.reviewed_by;
  return new;
end;
$$;

create or replace function public.protect_connection_transitions()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.requester_id = old.requester_id;
  new.recipient_id = old.recipient_id;

  if new.status = old.status or public.has_capability('members.review') then
    return new;
  end if;

  if old.status = 'requested'
    and new.status in ('accepted', 'declined')
    and old.recipient_id = (select auth.uid()) then
    return new;
  end if;

  if old.status = 'accepted'
    and new.status = 'declined'
    and (
      old.requester_id = (select auth.uid())
      or old.recipient_id = (select auth.uid())
    ) then
    return new;
  end if;

  if old.status = 'declined'
    and new.status = 'requested'
    and old.requester_id = (select auth.uid()) then
    return new;
  end if;

  raise exception 'illegal connection transition % -> %', old.status, new.status
    using errcode = '42501';
end;
$$;

create or replace function public.protect_post_state()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE'
    and (select auth.uid()) is not null
    and not public.has_capability('posts.moderate') then
    if new.state is distinct from old.state and new.state not in ('visible', 'archived') then
      raise exception 'illegal post state transition % -> %', old.state, new.state
        using errcode = '42501';
    end if;
    new.removed_by := old.removed_by;
    new.removed_at := old.removed_at;
    new.removed_reason := old.removed_reason;
    new.previous_state := old.previous_state;
    new.purge_after := old.purge_after;
  end if;

  new.moderation_status := case
    when new.state = 'visible' then 'visible'::public.moderation_status
    else 'removed'::public.moderation_status
  end;

  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- Review RPCs
-- ----------------------------------------------------------------------------

create or replace function public.review_persona(
  p_profile_id uuid,
  p_decision public.approval_status,
  p_reason text default null
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_admin uuid := (select auth.uid());
begin
  if v_admin is null or not public.has_capability('members.review') then
    raise exception 'not authorized to review personas' using errcode = '42501';
  end if;

  if p_decision not in ('approved', 'rejected', 'suspended') then
    raise exception 'invalid review decision' using errcode = '22023';
  end if;

  if p_decision in ('rejected', 'suspended')
    and (p_reason is null or char_length(pg_catalog.btrim(p_reason)) < 10) then
    raise exception 'a reason is required for reject or suspend' using errcode = '22023';
  end if;

  update public.profiles
  set approval_status = p_decision,
      reviewed_at = pg_catalog.now(),
      reviewed_by = v_admin
  where id = p_profile_id
    and role = 'user';

  if not found then
    raise exception 'profile not found or not reviewable' using errcode = '42501';
  end if;

  insert into public.profile_moderation_events (profile_id, admin_id, decision, reason)
  values (
    p_profile_id,
    v_admin,
    p_decision,
    case
      when p_reason is null or pg_catalog.btrim(p_reason) = '' then null
      else pg_catalog.btrim(p_reason)
    end
  );

  return true;
end;
$$;

create or replace function public.review_interest(
  p_interest_id uuid,
  p_decision public.interest_status
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old public.interest_status;
  v_created_by uuid;
  v_normalized text;
begin
  if not public.has_capability('interests.review') then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if p_decision <> 'approved'::public.interest_status
     and p_decision <> 'rejected'::public.interest_status then
    raise exception 'invalid decision' using errcode = '22023';
  end if;

  select status, created_by, normalized
    into v_old, v_created_by, v_normalized
  from public.interest_catalog
  where id = p_interest_id
  for update;

  if not found then
    return false;
  end if;

  update public.interest_catalog
  set status = p_decision,
      reviewed_by = auth.uid(),
      reviewed_at = pg_catalog.now()
  where id = p_interest_id;

  if p_decision = 'rejected'::public.interest_status
     and v_old = 'pending'::public.interest_status
     and v_created_by is not null then
    update public.profiles p
    set interests = coalesce(
      (
        select pg_catalog.array_agg(item.value order by item.ordinality)
        from pg_catalog.unnest(p.interests) with ordinality as item(value, ordinality)
        where public.normalize_interest_label(item.value) <> v_normalized
      ),
      '{}'::text[]
    )
    where p.id = v_created_by;
  end if;

  return true;
end;
$$;

-- ----------------------------------------------------------------------------
-- Policies
-- ----------------------------------------------------------------------------

drop policy if exists "profiles_select_admin" on public.profiles;
create policy "profiles_select_admin"
  on public.profiles for select
  to authenticated
  using (public.has_capability('members.review'));

drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin"
  on public.profiles for update
  to authenticated
  using (public.has_capability('members.review'))
  with check (public.has_capability('members.review'));

drop policy if exists "connections_select_party" on public.connections;
create policy "connections_select_party"
  on public.connections for select
  to authenticated
  using (
    requester_id = (select auth.uid())
    or recipient_id = (select auth.uid())
    or public.has_capability('members.review')
  );

drop policy if exists "connections_update_party" on public.connections;
create policy "connections_update_party"
  on public.connections for update
  to authenticated
  using (
    requester_id = (select auth.uid())
    or recipient_id = (select auth.uid())
    or public.has_capability('members.review')
  )
  with check (
    requester_id = (select auth.uid())
    or recipient_id = (select auth.uid())
    or public.has_capability('members.review')
  );

drop policy if exists "connections_delete_admin" on public.connections;
create policy "connections_delete_admin"
  on public.connections for delete
  to authenticated
  using (public.has_capability('members.review'));

drop policy if exists "posts_select_visible" on public.posts;
create policy "posts_select_visible"
  on public.posts for select
  to authenticated
  using (
    (public.is_approved() and state = 'visible')
    or author_id = (select auth.uid())
    or public.has_capability('posts.moderate')
  );

drop policy if exists "posts_update_admin" on public.posts;
create policy "posts_update_admin"
  on public.posts for update
  to authenticated
  using (public.has_capability('posts.moderate'))
  with check (public.has_capability('posts.moderate'));

drop policy if exists "posts_delete_admin" on public.posts;
create policy "posts_delete_admin"
  on public.posts for delete
  to authenticated
  using (public.has_capability('posts.moderate'));

drop policy if exists "post_comments_select_visible" on public.post_comments;
create policy "post_comments_select_visible"
  on public.post_comments for select
  to authenticated
  using (
    exists (
      select 1
      from public.posts p
      where p.id = post_comments.post_id
        and (
          (public.is_approved() and p.moderation_status = 'visible')
          or p.author_id = (select auth.uid())
          or public.has_capability('comments.moderate')
        )
    )
  );

drop policy if exists "post_comments_update_admin" on public.post_comments;
create policy "post_comments_update_admin"
  on public.post_comments for update
  to authenticated
  using (public.has_capability('comments.moderate'))
  with check (public.has_capability('comments.moderate'));

drop policy if exists "marketplace_products_select_published" on public.marketplace_products;
create policy "marketplace_products_select_published"
  on public.marketplace_products for select
  to authenticated
  using (
    (is_published and deleted_at is null and public.is_approved())
    or public.has_capability('marketplace.manage')
  );

drop policy if exists "marketplace_products_write_admin" on public.marketplace_products;
create policy "marketplace_products_write_admin"
  on public.marketplace_products for all
  to authenticated
  using (public.has_capability('marketplace.manage'))
  with check (public.has_capability('marketplace.manage'));

drop policy if exists "marketplace_product_images_select" on public.marketplace_product_images;
create policy "marketplace_product_images_select"
  on public.marketplace_product_images for select
  to authenticated
  using (
    exists (
      select 1
      from public.marketplace_products p
      where p.id = product_id
        and p.deleted_at is null
        and (
          (p.is_published and public.is_approved())
          or public.has_capability('marketplace.manage')
        )
    )
  );

drop policy if exists "marketplace_product_images_write_admin" on public.marketplace_product_images;
create policy "marketplace_product_images_write_admin"
  on public.marketplace_product_images for all
  to authenticated
  using (public.has_capability('marketplace.manage'))
  with check (public.has_capability('marketplace.manage'));

drop policy if exists "reports_select_admin" on public.reports;
create policy "reports_select_admin"
  on public.reports for select
  to authenticated
  using (public.has_capability('reports.manage'));

drop policy if exists "reports_update_admin" on public.reports;
create policy "reports_update_admin"
  on public.reports for update
  to authenticated
  using (public.has_capability('reports.manage'))
  with check (public.has_capability('reports.manage'));

drop policy if exists "platform_settings_write_admin" on public.platform_settings;
create policy "platform_settings_write_admin"
  on public.platform_settings for all
  to authenticated
  using (public.has_capability('settings.manage'))
  with check (public.has_capability('settings.manage'));

drop policy if exists "interest_catalog_select_visible" on public.interest_catalog;
create policy "interest_catalog_select_visible"
  on public.interest_catalog for select
  to authenticated
  using (
    status = 'approved'
    or created_by = (select auth.uid())
    or public.has_capability('interests.review')
  );

drop policy if exists "interest_catalog_update_admin" on public.interest_catalog;
create policy "interest_catalog_update_admin"
  on public.interest_catalog for update
  to authenticated
  using (public.has_capability('interests.review'))
  with check (public.has_capability('interests.review'));

drop policy if exists "profile_moderation_events_select_admin" on public.profile_moderation_events;
create policy "profile_moderation_events_select_admin"
  on public.profile_moderation_events for select
  to authenticated
  using (public.has_capability('members.review'));

drop policy if exists "profile_moderation_events_insert_admin" on public.profile_moderation_events;
create policy "profile_moderation_events_insert_admin"
  on public.profile_moderation_events for insert
  to authenticated
  with check (public.has_capability('members.review'));

drop policy if exists "post_appeals_select_admin" on public.post_appeals;
create policy "post_appeals_select_admin"
  on public.post_appeals for select
  to authenticated
  using (public.has_capability('posts.moderate'));

drop policy if exists "post_appeals_update_admin" on public.post_appeals;
create policy "post_appeals_update_admin"
  on public.post_appeals for update
  to authenticated
  using (public.has_capability('posts.moderate'))
  with check (public.has_capability('posts.moderate'));

drop policy if exists "product_images_write_admin" on storage.objects;
create policy "product_images_write_admin"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'product-images' and public.has_capability('marketplace.manage'));

drop policy if exists "product_images_delete_admin" on storage.objects;
create policy "product_images_delete_admin"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'product-images' and public.has_capability('marketplace.manage'));

-- ----------------------------------------------------------------------------
-- Role administration
-- ----------------------------------------------------------------------------

alter table public.admin_roles enable row level security;

create policy "admin_roles_select_admin"
  on public.admin_roles for select
  to authenticated
  using (public.has_capability('admins.manage'));

create policy "admin_roles_write_admin"
  on public.admin_roles for all
  to authenticated
  using (public.has_capability('admins.manage'))
  with check (public.has_capability('admins.manage'));

-- The system role (owner) can never be emptied or reassigned away.
create or replace function public.protect_system_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.is_system then
    if tg_op = 'DELETE' then
      raise exception 'system roles cannot be deleted' using errcode = '42501';
    end if;
    new.is_system := true;
    new.slug := old.slug;
    if 'admins.manage' <> all (new.capabilities) then
      raise exception 'the system role must keep admins.manage' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

create trigger admin_roles_protect_system
  before update or delete on public.admin_roles
  for each row execute function public.protect_system_role();

-- The admin shell needs the caller's own capabilities without an extra policy on
-- `admin_roles`; a definer function keeps that read narrow and cheap.
create or replace function public.my_capabilities()
returns text[]
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(r.capabilities, '{}'::text[])
  from public.profiles p
  join public.admin_roles r on r.id = p.admin_role_id
  where p.id = (select auth.uid())
    and p.role = 'admin'
    and p.approval_status = 'approved';
$$;

comment on function public.my_capabilities() is
  'Capabilities of the caller''s admin role; empty for members.';

revoke all on function public.my_capabilities() from public, anon;
grant execute on function public.my_capabilities() to authenticated, service_role;
