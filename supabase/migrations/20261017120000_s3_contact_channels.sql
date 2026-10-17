-- ============================================================================
-- S3 — separate contact channels
--
-- The vault used to collect a single "chat" handle (WhatsApp or Telegram,
-- whichever the member typed) plus Instagram. Members now give each channel
-- its own field, and at least one must be present.
--
-- `contact_details.whatsapp` finally gets used; Telegram and the newer socials
-- go into the `other` jsonb bucket (SD-5). The signature changes, so the old
-- overload is dropped rather than shadowed — otherwise PostgREST sees two
-- candidates and every call is ambiguous.
-- ============================================================================

drop function if exists public.save_persona(
  text, text, text, text, text, text, jsonb, text[], date, text, text
);

create or replace function public.save_persona(
  p_display_name text,
  p_country_code text,
  p_city text,
  p_bio text default null,
  p_bio_locale text default null,
  p_languages jsonb default null,
  p_interests text[] default null,
  p_date_of_birth date default null,
  p_whatsapp text default null,
  p_telegram text default null,
  p_instagram text default null,
  p_facebook text default null,
  p_tiktok text default null,
  p_x text default null
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
  v_contacts jsonb;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  -- Fail closed: the vault is the whole point of an accepted connection, so a
  -- persona with no reachable channel is rejected here as well as in Zod.
  if coalesce(
    nullif(p_whatsapp, ''), nullif(p_telegram, ''), nullif(p_instagram, ''),
    nullif(p_facebook, ''), nullif(p_tiktok, ''), nullif(p_x, '')
  ) is null then
    raise exception 'at least one contact channel is required' using errcode = '22023';
  end if;

  v_contacts := pg_catalog.jsonb_strip_nulls(
    pg_catalog.jsonb_build_object(
      'telegram', nullif(p_telegram, ''),
      'facebook', nullif(p_facebook, ''),
      'tiktok', nullif(p_tiktok, ''),
      'x', nullif(p_x, '')
    )
  );

  select approval_status into v_status from public.profiles where id = v_uid;

  if not found then
    insert into public.profiles (
      id, display_name, country_code, city,
      bio_en, bio_es, languages, interests, approval_status, submitted_at
    )
    values (
      v_uid, p_display_name, p_country_code, p_city,
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

  insert into public.contact_details (profile_id, whatsapp, instagram, other)
  values (v_uid, nullif(p_whatsapp, ''), nullif(p_instagram, ''), v_contacts)
  on conflict (profile_id) do update set
    whatsapp = excluded.whatsapp,
    instagram = excluded.instagram,
    other = excluded.other;

  return v_status;
end;
$$;

revoke all on function public.save_persona(
  text, text, text, text, text, jsonb, text[], date, text, text, text, text, text, text
) from public;

grant execute on function public.save_persona(
  text, text, text, text, text, jsonb, text[], date, text, text, text, text, text, text
) to authenticated;
