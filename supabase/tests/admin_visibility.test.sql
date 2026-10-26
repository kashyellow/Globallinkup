-- ============================================================================
-- Admin invisibility — run with `supabase test db` (pgTAP)
--
-- Admins are operators, not members: their profiles must never reach a regular
-- member, while their announcements stay on the feed with a masked author.
--
-- Fixed ids from the seed (supabase/seed.sql):
--   admin     11111111-…   sofia  22222222-…   camila 44444444-…
--   suspended abababab-…
-- ============================================================================

begin;

create extension if not exists pgtap with schema extensions;

select plan(10);

-- ----------------------------------------------------------------------------
-- A regular member cannot see the admin anywhere people are listed.
-- ----------------------------------------------------------------------------

set local role authenticated;
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
select is_empty(
  $$ select 1 from public.profiles where id = '11111111-1111-1111-1111-111111111111' $$,
  'member cannot read an admin profile row'
);
reset role;

set local role authenticated;
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
select is_empty(
  $$ select 1 from public.profiles_public where role = 'admin' $$,
  'member sees no admin rows in profiles_public'
);
reset role;

-- Regression: narrowing the policy must not hide ordinary members.
set local role authenticated;
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
select isnt_empty(
  $$ select 1 from public.profiles_public where id = '44444444-4444-4444-4444-444444444444' $$,
  'member still reads other approved members'
);
reset role;

-- A crafted insert must not open a connection that would unlock contact info.
set local role authenticated;
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
select throws_ok(
  $$
    insert into public.connections (requester_id, recipient_id, status)
    values ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'requested')
  $$,
  '42501',
  null,
  'member cannot request a connection to an admin'
);
reset role;

-- ----------------------------------------------------------------------------
-- Admins keep full visibility, including their own row.
-- ----------------------------------------------------------------------------

set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
select ok(
  (select count(*) from public.profiles) >= 4,
  'admin still reads every profile row'
);
reset role;

set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
select is(
  (select role::text from public.profiles where id = '11111111-1111-1111-1111-111111111111'),
  'admin',
  'admin reads their own profile row'
);
reset role;

set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
select ok(
  (select count(*) from public.profiles_public where role = 'admin') >= 1,
  'admin sees admin rows in profiles_public'
);
reset role;

-- ----------------------------------------------------------------------------
-- Announcements: an admin post stays on the feed, author masked.
-- ----------------------------------------------------------------------------

insert into public.posts (id, author_id, caption, moderation_status)
values
  (
    'a0000000-0000-0000-0000-00000000ad01',
    '11111111-1111-1111-1111-111111111111',
    'Platform announcement used by the RLS suite.',
    'visible'
  ),
  (
    'a0000000-0000-0000-0000-00000000ab01',
    'abababab-abab-abab-abab-abababababab',
    'Post from a suspended author used by the RLS suite.',
    'visible'
  );

set local role authenticated;
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
select isnt_empty(
  $$ select 1 from public.posts_feed where id = 'a0000000-0000-0000-0000-00000000ad01' $$,
  'admin announcement stays in the feed'
);
reset role;

set local role authenticated;
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
select is(
  (select author_name from public.posts_feed where id = 'a0000000-0000-0000-0000-00000000ad01'),
  null::text,
  'admin author is masked in the feed'
);
reset role;

-- Regression: the LEFT JOIN must not resurrect posts from suspended authors.
set local role authenticated;
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
select is_empty(
  $$ select 1 from public.posts_feed where id = 'a0000000-0000-0000-0000-00000000ab01' $$,
  'posts from suspended authors stay hidden'
);
reset role;

select * from finish();
rollback;
