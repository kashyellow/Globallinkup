-- ============================================================================
-- RLS suite — run with `supabase test db` (pgTAP)
--
-- Asserts PRD §7 rules against the seeded dev data (supabase/seed.sql). User
-- UUIDs are the deterministic ones from that file.
-- ============================================================================

begin;

create extension if not exists pgtap with schema extensions;

select plan(17);

-- Fixed ids from the seed.
--   admin   11111111-…  sofia 22222222-…  mateo 33333333-…
--   camila  44444444-…  lucas 55555555-…  elena 66666666-…
--   pending 77777777-…

-- 1. anon cannot read protected contact details.
set local role anon;
set local request.jwt.claims = '{}';
select is_empty(
  $$ select 1 from public.contact_details $$,
  'anon sees no contact_details'
);
reset role;

-- 2. anon cannot read profiles.
set local role anon;
set local request.jwt.claims = '{}';
select is_empty(
  $$ select 1 from public.profiles $$,
  'anon sees no profiles'
);
reset role;

-- 3. a pending user cannot read the feed.
set local role authenticated;
set local request.jwt.claims = '{"sub":"77777777-7777-7777-7777-777777777777","role":"authenticated"}';
select is_empty(
  $$ select 1 from public.posts $$,
  'pending user cannot read the feed'
);
reset role;

-- 4. …but a pending user can still read their own profile (needed by /verify).
set local role authenticated;
set local request.jwt.claims = '{"sub":"77777777-7777-7777-7777-777777777777","role":"authenticated"}';
select is(
  (select approval_status::text from public.profiles where id = '77777777-7777-7777-7777-777777777777'),
  'pending',
  'pending user can read their own profile row'
);
reset role;

-- 5. owner can read their own contact details.
set local role authenticated;
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
select isnt_empty(
  $$ select 1 from public.contact_details where profile_id = '22222222-2222-2222-2222-222222222222' $$,
  'owner reads own contact_details'
);
reset role;

-- 6. an accepted connection can read the other side's contact details.
set local role authenticated;
set local request.jwt.claims = '{"sub":"44444444-4444-4444-4444-444444444444","role":"authenticated"}';
select isnt_empty(
  $$ select 1 from public.contact_details where profile_id = '22222222-2222-2222-2222-222222222222' $$,
  'accepted connection reads the other side contact_details'
);
reset role;

-- 7. a declined connection cannot.
set local role authenticated;
set local request.jwt.claims = '{"sub":"55555555-5555-5555-5555-555555555555","role":"authenticated"}';
select is_empty(
  $$ select 1 from public.contact_details where profile_id = '22222222-2222-2222-2222-222222222222' $$,
  'declined connection cannot read contact_details'
);
reset role;

-- 8. admin reads every contact_details row (4 seeded).
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
select results_eq(
  $$ select count(*) from public.contact_details $$,
  $$ values (4::bigint) $$,
  'admin reads all contact_details'
);
reset role;

-- 9. a non-admin cannot insert a marketplace product.
set local role authenticated;
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
select throws_ok(
  $$ insert into public.marketplace_products (name, category) values ('Hacked product', 'travelGear') $$,
  42501,
  null,
  'non-admin cannot insert a marketplace product'
);
reset role;

-- 10. a non-admin cannot update a marketplace product (row is filtered out).
set local role authenticated;
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
update public.marketplace_products
  set name = 'Hacked'
  where id = 'b0000000-0000-0000-0000-000000000001';
reset role;
select is(
  (select name from public.marketplace_products where id = 'b0000000-0000-0000-0000-000000000001'),
  'Handmade Oaxacan Leather Travel Bag',
  'non-admin cannot update a marketplace product'
);

-- 11. an admin can insert a marketplace product.
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
select lives_ok(
  $$ insert into public.marketplace_products (name, category, created_by)
     values ('Admin draft', 'localGoods', '11111111-1111-1111-1111-111111111111') $$,
  'admin can insert a marketplace product'
);
reset role;

-- 12. a reversed duplicate connection pair is rejected by the unique index.
select throws_ok(
  $$ insert into public.connections (requester_id, recipient_id)
     values ('44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222') $$,
  23505,
  null,
  'duplicate unordered connection pair is rejected'
);

-- 13. a self-connection is rejected by the check constraint.
select throws_ok(
  $$ insert into public.connections (requester_id, recipient_id)
     values ('22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222') $$,
  23514,
  null,
  'self-connection is rejected'
);

-- A report filed by Elena, for the cross-reporter read test below.
insert into public.reports (reporter_id, target_type, target_user_id, reason)
values ('66666666-6666-6666-6666-666666666666', 'user', '33333333-3333-3333-3333-333333333333', 'seed report');

-- 14. a reporter can read their own report.
set local role authenticated;
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
insert into public.reports (reporter_id, target_type, target_post_id, reason)
values ('22222222-2222-2222-2222-222222222222', 'post', 'a0000000-0000-0000-0000-000000000001', 'spam');
select isnt_empty(
  $$ select 1 from public.reports where reporter_id = '22222222-2222-2222-2222-222222222222' $$,
  'reporter reads their own report'
);
reset role;

-- 15. …but cannot read another user's report.
set local role authenticated;
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
select is_empty(
  $$ select 1 from public.reports where reporter_id = '66666666-6666-6666-6666-666666666666' $$,
  'reporter cannot read another user report'
);
reset role;

-- 16. a pending user cannot self-approve (privilege guard trigger).
set local role authenticated;
set local request.jwt.claims = '{"sub":"77777777-7777-7777-7777-777777777777","role":"authenticated"}';
update public.profiles
  set approval_status = 'approved'
  where id = '77777777-7777-7777-7777-777777777777';
reset role;
select is(
  (select approval_status::text from public.profiles where id = '77777777-7777-7777-7777-777777777777'),
  'pending',
  'pending user cannot self-approve'
);

-- 17. an approved user can edit their own public fields without losing approval.
set local role authenticated;
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
update public.profiles
  set bio_en = 'Updated from the profile editor.'
  where id = '22222222-2222-2222-2222-222222222222';
reset role;
select results_eq(
  $$ select bio_en, approval_status::text from public.profiles where id = '22222222-2222-2222-2222-222222222222' $$,
  $$ values ('Updated from the profile editor.', 'approved') $$,
  'approved user edits own public fields and stays approved'
);

select * from finish();

rollback;
