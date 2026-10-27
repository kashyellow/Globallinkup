-- ============================================================================
-- Global country coverage (ADR 0007)
--
-- Registration is no longer limited to the nine-country list that used to live
-- in code. The app validates membership against ISO-3166-1; the database guards
-- the shape so a direct write cannot store junk.
--
-- `discover_countries()` powers the region filter: it only offers countries that
-- actually have approved members, so the list grows and shrinks with the data
-- instead of needing a deploy.
-- ============================================================================

alter table public.profiles
  add constraint profiles_country_code_format
  check (country_code is null or country_code ~ '^[A-Z]{2}$');

create or replace function public.discover_countries()
returns table (country_code text, member_count integer)
language sql
security definer
stable
set search_path = ''
as $$
  select p.country_code, pg_catalog.count(*)::integer
  from public.profiles p
  where p.approval_status = 'approved'
    and p.role = 'user'
    and p.country_code is not null
  group by p.country_code
  order by pg_catalog.count(*) desc, p.country_code;
$$;

comment on function public.discover_countries() is
  'Approved-member counts per country, for the discover region filter.';

-- Supabase grants EXECUTE on new `public` functions to anon/authenticated by
-- default, so `revoke ... from public` alone is not enough: name anon explicitly.
revoke all on function public.discover_countries() from public, anon;
grant execute on function public.discover_countries() to authenticated, service_role;

-- Same hygiene for the policy helpers added with admin invisibility: policies
-- are `to authenticated`, so anon has no reason to call them.
revoke execute on function public.is_visible_member(uuid) from anon;
revoke execute on function public.is_admin_author(uuid) from anon;
