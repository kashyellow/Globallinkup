-- ============================================================================
-- Audit trail — run with `supabase test db` (pgTAP)
-- ============================================================================

begin;

create extension if not exists pgtap with schema extensions;

select plan(5);

set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
select lives_ok(
  $$ select public.record_audit(
       'post.removed',
       'post',
       'a0000000-0000-0000-0000-000000000001',
       'Removed by the audit suite.',
       '{"from_state":"visible"}'::jsonb
     ) $$,
  'an admin records an audit row'
);
select is(
  (select count(*)::integer from public.audit_events where action = 'post.removed'),
  1,
  'the row is visible to a reader'
);
select throws_ok(
  $$ select public.record_audit('bad action') $$,
  '23514',
  null,
  'the action name must be namespaced'
);
reset role;

set local role authenticated;
set local request.jwt.claims = '{"sub":"55555555-5555-5555-5555-555555555555","role":"authenticated"}';
select is_empty(
  $$ select 1 from public.audit_events $$,
  'a member reads no audit rows'
);
select throws_ok(
  $$ select public.record_audit('post.removed') $$,
  '42501',
  null,
  'a member cannot write audit rows'
);
reset role;

select * from finish();
rollback;
