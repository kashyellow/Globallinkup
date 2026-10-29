-- ============================================================================
-- Comment moderators can write their own audit rows
--
-- `comment.removed` is emitted by the comment moderator action, but
-- `record_audit()` only accepted the desk capabilities that existed when the
-- function was written. Add `comments.moderate` so a role that only moderates
-- comments still produces a trail.
-- ============================================================================

create or replace function public.record_audit(
  p_action text,
  p_target_type text default null,
  p_target_id uuid default null,
  p_reason text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_role text;
  v_id uuid;
begin
  if v_actor is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  if not (
    public.has_capability('posts.moderate')
    or public.has_capability('comments.moderate')
    or public.has_capability('members.review')
    or public.has_capability('interests.review')
    or public.has_capability('marketplace.manage')
    or public.has_capability('reports.manage')
    or public.has_capability('settings.manage')
    or public.has_capability('admins.manage')
  ) then
    raise exception 'not an admin' using errcode = '42501';
  end if;

  select r.slug into v_role
  from public.profiles p
  join public.admin_roles r on r.id = p.admin_role_id
  where p.id = v_actor;

  insert into public.audit_events (actor_id, actor_role, action, target_type, target_id, reason, metadata)
  values (v_actor, v_role, p_action, p_target_type, p_target_id, p_reason, coalesce(p_metadata, '{}'::jsonb))
  returning id into v_id;

  return v_id;
end;
$$;

comment on function public.record_audit(text, text, uuid, text, jsonb) is
  'Append one audit row for the calling admin. Metadata is ids and state only, never content.';

revoke all on function public.record_audit(text, text, uuid, text, jsonb) from public, anon;
grant execute on function public.record_audit(text, text, uuid, text, jsonb) to authenticated, service_role;
