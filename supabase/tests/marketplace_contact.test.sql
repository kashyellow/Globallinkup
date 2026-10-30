-- ============================================================================
-- Marketplace concierge contact — run with `supabase test db` (pgTAP)
--
-- ADR 0009: `marketplace.manage` may write the `marketplace.contact` setting
-- and nothing else; `settings.manage` keeps its blanket write; members read.
--
-- Seed ids: admin 1111 (owner), sofia 2222 (member), lucas 5555.
-- ============================================================================

begin;

create extension if not exists pgtap with schema extensions;

select plan(8);

-- A marketplace operator with no settings rights, assigned to lucas.
insert into public.admin_roles (slug, name, capabilities)
values ('catalog', 'Catalog manager', array['marketplace.manage']);

update public.profiles
set role = 'admin',
    admin_role_id = (select id from public.admin_roles where slug = 'catalog')
where id = '55555555-5555-5555-5555-555555555555';

set local role authenticated;
set local request.jwt.claims = '{"sub":"55555555-5555-5555-5555-555555555555","role":"authenticated"}';

select lives_ok(
  $$ update public.platform_settings
        set value = '{"email":"desk@globallinkup.com","phone":"+34 600 111 222"}'::jsonb
      where key = 'marketplace.contact' $$,
  'a catalog manager updates the concierge contact'
);

select is(
  (select value ->> 'email' from public.platform_settings where key = 'marketplace.contact'),
  'desk@globallinkup.com',
  'the stored email is what the desk saved'
);

select is(
  (select value ->> 'phone' from public.platform_settings where key = 'marketplace.contact'),
  '+34 600 111 222',
  'the stored phone is what the desk saved'
);

-- A filtered-out UPDATE is a silent no-op under RLS, so assert the value held.
update public.platform_settings set value = '"EUR"'::jsonb where key = 'marketplace.currency';

select is(
  (select value from public.platform_settings where key = 'marketplace.currency'),
  '"USD"'::jsonb,
  'the catalog manager cannot change the currency'
);

select throws_ok(
  $$ insert into public.platform_settings (key, value) values ('marketplace.terms', '{}'::jsonb) $$,
  '42501',
  null,
  'the catalog manager cannot create new settings rows'
);

-- An approved member reads the contact, but never writes it.
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';

select isnt_empty(
  $$ select 1 from public.platform_settings where key = 'marketplace.contact' $$,
  'an approved member reads the concierge contact'
);

update public.platform_settings set value = '{}'::jsonb where key = 'marketplace.contact';

select is(
  (select value ->> 'email' from public.platform_settings where key = 'marketplace.contact'),
  'desk@globallinkup.com',
  'an approved member cannot write the concierge contact'
);

-- The owner keeps blanket settings rights.
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

select lives_ok(
  $$ update public.platform_settings set value = '"EUR"'::jsonb where key = 'marketplace.currency' $$,
  'the owner updates any setting'
);

reset role;

select * from finish();
rollback;
