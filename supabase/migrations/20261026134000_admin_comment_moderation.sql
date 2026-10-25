-- ============================================================================
-- Comments are moderated by admins only
--
-- Authors can add comments and replies, but cannot remove them. Moderation is
-- an admin action so a thread cannot be quietly rewritten by one participant.
-- ============================================================================

drop policy if exists "post_comments_update_own" on public.post_comments;

create policy "post_comments_update_admin"
  on public.post_comments for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
