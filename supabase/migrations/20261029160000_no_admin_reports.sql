-- ============================================================================
-- Reports are a member action
--
-- Admins moderate directly; filing a member report is part of the social
-- surface they are excluded from. Reuse `is_visible_member()` so the rule stays
-- aligned with likes and the connection graph.
-- ============================================================================

drop policy if exists "reports_insert_own" on public.reports;

create policy "reports_insert_own"
  on public.reports for insert
  to authenticated
  with check (
    reporter_id = (select auth.uid())
    and status = 'open'
    and public.is_visible_member((select auth.uid()))
  );
