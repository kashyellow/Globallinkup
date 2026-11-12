-- ============================================================================
-- Member invites (ADR 0010) — run with `supabase test db` (pgTAP)
--
-- Seed ids: admin 1111 (owner), sofia 2222, mateo 3333, lucas 5555.
-- Invitees aaaa/bbbb and the plain sign-up cccc exist only in auth.users.
-- ============================================================================

begin;

create extension if not exists pgtap with schema extensions;

select plan(10);

insert into auth.users (id, email)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'invitee.a@example.com'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'invitee.b@example.com'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'plain.signup@example.com');

insert into public.member_invites (user_id, email, display_name, locale, invited_by)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'invitee.a@example.com', 'Invitee A', 'en',
   '11111111-1111-1111-1111-111111111111'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'invitee.b@example.com', 'Invitee B', 'es',
   '11111111-1111-1111-1111-111111111111');

-- A members-desk reviewer (mateo) and a marketplace-only sub-admin (sofia).
insert into public.admin_roles (slug, name, capabilities)
values
  ('invite-reviewer', 'Member reviewer', array['members.review']),
  ('invite-market', 'Catalog only', array['marketplace.manage']);

update public.profiles
set role = 'admin', admin_role_id = (select id from public.admin_roles where slug = 'invite-reviewer')
where id = '33333333-3333-3333-3333-333333333333';
update public.profiles
set role = 'admin', admin_role_id = (select id from public.admin_roles where slug = 'invite-market')
where id = '22222222-2222-2222-2222-222222222222';

select throws_ok(
  $$ insert into public.member_invites (user_id, email, display_name, locale, avatar_path)
     values ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'plain.signup@example.com', 'Plain', 'en',
             'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/x.jpg') $$,
  '23514',
  null,
  'an invite avatar must live in the invitee''s own folder'
);

-- Visibility -----------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}';
select is((select count(*)::int from public.member_invites), 2, 'a members-desk admin sees every invite');
reset role;

set local role authenticated;
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
select is((select count(*)::int from public.member_invites), 0, 'a sub-admin without the members desk sees none');
reset role;

set local role authenticated;
set local request.jwt.claims = '{"sub":"55555555-5555-5555-5555-555555555555","role":"authenticated"}';
select is((select count(*)::int from public.member_invites), 0, 'a member sees no invites');
reset role;

set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","role":"authenticated"}';
select is(
  (select array_agg(user_id)::text from public.member_invites),
  '{aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa}',
  'an invitee sees only their own invite'
);

select throws_ok(
  $$ insert into public.member_invites (user_id, email, display_name, locale)
     values ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'plain.signup@example.com', 'Plain', 'en') $$,
  '42501',
  null,
  'the app role cannot write invites'
);

-- Auto-approval --------------------------------------------------------------
select is(
  public.save_persona('Invitee A', 'ES', 'Madrid', null, null, '[]'::jsonb, null, '+34600000000'),
  'approved'::public.approval_status,
  'an invited member is approved on persona submit'
);
reset role;

select isnt(
  (select accepted_at from public.member_invites where user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  null,
  'submitting the persona accepts the invite'
);

select is(
  (select actor_id from public.audit_events
   where action = 'member.invite_accepted' and target_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  '11111111-1111-1111-1111-111111111111'::uuid,
  'the acceptance is audited against the inviter'
);

set local role authenticated;
set local request.jwt.claims = '{"sub":"cccccccc-cccc-cccc-cccc-cccccccccccc","role":"authenticated"}';
select is(
  public.save_persona('Plain Signup', 'ES', 'Madrid', null, null, '[]'::jsonb, null, '+34600000001'),
  'pending'::public.approval_status,
  'a plain sign-up still waits for review'
);
reset role;

select * from finish();
rollback;
