-- ============================================================================
-- RLS suite — run with `supabase test db` (pgTAP)
--
-- Asserts PRD §7 rules against the seeded dev data (supabase/seed.sql). User
-- UUIDs are the deterministic ones from that file.
-- ============================================================================

begin;

create extension if not exists pgtap with schema extensions;

select plan(40);

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
-- Relative so a database mutated by the app (e2e onboarding) does not break it.
select ok(
  (select count(*) from public.contact_details) >= 4,
  'admin reads all contact_details'
);
reset role;

-- 9. a non-admin cannot insert a marketplace product.
set local role authenticated;
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
select throws_ok(
  $$ insert into public.marketplace_products (name) values ('Hacked product') $$,
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
  $$ insert into public.marketplace_products (name, created_by)
     values ('Admin draft', '11111111-1111-1111-1111-111111111111') $$,
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

-- ============================================================================
-- Audit follow-ups (docs/plan/api-layer/s1-audit-fixes.md)
-- ============================================================================

-- 18. F-1: a requester cannot accept their own request.
set local role authenticated;
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
insert into public.connections (requester_id, recipient_id, status)
values ('22222222-2222-2222-2222-222222222222', '66666666-6666-6666-6666-666666666666', 'requested');
select throws_ok(
  $$ update public.connections set status = 'accepted'
     where requester_id = '22222222-2222-2222-2222-222222222222'
       and recipient_id = '66666666-6666-6666-6666-666666666666' $$,
  42501,
  null,
  'requester cannot accept their own request'
);
reset role;

-- 19. F-1: a requester cannot swap the other party.
set local role authenticated;
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
update public.connections
  set recipient_id = '66666666-6666-6666-6666-666666666666'
  where id = 'c0000000-0000-0000-0000-000000000003';
reset role;
select is(
  (select recipient_id from public.connections where id = 'c0000000-0000-0000-0000-000000000003'),
  '55555555-5555-5555-5555-555555555555'::uuid,
  'requester cannot change the other party'
);

-- 20. F-1: the recipient can accept a request.
set local role authenticated;
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
select lives_ok(
  $$ update public.connections set status = 'accepted'
     where id = 'c0000000-0000-0000-0000-000000000002' $$,
  'recipient can accept a request'
);
reset role;

-- 21. F-1: the recipient cannot re-request a declined connection.
set local role authenticated;
set local request.jwt.claims = '{"sub":"55555555-5555-5555-5555-555555555555","role":"authenticated"}';
select throws_ok(
  $$ update public.connections set status = 'requested'
     where id = 'c0000000-0000-0000-0000-000000000003' $$,
  42501,
  null,
  'recipient cannot re-request a declined connection'
);
reset role;

-- 22. F-1: the requester can re-request a declined connection (FR-5.6).
set local role authenticated;
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
select lives_ok(
  $$ update public.connections set status = 'requested'
     where id = 'c0000000-0000-0000-0000-000000000003' $$,
  'requester can re-request after a decline'
);
reset role;

-- 23. F-2: are_connected() is not an oracle for arbitrary pairs.
set local role authenticated;
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
select is(
  public.are_connected('33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444'),
  false,
  'are_connected is false for a pair that excludes the caller'
);

-- 24. F-2: …but still true for the caller's own accepted connection.
select is(
  public.are_connected('22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444'),
  true,
  'are_connected is true for the caller accepted connection'
);
reset role;

-- 25. F-3: an author can soft-remove their own post (FR-6.5).
set local role authenticated;
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
select lives_ok(
  $$ update public.posts set moderation_status = 'removed'
     where id = 'a0000000-0000-0000-0000-000000000001' $$,
  'author can soft-remove their own post'
);

-- 26. F-3: …but cannot un-remove it.
select throws_ok(
  $$ update public.posts set moderation_status = 'visible'
     where id = 'a0000000-0000-0000-0000-000000000001' $$,
  42501,
  null,
  'author cannot un-remove a post'
);
reset role;

-- 27. CA-1: age is derived from the private date of birth.
set local role authenticated;
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
select is(
  public.profile_age('22222222-2222-2222-2222-222222222222'),
  27,
  'profile_age derives the seeded age'
);
reset role;

-- 28. CA-1: date_of_birth is no longer a public column.
select hasnt_column(
  'public', 'profiles', 'date_of_birth',
  'date_of_birth is not exposed on profiles'
);

-- 29. F-9: anon cannot read the feed.
set local role anon;
set local request.jwt.claims = '{}';
select is_empty(
  $$ select 1 from public.posts $$,
  'anon cannot read posts'
);
reset role;

-- 30. F-9: an approved user cannot promote themselves to admin.
set local role authenticated;
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
update public.profiles set role = 'admin'
  where id = '22222222-2222-2222-2222-222222222222';
reset role;
select is(
  (select role::text from public.profiles where id = '22222222-2222-2222-2222-222222222222'),
  'user',
  'approved user cannot self-promote to admin'
);

-- 31. F-9: an admin can approve a pending profile.
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
select lives_ok(
  $$ update public.profiles set approval_status = 'approved', reviewed_at = now()
     where id = '77777777-7777-7777-7777-777777777777' $$,
  'admin can approve a pending profile'
);

-- 32. F-9: an approved user can read published product images.
select isnt_empty(
  $$ select 1 from public.marketplace_product_images
     where product_id = 'b0000000-0000-0000-0000-000000000001' $$,
  'approved user reads published product images'
);
reset role;

-- 33. SB-1c: a rejected user can resubmit (rejected -> pending).
set local role authenticated;
set local request.jwt.claims = '{"sub":"99999999-9999-9999-9999-999999999999","role":"authenticated"}';
select lives_ok(
  $$ update public.profiles set approval_status = 'pending', submitted_at = now()
     where id = '99999999-9999-9999-9999-999999999999' $$,
  'rejected user can resubmit'
);

-- 34. SB-1c: an approved user cannot move themselves back to pending.
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
update public.profiles set approval_status = 'pending'
  where id = '22222222-2222-2222-2222-222222222222';
reset role;
select is(
  (select approval_status::text from public.profiles where id = '22222222-2222-2222-2222-222222222222'),
  'approved',
  'approved user cannot move back to pending'
);

-- 35. F-S2-5: save_persona rejects an unauthenticated caller.
set local role anon;
set local request.jwt.claims = '{}';
select throws_ok(
  $$ select public.save_persona('X','ES','X','bio text','en','[]'::jsonb,
       array['architecture','literature','hikingNature'], null, null, null, null, null, null, null) $$,
  42501,
  null,
  'save_persona rejects anonymous callers'
);
reset role;

-- 36. F-S2-5: save_persona resubmits a rejected profile atomically -> pending.
update public.profiles set approval_status = 'rejected'
  where id = '99999999-9999-9999-9999-999999999999';
set local role authenticated;
set local request.jwt.claims = '{"sub":"99999999-9999-9999-9999-999999999999","role":"authenticated"}';
select results_eq(
  $$ select public.save_persona('Rejected Applicant','PT','Lisbon','New bio text.','en',
       '[]'::jsonb, array['architecture','literature','hikingNature'], '1993-09-14',
       '+351 912 000 000', '@tg', '@x', null, null, null)::text $$,
  $$ values ('pending') $$,
  'save_persona resubmits a rejected profile to pending'
);
reset role;

-- 37. F-S2-5: save_persona keeps an approved profile approved.
set local role authenticated;
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
select results_eq(
  $$ select public.save_persona('Sofia Martinez','ES','Barcelona','Updated bio.','en',
       '[]'::jsonb, array['architecture','literature','hikingNature'], null,
       null, null, '@s', null, null, null)::text $$,
  $$ values ('approved') $$,
  'save_persona keeps an approved profile approved'
);
reset role;

-- 38. S3.0: anon cannot read storage objects (no policy -> fail closed).
set local role anon;
set local request.jwt.claims = '{}';
select is_empty(
  $$ select 1 from storage.objects $$,
  'anon sees no storage objects'
);
reset role;

-- 39. S4: save_persona persists the avatar path, and keeps it when omitted.
set local role authenticated;
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
select public.save_persona('Sofia Martinez','ES','Barcelona','Updated bio.','en',
  '[]'::jsonb, array['architecture','literature','hikingNature'], null,
  null, null, '@s', null, null, null,
  '22222222-2222-2222-2222-222222222222/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa.jpg');
select public.save_persona('Sofia Martinez','ES','Barcelona','Updated bio.','en',
  '[]'::jsonb, array['architecture','literature','hikingNature'], null,
  null, null, '@s', null, null, null);
select is(
  (select avatar_url from public.profiles where id = '22222222-2222-2222-2222-222222222222'),
  '22222222-2222-2222-2222-222222222222/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa.jpg',
  'save_persona persists the avatar path and keeps it when omitted'
);
reset role;

-- 40. S4: save_persona refuses an avatar path outside the caller's folder.
set local role authenticated;
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
select throws_ok(
  $$ select public.save_persona('Sofia Martinez','ES','Barcelona','Updated bio.','en',
       '[]'::jsonb, array['architecture','literature','hikingNature'], null,
       null, null, '@s', null, null, null,
       '33333333-3333-3333-3333-333333333333/stolen.jpg') $$,
  22023,
  null,
  'save_persona rejects an avatar path outside the caller folder'
);
reset role;

select * from finish();

rollback;
