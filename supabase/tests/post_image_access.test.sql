-- ============================================================================
-- Post image access — run with `supabase test db` (pgTAP)
--
-- Seed ids: admin 1111, sofia 2222, mateo 3333, pending 7777.
-- The policy must follow the post, not the viewer: removed media is unreadable
-- to everyone except the author (who may still restore the post).
-- ============================================================================

begin;

create extension if not exists pgtap with schema extensions;

select plan(7);

-- Fixtures: a visible seed post (a000…0001, authored by sofia) and a removed
-- post by the same author with its own image.
insert into public.posts (id, author_id, caption, moderation_status, removed_by, removed_at)
values (
  'a0000000-0000-0000-0000-00000000f001',
  '22222222-2222-2222-2222-222222222222',
  'Removed post used by the storage suite.',
  'removed',
  '11111111-1111-1111-1111-111111111111',
  now()
);

insert into public.post_images (post_id, storage_path, sort)
values (
  'a0000000-0000-0000-0000-00000000f001',
  '22222222-2222-2222-2222-222222222222/removed.jpg',
  0
);

insert into storage.objects (bucket_id, name)
values
  ('post-images', 'seed/sofia-terrace.jpg'),
  ('post-images', '22222222-2222-2222-2222-222222222222/removed.jpg');

-- The author keeps access to both, so she can restore or delete the post.
set local role authenticated;
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
select isnt_empty(
  $$ select 1 from storage.objects where bucket_id = 'post-images' and name = 'seed/sofia-terrace.jpg' $$,
  'the author reads a visible post image'
);
select isnt_empty(
  $$ select 1 from storage.objects where bucket_id = 'post-images' and name = '22222222-2222-2222-2222-222222222222/removed.jpg' $$,
  'the author reads her own removed post image'
);
reset role;

-- Another member only sees the visible post.
set local role authenticated;
set local request.jwt.claims = '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}';
select isnt_empty(
  $$ select 1 from storage.objects where bucket_id = 'post-images' and name = 'seed/sofia-terrace.jpg' $$,
  'a member reads a visible post image'
);
select is_empty(
  $$ select 1 from storage.objects where bucket_id = 'post-images' and name = '22222222-2222-2222-2222-222222222222/removed.jpg' $$,
  'a member cannot read a removed post image'
);
reset role;

-- Admins get no exception: the client asked that removed media stays unreadable.
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
select is_empty(
  $$ select 1 from storage.objects where bucket_id = 'post-images' and name = '22222222-2222-2222-2222-222222222222/removed.jpg' $$,
  'an admin cannot read a removed post image'
);
reset role;

-- Pending accounts are still locked out by the approval check.
set local role authenticated;
set local request.jwt.claims = '{"sub":"77777777-7777-7777-7777-777777777777","role":"authenticated"}';
select is_empty(
  $$ select 1 from storage.objects where bucket_id = 'post-images' $$,
  'a pending member reads no post images'
);
reset role;

-- The permissive policy from S3 is gone.
select ok(
  not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'post_images_select_approved'
  ),
  'the viewer-only policy is dropped'
);

select * from finish();
rollback;
