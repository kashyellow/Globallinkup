-- ============================================================================
-- S3 — drop the dead `profiles.origin_flavor` column (SC-9)
--
-- SD-4 originally added it, but the later UI update removed the "anchor" field
-- and `save_persona` stopped accepting it. Nothing reads the column any more.
-- ============================================================================

alter table public.profiles drop column if exists origin_flavor;
