-- ============================================================================
-- Marketplace catalog: drop legacy display columns
--
-- The public catalog renders only name, price, description, origin and the
-- seller contact, and the admin form collects nothing else. `sku`, `summary`,
-- `badge` and `specs` are dead schema: drop them rather than keep columns no
-- writer or reader touches. The unique index on `sku` and the length checks on
-- `sku`/`summary` are dropped along with their columns.
-- ============================================================================

alter table public.marketplace_products
  drop column if exists sku,
  drop column if exists summary,
  drop column if exists badge,
  drop column if exists specs;
