-- ============================================================================
-- Discover search v2
--
-- The previous discover page loaded every approved profile and filtered in the
-- browser. That cannot scale and made search/filter feel page-scoped. This adds
-- a maintained, lower-cased search text to `profiles` (name, city, country,
-- headline, interests, and language names) plus a trigram index, then exposes
-- it through `profiles_public` for server-side filtering and pagination.
-- ============================================================================

create extension if not exists pg_trgm with schema extensions;

alter table public.profiles
  add column if not exists search_text text not null default '';

-- English + Spanish labels for the seeded interest keys. Custom labels are
-- already included verbatim by `array_to_string` in `profile_search_text`.
create or replace function public.interest_search_text(p_interests text[])
returns text
language sql
immutable
set search_path = ''
as $$
  select coalesce(
    pg_catalog.string_agg(
      pg_catalog.lower(
        coalesce(interest, '') || ' ' ||
        case pg_catalog.lower(interest)
          when 'architecture' then 'architecture arquitectura'
          when 'analogphotography' then 'analog photography fotografía analógica'
          when 'ceramicscraft' then 'ceramics craft cerámica oficio'
          when 'independentcinema' then 'independent cinema cine independiente'
          when 'culinaryheritage' then 'culinary heritage herencia culinaria'
          when 'hikingnature' then 'hiking nature senderismo naturaleza'
          when 'literature' then 'literature literatura'
          when 'latinmusic' then 'latin music música latina'
          else ''
        end
      ),
      ' '
    ),
    ''
  )
  from pg_catalog.unnest(p_interests) as interest;
$$;

-- Language codes plus their English/Spanish names. `languages` is JSONB in the
-- form [{ "code": "ES", "level": "native" }, …].
create or replace function public.language_search_text(p_languages jsonb)
returns text
language sql
immutable
set search_path = ''
as $$
  select coalesce(
    pg_catalog.string_agg(
      case pg_catalog.lower(coalesce(entry ->> 'code', ''))
        when 'es' then 'es spanish español'
        when 'en' then 'en english inglés'
        when 'pt' then 'pt portuguese portugués'
        when 'fr' then 'fr french francés'
        else pg_catalog.lower(coalesce(entry ->> 'code', ''))
      end,
      ' '
    ),
    ''
  )
  from pg_catalog.jsonb_array_elements(
    case
      when pg_catalog.jsonb_typeof(p_languages) = 'array' then p_languages
      else '[]'::jsonb
    end
  ) as entry;
$$;

create or replace function public.profile_search_text(
  p_display_name text,
  p_city text,
  p_country_code text,
  p_headline text,
  p_interests text[],
  p_languages jsonb
)
returns text
language sql
immutable
set search_path = ''
as $$
  select pg_catalog.lower(
    coalesce(p_display_name, '') || ' ' ||
    coalesce(p_city, '') || ' ' ||
    coalesce(p_country_code, '') || ' ' ||
    coalesce(p_headline, '') || ' ' ||
    coalesce(pg_catalog.array_to_string(p_interests, ' '), '') || ' ' ||
    public.interest_search_text(p_interests) || ' ' ||
    public.language_search_text(p_languages)
  );
$$;

create or replace function public.set_profile_search_text()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.search_text := public.profile_search_text(
    new.display_name,
    new.city,
    new.country_code,
    new.headline,
    new.interests,
    new.languages
  );
  return new;
end;
$$;

drop trigger if exists profiles_set_search_text on public.profiles;
create trigger profiles_set_search_text
  before insert or update of
    display_name,
    city,
    country_code,
    headline,
    interests,
    languages
  on public.profiles
  for each row execute function public.set_profile_search_text();

-- Backfill existing rows; the trigger keeps future writes in sync.
update public.profiles
set search_text = public.profile_search_text(
  display_name,
  city,
  country_code,
  headline,
  interests,
  languages
);

create index if not exists profiles_search_trgm_idx
  on public.profiles using gin (search_text extensions.gin_trgm_ops);

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
  p.search_text
from public.profiles p;

grant select on public.profiles_public to authenticated, service_role;
