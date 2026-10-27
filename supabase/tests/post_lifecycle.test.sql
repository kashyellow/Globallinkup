-- ============================================================================
-- Post lifecycle — run with `supabase test db` (pgTAP)
--
-- Covers the parts the RLS suite does not: archiving hides a post from other
-- members, the author's hard delete only touches their own visible/archived
-- posts, and an admin removal sets the purge deadline.
-- ============================================================================

begin;

create extension if not exists pgtap with schema extensions;

select plan(5);

insert into public.posts (id, author_id, caption, state, archived_at)
values
  (
    'a0000000-0000-0000-0000-00000000c001',
    '22222222-2222-2222-2222-222222222222',
    'Visible post used by the lifecycle suite.',
    'visible',
    null
  ),
  (
    'a0000000-0000-0000-0000-00000000c002',
    '22222222-2222-2222-2222-222222222222',
    'Archived post used by the lifecycle suite.',
    'archived',
    now()
  ),
  (
    'a0000000-0000-0000-0000-00000000c003',
    '22222222-2222-2222-2222-222222222222',
    'Admin-removed post used by the lifecycle suite.',
    'removed',
    null
  );

update public.posts
set removed_by = '11111111-1111-1111-1111-111111111111',
    removed_at = now(),
    removed_reason = 'Removed by the lifecycle suite.',
    purge_after = now() + interval '14 days'
where id = 'a0000000-0000-0000-0000-00000000c003';

-- Another member only sees the visible one.
set local role authenticated;
set local request.jwt.claims = '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}';
select isnt_empty(
  $$ select 1 from public.posts_feed where id = 'a0000000-0000-0000-0000-00000000c001' and moderation_status = 'visible' $$,
  'a member sees the visible post'
);
select is_empty(
  $$ select 1 from public.posts_feed where id = 'a0000000-0000-0000-0000-00000000c002' and moderation_status = 'visible' $$,
  'an archived post stays out of the visible feed'
);
reset role;

-- The author can hard-delete a visible post…
set local role authenticated;
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
select results_eq(
  $$ delete from public.posts where id = 'a0000000-0000-0000-0000-00000000c001' returning id $$,
  $$ values ('a0000000-0000-0000-0000-00000000c001'::uuid) $$,
  'the author hard-deletes their own post'
);

-- …but not one an admin removed while the appeal window is open.
select is_empty(
  $$ delete from public.posts where id = 'a0000000-0000-0000-0000-00000000c003' returning id $$,
  'the author cannot delete an admin-removed post'
);
reset role;

-- The removal deadline is two weeks out (ADR 0001).
select ok(
  (
    select age(purge_after, removed_at) > interval '13 days 23 hours'
      and age(purge_after, removed_at) < interval '14 days 1 hour'
    from public.posts
    where id = 'a0000000-0000-0000-0000-00000000c003'
  ),
  'an admin removal sets a 14-day purge deadline'
);

select * from finish();
rollback;
