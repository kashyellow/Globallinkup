-- ============================================================================
-- Global countries (ADR 0007) — run with `supabase test db` (pgTAP)
--
-- The platform accepts any ISO-3166-1 alpha-2 code; the database guards the
-- shape and the region filter is derived from approved members.
-- ============================================================================

begin;

create extension if not exists pgtap with schema extensions;

select plan(4);

-- Counts cover exactly the approved members (admins and pending users excluded).
select is(
  (select coalesce(sum(member_count), 0)::integer from public.discover_countries()),
  (
    select count(*)::integer
    from public.profiles p
    where p.approval_status = 'approved'
      and p.role = 'user'
      and p.country_code is not null
  ),
  'discover_countries counts exactly the approved members'
);

-- The check constraint keeps codes upper-case and two letters wide.
select throws_ok(
  $$ update public.profiles set country_code = 'es' where id = '22222222-2222-2222-2222-222222222222' $$,
  '23514',
  null,
  'lower-case country codes are rejected'
);

select throws_ok(
  $$ update public.profiles set country_code = 'ESP' where id = '22222222-2222-2222-2222-222222222222' $$,
  '23514',
  null,
  'country codes longer than two letters are rejected'
);

-- The aggregate is for signed-in members only.
set local role anon;
set local request.jwt.claims = '{}';
select throws_ok(
  $$ select * from public.discover_countries() $$,
  '42501',
  null,
  'anon cannot call discover_countries'
);
reset role;

select * from finish();
rollback;
