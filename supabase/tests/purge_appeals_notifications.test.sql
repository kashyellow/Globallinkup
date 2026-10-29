-- ============================================================================
-- Purge, appeals and notifications — run with `supabase test db` (pgTAP)
--
-- Seed ids: admin 1111, sofia 2222, mateo 3333.
-- ============================================================================

begin;

create extension if not exists pgtap with schema extensions;

select plan(9);

-- Fixtures -------------------------------------------------------------------
insert into public.posts (id, author_id, caption, state, removed_by, removed_at, removed_reason, purge_after)
values (
  'a0000000-0000-0000-0000-00000000d001',
  '22222222-2222-2222-2222-222222222222',
  'Removed post used by the purge suite.',
  'removed',
  '11111111-1111-1111-1111-111111111111',
  now() - interval '15 days',
  'Removed by the purge suite.',
  now() - interval '1 day'
);

insert into public.post_images (post_id, storage_path, sort)
values ('a0000000-0000-0000-0000-00000000d001', 'seed/purge-me.jpg', 0);

insert into public.post_comments (id, post_id, author_id, body, deleted_at)
values (
  'c0000000-0000-0000-0000-00000000d001',
  'a0000000-0000-0000-0000-000000000001',
  '33333333-3333-3333-3333-333333333333',
  'Comment body that should be purged.',
  now() - interval '15 days'
);

insert into public.notifications (recipient_id, type, expires_at)
values
  ('22222222-2222-2222-2222-222222222222', 'post.removed', now() - interval '1 day'),
  ('22222222-2222-2222-2222-222222222222', 'post.removed', now() + interval '10 days');

-- Appeals --------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
select lives_ok(
  $$ insert into public.post_appeals (post_id, author_id, message)
     values ('a0000000-0000-0000-0000-00000000d001', '22222222-2222-2222-2222-222222222222', 'This was a misunderstanding, please review.') $$,
  'the author files one appeal'
);
select throws_ok(
  $$ insert into public.post_appeals (post_id, author_id, message)
     values ('a0000000-0000-0000-0000-00000000d001', '22222222-2222-2222-2222-222222222222', 'Second attempt at the same post.') $$,
  '23505',
  null,
  'only one open appeal per post'
);
reset role;

-- Another member cannot read the appeal.
set local role authenticated;
set local request.jwt.claims = '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}';
select is_empty(
  $$ select 1 from public.post_appeals $$,
  'another member reads no appeals'
);
reset role;

-- Notifications are recipient-only.
set local role authenticated;
set local request.jwt.claims = '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}';
select is_empty(
  $$ select 1 from public.notifications $$,
  'a member reads only their own notifications'
);
reset role;

set local role authenticated;
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
select ok(
  (select count(*) from public.notifications) = 2,
  'the recipient reads their notifications'
);
reset role;

-- Purge ----------------------------------------------------------------------
select is(
  (public.purge_expired_content(true) ->> 'posts')::integer,
  1,
  'a dry run reports the expired post'
);
select ok(
  exists (select 1 from public.posts where id = 'a0000000-0000-0000-0000-00000000d001'),
  'a dry run keeps the post'
);

select is(
  (public.purge_expired_content(false) ->> 'comments')::integer,
  1,
  'the purge blanks one comment body'
);
select ok(
  not exists (select 1 from public.posts where id = 'a0000000-0000-0000-0000-00000000d001')
    and (select body from public.post_comments where id = 'c0000000-0000-0000-0000-00000000d001') is null
    and (select purged_at from public.post_comments where id = 'c0000000-0000-0000-0000-00000000d001') is not null
    and (select count(*) from public.notifications) = 1,
  'the real run deletes the post, blanks the body and drops expired notifications'
);

select * from finish();
rollback;
