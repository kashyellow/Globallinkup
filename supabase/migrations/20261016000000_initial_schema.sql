-- ============================================================================
-- GlobalLinkup — initial schema, RLS and helper functions
--
-- Implements the model in docs/PRD.md §6 (tables) and §7 (security), with the
-- field↔column decisions locked in
-- docs/plan/api-layer/api-layer-decisions.md (SD-1 … SD-12).
--
-- Nothing here is user-visible; the UI is still fixture-driven. See
-- docs/plan/api-layer/s1-schema-rls-seed.md for the slice context.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Enums
-- ----------------------------------------------------------------------------
create type public.approval_status as enum ('pending', 'approved', 'rejected', 'suspended');
create type public.app_role as enum ('user', 'admin');
create type public.connection_status as enum ('requested', 'accepted', 'declined');
create type public.moderation_status as enum ('visible', 'removed');
create type public.product_availability as enum ('in_stock', 'out_of_stock', 'made_to_order');
create type public.report_target_type as enum ('user', 'post');
create type public.report_status as enum ('open', 'resolved', 'dismissed');

-- ----------------------------------------------------------------------------
-- updated_at maintenance (attached to every table that carries the column)
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = pg_catalog.now();
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- Tables
-- ----------------------------------------------------------------------------

-- 1:1 with auth.users. The row is created on persona submit (S2/S3), never at
-- signUp, so "no profile" keeps meaning "still onboarding" (PRD §7.5).
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  country_code text,
  city text,
  -- SD-9: kept because the connections UI renders it.
  neighborhood text,
  avatar_url text,
  -- SD-3: the dossier shows both language editions side by side.
  bio_en text,
  bio_es text,
  -- SD-4
  origin_flavor text,
  -- SD-1: age is derived from this; the persona form is not yet wired.
  date_of_birth date,
  -- SD-2: [{ "code": "ES", "level": "native" }, …]
  languages jsonb not null default '[]'::jsonb,
  interests text[] not null default '{}',
  -- SD-9: display badge shown on connection cards.
  badge text,
  approval_status public.approval_status not null default 'pending',
  role public.app_role not null default 'user',
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Separate 1:1 so RLS can gate it on an accepted connection (PRD §6.1).
create table public.contact_details (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  whatsapp text,
  instagram text,
  email text,
  -- SD-5: a generic bucket for the "chat handle" and other links.
  other jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table public.connections (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles (id) on delete cascade,
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  status public.connection_status not null default 'requested',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint connections_distinct_parties check (requester_id <> recipient_id)
);

-- One row per unordered pair: decline → re-request is an UPDATE, never an insert.
create unique index connections_unique_pair
  on public.connections (least(requester_id, recipient_id), greatest(requester_id, recipient_id));

create index connections_requester_idx on public.connections (requester_id);
create index connections_recipient_idx on public.connections (recipient_id);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  image_path text,
  caption text,
  moderation_status public.moderation_status not null default 'visible',
  removed_by uuid references public.profiles (id) on delete set null,
  removed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index posts_author_idx on public.posts (author_id);
create index posts_created_at_idx on public.posts (created_at desc);

create table public.post_likes (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table public.marketplace_products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  -- SD-11: integer minor units, single configured currency.
  price_cents integer not null default 0 check (price_cents >= 0),
  currency text not null default 'USD',
  -- SD-10: frozen controlled list.
  category text not null
    check (category in ('artisanCrafts', 'homeLiving', 'booksCulture', 'localGoods', 'travelGear')),
  description text,
  availability public.product_availability not null default 'in_stock',
  contact_information text,
  is_published boolean not null default false,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.marketplace_product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.marketplace_products (id) on delete cascade,
  storage_path text not null,
  sort integer not null default 0
);

create index marketplace_product_images_product_idx
  on public.marketplace_product_images (product_id, sort);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  target_type public.report_target_type not null,
  target_user_id uuid references public.profiles (id) on delete cascade,
  target_post_id uuid references public.posts (id) on delete cascade,
  reason text not null,
  details text,
  status public.report_status not null default 'open',
  resolved_by uuid references public.profiles (id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  -- Exactly one target, matching the declared type.
  constraint reports_target_matches_type check (
    (
      target_type = 'user'
      and target_user_id is not null
      and target_post_id is null
    )
    or (
      target_type = 'post'
      and target_post_id is not null
      and target_user_id is null
    )
  )
);

create index reports_status_idx on public.reports (status);
create index reports_reporter_idx on public.reports (reporter_id);

-- SD-12: minimal Admin → Settings store (FR-9.5). Key/value keeps it open-ended.
create table public.platform_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- updated_at triggers
-- ----------------------------------------------------------------------------
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger contact_details_set_updated_at
  before update on public.contact_details
  for each row execute function public.set_updated_at();
create trigger connections_set_updated_at
  before update on public.connections
  for each row execute function public.set_updated_at();
create trigger posts_set_updated_at
  before update on public.posts
  for each row execute function public.set_updated_at();
create trigger marketplace_products_set_updated_at
  before update on public.marketplace_products
  for each row execute function public.set_updated_at();
create trigger platform_settings_set_updated_at
  before update on public.platform_settings
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- RLS helper functions (PRD §7.2) — security definer, stable, pinned search_path
-- ----------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'admin'
      and p.approval_status = 'approved'
  );
$$;

-- An admin is approved by definition (PRD §3.2), so there is no admin special
-- case here — the bootstrap admin is seeded as `approved`.
create or replace function public.is_approved()
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.approval_status = 'approved'
  );
$$;

create or replace function public.are_connected(a uuid, b uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.connections c
    where c.status = 'accepted'
      and (
        (c.requester_id = a and c.recipient_id = b)
        or (c.requester_id = b and c.recipient_id = a)
      )
  );
$$;

grant execute on function public.is_admin() to anon, authenticated, service_role;
grant execute on function public.is_approved() to anon, authenticated, service_role;
grant execute on function public.are_connected(uuid, uuid) to anon, authenticated, service_role;

-- Non-admins may not promote themselves or self-approve (PRD §7.3: only an admin
-- may change status/role). Service-role and the seed (no JWT) bypass the guard.
create or replace function public.protect_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is not null and not public.is_admin() then
    new.role = old.role;
    new.approval_status = old.approval_status;
    new.submitted_at = old.submitted_at;
    new.reviewed_at = old.reviewed_at;
    new.reviewed_by = old.reviewed_by;
  end if;
  return new;
end;
$$;

create trigger profiles_protect_privileges
  before update on public.profiles
  for each row execute function public.protect_profile_privileges();

-- ----------------------------------------------------------------------------
-- Row level security
-- ----------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.contact_details enable row level security;
alter table public.connections enable row level security;
alter table public.posts enable row level security;
alter table public.post_likes enable row level security;
alter table public.marketplace_products enable row level security;
alter table public.marketplace_product_images enable row level security;
alter table public.reports enable row level security;
alter table public.platform_settings enable row level security;

-- profiles: own record (any status — /verify reads it), approved faces to
-- approved users, everything to admins.
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()));

create policy "profiles_select_approved"
  on public.profiles for select
  to authenticated
  using (public.is_approved() and approval_status = 'approved');

create policy "profiles_select_admin"
  on public.profiles for select
  to authenticated
  using (public.is_admin());

create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (
    id = (select auth.uid())
    and role = 'user'
    and approval_status = 'pending'
  );

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()) and role = 'user');

create policy "profiles_update_admin"
  on public.profiles for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- contact_details: owner, an accepted connection, or an admin.
create policy "contact_details_select_owner"
  on public.contact_details for select
  to authenticated
  using (profile_id = (select auth.uid()));

create policy "contact_details_select_connection"
  on public.contact_details for select
  to authenticated
  using (public.are_connected(profile_id, (select auth.uid())));

create policy "contact_details_select_admin"
  on public.contact_details for select
  to authenticated
  using (public.is_admin());

create policy "contact_details_write_own"
  on public.contact_details for all
  to authenticated
  using (profile_id = (select auth.uid()))
  with check (profile_id = (select auth.uid()));

create policy "contact_details_write_admin"
  on public.contact_details for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- connections: the two parties (state machine in the Server Action), or admin.
create policy "connections_select_party"
  on public.connections for select
  to authenticated
  using (
    requester_id = (select auth.uid())
    or recipient_id = (select auth.uid())
    or public.is_admin()
  );

create policy "connections_insert_requester"
  on public.connections for insert
  to authenticated
  with check (
    requester_id = (select auth.uid())
    and status = 'requested'
    and public.is_approved()
  );

create policy "connections_update_party"
  on public.connections for update
  to authenticated
  using (
    requester_id = (select auth.uid())
    or recipient_id = (select auth.uid())
    or public.is_admin()
  )
  with check (
    requester_id = (select auth.uid())
    or recipient_id = (select auth.uid())
    or public.is_admin()
  );

create policy "connections_delete_admin"
  on public.connections for delete
  to authenticated
  using (public.is_admin());

-- posts: approved users see visible posts; authors see their own; admin sees all.
create policy "posts_select_visible"
  on public.posts for select
  to authenticated
  using (
    (public.is_approved() and moderation_status = 'visible')
    or author_id = (select auth.uid())
    or public.is_admin()
  );

create policy "posts_insert_author"
  on public.posts for insert
  to authenticated
  with check (
    author_id = (select auth.uid())
    and moderation_status = 'visible'
    and public.is_approved()
  );

create policy "posts_update_author"
  on public.posts for update
  to authenticated
  using (author_id = (select auth.uid()))
  with check (author_id = (select auth.uid()));

create policy "posts_update_admin"
  on public.posts for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- post_likes: approved users read counts; owners write their own like.
create policy "post_likes_select_approved"
  on public.post_likes for select
  to authenticated
  using (public.is_approved());

create policy "post_likes_insert_own"
  on public.post_likes for insert
  to authenticated
  with check (user_id = (select auth.uid()) and public.is_approved());

create policy "post_likes_delete_own"
  on public.post_likes for delete
  to authenticated
  using (user_id = (select auth.uid()));

-- marketplace: approved users read published products; admin reads/writes all.
create policy "marketplace_products_select_published"
  on public.marketplace_products for select
  to authenticated
  using (
    (is_published and public.is_approved())
    or public.is_admin()
  );

create policy "marketplace_products_write_admin"
  on public.marketplace_products for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "marketplace_product_images_select"
  on public.marketplace_product_images for select
  to authenticated
  using (
    exists (
      select 1
      from public.marketplace_products p
      where p.id = product_id
        and ((p.is_published and public.is_approved()) or public.is_admin())
    )
  );

create policy "marketplace_product_images_write_admin"
  on public.marketplace_product_images for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- reports: reporter sees their own; admin sees and resolves all.
create policy "reports_select_own"
  on public.reports for select
  to authenticated
  using (reporter_id = (select auth.uid()));

create policy "reports_select_admin"
  on public.reports for select
  to authenticated
  using (public.is_admin());

create policy "reports_insert_own"
  on public.reports for insert
  to authenticated
  with check (
    reporter_id = (select auth.uid())
    and status = 'open'
    and public.is_approved()
  );

create policy "reports_update_admin"
  on public.reports for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- platform_settings: approved users read, admin writes.
create policy "platform_settings_select_approved"
  on public.platform_settings for select
  to authenticated
  using (public.is_approved());

create policy "platform_settings_write_admin"
  on public.platform_settings for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- Privileges (matches the Supabase cloud default; RLS does the restricting)
-- ----------------------------------------------------------------------------
grant usage on schema public to anon, authenticated, service_role;

grant select on all tables in schema public to anon, authenticated;
grant insert, update, delete on all tables in schema public to authenticated;
grant all privileges on all tables in schema public to service_role;
