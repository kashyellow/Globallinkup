-- ============================================================================
-- S5 — index untuk pola akses listing + constraint konten
--
-- Index ini mengikuti query yang benar-benar dipakai:
--   discovery  : profiles_public (approved, role=user, urut display_name)
--   nav badge  : connections (recipient_id, status)
--   feed       : posts (moderation_status, created_at desc)
--   katalog    : marketplace_products (is_published, created_at desc)
--   moderasi   : reports (status, created_at desc) + target_post_id
--
-- Constraint konten melengkapi Zod di Server Action. PostgREST dapat dipanggil
-- langsung dengan anon key + JWT, jadi batas panjang harus ada di database.
-- `not valid` menjaga migrasi tetap aman pada data lama; baris baru/update
-- tetap diperiksa.
-- ============================================================================

create index if not exists profiles_discovery_idx
  on public.profiles (approval_status, role, display_name)
  where approval_status = 'approved' and role = 'user';

create index if not exists connections_recipient_status_idx
  on public.connections (recipient_id, status);

create index if not exists connections_requester_status_idx
  on public.connections (requester_id, status);

create index if not exists posts_feed_idx
  on public.posts (moderation_status, created_at desc);

create index if not exists marketplace_products_catalog_idx
  on public.marketplace_products (is_published, created_at desc);

create index if not exists reports_status_created_idx
  on public.reports (status, created_at desc);

create index if not exists reports_target_post_idx
  on public.reports (target_post_id)
  where target_post_id is not null;

-- ----------------------------------------------------------------------------
-- Content constraints
-- ----------------------------------------------------------------------------

alter table public.profiles
  add constraint profiles_display_name_length
    check (char_length(display_name) between 2 and 120) not valid,
  add constraint profiles_country_code_length
    check (country_code is null or char_length(country_code) = 2) not valid,
  add constraint profiles_city_length
    check (city is null or char_length(city) <= 120) not valid,
  add constraint profiles_neighborhood_length
    check (neighborhood is null or char_length(neighborhood) <= 120) not valid,
  add constraint profiles_bio_en_length
    check (bio_en is null or char_length(bio_en) <= 160) not valid,
  add constraint profiles_bio_es_length
    check (bio_es is null or char_length(bio_es) <= 160) not valid,
  add constraint profiles_languages_shape
    check (
      case
        when jsonb_typeof(languages) = 'array' then jsonb_array_length(languages) <= 10
        else false
      end
    ) not valid,
  add constraint profiles_interests_length
    check (array_length(interests, 1) is null or array_length(interests, 1) <= 20) not valid;

alter table public.contact_details
  add constraint contact_details_whatsapp_length
    check (whatsapp is null or char_length(whatsapp) <= 40) not valid,
  add constraint contact_details_instagram_length
    check (instagram is null or char_length(instagram) <= 60) not valid,
  add constraint contact_details_email_length
    check (email is null or char_length(email) <= 254) not valid;

alter table public.posts
  add constraint posts_caption_length
    check (caption is null or char_length(caption) <= 600) not valid;

alter table public.reports
  add constraint reports_details_length
    check (details is null or char_length(details) <= 1000) not valid,
  add constraint reports_reason_allowed
    check (reason in ('spam', 'harassment', 'inappropriate', 'other')) not valid;

alter table public.marketplace_products
  add constraint marketplace_products_name_length
    check (char_length(name) between 2 and 160) not valid,
  add constraint marketplace_products_sku_length
    check (sku is null or char_length(sku) <= 80) not valid,
  add constraint marketplace_products_summary_length
    check (summary is null or char_length(summary) <= 400) not valid,
  add constraint marketplace_products_description_length
    check (description is null or char_length(description) <= 2000) not valid,
  add constraint marketplace_products_origin_length
    check (origin_label is null or char_length(origin_label) <= 120) not valid,
  add constraint marketplace_products_contact_length
    check (contact_information is null or char_length(contact_information) <= 60) not valid;
