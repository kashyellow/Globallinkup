-- ============================================================================
-- Admins can edit their own profile
--
-- Drops the admins-cannot-write guard from `save_persona`. Admin rows always
-- exist (bootstrap flow), so an admin only reaches the UPDATE branch, which
-- never touches `role` or `admin_role_id`.
-- ============================================================================

create or replace function public.save_persona(
  p_display_name text,
  p_country_code text,
  p_city text,
  p_bio text default null,
  p_bio_locale text default null,
  p_languages jsonb default null,
  p_date_of_birth date default null,
  p_whatsapp text default null,
  p_telegram text default null,
  p_instagram text default null,
  p_facebook text default null,
  p_tiktok text default null,
  p_x text default null,
  p_avatar_url text default null,
  p_headline text default null
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
  v_avatar text := nullif(p_avatar_url, '');
  v_headline text := nullif(pg_catalog.btrim(p_headline), '');
  v_inviter uuid;
  v_invited boolean := false;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  if coalesce(
    nullif(p_whatsapp, ''), nullif(p_telegram, ''), nullif(p_instagram, ''),
    nullif(p_facebook, ''), nullif(p_tiktok, ''), nullif(p_x, '')
  ) is null then
    raise exception 'at least one contact channel is required' using errcode = '22023';
  end if;

  if v_avatar is not null and split_part(v_avatar, '/', 1) <> v_uid::text then
    raise exception 'avatar path must belong to the caller' using errcode = '22023';
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
    -- An admin vouched for an invited member: no review queue. Only for the
    -- session that opened the emailed link, after the terms step.
    select i.invited_by, true into v_inviter, v_invited
    from public.member_invites i
    where i.user_id = v_uid
      and i.accepted_at is null
      and i.terms_accepted_at is not null
      and i.verified_session_id::text = (auth.jwt() ->> 'session_id');
    v_invited := coalesce(v_invited, false);
    v_status := case when v_invited then 'approved' else 'pending' end;

    insert into public.profiles (
      id, display_name, country_code, city, avatar_url, headline,
      bio_en, bio_es, languages, approval_status, submitted_at
    )
    values (
      v_uid, p_display_name, p_country_code, p_city, v_avatar, v_headline,
      case when p_bio_locale = 'es' then null else p_bio end,
      case when p_bio_locale = 'es' then p_bio else null end,
      p_languages, v_status, pg_catalog.now()
    );

    -- A persona closes any open invite; unverified ones go through review.
    update public.member_invites set accepted_at = pg_catalog.now()
    where user_id = v_uid and accepted_at is null;
    if v_invited then
      insert into public.audit_events (actor_id, action, target_type, target_id)
      values (v_inviter, 'member.invite_accepted', 'profile', v_uid);
    end if;
  else
    v_resubmit := v_status = 'rejected';
    update public.profiles set
      display_name = p_display_name,
      country_code = p_country_code,
      city = p_city,
      avatar_url = coalesce(v_avatar, avatar_url),
      headline = v_headline,
      bio_en = case when p_bio_locale = 'es' then bio_en else p_bio end,
      bio_es = case when p_bio_locale = 'es' then p_bio else bio_es end,
      languages = p_languages,
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
