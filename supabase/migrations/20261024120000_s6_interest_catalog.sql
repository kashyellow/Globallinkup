-- ============================================================================
-- S6 — moderated cultural-interest catalog
--
-- User-created interests are suggestions, never auto-published. A label is
-- stored on the profile immediately, but it only becomes a suggestion for
-- other members after an admin approves the catalog row. Rejecting a pending
-- row also removes the label from its creator's profile; rejecting an already
-- approved row merely unpublishes it (existing profiles keep their text).
--
-- The catalog stores a single display label on purpose: custom interests are
-- user-authored text, while the eight built-in interests keep their bilingual
-- labels in `src/messages`. This avoids storing stale translations on profiles.
-- ============================================================================

create type public.interest_status as enum ('pending', 'approved', 'rejected');

-- Lowercase + trim + collapse whitespace. Used for dedupe and profile cleanup.
create or replace function public.normalize_interest_label(value text)
returns text
language sql
immutable
set search_path = ''
as $$
  select pg_catalog.lower(
    pg_catalog.regexp_replace(pg_catalog.btrim(value), '\s+', ' ', 'g')
  );
$$;

create table public.interest_catalog (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  normalized text not null unique,
  status public.interest_status not null default 'pending',
  -- Auth users, not profiles: a first-time persona registers its custom
  -- interests immediately before `save_persona` creates the profile row.
  created_by uuid references auth.users (id) on delete set null,
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint interest_catalog_label_length check (char_length(label) between 2 and 40),
  constraint interest_catalog_normalized_length check (char_length(normalized) between 2 and 40)
);

-- Keep `normalized` in sync even if an admin edits the label later.
create or replace function public.set_interest_normalized()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.normalized = public.normalize_interest_label(new.label);
  return new;
end;
$$;

create trigger interest_catalog_normalize
  before insert or update of label on public.interest_catalog
  for each row execute function public.set_interest_normalized();

create trigger interest_catalog_updated_at
  before update on public.interest_catalog
  for each row execute function public.set_updated_at();

create index interest_catalog_status_created_idx
  on public.interest_catalog (status, created_at);

create index interest_catalog_created_by_idx
  on public.interest_catalog (created_by)
  where created_by is not null;

alter table public.interest_catalog enable row level security;

-- Approved labels are public; creators can see their own pending/rejected rows
-- (so the form can explain a rejected suggestion), and admins see everything.
-- Anonymous read of `approved` is needed because step 1 no longer creates an
-- auth user: the persona combobox renders before sign-up.
create policy "interest_catalog_select_visible"
  on public.interest_catalog for select
  to authenticated
  using (
    status = 'approved'
    or created_by = (select auth.uid())
    or public.is_admin()
  );

create policy "interest_catalog_select_approved_anon"
  on public.interest_catalog for select
  to anon
  using (status = 'approved');

-- Only admins may update rows directly. Normal writes go through the
-- security-definer RPCs below, which also enforce the rate limit.
create policy "interest_catalog_update_admin"
  on public.interest_catalog for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

grant select, update on public.interest_catalog to authenticated;
grant all privileges on public.interest_catalog to service_role;
revoke insert, delete on public.interest_catalog from authenticated;
revoke all on public.interest_catalog from anon;
grant select on public.interest_catalog to anon;

-- ----------------------------------------------------------------------------
-- Register custom labels
--
-- Called by the persona Server Action with only the labels that are not one of
-- the eight built-in interests. New labels start as `pending`; existing
-- approved/pending rows are accepted, rejected rows are returned so the form
-- can reject the submit before writing the profile.
--
-- Limit: at most 3 *new* pending labels per member per rolling 24 hours.
-- Re-saving an existing pending label does not consume the quota.
-- ----------------------------------------------------------------------------
create or replace function public.register_custom_interests(p_labels text[])
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_recent integer;
  v_new_count integer;
  v_label text;
  v_norm text;
  v_status public.interest_status;
  v_accepted text[] := '{}';
  v_rejected text[] := '{}';
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  if p_labels is null or coalesce(array_length(p_labels, 1), 0) = 0 then
    return pg_catalog.jsonb_build_object(
      'status', 'ok',
      'accepted', '[]'::jsonb,
      'rejected', '[]'::jsonb
    );
  end if;

  -- Count labels that would be newly inserted. Invalid-length labels are not
  -- counted here; they are returned as rejected after the insert attempt.
  select count(*) into v_new_count
  from (
    select distinct public.normalize_interest_label(candidate) as normalized
    from unnest(p_labels) as candidate
    where char_length(public.normalize_interest_label(candidate)) between 2 and 40
  ) missing
  where not exists (
    select 1
    from public.interest_catalog c
    where c.normalized = missing.normalized
  );

  select count(*) into v_recent
  from public.interest_catalog
  where created_by = v_uid
    and status = 'pending'
    and created_at > pg_catalog.now() - interval '24 hours';

  if v_recent + v_new_count > 3 then
    return pg_catalog.jsonb_build_object(
      'status', 'rate_limited',
      'accepted', '[]'::jsonb,
      'rejected', '[]'::jsonb
    );
  end if;

  insert into public.interest_catalog (label, status, created_by)
  select distinct on (public.normalize_interest_label(candidate))
    pg_catalog.btrim(candidate) as label,
    'pending',
    v_uid
  from unnest(p_labels) as candidate
  where char_length(pg_catalog.btrim(candidate)) between 2 and 40
    and not exists (
      select 1
      from public.interest_catalog c
      where c.normalized = public.normalize_interest_label(candidate)
    )
  order by public.normalize_interest_label(candidate), pg_catalog.btrim(candidate)
  on conflict (normalized) do nothing;

  for v_label in
    select distinct pg_catalog.btrim(candidate)
    from unnest(p_labels) as candidate
    where pg_catalog.btrim(candidate) <> ''
  loop
    v_norm := public.normalize_interest_label(v_label);

    select c.status into v_status
    from public.interest_catalog c
    where c.normalized = v_norm;

    if v_status is null or v_status = 'rejected' then
      v_rejected := pg_catalog.array_append(v_rejected, v_label);
    else
      v_accepted := pg_catalog.array_append(v_accepted, v_label);
    end if;
  end loop;

  return pg_catalog.jsonb_build_object(
    'status', 'ok',
    'accepted', pg_catalog.to_jsonb(v_accepted),
    'rejected', pg_catalog.to_jsonb(v_rejected)
  );
end;
$$;

revoke all on function public.register_custom_interests(text[]) from public;
grant execute on function public.register_custom_interests(text[]) to authenticated;

-- ----------------------------------------------------------------------------
-- Admin review
--
-- Approve: publish to suggestions.
-- Reject pending: unpublish + remove the label from the creator's profile.
-- Reject approved: unpublish only; existing profiles keep their text.
-- ----------------------------------------------------------------------------
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
  if not public.is_admin() then
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

revoke all on function public.review_interest(uuid, public.interest_status) from public;
grant execute on function public.review_interest(uuid, public.interest_status) to authenticated;
