-- ============================================================================
-- Remove cultural interests (client decision, 2026-10-30)
--
-- Interests are dropped end to end: the persona field, the moderated catalog
-- and its review desk, the `interests.review` capability, the interest
-- notifications, and interest text in Discover search. See
-- docs/feedback/2026-10-30-remove-interests.md.
--
-- Order matters: every object that reads `profiles.interests` is recreated
-- without it first, then the column, the catalog and their types go.
-- Audit history is append-only and is kept as written; rows that name an
-- `interest.*` action remain readable.
--
-- This deletes data (every profile's interests and the whole catalog) and is
-- not reversible by a later migration.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Discover search text no longer includes interests
-- ---------------------------------------------------------------------------

drop trigger if exists profiles_set_search_text on public.profiles;

drop function if exists public.profile_search_text(text, text, text, text, text[], jsonb);
drop function if exists public.interest_search_text(text[]);

create or replace function public.profile_search_text(
  p_display_name text,
  p_city text,
  p_country_code text,
  p_headline text,
  p_languages jsonb
)
returns text
language sql
immutable
set search_path = ''
as $$
  select pg_catalog.lower(
    coalesce(p_display_name, '') || ' ' ||
    coalesce(p_city, '') || ' ' ||
    coalesce(p_country_code, '') || ' ' ||
    coalesce(p_headline, '') || ' ' ||
    public.language_search_text(p_languages)
  );
$$;

create or replace function public.set_profile_search_text()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.search_text := public.profile_search_text(
    new.display_name,
    new.city,
    new.country_code,
    new.headline,
    new.languages
  );
  return new;
end;
$$;

create trigger profiles_set_search_text
  before insert or update of
    display_name,
    city,
    country_code,
    headline,
    languages
  on public.profiles
  for each row execute function public.set_profile_search_text();

-- ---------------------------------------------------------------------------
-- 2. Discover RPC: same filters and seeded order, no interests column
-- ---------------------------------------------------------------------------

-- The return type changes, so the function is dropped rather than replaced.
drop function if exists public.discover_personas(text, text[], text, integer, integer);

-- ---------------------------------------------------------------------------
-- 3. Views: `profiles_public` loses the column; `posts_feed` depends on it and
--    is recreated unchanged.
-- ---------------------------------------------------------------------------

drop view if exists public.posts_feed;
drop view if exists public.profiles_public;

create view public.profiles_public
with (security_invoker = true)
as
select
  p.id,
  p.display_name,
  p.country_code,
  p.city,
  p.neighborhood,
  p.avatar_url,
  p.bio_en,
  p.bio_es,
  p.headline,
  p.languages,
  p.badge,
  p.role,
  p.approval_status,
  p.created_at,
  public.profile_age(p.id) as age,
  p.search_text,
  p.submitted_at
from public.profiles p;

grant select on public.profiles_public to authenticated, service_role;

create view public.posts_feed
with (security_invoker = true)
as
select
  p.id,
  p.author_id,
  p.image_path,
  p.caption,
  p.moderation_status,
  p.created_at,
  p.updated_at,
  pr.display_name as author_name,
  pr.country_code as author_country_code,
  pr.city as author_city,
  pr.avatar_url as author_avatar_url,
  (
    select count(*)::integer
    from public.post_comments c
    where c.post_id = p.id and c.deleted_at is null
  ) as comment_count,
  (
    select count(*)::integer
    from public.post_likes l
    where l.post_id = p.id
  ) as like_count,
  p.state,
  p.archived_at,
  p.removed_reason,
  p.purge_after
from public.posts p
left join public.profiles_public pr on pr.id = p.author_id
where pr.id is not null or public.is_admin_author(p.author_id);

grant select on public.posts_feed to authenticated, service_role;

create function public.discover_personas(
  p_query text default '',
  p_countries text[] default '{}',
  p_seed text default '',
  p_limit integer default 10,
  p_offset integer default 0
)
returns table (
  id uuid,
  display_name text,
  country_code text,
  city text,
  avatar_url text,
  languages jsonb,
  badge text,
  approval_status public.approval_status,
  age integer,
  total_count bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  with filtered as (
    select
      p.id,
      p.display_name,
      p.country_code,
      p.city,
      p.avatar_url,
      p.languages,
      p.badge,
      p.approval_status,
      p.age
    from public.profiles_public p
    where p.approval_status = 'approved'
      and p.role = 'user'
      and p.id is distinct from (select auth.uid())
      and (
        coalesce(pg_catalog.cardinality(p_countries), 0) = 0
        or p.country_code = any (p_countries)
      )
      and (
        pg_catalog.btrim(coalesce(p_query, '')) = ''
        or pg_catalog.strpos(
          p.search_text,
          pg_catalog.lower(pg_catalog.btrim(p_query))
        ) > 0
      )
  )
  select
    f.id,
    f.display_name,
    f.country_code,
    f.city,
    f.avatar_url,
    f.languages,
    f.badge,
    f.approval_status,
    f.age,
    pg_catalog.count(*) over () as total_count
  from filtered f
  order by
    pg_catalog.md5(f.id::text || coalesce(p_seed, '')),
    f.id
  limit greatest(coalesce(p_limit, 10), 0)
  offset greatest(coalesce(p_offset, 0), 0);
$$;

revoke all on function public.discover_personas(text, text[], text, integer, integer)
  from public;
grant execute on function public.discover_personas(text, text[], text, integer, integer)
  to authenticated;

-- ---------------------------------------------------------------------------
-- 4. save_persona without p_interests (signature changes: drop + create)
-- ---------------------------------------------------------------------------

drop function if exists public.save_persona(
  text, text, text, text, text, jsonb, text[], date,
  text, text, text, text, text, text, text, text
);

create function public.save_persona(
  p_display_name text,
  p_country_code text,
  p_city text,
  p_bio text default null,
  p_bio_locale text default null,
  p_languages jsonb default null,
  p_date_of_birth date default null,
  p_whatsapp text default null,
  p_telegram text default null,
  p_instagram text default null,
  p_facebook text default null,
  p_tiktok text default null,
  p_x text default null,
  p_avatar_url text default null,
  p_headline text default null
)
returns public.approval_status
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_status public.approval_status;
  v_resubmit boolean := false;
  v_contacts jsonb;
  v_avatar text := nullif(p_avatar_url, '');
  v_headline text := nullif(pg_catalog.btrim(p_headline), '');
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  -- Admins are operators, not members: they have no persona to create or edit.
  if exists (
    select 1 from public.profiles p where p.id = v_uid and p.role = 'admin'
  ) then
    raise exception 'admins cannot write a member persona' using errcode = '42501';
  end if;

  if coalesce(
    nullif(p_whatsapp, ''), nullif(p_telegram, ''), nullif(p_instagram, ''),
    nullif(p_facebook, ''), nullif(p_tiktok, ''), nullif(p_x, '')
  ) is null then
    raise exception 'at least one contact channel is required' using errcode = '22023';
  end if;

  if v_avatar is not null and split_part(v_avatar, '/', 1) <> v_uid::text then
    raise exception 'avatar path must belong to the caller' using errcode = '22023';
  end if;

  v_contacts := pg_catalog.jsonb_strip_nulls(
    pg_catalog.jsonb_build_object(
      'telegram', nullif(p_telegram, ''),
      'facebook', nullif(p_facebook, ''),
      'tiktok', nullif(p_tiktok, ''),
      'x', nullif(p_x, '')
    )
  );

  select approval_status into v_status from public.profiles where id = v_uid;

  if not found then
    insert into public.profiles (
      id, display_name, country_code, city, avatar_url, headline,
      bio_en, bio_es, languages, approval_status, submitted_at
    )
    values (
      v_uid, p_display_name, p_country_code, p_city, v_avatar, v_headline,
      case when p_bio_locale = 'es' then null else p_bio end,
      case when p_bio_locale = 'es' then p_bio else null end,
      p_languages, 'pending', pg_catalog.now()
    );
    v_status := 'pending';
  else
    v_resubmit := v_status = 'rejected';
    update public.profiles set
      display_name = p_display_name,
      country_code = p_country_code,
      city = p_city,
      avatar_url = coalesce(v_avatar, avatar_url),
      headline = v_headline,
      bio_en = case when p_bio_locale = 'es' then bio_en else p_bio end,
      bio_es = case when p_bio_locale = 'es' then p_bio else bio_es end,
      languages = p_languages,
      approval_status = case when v_resubmit then 'pending' else approval_status end,
      submitted_at = case when v_resubmit then pg_catalog.now() else submitted_at end
    where id = v_uid;

    select p.approval_status into v_status from public.profiles p where p.id = v_uid;
  end if;

  if p_date_of_birth is null then
    delete from public.profile_private where profile_id = v_uid;
  else
    insert into public.profile_private (profile_id, date_of_birth)
    values (v_uid, p_date_of_birth)
    on conflict (profile_id) do update set date_of_birth = excluded.date_of_birth;
  end if;

  insert into public.contact_details (profile_id, whatsapp, instagram, other)
  values (v_uid, nullif(p_whatsapp, ''), nullif(p_instagram, ''), v_contacts)
  on conflict (profile_id) do update set
    whatsapp = excluded.whatsapp,
    instagram = excluded.instagram,
    other = excluded.other;

  return v_status;
end;
$$;

revoke all on function public.save_persona(
  text, text, text, text, text, jsonb, date,
  text, text, text, text, text, text, text, text
) from public;

grant execute on function public.save_persona(
  text, text, text, text, text, jsonb, date,
  text, text, text, text, text, text, text, text
) to authenticated;

-- ---------------------------------------------------------------------------
-- 5. The catalog, its RPCs and the profile column
-- ---------------------------------------------------------------------------

drop function if exists public.review_interest(uuid, public.interest_status);
drop function if exists public.register_custom_interests(text[]);
drop table if exists public.interest_catalog;
drop function if exists public.set_interest_normalized();
drop function if exists public.normalize_interest_label(text);
drop type if exists public.interest_status;

alter table public.profiles drop constraint if exists profiles_interests_length;
alter table public.profiles drop column if exists interests;

-- Recompute search text now that interests are gone from it.
update public.profiles
set search_text = public.profile_search_text(
  display_name,
  city,
  country_code,
  headline,
  languages
);

-- ---------------------------------------------------------------------------
-- 6. Notification types: drop interest.approved / interest.rejected
--    (Postgres cannot remove enum values, so the type is rebuilt.)
-- ---------------------------------------------------------------------------

delete from public.notifications where type::text in ('interest.approved', 'interest.rejected');

alter type public.notification_type rename to notification_type_old;

create type public.notification_type as enum (
  'post.removed',
  'post.restored',
  'appeal.declined',
  'persona.approved',
  'persona.rejected',
  'persona.suspended'
);

alter table public.notifications
  alter column type type public.notification_type
  using type::text::public.notification_type;

drop type public.notification_type_old;

-- ---------------------------------------------------------------------------
-- 7. The `interests.review` capability
-- ---------------------------------------------------------------------------

update public.admin_roles
set capabilities = pg_catalog.array_remove(capabilities, 'interests.review')
where 'interests.review' = any (capabilities);

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
    or public.has_capability('comments.moderate')
    or public.has_capability('members.review')
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
