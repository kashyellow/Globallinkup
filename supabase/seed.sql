-- ============================================================================
-- GlobalLinkup — LOCAL DEV SEED  ⚠️  DO NOT RUN IN PRODUCTION
--
-- Applied by `supabase db reset` / `supabase db seed` only — never `supabase
-- db push`. Mirrors the mock fixtures in `src/features/*/data.ts` so S3 can flip
-- them to real rows without inventing data.
--
-- Deterministic UUIDs so the pgTAP suite in `supabase/tests/` can reference the
-- same accounts. All accounts are pre-confirmed (no email needed locally) and
-- share the password `Password123` (satisfies the CFG-1 policy). See
-- docs/plan/api-layer/api-layer-decisions.md (SA-4).
--
-- Media (avatars / post images / product images) are placeholder storage paths:
-- real uploads land in S4, so nothing here points at a CDN.
-- ============================================================================

create extension if not exists pgcrypto with schema extensions;

begin;

-- ----------------------------------------------------------------------------
-- Auth accounts
-- ----------------------------------------------------------------------------
create temporary table seed_users (
  id uuid primary key,
  email text not null,
  display_name text not null,
  role public.app_role not null,
  approval_status public.approval_status not null
) on commit drop;

insert into seed_users (id, email, display_name, role, approval_status)
values
  ('11111111-1111-1111-1111-111111111111', 'admin@globallinkup.test',      'GlobalLinkup Admin', 'admin', 'approved'),
  ('22222222-2222-2222-2222-222222222222', 'sofia.martinez@example.com',   'Sofia Martinez',     'user',  'approved'),
  ('33333333-3333-3333-3333-333333333333', 'mateo.silva@example.com',      'Mateo Silva',        'user',  'approved'),
  ('44444444-4444-4444-4444-444444444444', 'camila.osorio@example.com',    'Camila Osorio',      'user',  'approved'),
  ('55555555-5555-5555-5555-555555555555', 'lucas.varela@example.com',     'Lucas Varela',       'user',  'approved'),
  ('66666666-6666-6666-6666-666666666666', 'elena.ramos@example.com',      'Elena Ramos',        'user',  'approved'),
  ('77777777-7777-7777-7777-777777777777', 'pending.user@example.com',     'Pending Applicant',  'user',  'pending'),
  ('88888888-8888-8888-8888-888888888888', 'reset.user@example.com',       'Reset Flow User',    'user',  'approved'),
  ('99999999-9999-9999-9999-999999999999', 'rejected.user@example.com',    'Rejected Applicant', 'user',  'rejected'),
  ('abababab-abab-abab-abab-abababababab', 'suspended.user@example.com',   'Suspended Member',   'user',  'suspended');

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change,
  created_at,
  updated_at
)
select
  '00000000-0000-0000-0000-000000000000',
  u.id,
  'authenticated',
  'authenticated',
  u.email,
  extensions.crypt('Password123', extensions.gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('display_name', u.display_name),
  '',
  '',
  '',
  '',
  now(),
  now()
from seed_users u;

insert into auth.identities (
  provider_id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
select
  u.id::text,
  u.id,
  jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
  'email',
  now(),
  now(),
  now()
from seed_users u;

-- ----------------------------------------------------------------------------
-- Profiles  (admin first: later rows reference it via reviewed_by)
-- ----------------------------------------------------------------------------
insert into public.profiles (
  id, display_name, country_code, city, bio_en, headline, languages, interests,
  approval_status, role, submitted_at, reviewed_at
)
values (
  '11111111-1111-1111-1111-111111111111',
  'GlobalLinkup Admin', 'ES', 'Madrid',
  'Platform steward for the GlobalLinkup community.',
  'Platform Steward',
  '[{"code":"ES","level":"native"},{"code":"EN","level":"fluent"}]'::jsonb,
  array[]::text[],
  'approved', 'admin', now(), now()
);

insert into public.profiles (
  id, display_name, country_code, city, neighborhood, avatar_url,
  bio_en, bio_es, origin_flavor, headline, languages, interests, badge,
  approval_status, role, submitted_at, reviewed_at, reviewed_by
)
values
  (
    '22222222-2222-2222-2222-222222222222', 'Sofia Martinez', 'ES', 'Barcelona', 'El Born',
    'avatars/seed/sofia.jpg',
    'Architect and ceramicist based in El Born. Passionate about brutalist forms, analog rolls, and mezcal pairings.',
    'Arquitecta y ceramista afincada en El Born. Apasionada de las formas brutalistas, los carretes analógicos y las catas de mezcal.',
    'Gothic Quarter, Barcelona',
    'Architect & Cultural Documentary Filmmaker',
    '[{"code":"ES","level":"native"},{"code":"EN","level":"fluent"}]'::jsonb,
    array['architecture', 'analogPhotography', 'ceramicsCraft'],
    'ambassador', 'approved', 'user', now(), now(), '11111111-1111-1111-1111-111111111111'
  ),
  (
    '33333333-3333-3333-3333-333333333333', 'Mateo Silva', 'MX', 'Mexico City', 'Roma Norte',
    'avatars/seed/mateo.jpg',
    'Creative director working between CDMX studios and archaeological sites, drawn to street photography and gastronomy.',
    'Director creativo que trabaja entre estudios de la CDMX y sitios arqueológicos, atraído por la fotografía urbana y la gastronomía.',
    'Coyoacán courtyards',
    'Creative Director',
    '[{"code":"ES","level":"native"},{"code":"EN","level":"conversational"}]'::jsonb,
    array['culinaryHeritage', 'independentCinema', 'architecture'],
    'ambassador', 'approved', 'user', now(), now(), '11111111-1111-1111-1111-111111111111'
  ),
  (
    '44444444-4444-4444-4444-444444444444', 'Camila Osorio', 'CO', 'Medellín', 'El Poblado',
    'avatars/seed/camila.jpg',
    'Textile curator documenting hand-loom traditions in the Antioquian highlands.',
    'Curadora textil que documenta las tradiciones del telar en el altiplano antioqueño.',
    'Aburrá Valley',
    'Textile Curator',
    '[{"code":"ES","level":"native"},{"code":"EN","level":"proficient"}]'::jsonb,
    array['ceramicsCraft', 'hikingNature', 'analogPhotography'],
    'ambassador', 'approved', 'user', now(), now(), '11111111-1111-1111-1111-111111111111'
  ),
  (
    '55555555-5555-5555-5555-555555555555', 'Lucas Varela', 'AR', 'Buenos Aires', 'San Telmo',
    'avatars/seed/lucas.jpg',
    'Sound designer and author collecting vinyl and oral histories in Buenos Aires.',
    'Diseñador de sonido y autor que colecciona vinilos e historias orales en Buenos Aires.',
    'Río de la Plata',
    'Sound Designer & Author',
    '[{"code":"ES","level":"native"},{"code":"EN","level":"conversational"}]'::jsonb,
    array['literature', 'independentCinema', 'analogPhotography'],
    'creator', 'approved', 'user', now(), now(), '11111111-1111-1111-1111-111111111111'
  ),
  (
    '66666666-6666-6666-6666-666666666666', 'Elena Ramos', 'ES', 'Madrid', 'Chamberí',
    'avatars/seed/elena.jpg',
    'Documentary film producer living in Madrid, obsessed with ceramics and independent bookshops.',
    'Productora de documentales afincada en Madrid, obsesionada con la cerámica y las librerías independientes.',
    'Chamberí studios',
    'Documentary Film Producer',
    '[{"code":"ES","level":"native"},{"code":"EN","level":"fluent"},{"code":"FR","level":"basic"}]'::jsonb,
    array['independentCinema', 'culinaryHeritage', 'ceramicsCraft'],
    'resident', 'approved', 'user', now(), now(), '11111111-1111-1111-1111-111111111111'
  ),
  (
    '77777777-7777-7777-7777-777777777777', 'Pending Applicant', 'CR', 'San José', null,
    null,
    'Just arrived and waiting for the review desk to wave me through.',
    'Recién llegado y esperando que la mesa de revisión me dé paso.',
    null, 'Photographer',
    '[{"code":"ES","level":"native"},{"code":"EN","level":"basic"}]'::jsonb,
    array['hikingNature', 'literature', 'architecture'],
    null, 'pending', 'user', now(), null, null
  ),
  (
    '88888888-8888-8888-8888-888888888888', 'Reset Flow User', 'CL', 'Santiago', null,
    'avatars/seed/reset.jpg',
    'Account dedicated to exercising the password-recovery flow.',
    'Cuenta dedicada a ejercitar el flujo de recuperación de contraseña.',
    null, 'Product Tester',
    '[{"code":"ES","level":"native"},{"code":"EN","level":"fluent"}]'::jsonb,
    array['literature', 'architecture', 'hikingNature'],
    null, 'approved', 'user', now(), now(), '11111111-1111-1111-1111-111111111111'
  ),
  (
    '99999999-9999-9999-9999-999999999999', 'Rejected Applicant', 'PT', 'Lisbon', null,
    null,
    'Portrait photo did not meet the review guidelines; ready to resubmit.',
    'La foto de perfil no cumplía las normas de revisión; listo para reenviar.',
    null, 'Photographer',
    '[{"code":"PT","level":"native"},{"code":"EN","level":"fluent"}]'::jsonb,
    array['analogPhotography', 'literature', 'ceramicsCraft'],
    null, 'rejected', 'user', now(), now(), '11111111-1111-1111-1111-111111111111'
  ),
  (
    'abababab-abab-abab-abab-abababababab', 'Suspended Member', 'MX', 'Guadalajara', null,
    null,
    'Account suspended following a community report; awaiting review.',
    'Cuenta suspendida tras un reporte de la comunidad; en espera de revisión.',
    null, 'Journalist',
    '[{"code":"ES","level":"native"},{"code":"EN","level":"advanced"}]'::jsonb,
    array['literature', 'independentCinema', 'architecture'],
    null, 'suspended', 'user', now(), now(), '11111111-1111-1111-1111-111111111111'
  );

-- ----------------------------------------------------------------------------
-- Private profile data (owner/admin only). Age is derived via profile_age().
-- ----------------------------------------------------------------------------
insert into public.profile_private (profile_id, date_of_birth)
values
  ('11111111-1111-1111-1111-111111111111', '1990-01-01'),
  ('22222222-2222-2222-2222-222222222222', '1999-04-12'),
  ('33333333-3333-3333-3333-333333333333', '1997-02-08'),
  ('44444444-4444-4444-4444-444444444444', '2001-06-21'),
  ('55555555-5555-5555-5555-555555555555', '1994-11-30'),
  ('66666666-6666-6666-6666-666666666666', '1998-08-17'),
  ('77777777-7777-7777-7777-777777777777', '2000-03-03'),
  ('88888888-8888-8888-8888-888888888888', '1996-05-05'),
  ('99999999-9999-9999-9999-999999999999', '1993-09-14'),
  ('abababab-abab-abab-abab-abababababab', '1991-12-01');

-- ----------------------------------------------------------------------------
-- Protected contact details (RLS-gated)
-- ----------------------------------------------------------------------------
insert into public.contact_details (profile_id, whatsapp, instagram, email, other)
values
  ('22222222-2222-2222-2222-222222222222', '+34 612 849 201', '@sofia.mtz_bcn', 'sofia@bcncreative.es', '{"telegram":"@sofia.bcn","substack":"sofia.substack.com"}'::jsonb),
  ('33333333-3333-3333-3333-333333333333', '+52 55 4910 8823', '@mateo_silv', 'mateo@silvaestudio.mx', '{"telegram":"@mateo.silv"}'::jsonb),
  ('44444444-4444-4444-4444-444444444444', '+57 312 849 2011', '@camila.textiles', 'camila@osorio.co', '{}'::jsonb),
  ('66666666-6666-6666-6666-666666666666', '+34 611 729 334', '@elena_curaduria', 'elena.ramos@curaduria.es', '{}'::jsonb);

-- ----------------------------------------------------------------------------
-- Connections — one accepted, one pending inbound, one declined (re-request path)
-- ----------------------------------------------------------------------------
insert into public.connections (id, requester_id, recipient_id, status, intro, topic, created_at, updated_at)
values
  ('c0000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', 'accepted',
   'Hola Camila, me encantaría intercambiar ideas sobre telares y arquitectura textil.', 'textiles', now() - interval '40 days', now() - interval '39 days'),
  ('c0000000-0000-0000-0000-000000000002', '33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'requested',
   'Hola Sofia! Loved your dispatch on Madrid brutalism. I lead historic urban walks in CDMX and would love to compare notes.', 'architecture', now() - interval '2 days', now() - interval '2 days'),
  ('c0000000-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', '55555555-5555-5555-5555-555555555555', 'declined',
   'Hi Lucas, would love to talk analog sound and field recording.', 'soundArt', now() - interval '30 days', now() - interval '20 days');

-- ----------------------------------------------------------------------------
-- Posts + likes
-- ----------------------------------------------------------------------------
insert into public.posts (id, author_id, image_path, caption, moderation_status, created_at, updated_at)
values
  ('a0000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'post-images/seed/sofia-terrace.jpg', 'Cafe terrace light in the Gothic Quarter, shot on expired Portra.', 'visible', now() - interval '2 hours', now() - interval '2 hours'),
  ('a0000000-0000-0000-0000-000000000002', '33333333-3333-3333-3333-333333333333', 'post-images/seed/mateo-coyoacan.jpg', 'Jacaranda season on a cobblestone avenue in Coyoacán.', 'visible', now() - interval '5 hours', now() - interval '5 hours'),
  ('a0000000-0000-0000-0000-000000000003', '66666666-6666-6666-6666-666666666666', 'post-images/seed/elena-gallery.jpg', 'Opening night at a contemporary art space in Madrid.', 'visible', now() - interval '1 day', now() - interval '1 day');

insert into public.post_likes (post_id, user_id, created_at)
values
  ('a0000000-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', now() - interval '1 hour'),
  ('a0000000-0000-0000-0000-000000000001', '44444444-4444-4444-4444-444444444444', now() - interval '90 minutes'),
  ('a0000000-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', now() - interval '4 hours'),
  ('a0000000-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', now() - interval '20 hours'),
  ('a0000000-0000-0000-0000-000000000003', '55555555-5555-5555-5555-555555555555', now() - interval '18 hours');

-- ----------------------------------------------------------------------------
-- Marketplace catalog (admin-authored; price in minor units, SD-11)
-- ----------------------------------------------------------------------------
insert into public.marketplace_products (
  id, name, sku, price_cents, currency, category, summary, description,
  origin_label, badge, specs, availability, contact_information, is_published, created_by
)
values
  ('b0000000-0000-0000-0000-000000000001', 'Handmade Oaxacan Leather Travel Bag', 'GL-OAX-882', 12000, 'USD', 'artisanCrafts',
   'Full-grain vegetable-tanned leather carry-on crafted with a Oaxacan artisan guild.',
   'Full-grain vegetable-tanned leather crafted with the Velásquez artisan guild in Oaxaca.',
   'Oaxaca, MX', 'artisanPartner',
   '{"origin":"Oaxaca, Mexico","artisan":"Mateo Velásquez Guild","material":"100% full-grain bovine","dimensions":"52 x 28 x 25 cm (carry-on)","weight":"1.45 kg","fulfillment":"fulfillmentCourier"}'::jsonb,
   'in_stock', 'concierge@globallinkup.com', true, '11111111-1111-1111-1111-111111111111'),
  ('b0000000-0000-0000-0000-000000000002', 'Artisanal Ceramic Espresso Set (Barcelona)', 'GL-BCN-410', 6400, 'USD', 'homeLiving',
   'Pair of matte-glazed terracotta espresso cups fired in Gràcia.',
   'Hand-thrown speckled stoneware fired twice in a Gràcia family atelier.',
   'Barcelona, ES', 'adminCurated',
   '{"origin":"Barcelona, Spain","artisan":"Taller Gràcia Ceramics","material":"Speckled stoneware, matte glaze","dimensions":"6 x 6 x 7 cm per cup (set of 2)","weight":"0.62 kg","fulfillment":"fulfillmentCourier"}'::jsonb,
   'in_stock', 'concierge@globallinkup.com', true, '11111111-1111-1111-1111-111111111111'),
  ('b0000000-0000-0000-0000-000000000003', 'Bilingual Cultural Phrasebook & Journal (EN/ES)', 'GL-EDT-024', 2400, 'USD', 'booksCulture',
   'Linen-bound bilingual journal with a copper pen, curated by linguists.',
   'Linen-bound official GlobalLinkup journal paired with a copper pen.',
   'Official Edition', 'globalLinkupOriginal',
   '{"origin":"Madrid, Spain","artisan":"GlobalLinkup Editorial Studio","material":"Linen-bound, 120gsm archival paper","dimensions":"21 x 14.8 x 2.1 cm (A5)","weight":"0.48 kg","fulfillment":"fulfillmentPostal"}'::jsonb,
   'in_stock', 'concierge@globallinkup.com', true, '11111111-1111-1111-1111-111111111111'),
  ('b0000000-0000-0000-0000-000000000004', 'Handwoven Merino Wool Travel Throw', 'GL-MDE-330', 8800, 'USD', 'artisanCrafts',
   'Ultra-soft lightweight merino loomed in the Antioquian highlands.',
   'Extra-fine merino loomed on wooden looms in the Antioquian highlands.',
   'Medellín, CO', 'adminVerified',
   '{"origin":"Medellín, Colombia","artisan":"Tejedoras de Antioquia","material":"100% extra-fine merino wool","dimensions":"180 x 130 cm (rolled 30 cm)","weight":"0.85 kg","fulfillment":"fulfillmentCourier"}'::jsonb,
   'made_to_order', 'concierge@globallinkup.com', true, '11111111-1111-1111-1111-111111111111'),
  ('b0000000-0000-0000-0000-000000000005', 'Specialty Roasted Chiapas Coffee Beans (500g)', 'GL-CHP-500', 1900, 'USD', 'localGoods',
   'Single-origin high-altitude beans with cacao, fig and orange blossom notes.',
   'Single-origin Typica and Bourbon grown at 1,600m by a smallholder collective.',
   'Chiapas, MX', 'directTrade',
   '{"origin":"Chiapas, Mexico","artisan":"Finca La Esperanza Collective","material":"Single-origin Typica & Bourbon","dimensions":"500 g valve-sealed kraft bag","weight":"0.52 kg","fulfillment":"fulfillmentCourier"}'::jsonb,
   'in_stock', 'concierge@globallinkup.com', true, '11111111-1111-1111-1111-111111111111'),
  ('b0000000-0000-0000-0000-000000000006', 'Minimalist Passport & Document Wallet', 'GL-MAD-118', 4500, 'USD', 'travelGear',
   'RFID-shielded leather passport wallet cut and stitched in Madrid.',
   'RFID-shielded vegetable-tanned leather wallet cut and stitched in Madrid.',
   'Madrid, ES', 'adminCurated',
   '{"origin":"Madrid, Spain","artisan":"Taller Piel Madrid","material":"Full-grain leather, RFID shielding","dimensions":"14 x 10 x 1.8 cm","weight":"0.18 kg","fulfillment":"fulfillmentPostal"}'::jsonb,
   'out_of_stock', 'concierge@globallinkup.com', true, '11111111-1111-1111-1111-111111111111');

insert into public.marketplace_product_images (product_id, storage_path, sort)
values
  ('b0000000-0000-0000-0000-000000000001', 'product-images/seed/oaxaca-bag-01.jpg', 0),
  ('b0000000-0000-0000-0000-000000000001', 'product-images/seed/oaxaca-bag-02.jpg', 1),
  ('b0000000-0000-0000-0000-000000000002', 'product-images/seed/espresso-set-01.jpg', 0),
  ('b0000000-0000-0000-0000-000000000003', 'product-images/seed/phrasebook-01.jpg', 0),
  ('b0000000-0000-0000-0000-000000000004', 'product-images/seed/merino-throw-01.jpg', 0),
  ('b0000000-0000-0000-0000-000000000005', 'product-images/seed/chiapas-coffee-01.jpg', 0),
  ('b0000000-0000-0000-0000-000000000006', 'product-images/seed/passport-wallet-01.jpg', 0);

-- ----------------------------------------------------------------------------
-- Platform settings (Admin → Settings, FR-9.5 / SD-12)
-- ----------------------------------------------------------------------------
insert into public.platform_settings (key, value)
values
  ('marketplace.contact', '{"whatsapp":"+34 612 345 678","whatsappLink":"https://wa.me/34612345678","email":"concierge@globallinkup.com"}'::jsonb),
  ('marketplace.currency', '"USD"'::jsonb);

commit;
