-- ============================================================================
-- Marketplace: contact email and phone live on the product
--
-- The admin collects them in the product create/edit form, so each piece can
-- name its own concierge. Blank means "use the catalog-wide concierge contact"
-- (`platform_settings.marketplace.contact`). The phone keeps its country code:
-- the public side derives `tel:` and `wa.me` links from it.
-- ============================================================================

alter table public.marketplace_products
  add column if not exists contact_email text,
  add column if not exists contact_phone text,
  add constraint marketplace_products_contact_email_len
    check (contact_email is null or char_length(contact_email) <= 200),
  add constraint marketplace_products_contact_phone_len
    check (contact_phone is null or char_length(contact_phone) <= 40);
