-- ============================================================================
-- Atomic persona review
--
-- The status update and its audit reason must land together. Keep the
-- transition in one security-invoker function so the admin UI cannot write a
-- reason without changing status (or vice versa).
-- ============================================================================

create or replace function public.review_persona(
  p_profile_id uuid,
  p_decision public.approval_status,
  p_reason text default null
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_admin uuid := (select auth.uid());
begin
  if v_admin is null or not public.is_admin() then
    raise exception 'not authorized to review personas' using errcode = '42501';
  end if;

  if p_decision not in ('approved', 'rejected', 'suspended') then
    raise exception 'invalid review decision' using errcode = '22023';
  end if;

  if p_decision in ('rejected', 'suspended')
    and (p_reason is null or char_length(pg_catalog.btrim(p_reason)) < 10) then
    raise exception 'a reason is required for reject or suspend' using errcode = '22023';
  end if;

  update public.profiles
  set approval_status = p_decision,
      reviewed_at = pg_catalog.now(),
      reviewed_by = v_admin
  where id = p_profile_id
    and role = 'user';

  if not found then
    raise exception 'profile not found or not reviewable' using errcode = '42501';
  end if;

  insert into public.profile_moderation_events (profile_id, admin_id, decision, reason)
  values (
    p_profile_id,
    v_admin,
    p_decision,
    case
      when p_reason is null or pg_catalog.btrim(p_reason) = '' then null
      else pg_catalog.btrim(p_reason)
    end
  );

  return true;
end;
$$;

revoke all on function public.review_persona(uuid, public.approval_status, text) from public;
grant execute on function public.review_persona(uuid, public.approval_status, text)
  to authenticated;
