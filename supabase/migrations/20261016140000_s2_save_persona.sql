-- ============================================================================
-- S2 fixes — atomic persona write (F-S2-5 / F-S2-6)
--
-- The JS action wrote profiles -> profile_private -> contact_details in three
-- calls, so a mid-way failure left half a persona. This single security-definer
-- RPC does all three in one transaction, enforces ownership via auth.uid(),
-- and clears the date of birth when the field is emptied.
-- ============================================================================

create or replace function public.save_persona(
  p_display_name text,
  p_country_code text,
  p_city text,
  p_origin_flavor text default null,
  p_bio text default null,
  p_bio_locale text default null,
  p_languages jsonb default null,
  p_interests text[] default null,
  p_date_of_birth date default null,
  p_instagram text default null,
  p_chat text default null
)
returns public.approval_status
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_status public.approval_status;
  v_resubmit boolean := false;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  select approval_status into v_status from public.profiles where id = v_uid;

  if not found then
    insert into public.profiles (
      id, display_name, country_code, city, origin_flavor,
      bio_en, bio_es, languages, interests, approval_status, submitted_at
    )
    values (
      v_uid, p_display_name, p_country_code, p_city, p_origin_flavor,
      case when p_bio_locale = 'es' then null else p_bio end,
      case when p_bio_locale = 'es' then p_bio else null end,
      p_languages, p_interests, 'pending', pg_catalog.now()
    );
    v_status := 'pending';
  else
    v_resubmit := v_status = 'rejected';
    update public.profiles set
      display_name = p_display_name,
      country_code = p_country_code,
      city = p_city,
      origin_flavor = p_origin_flavor,
      bio_en = case when p_bio_locale = 'es' then bio_en else p_bio end,
      bio_es = case when p_bio_locale = 'es' then p_bio else bio_es end,
      languages = p_languages,
      interests = p_interests,
      approval_status = case when v_resubmit then 'pending' else approval_status end,
      submitted_at = case when v_resubmit then pg_catalog.now() else submitted_at end
    where id = v_uid;

    select p.approval_status into v_status from public.profiles p where p.id = v_uid;
  end if;

  if p_date_of_birth is null then
    delete from public.profile_private where profile_id = v_uid;
  else
    insert into public.profile_private (profile_id, date_of_birth)
    values (v_uid, p_date_of_birth)
    on conflict (profile_id) do update set date_of_birth = excluded.date_of_birth;
  end if;

  insert into public.contact_details (profile_id, instagram, other)
  values (
    v_uid,
    p_instagram,
    case
      when p_chat is null or p_chat = '' then '{}'::jsonb
      else pg_catalog.jsonb_build_object('chat', p_chat)
    end
  )
  on conflict (profile_id) do update set
    instagram = excluded.instagram,
    other = excluded.other;

  return v_status;
end;
$$;

revoke all on function public.save_persona(
  text, text, text, text, text, text, jsonb, text[], date, text, text
) from public;

grant execute on function public.save_persona(
  text, text, text, text, text, text, jsonb, text[], date, text, text
) to authenticated;
