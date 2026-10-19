-- ============================================================================
-- Marketplace product form rework (admin)
--
-- The admin form now collects exactly what buyers need to reach the seller:
-- name, price, origin and a phone number. Categories and the availability
-- list are gone from the product model, so the columns (and the enum only
-- they used) are dropped rather than left as dead schema.
-- ============================================================================

alter table public.marketplace_products
  drop column if exists category,
  drop column if exists availability;

drop type if exists public.product_availability;
