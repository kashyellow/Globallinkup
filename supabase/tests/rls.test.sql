-- ============================================================================
-- RLS suite — run with `supabase test db` (pgTAP)
--
-- Asserts PRD §7 rules against the seeded dev data (supabase/seed.sql). User
-- UUIDs are the deterministic ones from that file.
-- ============================================================================

begin;

create extension if not exists pgtap with schema extensions;

select plan(95);

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

-- 8. admins cannot read contact_details or date of birth (ADR 0005).
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
select is_empty(
  $$ select 1 from public.contact_details where profile_id = '22222222-2222-2222-2222-222222222222' $$,
  'admin cannot read a member''s contact_details'
);
select is_empty(
  $$ select 1 from public.profile_private where profile_id = '22222222-2222-2222-2222-222222222222' $$,
  'admin cannot read a member''s date of birth'
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
values ('66666666-6666-6666-6666-666666666666', 'user', '33333333-3333-3333-3333-333333333333', 'other');

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
set local request.jwt.claims = '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}';
insert into public.connections (requester_id, recipient_id, status)
values ('33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'requested');
select throws_ok(
  $$ update public.connections set status = 'accepted'
     where requester_id = '33333333-3333-3333-3333-333333333333'
       and recipient_id = '44444444-4444-4444-4444-444444444444' $$,
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

-- 25. F-3: an author can archive their own post (ADR 0001).
set local role authenticated;
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
select lives_ok(
  $$ update public.posts set state = 'archived'
     where id = 'a0000000-0000-0000-0000-000000000001' $$,
  'author can archive their own post'
);

-- 26. …but removal is an admin decision; the author cannot set it.
select throws_ok(
  $$ update public.posts set state = 'removed'
     where id = 'a0000000-0000-0000-0000-000000000001' $$,
  42501,
  null,
  'author cannot remove their own post'
);
reset role;

-- 27. An admin removes it, which the rest of the suite relies on.
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
select lives_ok(
  $$ update public.posts
       set state = 'removed',
           removed_by = '11111111-1111-1111-1111-111111111111',
           removed_at = now(),
           removed_reason = 'Removed by the RLS suite.'
     where id = 'a0000000-0000-0000-0000-000000000001' $$,
  'admin can remove a post'
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

-- ============================================================================
-- S6 — moderated cultural-interest catalog
-- ============================================================================

-- 40b. Anonymous visitors see approved suggestions (the persona form renders
-- before sign-up) but never pending rows.
set local role anon;
set local request.jwt.claims = '{}';
select isnt_empty(
  $$ select 1 from public.interest_catalog
     where label = 'Storytelling' and status = 'approved' $$,
  'anon reads approved interest suggestions'
);
select is_empty(
  $$ select 1 from public.interest_catalog where label = 'Bookbinding' $$,
  'anon cannot read pending interests'
);
reset role;

-- 41. An approved member sees approved suggestions, never another member's
-- pending row.
set local role authenticated;
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
select isnt_empty(
  $$ select 1 from public.interest_catalog
     where label = 'Storytelling' and status = 'approved' $$,
  'approved member reads approved interest suggestions'
);
select is_empty(
  $$ select 1 from public.interest_catalog where label = 'Bookbinding' $$,
  'approved member cannot read another member pending interest'
);
reset role;

-- 42. The creator sees their own pending label (the form needs it).
set local role authenticated;
set local request.jwt.claims = '{"sub":"77777777-7777-7777-7777-777777777777","role":"authenticated"}';
select isnt_empty(
  $$ select 1 from public.interest_catalog where label = 'Bookbinding' and status = 'pending' $$,
  'creator reads their own pending interest'
);
reset role;

-- 43. A member cannot append to the global catalog directly.
set local role authenticated;
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
select throws_ok(
  $$ insert into public.interest_catalog (label) values ('Hacked interest') $$,
  42501,
  null,
  'non-admin cannot insert an interest into the catalog'
);
reset role;

-- 44. A member cannot approve/reject, even through the RPC.
set local role authenticated;
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
select throws_ok(
  $$ select public.review_interest('cdcdcdcd-cdcd-cdcd-cdcd-cdcdcdcdcdcd'::uuid, 'approved') $$,
  42501,
  null,
  'non-admin cannot review an interest'
);
reset role;

-- 45. An admin can publish a pending suggestion.
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
select lives_ok(
  $$ select public.review_interest('cdcdcdcd-cdcd-cdcd-cdcd-cdcdcdcdcdcd'::uuid, 'approved') $$,
  'admin approves a pending interest'
);
reset role;
select is(
  (select status::text from public.interest_catalog
    where id = 'cdcdcdcd-cdcd-cdcd-cdcd-cdcdcdcdcdcd'),
  'approved',
  'approved interest status is persisted'
);

-- 45b. Unpublishing an approved interest hides it but keeps it on profiles.
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
select public.review_interest('cdcdcdcd-cdcd-cdcd-cdcd-cdcdcdcdcdcd'::uuid, 'rejected');
reset role;
select is(
  (select status::text from public.interest_catalog
    where id = 'cdcdcdcd-cdcd-cdcd-cdcd-cdcdcdcdcdcd'),
  'rejected',
  'unpublishing an approved interest changes its status'
);
select is(
  (
    select 'Bookbinding' = any(interests)
    from public.profiles
    where id = '77777777-7777-7777-7777-777777777777'
  ),
  true,
  'unpublishing an approved interest keeps it on existing profiles'
);

-- 46. Rejecting a pending interest removes its label from the creator profile.
set local role authenticated;
set local request.jwt.claims = '{"sub":"77777777-7777-7777-7777-777777777777","role":"authenticated"}';
select public.register_custom_interests(array['Zine Making']);
update public.profiles
  set interests = array_append(interests, 'Zine Making')
  where id = '77777777-7777-7777-7777-777777777777';
reset role;

set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
select public.review_interest(
  (select id from public.interest_catalog where label = 'Zine Making'),
  'rejected'
);
reset role;

select is(
  (
    select 'Zine Making' = any(interests)
    from public.profiles
    where id = '77777777-7777-7777-7777-777777777777'
  ),
  false,
  'rejecting a pending interest removes it from the creator profile'
);

-- 47. The fourth new pending suggestion in 24 hours is rate-limited.
set local role authenticated;
set local request.jwt.claims = '{"sub":"66666666-6666-6666-6666-666666666666","role":"authenticated"}';
select public.register_custom_interests(array['Letterpress']);
select public.register_custom_interests(array['Paper Making']);
select public.register_custom_interests(array['Small Press']);
select is(
  public.register_custom_interests(array['Book Arts'])->>'status',
  'rate_limited',
  'fourth new interest in 24 hours is rate-limited'
);
reset role;

-- ============================================================================
-- Phase 0 — post images, comments, product lifecycle, audit, views, discover
-- ============================================================================

-- 48. anon cannot read post galleries.
set local role anon;
set local request.jwt.claims = '{}';
select is_empty(
  $$ select 1 from public.post_images $$,
  'anon sees no post images'
);
reset role;

-- 49. an approved user reads the gallery of a visible post.
set local role authenticated;
set local request.jwt.claims = '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}';
select isnt_empty(
  $$ select 1 from public.post_images
     where post_id = 'a0000000-0000-0000-0000-000000000002' $$,
  'approved user reads a visible post gallery'
);
reset role;

-- 50. a multi-image post returns all three images.
set local role authenticated;
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
select is(
  (
    select count(*)::integer
    from public.post_images
    where post_id = 'a0000000-0000-0000-0000-000000000004'
  ),
  3,
  'multi-image post exposes three images'
);
reset role;

-- 51. a non-author cannot attach an image to someone else's post.
set local role authenticated;
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
select throws_ok(
  $$ insert into public.post_images (post_id, storage_path, sort)
     values ('a0000000-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222/hack.jpg', 9) $$,
  42501,
  null,
  'non-author cannot attach a post image'
);
reset role;

-- 52. the author can attach an image to their own post.
set local role authenticated;
set local request.jwt.claims = '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}';
select lives_ok(
  $$ insert into public.post_images (post_id, storage_path, sort)
     values ('a0000000-0000-0000-0000-000000000002', '33333333-3333-3333-3333-333333333333/extra.jpg', 5) $$,
  'author can attach an image to their own post'
);
reset role;

-- 53. the author keeps access to images on their own removed post.
set local role authenticated;
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
select isnt_empty(
  $$ select 1 from public.post_images
     where post_id = 'a0000000-0000-0000-0000-000000000001' $$,
  'author reads images on their own removed post'
);
reset role;

-- 54. an approved reader sees comments on a visible post.
set local role authenticated;
set local request.jwt.claims = '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}';
select isnt_empty(
  $$ select 1 from public.post_comments
     where post_id = 'a0000000-0000-0000-0000-000000000002' $$,
  'approved reader reads comments on a visible post'
);
reset role;

-- 55. comments on a removed post stay hidden from other members.
set local role authenticated;
set local request.jwt.claims = '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}';
select is_empty(
  $$ select 1 from public.post_comments
     where post_id = 'a0000000-0000-0000-0000-000000000001' $$,
  'other members cannot read comments on a removed post'
);
reset role;

-- 56. the post author still sees the removed post's comments.
set local role authenticated;
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
select isnt_empty(
  $$ select 1 from public.post_comments
     where post_id = 'a0000000-0000-0000-0000-000000000001' $$,
  'author reads comments on their own removed post'
);
reset role;

-- 57. anon cannot read comments.
set local role anon;
set local request.jwt.claims = '{}';
select is_empty(
  $$ select 1 from public.post_comments $$,
  'anon sees no comments'
);
reset role;

-- 58. an approved member can create a root comment.
set local role authenticated;
set local request.jwt.claims = '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}';
select lives_ok(
  $$ insert into public.post_comments (id, post_id, author_id, body)
     values ('d0000000-0000-0000-0000-000000000010',
       'a0000000-0000-0000-0000-000000000002',
       '33333333-3333-3333-3333-333333333333',
       'A root comment for the thread test.') $$,
  'approved member creates a root comment'
);
reset role;

-- 59. a reply to a root comment is allowed.
set local role authenticated;
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
select lives_ok(
  $$ insert into public.post_comments (id, post_id, author_id, parent_id, body)
     values ('d0000000-0000-0000-0000-000000000011',
       'a0000000-0000-0000-0000-000000000002',
       '22222222-2222-2222-2222-222222222222',
       'd0000000-0000-0000-0000-000000000010',
       'A first-level reply.') $$,
  'reply to a root comment is allowed'
);
reset role;

-- 60. replies to replies are rejected.
set local role authenticated;
set local request.jwt.claims = '{"sub":"44444444-4444-4444-4444-444444444444","role":"authenticated"}';
select throws_ok(
  $$ insert into public.post_comments (id, post_id, author_id, parent_id, body)
     values ('d0000000-0000-0000-0000-000000000012',
       'a0000000-0000-0000-0000-000000000002',
       '44444444-4444-4444-4444-444444444444',
       'd0000000-0000-0000-0000-000000000011',
       'A reply to a reply.') $$,
  23514,
  null,
  'comments support only one reply level'
);
reset role;

-- 61. members cannot comment on a removed post.
set local role authenticated;
set local request.jwt.claims = '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}';
select throws_ok(
  $$ insert into public.post_comments (post_id, author_id, body)
     values ('a0000000-0000-0000-0000-000000000001',
       '33333333-3333-3333-3333-333333333333',
       'Comment on a removed post.') $$,
  42501,
  null,
  'member cannot comment on a removed post'
);
reset role;

-- 62. authors cannot delete their own comment; admins can.
set local role authenticated;
set local request.jwt.claims = '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}';
update public.post_comments
  set deleted_at = now()
  where id = 'd0000000-0000-0000-0000-000000000010';
reset role;
select is(
  (select deleted_at from public.post_comments
    where id = 'd0000000-0000-0000-0000-000000000010'),
  null,
  'author cannot soft-delete their own comment'
);

set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
select lives_ok(
  $$ update public.post_comments
     set deleted_at = now()
     where id = 'd0000000-0000-0000-0000-000000000010' $$,
  'admin soft-deletes a comment'
);
reset role;
select isnt_empty(
  $$ select 1 from public.post_comments
     where id = 'd0000000-0000-0000-0000-000000000010' and deleted_at is not null $$,
  'soft-deleted comment keeps its row'
);

-- 63. an admin reads comments on a removed post.
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
select isnt_empty(
  $$ select 1 from public.post_comments
     where post_id = 'a0000000-0000-0000-0000-000000000001' $$,
  'admin reads comments on a removed post'
);
reset role;

-- 64. approved members do not see draft/unpublished/trashed products.
set local role authenticated;
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
select is_empty(
  $$ select 1 from public.marketplace_products
     where catalog_status <> 'live' $$,
  'approved member sees only live products'
);
reset role;

-- 65. the admin sees the trashed product.
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
select isnt_empty(
  $$ select 1 from public.marketplace_products
     where id = 'b0000000-0000-0000-0000-000000000009'
       and catalog_status = 'trashed' $$,
  'admin sees the trashed product'
);
reset role;

-- 66. the generated status derives draft/unpublished/trashed correctly.
select results_eq(
  $$ select catalog_status::text
     from public.marketplace_products
     where id in (
       'b0000000-0000-0000-0000-000000000007',
       'b0000000-0000-0000-0000-000000000008',
       'b0000000-0000-0000-0000-000000000009'
     )
     order by id $$,
  $$ values ('draft'), ('unpublished'), ('trashed') $$,
  'catalog status derives draft, unpublished and trashed'
);

-- 67. a non-admin cannot soft-delete a product.
set local role authenticated;
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
update public.marketplace_products
  set deleted_at = now()
  where id = 'b0000000-0000-0000-0000-000000000001';
reset role;
select is(
  (select deleted_at from public.marketplace_products
    where id = 'b0000000-0000-0000-0000-000000000001'),
  null,
  'non-admin cannot soft-delete a product'
);

-- 68. an admin can soft-delete a product and the status becomes trashed.
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
select lives_ok(
  $$ update public.marketplace_products
     set deleted_at = now()
     where id = 'b0000000-0000-0000-0000-000000000002' $$,
  'admin soft-deletes a product'
);
reset role;
select is(
  (select catalog_status::text from public.marketplace_products
    where id = 'b0000000-0000-0000-0000-000000000002'),
  'trashed',
  'soft-deleted product derives trashed status'
);

-- 69. images for a trashed product disappear from the public catalog.
set local role authenticated;
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
select is_empty(
  $$ select 1 from public.marketplace_product_images
     where product_id = 'b0000000-0000-0000-0000-000000000002' $$,
  'trashed product images are hidden from members'
);
reset role;

-- 70. the member reads their own moderation reason.
set local role authenticated;
set local request.jwt.claims = '{"sub":"99999999-9999-9999-9999-999999999999","role":"authenticated"}';
select isnt_empty(
  $$ select 1 from public.profile_moderation_events
     where profile_id = '99999999-9999-9999-9999-999999999999' $$,
  'member reads their own moderation history'
);
reset role;

-- 71. another member cannot read that reason.
set local role authenticated;
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
select is_empty(
  $$ select 1 from public.profile_moderation_events
     where profile_id = '99999999-9999-9999-9999-999999999999' $$,
  'other members cannot read a moderation reason'
);
reset role;

-- 72. a non-admin cannot insert a moderation event.
set local role authenticated;
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
select throws_ok(
  $$ insert into public.profile_moderation_events (profile_id, admin_id, decision, reason)
     values ('33333333-3333-3333-3333-333333333333',
       '22222222-2222-2222-2222-222222222222',
       'suspended',
       'A non-admin attempt to write a reason.') $$,
  42501,
  null,
  'non-admin cannot insert a moderation event'
);
reset role;

-- 73. an admin can insert a moderation event.
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
select lives_ok(
  $$ insert into public.profile_moderation_events (profile_id, admin_id, decision, reason)
     values ('b3b3b3b3-b3b3-b3b3-b3b3-b3b3b3b3b3b3',
       '11111111-1111-1111-1111-111111111111',
       'approved',
       'Audit insert from the RLS suite.') $$,
  'admin can insert a moderation event'
);
reset role;

-- 74. the feed view hides a removed post from other members.
set local role authenticated;
set local request.jwt.claims = '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}';
select is_empty(
  $$ select 1 from public.posts_feed
     where id = 'a0000000-0000-0000-0000-000000000001' $$,
  'feed view hides a removed post from other members'
);
reset role;

-- 75. the author still sees their own removed post in the view.
set local role authenticated;
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
select isnt_empty(
  $$ select 1 from public.posts_feed
     where id = 'a0000000-0000-0000-0000-000000000001' $$,
  'feed view keeps the author removed post visible to the author'
);
reset role;

-- 76. anon cannot read the feed view.
set local role anon;
set local request.jwt.claims = '{}';
select is_empty(
  $$ select 1 from public.posts_feed $$,
  'anon sees no posts_feed rows'
);
reset role;

-- 77. the feed view exposes the comment count.
set local role authenticated;
set local request.jwt.claims = '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}';
select ok(
  (
    select comment_count >= 2
    from public.posts_feed
    where id = 'a0000000-0000-0000-0000-000000000002'
  ),
  'feed view exposes the comment count'
);
reset role;

-- 78. the seeded discover function returns rows and total count.
set local role authenticated;
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
select ok(
  (
    select count(*) = 5 and max(total_count) >= 10
    from public.discover_personas('', '{}', 'seed-rls', 5, 0)
  ),
  'discover returns a page and a total count'
);
reset role;

-- 79. anon cannot call discover into rows.
set local role anon;
set local request.jwt.claims = '{}';
select is_empty(
  $$ select 1 from public.discover_personas('', '{}', 'seed-rls', 5, 0) $$,
  'anon sees no discover rows'
);
reset role;

-- 80. the same seed does not overlap page one and page two.
set local role authenticated;
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
select is_empty(
  $$ select id from public.discover_personas('', '{}', 'seed-pages', 5, 0)
     intersect
     select id from public.discover_personas('', '{}', 'seed-pages', 5, 5) $$,
  'seeded discover pages do not overlap'
);
reset role;

-- 81. a non-admin cannot review a persona through the RPC.
set local role authenticated;
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
select throws_ok(
  $$ select public.review_persona(
       'b4b4b4b4-b4b4-b4b4-b4b4-b4b4b4b4b4b4',
       'suspended',
       'A non-admin attempt to suspend a member.') $$,
  42501,
  null,
  'non-admin cannot review a persona through the RPC'
);
reset role;

-- 82. reject/suspend requires a reason.
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
select throws_ok(
  $$ select public.review_persona(
       'b4b4b4b4-b4b4-b4b4-b4b4-b4b4b4b4b4b4',
       'suspended',
       null) $$,
  22023,
  null,
  'suspend requires a reason'
);
reset role;

-- 83. an admin suspend writes status and audit together.
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
select lives_ok(
  $$ select public.review_persona(
       'b4b4b4b4-b4b4-b4b4-b4b4-b4b4b4b4b4b4',
       'suspended',
       'A clear audit reason for the suspension.') $$,
  'admin can suspend a persona with a reason'
);
reset role;
select results_eq(
  $$ select p.approval_status::text, e.reason
     from public.profiles p
     join public.profile_moderation_events e on e.profile_id = p.id
     where p.id = 'b4b4b4b4-b4b4-b4b4-b4b4-b4b4b4b4b4b4'
     order by e.created_at desc
     limit 1 $$,
  $$ values ('suspended', 'A clear audit reason for the suspension.') $$,
  'persona status and moderation reason are stored together'
);

select * from finish();

rollback;
