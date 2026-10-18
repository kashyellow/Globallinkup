-- ============================================================================
-- S3a — `profiles_public` view
--
-- Discovery needs age (derived from the private date of birth) alongside the
-- public columns, in one read. `security_invoker` keeps the `profiles` RLS in
-- charge, so the view exposes exactly what the caller may already read.
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
  public.profile_age(p.id) as age
from public.profiles p;

grant select on public.profiles_public to authenticated, service_role;
