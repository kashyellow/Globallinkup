-- ============================================================================
-- S2 — resubmit path (SB-1c)
--
-- FR-2.5: a rejected user edits their persona and resubmits -> back to pending.
-- The S1 privilege guard froze approval_status/submitted_at for non-admins, so
-- resubmit could not run on the RLS client. Broaden it to allow exactly the
-- `rejected -> pending` transition by the owner (and a fresh submitted_at);
-- every other status/role change stays admin-only. See s2-auth.md §6.
-- ============================================================================

create or replace function public.protect_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Service-role / seed (no JWT) and admins may change anything.
  if (select auth.uid()) is null or public.is_admin() then
    return new;
  end if;

  -- The owner may resubmit after a rejection (FR-2.5) and nothing else.
  if old.approval_status = 'rejected' and new.approval_status = 'pending' then
    new.role = old.role;
    new.reviewed_at = old.reviewed_at;
    new.reviewed_by = old.reviewed_by;
    return new;
  end if;

  new.role = old.role;
  new.approval_status = old.approval_status;
  new.submitted_at = old.submitted_at;
  new.reviewed_at = old.reviewed_at;
  new.reviewed_by = old.reviewed_by;
  return new;
end;
$$;
