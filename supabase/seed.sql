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
  ('abababab-abab-abab-abab-abababababab', 'suspended.user@example.com',   'Suspended Member',   'user',  'suspended'),
  ('b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1', 'daniel.rivera@example.com',    'Daniel Rivera',      'user',  'approved'),
  ('b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', 'valentina.gomez@example.com',  'Valentina Gomez',    'user',  'approved'),
  ('b3b3b3b3-b3b3-b3b3-b3b3-b3b3b3b3b3b3', 'andres.molina@example.com',    'Andrés Molina',      'user',  'approved'),
  ('b4b4b4b4-b4b4-b4b4-b4b4-b4b4b4b4b4b4', 'carla.rossi@example.com',      'Carla Rossi',        'user',  'approved'),
  ('b5b5b5b5-b5b5-b5b5-b5b5-b5b5b5b5b5b5', 'mariana.costa@example.com',    'Mariana Costa',      'user',  'approved'),
  ('b6b6b6b6-b6b6-b6b6-b6b6-b6b6b6b6b6b6', 'tomas.herrera@example.com',    'Tomás Herrera',      'user',  'approved'),
  ('b7b7b7b7-b7b7-b7b7-b7b7-b7b7b7b7b7b7', 'lucia.fernandez@example.com',  'Lucía Fernández',    'user',  'approved');

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
  bio_en, bio_es, headline, languages, interests, badge,
  approval_status, role, submitted_at, reviewed_at, reviewed_by
)
values
  (
    '22222222-2222-2222-2222-222222222222', 'Sofia Martinez', 'ES', 'Barcelona', 'El Born',
    'avatars/seed/sofia.jpg',
    'Architect and ceramicist based in El Born. Passionate about brutalist forms, analog rolls, and mezcal pairings.',
    'Arquitecta y ceramista afincada en El Born. Apasionada de las formas brutalistas, los carretes analógicos y las catas de mezcal.',
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
    'Photographer',
    '[{"code":"ES","level":"native"},{"code":"EN","level":"basic"}]'::jsonb,
    array['hikingNature', 'literature', 'architecture', 'Bookbinding'],
    null, 'pending', 'user', now(), null, null
  ),
  (
    '88888888-8888-8888-8888-888888888888', 'Reset Flow User', 'CL', 'Santiago', null,
    'avatars/seed/reset.jpg',
    'Account dedicated to exercising the password-recovery flow.',
    'Cuenta dedicada a ejercitar el flujo de recuperación de contraseña.',
    'Product Tester',
    '[{"code":"ES","level":"native"},{"code":"EN","level":"fluent"}]'::jsonb,
    array['literature', 'architecture', 'hikingNature'],
    null, 'approved', 'user', now(), now(), '11111111-1111-1111-1111-111111111111'
  ),
  (
    '99999999-9999-9999-9999-999999999999', 'Rejected Applicant', 'PT', 'Lisbon', null,
    null,
    'Portrait photo did not meet the review guidelines; ready to resubmit.',
    'La foto de perfil no cumplía las normas de revisión; listo para reenviar.',
    'Photographer',
    '[{"code":"PT","level":"native"},{"code":"EN","level":"fluent"}]'::jsonb,
    array['analogPhotography', 'literature', 'ceramicsCraft'],
    null, 'rejected', 'user', now(), now(), '11111111-1111-1111-1111-111111111111'
  ),
  (
    'abababab-abab-abab-abab-abababababab', 'Suspended Member', 'MX', 'Guadalajara', null,
    null,
    'Account suspended following a community report; awaiting review.',
    'Cuenta suspendida tras un reporte de la comunidad; en espera de revisión.',
    'Journalist',
    '[{"code":"ES","level":"native"},{"code":"EN","level":"advanced"}]'::jsonb,
    array['literature', 'independentCinema', 'architecture'],
    null, 'suspended', 'user', now(), now(), '11111111-1111-1111-1111-111111111111'
  );

-- Additional approved members make discovery load-more and the connections
-- board visible without having to manufacture connections in the browser.
insert into public.profiles (
  id, display_name, country_code, city, neighborhood, avatar_url,
  bio_en, bio_es, headline, languages, interests, badge,
  approval_status, role, submitted_at, reviewed_at, reviewed_by
)
values
  (
    'b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1', 'Daniel Rivera', 'MX', 'Mexico City', 'Condesa',
    'avatars/seed/daniel.jpg',
    'Architect leading historic urban walks through Mexico City and collecting stories of preservation.',
    'Arquitecto que guía recorridos urbanos históricos por la Ciudad de México y colecciona historias de preservación.',
    'Architect & Urban Walk Guide',
    '[{"code":"ES","level":"native"},{"code":"EN","level":"fluent"}]'::jsonb,
    array['architecture', 'literature', 'culinaryHeritage'],
    null, 'approved', 'user', now(), now(), '11111111-1111-1111-1111-111111111111'
  ),
  (
    'b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', 'Valentina Gomez', 'CO', 'Bogotá', 'Chapinero',
    'avatars/seed/valentina.jpg',
    'Visual journalist documenting independent culture, migration, and the everyday textures of Bogotá.',
    'Periodista visual que documenta la cultura independiente, la migración y las texturas cotidianas de Bogotá.',
    'Visual Journalist',
    '[{"code":"ES","level":"native"},{"code":"EN","level":"advanced"}]'::jsonb,
    array['analogPhotography', 'literature', 'independentCinema'],
    null, 'approved', 'user', now(), now(), '11111111-1111-1111-1111-111111111111'
  ),
  (
    'b3b3b3b3-b3b3-b3b3-b3b3-b3b3b3b3b3b3', 'Andrés Molina', 'MX', 'Oaxaca', 'Centro',
    'avatars/seed/andres.jpg',
    'Ceramicist working with local clay bodies and the slow rhythm of Oaxacan workshop traditions.',
    'Ceramista que trabaja con arcillas locales y el ritmo lento de las tradiciones de taller oaxaqueñas.',
    'Ceramicist',
    '[{"code":"ES","level":"native"},{"code":"EN","level":"conversational"}]'::jsonb,
    array['ceramicsCraft', 'culinaryHeritage', 'hikingNature'],
    null, 'approved', 'user', now(), now(), '11111111-1111-1111-1111-111111111111'
  ),
  (
    'b4b4b4b4-b4b4-b4b4-b4b4-b4b4b4b4b4b4', 'Carla Rossi', 'ES', 'Barcelona', 'Gràcia',
    'avatars/seed/carla.jpg',
    'Travel writer and editor interested in independent publishing, food markets, and long train journeys.',
    'Escritora y editora de viajes interesada en la edición independiente, los mercados y los largos trayectos en tren.',
    'Travel Writer & Editor',
    '[{"code":"ES","level":"native"},{"code":"EN","level":"fluent"},{"code":"IT","level":"basic"}]'::jsonb,
    array['literature', 'culinaryHeritage', 'architecture'],
    null, 'approved', 'user', now(), now(), '11111111-1111-1111-1111-111111111111'
  ),
  (
    'b5b5b5b5-b5b5-b5b5-b5b5-b5b5b5b5b5b5', 'Mariana Costa', 'PT', 'Lisbon', 'Alfama',
    'avatars/seed/mariana.jpg',
    'Sound artist collecting field recordings from ports, markets, and the Atlantic edge of Lisbon.',
    'Artista sonora que colecciona grabaciones de campo de puertos, mercados y el borde atlántico de Lisboa.',
    'Sound Artist',
    '[{"code":"PT","level":"native"},{"code":"EN","level":"fluent"},{"code":"ES","level":"conversational"}]'::jsonb,
    array['latinMusic', 'independentCinema', 'literature'],
    null, 'approved', 'user', now(), now(), '11111111-1111-1111-1111-111111111111'
  ),
  (
    'b6b6b6b6-b6b6-b6b6-b6b6-b6b6b6b6b6b6', 'Tomás Herrera', 'CL', 'Santiago', 'Barrio Italia',
    'avatars/seed/tomas.jpg',
    'Documentary photographer following the changing edges of Santiago and the people who build them.',
    'Fotógrafo documental que sigue los bordes cambiantes de Santiago y a quienes los construyen.',
    'Documentary Photographer',
    '[{"code":"ES","level":"native"},{"code":"EN","level":"advanced"}]'::jsonb,
    array['analogPhotography', 'architecture', 'hikingNature'],
    null, 'approved', 'user', now(), now(), '11111111-1111-1111-1111-111111111111'
  ),
  (
    'b7b7b7b7-b7b7-b7b7-b7b7-b7b7b7b7b7b7', 'Lucía Fernández', 'AR', 'Buenos Aires', 'Villa Crespo',
    'avatars/seed/lucia.jpg',
    'Textile designer and community workshop host exploring natural dyes and slow fashion.',
    'Diseñadora textil y anfitriona de talleres comunitarios que explora tintes naturales y moda lenta.',
    'Textile Designer',
    '[{"code":"ES","level":"native"},{"code":"EN","level":"conversational"}]'::jsonb,
    array['ceramicsCraft', 'hikingNature', 'literature'],
    null, 'approved', 'user', now(), now(), '11111111-1111-1111-1111-111111111111'
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
  ('abababab-abab-abab-abab-abababababab', '1991-12-01'),
  ('b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1', '1996-01-19'),
  ('b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', '1997-09-03'),
  ('b3b3b3b3-b3b3-b3b3-b3b3-b3b3b3b3b3b3', '1992-04-27'),
  ('b4b4b4b4-b4b4-b4b4-b4b4-b4b4b4b4b4b4', '1995-11-08'),
  ('b5b5b5b5-b5b5-b5b5-b5b5-b5b5b5b5b5b5', '1994-06-14'),
  ('b6b6b6b6-b6b6-b6b6-b6b6-b6b6b6b6b6b6', '1993-02-21'),
  ('b7b7b7b7-b7b7-b7b7-b7b7-b7b7b7b7b7b7', '1998-10-30');

-- ----------------------------------------------------------------------------
-- Protected contact details (RLS-gated)
-- ----------------------------------------------------------------------------
insert into public.contact_details (profile_id, whatsapp, instagram, email, other)
values
  ('22222222-2222-2222-2222-222222222222', '+34 612 849 201', '@sofia.mtz_bcn', 'sofia@bcncreative.es', '{"telegram":"@sofia.bcn","substack":"sofia.substack.com"}'::jsonb),
  ('33333333-3333-3333-3333-333333333333', '+52 55 4910 8823', '@mateo_silv', 'mateo@silvaestudio.mx', '{"telegram":"@mateo.silv"}'::jsonb),
  ('44444444-4444-4444-4444-444444444444', '+57 312 849 2011', '@camila.textiles', 'camila@osorio.co', '{}'::jsonb),
  ('66666666-6666-6666-6666-666666666666', '+34 611 729 334', '@elena_curaduria', 'elena.ramos@curaduria.es', '{}'::jsonb),
  ('88888888-8888-8888-8888-888888888888', '+56 9 5555 0101', '@reset.flow', 'reset@example.com', '{}'::jsonb),
  ('99999999-9999-9999-9999-999999999999', '+351 912 000 000', null, 'rejected@example.com', '{"telegram":"@rejected_pt"}'::jsonb),
  ('abababab-abab-abab-abab-abababababab', '+52 33 1234 5678', null, 'suspended@example.com', '{}'::jsonb),
  ('b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1', '+52 55 2201 4410', '@daniel.caminos', 'daniel@caminos.mx', '{"telegram":"@daniel.caminos"}'::jsonb),
  ('b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', '+57 310 440 2288', '@valen.visual', 'valentina@visual.co', '{}'::jsonb),
  ('b3b3b3b3-b3b3-b3b3-b3b3-b3b3b3b3b3b3', '+52 951 118 3302', '@andres.barro', 'andres@barro.mx', '{"telegram":"@andres.barro"}'::jsonb),
  ('b4b4b4b4-b4b4-b4b4-b4b4-b4b4b4b4b4b4', '+34 622 883 104', '@carla.rossi', 'carla@rossi.es', '{}'::jsonb),
  ('b5b5b5b5-b5b5-b5b5-b5b5-b5b5b5b5b5b5', '+351 913 440 220', '@mariana.porto', 'mariana@porto.pt', '{}'::jsonb),
  ('b6b6b6b6-b6b6-b6b6-b6b6-b6b6b6b6b6b6', '+56 9 6601 2288', '@tomas.bordes', 'tomas@bordes.cl', '{"telegram":"@tomas.bordes"}'::jsonb),
  ('b7b7b7b7-b7b7-b7b7-b7b7-b7b7b7b7b7b7', '+54 9 11 5502 9911', '@lucia.tintes', 'lucia@tintes.ar', '{}'::jsonb);

-- ----------------------------------------------------------------------------
-- Cultural-interest catalog (S6)
--
-- One approved row gives the combobox a custom suggestion; one pending row
-- exercises the admin review queue and its creator cleanup. The pending label
-- is also on its creator's profile, as it would be after a real save.
-- ----------------------------------------------------------------------------
insert into public.interest_catalog (
  id, label, status, created_by, reviewed_by, reviewed_at
)
values
  (
    'cdcdcdcd-cdcd-cdcd-cdcd-cdcdcdcdcdcd', 'Bookbinding', 'pending',
    '77777777-7777-7777-7777-777777777777', null, null
  ),
  (
    'efefefef-efef-efef-efef-efefefefefef', 'Storytelling', 'approved',
    null, '11111111-1111-1111-1111-111111111111', now()
  ),
  (
    'edededed-eded-eded-eded-edededededed', 'Crypto Art', 'rejected',
    'b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1',
    '11111111-1111-1111-1111-111111111111', now() - interval '5 days'
  );

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
   'Hi Lucas, would love to talk analog sound and field recording.', 'soundArt', now() - interval '30 days', now() - interval '20 days'),
  ('c0000000-0000-0000-0000-000000000004', '22222222-2222-2222-2222-222222222222', '66666666-6666-6666-6666-666666666666', 'accepted',
   'Hola Elena, let us compare notes on documentary production and Madrid bookshops.', 'documentary', now() - interval '70 days', now() - interval '68 days'),
  ('c0000000-0000-0000-0000-000000000005', '22222222-2222-2222-2222-222222222222', 'b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1', 'accepted',
   'Daniel, your preservation walks are exactly the kind of thing I want to document.', 'architecture', now() - interval '55 days', now() - interval '54 days'),
  ('c0000000-0000-0000-0000-000000000006', '22222222-2222-2222-2222-222222222222', 'b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', 'accepted',
   'Valentina, I loved your visual essay on migration and everyday textures.', 'visualJournalism', now() - interval '48 days', now() - interval '47 days'),
  ('c0000000-0000-0000-0000-000000000007', '22222222-2222-2222-2222-222222222222', 'b3b3b3b3-b3b3-b3b3-b3b3-b3b3b3b3b3b3', 'accepted',
   'Andrés, your clay work reminded me of the ceramics I saw in Oaxaca last spring.', 'ceramics', now() - interval '41 days', now() - interval '40 days'),
  ('c0000000-0000-0000-0000-000000000008', '22222222-2222-2222-2222-222222222222', 'b4b4b4b4-b4b4-b4b4-b4b4-b4b4b4b4b4b4', 'accepted',
   'Carla, I would love to hear more about your independent travel publishing project.', 'publishing', now() - interval '35 days', now() - interval '34 days'),
  ('c0000000-0000-0000-0000-000000000009', '22222222-2222-2222-2222-222222222222', 'b5b5b5b5-b5b5-b5b5-b5b5-b5b5b5b5b5b5', 'accepted',
   'Mariana, your field recordings of Lisbon are beautiful. Let us trade sound notes.', 'soundArt', now() - interval '28 days', now() - interval '27 days'),
  ('c0000000-0000-0000-0000-000000000010', '22222222-2222-2222-2222-222222222222', 'b6b6b6b6-b6b6-b6b6-b6b6-b6b6b6b6b6b6', 'accepted',
   'Tomás, the edges of Santiago series is incredible. Would love to see the full edit.', 'photography', now() - interval '21 days', now() - interval '20 days'),
  ('c0000000-0000-0000-0000-000000000011', '22222222-2222-2222-2222-222222222222', 'b7b7b7b7-b7b7-b7b7-b7b7-b7b7b7b7b7b7', 'accepted',
   'Lucía, natural dyes and slow fashion are exactly my kind of conversation.', 'textiles', now() - interval '14 days', now() - interval '13 days'),
  ('c0000000-0000-0000-0000-000000000012', '22222222-2222-2222-2222-222222222222', '88888888-8888-8888-8888-888888888888', 'requested',
   'Hola, I would love to compare notes on product testing and bilingual launch flows. Your Santiago perspective would be valuable.', 'productTesting', now() - interval '3 days', now() - interval '3 days');

-- ----------------------------------------------------------------------------
-- Posts + likes
-- ----------------------------------------------------------------------------
insert into public.posts (id, author_id, image_path, caption, moderation_status, created_at, updated_at)
values
  ('a0000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'seed/sofia-terrace.jpg', 'Cafe terrace light in the Gothic Quarter, shot on expired Portra.', 'visible', now() - interval '2 hours', now() - interval '2 hours'),
  ('a0000000-0000-0000-0000-000000000002', '33333333-3333-3333-3333-333333333333', 'seed/mateo-coyoacan.jpg', 'Jacaranda season on a cobblestone avenue in Coyoacán.', 'visible', now() - interval '5 hours', now() - interval '5 hours'),
  ('a0000000-0000-0000-0000-000000000003', '66666666-6666-6666-6666-666666666666', 'seed/elena-gallery.jpg', 'Opening night at a contemporary art space in Madrid.', 'visible', now() - interval '1 day', now() - interval '1 day'),
  ('a0000000-0000-0000-0000-000000000004', 'b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1', 'seed/daniel-condesa-01.jpg', 'Three corners of Condesa I keep returning to: the kiosk, the tiled stair, and the morning light on the park.', 'visible', now() - interval '7 hours', now() - interval '7 hours'),
  ('a0000000-0000-0000-0000-000000000005', 'b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', 'seed/valentina-chapinero.jpg', 'A quiet afternoon documenting the independent bookshops of Chapinero.', 'visible', now() - interval '10 hours', now() - interval '10 hours'),
  ('a0000000-0000-0000-0000-000000000006', 'b3b3b3b3-b3b3-b3b3-b3b3-b3b3b3b3b3b3', 'seed/andres-oaxaca.jpg', 'Fresh clay, slow hands, and the smell of the workshop after rain.', 'visible', now() - interval '14 hours', now() - interval '14 hours'),
  ('a0000000-0000-0000-0000-000000000007', 'b4b4b4b4-b4b4-b4b4-b4b4-b4b4b4b4b4b4', 'seed/carla-gracia.jpg', 'A long lunch in Gràcia that turned into a two-hour conversation about train travel.', 'visible', now() - interval '20 hours', now() - interval '20 hours'),
  ('a0000000-0000-0000-0000-000000000008', 'b5b5b5b5-b5b5-b5b5-b5b5-b5b5b5b5b5b5', 'seed/mariana-alfama.jpg', 'Field recording at the edge of Alfama, just before the market closed.', 'visible', now() - interval '1 day 3 hours', now() - interval '1 day 3 hours'),
  ('a0000000-0000-0000-0000-000000000009', 'b6b6b6b6-b6b6-b6b6-b6b6-b6b6b6b6b6b6', 'seed/tomas-santiago.jpg', 'New housing, old walls, and the people who hold both together.', 'visible', now() - interval '1 day 8 hours', now() - interval '1 day 8 hours'),
  ('a0000000-0000-0000-0000-000000000010', 'b7b7b7b7-b7b7-b7b7-b7b7-b7b7b7b7b7b7', 'seed/lucia-tintes.jpg', 'Natural dye tests for the spring workshop. Onion skin, cochineal, and a lot of patience.', 'visible', now() - interval '2 days', now() - interval '2 days'),
  ('a0000000-0000-0000-0000-000000000011', '44444444-4444-4444-4444-444444444444', 'seed/camila-telar.jpg', 'The loom in the highlands does not hurry. Neither should we.', 'visible', now() - interval '2 days 6 hours', now() - interval '2 days 6 hours'),
  ('a0000000-0000-0000-0000-000000000012', '55555555-5555-5555-5555-555555555555', 'seed/lucas-vinyl.jpg', 'Found a stack of field recordings in San Telmo and spent the afternoon listening.', 'visible', now() - interval '3 days', now() - interval '3 days');

insert into public.post_images (post_id, storage_path, sort)
values
  ('a0000000-0000-0000-0000-000000000001', 'seed/sofia-terrace.jpg', 0),
  ('a0000000-0000-0000-0000-000000000002', 'seed/mateo-coyoacan.jpg', 0),
  ('a0000000-0000-0000-0000-000000000003', 'seed/elena-gallery.jpg', 0),
  ('a0000000-0000-0000-0000-000000000004', 'seed/daniel-condesa-01.jpg', 0),
  ('a0000000-0000-0000-0000-000000000004', 'seed/daniel-condesa-02.jpg', 1),
  ('a0000000-0000-0000-0000-000000000004', 'seed/daniel-condesa-03.jpg', 2),
  ('a0000000-0000-0000-0000-000000000005', 'seed/valentina-chapinero.jpg', 0),
  ('a0000000-0000-0000-0000-000000000006', 'seed/andres-oaxaca.jpg', 0),
  ('a0000000-0000-0000-0000-000000000007', 'seed/carla-gracia.jpg', 0),
  ('a0000000-0000-0000-0000-000000000008', 'seed/mariana-alfama.jpg', 0),
  ('a0000000-0000-0000-0000-000000000009', 'seed/tomas-santiago.jpg', 0),
  ('a0000000-0000-0000-0000-000000000010', 'seed/lucia-tintes.jpg', 0),
  ('a0000000-0000-0000-0000-000000000011', 'seed/camila-telar.jpg', 0),
  ('a0000000-0000-0000-0000-000000000012', 'seed/lucas-vinyl.jpg', 0);

insert into public.post_likes (post_id, user_id, created_at)
values
  ('a0000000-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', now() - interval '1 hour'),
  ('a0000000-0000-0000-0000-000000000001', '44444444-4444-4444-4444-444444444444', now() - interval '90 minutes'),
  ('a0000000-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', now() - interval '4 hours'),
  ('a0000000-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', now() - interval '20 hours'),
  ('a0000000-0000-0000-0000-000000000003', '55555555-5555-5555-5555-555555555555', now() - interval '18 hours'),
  ('a0000000-0000-0000-0000-000000000004', '22222222-2222-2222-2222-222222222222', now() - interval '6 hours'),
  ('a0000000-0000-0000-0000-000000000004', 'b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', now() - interval '5 hours'),
  ('a0000000-0000-0000-0000-000000000005', '22222222-2222-2222-2222-222222222222', now() - interval '9 hours'),
  ('a0000000-0000-0000-0000-000000000006', '44444444-4444-4444-4444-444444444444', now() - interval '13 hours'),
  ('a0000000-0000-0000-0000-000000000007', '66666666-6666-6666-6666-666666666666', now() - interval '19 hours'),
  ('a0000000-0000-0000-0000-000000000008', '22222222-2222-2222-2222-222222222222', now() - interval '1 day'),
  ('a0000000-0000-0000-0000-000000000009', 'b6b6b6b6-b6b6-b6b6-b6b6-b6b6b6b6b6b6', now() - interval '1 day 7 hours'),
  ('a0000000-0000-0000-0000-000000000010', '22222222-2222-2222-2222-222222222222', now() - interval '1 day 12 hours'),
  ('a0000000-0000-0000-0000-000000000010', 'b4b4b4b4-b4b4-b4b4-b4b4-b4b4b4b4b4b4', now() - interval '1 day 10 hours'),
  ('a0000000-0000-0000-0000-000000000011', '22222222-2222-2222-2222-222222222222', now() - interval '2 days'),
  ('a0000000-0000-0000-0000-000000000012', '22222222-2222-2222-2222-222222222222', now() - interval '2 days 20 hours');

-- ----------------------------------------------------------------------------
-- Post comments — one root + one reply level
-- ----------------------------------------------------------------------------
insert into public.post_comments (
  id, post_id, author_id, parent_id, body, created_at, updated_at
)
values
  (
    'd0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001',
    '33333333-3333-3333-3333-333333333333', null,
    'The light on that terrace is unreal. Was this really expired Portra?',
    now() - interval '90 minutes', now() - interval '90 minutes'
  ),
  (
    'd0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001',
    '44444444-4444-4444-4444-444444444444', null,
    'I want to sit exactly there with a coffee and no plans.',
    now() - interval '70 minutes', now() - interval '70 minutes'
  ),
  (
    'd0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001',
    '22222222-2222-2222-2222-222222222222', 'd0000000-0000-0000-0000-000000000001',
    'Yes — a roll that spent a little too long in a drawer. I love the surprise.',
    now() - interval '60 minutes', now() - interval '60 minutes'
  ),
  (
    'd0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000002',
    '22222222-2222-2222-2222-222222222222', null,
    'The jacaranda colour is perfect. Which street is this?',
    now() - interval '4 hours', now() - interval '4 hours'
  ),
  (
    'd0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000002',
    '33333333-3333-3333-3333-333333333333', 'd0000000-0000-0000-0000-000000000004',
    'A quiet block just off Francisco Sosa. Go early, before the runners arrive.',
    now() - interval '3 hours', now() - interval '3 hours'
  ),
  (
    'd0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000004',
    'b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', null,
    'The tiled stair is my favourite of the three. Such a good eye.',
    now() - interval '6 hours', now() - interval '6 hours'
  ),
  (
    'd0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000004',
    'b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1', 'd0000000-0000-0000-0000-000000000006',
    'Thank you — it took three walks to catch that light.',
    now() - interval '5 hours', now() - interval '5 hours'
  ),
  (
    'd0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000007',
    '66666666-6666-6666-6666-666666666666', null,
    'That sounds like the correct way to spend an afternoon in Gràcia.',
    now() - interval '18 hours', now() - interval '18 hours'
  );

-- ----------------------------------------------------------------------------
-- Marketplace catalog (admin-authored; price in minor units, SD-11)
-- ----------------------------------------------------------------------------
insert into public.marketplace_products (
  id, name, price_cents, currency, description,
  origin_label, contact_information, is_published, created_by
)
values
  ('b0000000-0000-0000-0000-000000000001', 'Handmade Oaxacan Leather Travel Bag', 12000, 'USD',
   'Full-grain vegetable-tanned leather crafted with the Velásquez artisan guild in Oaxaca.',
   'Oaxaca, MX',
   '+52 951 100 2201', true, '11111111-1111-1111-1111-111111111111'),
  ('b0000000-0000-0000-0000-000000000002', 'Artisanal Ceramic Espresso Set (Barcelona)', 6400, 'USD',
   'Hand-thrown speckled stoneware fired twice in a Gràcia family atelier.',
   'Barcelona, ES',
   null, true, '11111111-1111-1111-1111-111111111111'),
  ('b0000000-0000-0000-0000-000000000003', 'Bilingual Cultural Phrasebook & Journal (EN/ES)', 2400, 'USD',
   'Linen-bound official GlobalLinkup journal paired with a copper pen.',
   'Official Edition',
   '+34 612 345 679', true, '11111111-1111-1111-1111-111111111111'),
  ('b0000000-0000-0000-0000-000000000004', 'Handwoven Merino Wool Travel Throw', 8800, 'USD',
   'Extra-fine merino loomed on wooden looms in the Antioquian highlands.',
   'Medellín, CO',
   '+57 310 440 2288', true, '11111111-1111-1111-1111-111111111111'),
  ('b0000000-0000-0000-0000-000000000005', 'Specialty Roasted Chiapas Coffee Beans (500g)', 1900, 'USD',
   'Single-origin Typica and Bourbon grown at 1,600m by a smallholder collective.',
   'Chiapas, MX',
   '+52 967 100 3301', true, '11111111-1111-1111-1111-111111111111'),
  ('b0000000-0000-0000-0000-000000000006', 'Minimalist Passport & Document Wallet', 4500, 'USD',
   'RFID-shielded vegetable-tanned leather wallet cut and stitched in Madrid.',
   'Madrid, ES',
   '+34 612 345 680', true, '11111111-1111-1111-1111-111111111111');

-- A few more live pieces give the public grid a second page.
insert into public.marketplace_products (
  id, name, price_cents, currency, description,
  origin_label, contact_information, is_published, created_by
)
values
  ('b0000000-0000-0000-0000-000000000010', 'Hand-Thrown Clay Vase', 5800, 'USD',
   'A tall stoneware vase with a soft ash glaze from a family workshop in Oaxaca.',
   'Oaxaca, MX', '+52 951 100 2210', true, '11111111-1111-1111-1111-111111111111'),
  ('b0000000-0000-0000-0000-000000000011', 'Linen & Cotton Market Tote', 4200, 'USD',
   'A sturdy everyday tote woven and finished in a small Barcelona atelier.',
   'Barcelona, ES', '+34 612 345 682', true, '11111111-1111-1111-1111-111111111111'),
  ('b0000000-0000-0000-0000-000000000012', 'Bilingual Letterpress Notebook', 2800, 'USD',
   'A pocket notebook printed in Lisbon with a linen cover and warm cream pages.',
   'Lisbon, PT', '+351 913 440 221', true, '11111111-1111-1111-1111-111111111111'),
  ('b0000000-0000-0000-0000-000000000013', 'Woven Palm Market Basket', 4900, 'USD',
   'A lightweight market basket braided by hand in the Antioquian highlands.',
   'Medellín, CO', '+57 310 440 2290', true, '11111111-1111-1111-1111-111111111111');

-- Draft, unpublished and soft-deleted pieces exercise the admin lifecycle
-- filters. Public reads must only resolve the live rows above.
insert into public.marketplace_products (
  id, name, price_cents, currency, description,
  origin_label, contact_information, is_published, published_at, deleted_at, created_by
)
values
  ('b0000000-0000-0000-0000-000000000007', 'Prototype Woven Market Tote', 5500, 'USD',
   'A workshop prototype waiting for final material approval.',
   'Oaxaca, MX', '+52 951 100 2202', false, null, null,
   '11111111-1111-1111-1111-111111111111'),
  ('b0000000-0000-0000-0000-000000000008', 'Limited Stoneware Serving Bowl', 7200, 'USD',
   'A small-batch bowl taken down while the next glaze firing is scheduled.',
   'Barcelona, ES', '+34 612 345 681', false, now() - interval '10 days', null,
   '11111111-1111-1111-1111-111111111111'),
  ('b0000000-0000-0000-0000-000000000009', 'Archived Linen Table Runner', 3900, 'USD',
   'Retired sample kept in Trash for reference.',
   'Lisbon, PT', '+351 913 440 220', false, now() - interval '30 days',
   now() - interval '2 days', '11111111-1111-1111-1111-111111111111');

insert into public.marketplace_product_images (product_id, storage_path, sort)
values
  ('b0000000-0000-0000-0000-000000000001', 'product-images/seed/oaxaca-bag-01.jpg', 0),
  ('b0000000-0000-0000-0000-000000000001', 'product-images/seed/oaxaca-bag-02.jpg', 1),
  ('b0000000-0000-0000-0000-000000000002', 'product-images/seed/espresso-set-01.jpg', 0),
  ('b0000000-0000-0000-0000-000000000003', 'product-images/seed/phrasebook-01.jpg', 0),
  ('b0000000-0000-0000-0000-000000000004', 'product-images/seed/merino-throw-01.jpg', 0),
  ('b0000000-0000-0000-0000-000000000005', 'product-images/seed/chiapas-coffee-01.jpg', 0),
  ('b0000000-0000-0000-0000-000000000006', 'product-images/seed/passport-wallet-01.jpg', 0),
  ('b0000000-0000-0000-0000-000000000007', 'product-images/seed/market-tote-draft-01.jpg', 0),
  ('b0000000-0000-0000-0000-000000000008', 'product-images/seed/serving-bowl-01.jpg', 0),
  ('b0000000-0000-0000-0000-000000000008', 'product-images/seed/serving-bowl-02.jpg', 1),
  ('b0000000-0000-0000-0000-000000000009', 'product-images/seed/linen-runner-01.jpg', 0),
  ('b0000000-0000-0000-0000-000000000010', 'product-images/seed/clay-vase-01.jpg', 0),
  ('b0000000-0000-0000-0000-000000000011', 'product-images/seed/market-tote-01.jpg', 0),
  ('b0000000-0000-0000-0000-000000000012', 'product-images/seed/letterpress-01.jpg', 0),
  ('b0000000-0000-0000-0000-000000000013', 'product-images/seed/palm-basket-01.jpg', 0);

-- ----------------------------------------------------------------------------
-- Reports — open, resolved and dismissed queues
-- ----------------------------------------------------------------------------
insert into public.reports (
  id, reporter_id, target_type, target_user_id, target_post_id,
  reason, details, status, resolved_by, resolved_at, created_at
)
values
  (
    'e0000000-0000-0000-0000-000000000001',
    'b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1', 'post', null,
    'a0000000-0000-0000-0000-000000000003', 'inappropriate',
    'The caption includes a personal attack in the replies.',
    'open', null, null, now() - interval '3 hours'
  ),
  (
    'e0000000-0000-0000-0000-000000000002',
    'b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', 'user',
    'b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1', null, 'harassment',
    'Repeated unwelcome messages after a declined connection.',
    'open', null, null, now() - interval '8 hours'
  ),
  (
    'e0000000-0000-0000-0000-000000000003',
    'b3b3b3b3-b3b3-b3b3-b3b3-b3b3b3b3b3b3', 'post', null,
    'a0000000-0000-0000-0000-000000000007', 'spam',
    'Commercial link posted as a comment.',
    'resolved', '11111111-1111-1111-1111-111111111111',
    now() - interval '1 day', now() - interval '2 days'
  ),
  (
    'e0000000-0000-0000-0000-000000000004',
    'b5b5b5b5-b5b5-b5b5-b5b5-b5b5b5b5b5b5', 'user',
    'b4b4b4b4-b4b4-b4b4-b4b4-b4b4b4b4b4b4', null, 'other',
    'Reporter asked us to review a profile photo, but it meets the guidelines.',
    'dismissed', '11111111-1111-1111-1111-111111111111',
    now() - interval '2 days', now() - interval '3 days'
  ),
  (
    'e0000000-0000-0000-0000-000000000005',
    'b6b6b6b6-b6b6-b6b6-b6b6-b6b6b6b6b6b6', 'post', null,
    'a0000000-0000-0000-0000-000000000012', 'inappropriate',
    'Possible third-party photo without credit.',
    'open', null, null, now() - interval '1 hour'
  );

-- ----------------------------------------------------------------------------
-- Profile moderation history
-- ----------------------------------------------------------------------------
insert into public.profile_moderation_events (
  id, profile_id, admin_id, decision, reason, created_at
)
values
  (
    'f0000000-0000-0000-0000-000000000001',
    '99999999-9999-9999-9999-999999999999',
    '11111111-1111-1111-1111-111111111111', 'rejected',
    'The portrait was too dark to verify the member against the submitted photo. Please resubmit in natural light.',
    now() - interval '6 days'
  ),
  (
    'f0000000-0000-0000-0000-000000000002',
    'abababab-abab-abab-abab-abababababab',
    '11111111-1111-1111-1111-111111111111', 'suspended',
    'Repeated reports after a prior warning. Account restricted while the review is completed.',
    now() - interval '4 days'
  ),
  (
    'f0000000-0000-0000-0000-000000000003',
    'b7b7b7b7-b7b7-b7b7-b7b7-b7b7b7b7b7b7',
    '11111111-1111-1111-1111-111111111111', 'approved',
    'Profile and portrait verified.',
    now() - interval '13 days'
  );

-- ----------------------------------------------------------------------------
-- Platform settings (Admin → Settings, FR-9.5 / SD-12)
-- ----------------------------------------------------------------------------
insert into public.platform_settings (key, value)
values
  ('marketplace.contact', '{"whatsapp":"+34 612 345 678","whatsappLink":"https://wa.me/34612345678","email":"concierge@globallinkup.com"}'::jsonb),
  ('marketplace.currency', '"USD"'::jsonb);

commit;
