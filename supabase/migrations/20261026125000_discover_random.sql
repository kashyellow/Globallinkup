-- ============================================================================
-- Discover: seeded shuffle
--
-- A per-session seed gives the directory a lively random order while keeping
-- load-more correct: the same seed produces the same order across pages, so a
-- page two never duplicates or skips a row. A new search/filter generates a new
-- seed and therefore a fresh ordering.
--
-- security_invoker keeps profiles RLS in charge; the caller cannot request
-- another member's private fields through this function.
-- ============================================================================

create or replace function public.discover_personas(
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
  interests text[],
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
      p.interests,
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
    f.interests,
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
