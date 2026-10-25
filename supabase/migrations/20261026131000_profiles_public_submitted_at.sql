-- ============================================================================
-- Admin needs the submission timestamp from the public profile view.
--
-- `profiles_public` already exposes age for discovery; adding `submitted_at`
-- lets the admin review queue sort pending personas without a second query.
-- The view remains security_invoker, so the underlying profiles RLS still
-- decides who can read the row.
-- ============================================================================

create or replace view public.profiles_public
with (security_invoker = true)
as
select
  p.id,
  p.display_name,
  p.country_code,
  p.city,
  p.neighborhood,
  p.avatar_url,
  p.bio_en,
  p.bio_es,
  p.headline,
  p.languages,
  p.interests,
  p.badge,
  p.role,
  p.approval_status,
  p.created_at,
  public.profile_age(p.id) as age,
  p.search_text,
  p.submitted_at
from public.profiles p;

grant select on public.profiles_public to authenticated, service_role;
