-- ============================================================================
-- Admin social limits — run with `supabase test db` (pgTAP)
--
-- Admins may comment on announcements/posts, but cannot like or join the
-- connection graph. The persona write path rejects them too.
-- Seed ids: admin 1111, sofia 2222, lucas 5555.
-- ============================================================================

begin;

create extension if not exists pgtap with schema extensions;

select plan(5);

-- Likes are member-only ------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
select throws_ok(
  $$ insert into public.post_likes (post_id, user_id)
     values ('a0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111') $$,
  '42501',
  null,
  'an admin cannot like a post'
);

select throws_ok(
  $$ insert into public.reports (reporter_id, target_type, target_post_id, reason)
     values (
       '11111111-1111-1111-1111-111111111111',
       'post',
       'a0000000-0000-0000-0000-000000000001',
       'spam'
     ) $$,
  '42501',
  null,
  'an admin cannot file a member report'
);
reset role;

set local role authenticated;
set local request.jwt.claims = '{"sub":"55555555-5555-5555-5555-555555555555","role":"authenticated"}';
select lives_ok(
  $$ insert into public.post_likes (post_id, user_id)
     values ('a0000000-0000-0000-0000-000000000006', '55555555-5555-5555-5555-555555555555')
     on conflict do nothing $$,
  'a member can still like a post'
);
reset role;

-- Comments stay open to admins ----------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
select lives_ok(
  $$ insert into public.post_comments (post_id, author_id, body)
     values ('a0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Admin note') $$,
  'an admin can still comment'
);

-- Persona writes are member-only --------------------------------------------
select throws_ok(
  $$ select public.save_persona('Admin persona', 'ID', 'Jakarta', p_whatsapp => '+628123456789') $$,
  '42501',
  null,
  'an admin cannot write a persona'
);
reset role;

select * from finish();
rollback;
