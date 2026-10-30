-- ============================================================================
-- Marketplace concierge contact is editable from the admin portal
--
-- ADR 0009. `platform_settings.marketplace.contact` holds the single email and
-- phone members use to order from the curated catalog. It used to be writable
-- only through `settings.manage` (owner by default), so the marketplace team had
-- to edit the database by hand. The marketplace desk now owns that one row:
-- `marketplace.manage` writes `marketplace.contact` and nothing else, while
-- `settings.manage` keeps its blanket write.
--
-- No row is inserted here: a cloud project starts with no contact configured,
-- and the admin portal fills it in (the public side warns until then).
-- ============================================================================

drop policy if exists "platform_settings_write_admin" on public.platform_settings;
create policy "platform_settings_write_admin"
  on public.platform_settings for all
  to authenticated
  using (
    public.has_capability('settings.manage')
    or (key = 'marketplace.contact' and public.has_capability('marketplace.manage'))
  )
  with check (
    public.has_capability('settings.manage')
    or (key = 'marketplace.contact' and public.has_capability('marketplace.manage'))
  );
