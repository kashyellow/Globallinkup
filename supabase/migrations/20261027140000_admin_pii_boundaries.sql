-- ============================================================================
-- PII access boundaries (ADR 0005)
--
-- `contact_details` (WhatsApp, Telegram, Instagram, Facebook, TikTok, X, email)
-- and `profile_private` (date of birth) are personal data. They were readable by
-- any admin, which contradicts the rule that a contact channel is disclosed only
-- to someone the member consciously accepted.
--
-- Admins lose both. The dossier keeps the derived age and the public profile
-- fields; the moderation desk no longer renders contact channels.
-- ============================================================================

-- Both tables also carried a `for all` admin policy, which grants SELECT as well;
-- drop it so no admin path remains.
drop policy if exists "contact_details_select_admin" on public.contact_details;
drop policy if exists "contact_details_write_admin" on public.contact_details;
drop policy if exists "profile_private_select_admin" on public.profile_private;
drop policy if exists "profile_private_write_admin" on public.profile_private;

comment on table public.contact_details is
  'Private channels. Readable by the owner and by accepted connections only — never by admins.';

comment on table public.profile_private is
  'Owner-only private fields (date of birth). Admins see profile_age(), never the raw value.';
