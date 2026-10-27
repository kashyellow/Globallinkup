-- ============================================================================
-- Granular admin roles — run with `supabase test db` (pgTAP)
--
-- Seed ids: admin 1111 (owner), sofia 2222, mateo 3333, lucas 5555, pending 7777.
-- ============================================================================

begin;

create extension if not exists pgtap with schema extensions;

select plan(8);

-- A marketplace-less reviewer role, assigned to mateo.
insert into public.admin_roles (slug, name, capabilities)
values ('reviewer', 'Member reviewer', array['members.review']);

update public.profiles
set role = 'admin',
    admin_role_id = (select id from public.admin_roles where slug = 'reviewer')
where id = '33333333-3333-3333-3333-333333333333';

-- Capability plumbing ---------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}';
select ok(
  public.has_capability('members.review'),
  'the reviewer role grants members.review'
);
select ok(
  not public.has_capability('marketplace.manage'),
  'the reviewer role does not grant marketplace.manage'
);
select ok(not public.is_admin(), 'a sub-admin is not the owner');

select isnt_empty(
  $$ select 1 from public.profiles where id = '77777777-7777-7777-7777-777777777777' $$,
  'the reviewer reads pending dossiers'
);

select throws_ok(
  $$ insert into public.marketplace_products (name, created_by)
     values ('Reviewer draft', '33333333-3333-3333-3333-333333333333') $$,
  '42501',
  null,
  'the reviewer cannot write the catalog'
);

select lives_ok(
  $$ select public.review_persona('77777777-7777-7777-7777-777777777777', 'approved', null) $$,
  'the reviewer approves a pending persona'
);
reset role;

-- The seeded admin keeps full control; a member has nothing.
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
select ok(public.has_capability('marketplace.manage'), 'the owner holds every capability');
reset role;

set local role authenticated;
set local request.jwt.claims = '{"sub":"55555555-5555-5555-5555-555555555555","role":"authenticated"}';
select ok(
  not public.has_capability('members.review') and not public.is_admin(),
  'a member holds no admin capability'
);
reset role;

select * from finish();
rollback;
