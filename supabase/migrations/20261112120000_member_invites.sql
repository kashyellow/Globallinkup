-- ============================================================================
-- Member invites (ADR 0010)
--
-- An admin with the members desk invites a person by email
-- (`auth.admin.inviteUserByEmail`). The invite creates the `auth.users` row up
-- front; the name, optional photo and email language are staged here until the
-- invitee submits their persona. No `profiles` row exists before then, so an
-- unfinished invitee never reaches the members review queue. `save_persona`
-- approves an invited member on submit and audits it against the inviter.
-- ============================================================================

create table public.member_invites (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  display_name text not null,
  avatar_path text,
  locale text not null,
  invited_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  last_sent_at timestamptz not null default now(),
  opened_at timestamptz,
  accepted_at timestamptz,
  constraint member_invites_email_format
    check (email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' and email = lower(email)),
  constraint member_invites_display_name_length
    check (char_length(btrim(display_name)) between 2 and 60),
  constraint member_invites_avatar_owner
    check (avatar_path is null or split_part(avatar_path, '/', 1) = user_id::text),
  constraint member_invites_locale check (locale in ('en', 'es'))
);

alter table public.member_invites enable row level security;

create policy "member_invites_select"
  on public.member_invites for select
  to authenticated
  using (public.has_capability('members.review') or user_id = (select auth.uid()));

-- Writes go through the service role from server actions only.
revoke all on public.member_invites from anon, authenticated;
grant select on public.member_invites to authenticated;
grant all privileges on public.member_invites to service_role;

-- ---------------------------------------------------------------------------
-- save_persona: approve an invited member on first submit
-- ---------------------------------------------------------------------------

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

  -- Admins are operators, not members: they have no persona to create or edit.
  if exists (
    select 1 from public.profiles p where p.id = v_uid and p.role = 'admin'
  ) then
    raise exception 'admins cannot write a member persona' using errcode = '42501';
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
    -- An admin vouched for an invited member: no review queue.
    select i.invited_by, true into v_inviter, v_invited
    from public.member_invites i
    where i.user_id = v_uid and i.accepted_at is null;
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

    if v_invited then
      update public.member_invites set accepted_at = pg_catalog.now() where user_id = v_uid;
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
