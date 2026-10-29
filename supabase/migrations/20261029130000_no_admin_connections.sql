-- ============================================================================
-- Admins are outside the social graph
--
-- A member cannot request an admin (recipient must be a visible member) and an
-- admin cannot request a member either: support may read and remove connections,
-- but never create one. The trigger also covers any write path that bypasses the
-- insert policy.
-- ============================================================================

drop policy if exists "connections_insert_requester" on public.connections;

create policy "connections_insert_requester"
  on public.connections for insert
  to authenticated
  with check (
    requester_id = (select auth.uid())
    and status = 'requested'
    and public.is_approved()
    and public.is_visible_member(requester_id)
    and public.is_visible_member(recipient_id)
  );

create or replace function public.protect_connection_parties()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1
    from public.profiles p
    where p.id in (new.requester_id, new.recipient_id)
      and p.role = 'admin'
  ) then
    raise exception 'admins cannot hold connections' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists connections_no_admin on public.connections;
create trigger connections_no_admin
  before insert or update on public.connections
  for each row execute function public.protect_connection_parties();
