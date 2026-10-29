-- ============================================================================
-- Likes are a member action
--
-- Admins stay on the platform side of the wall: they may read counts and keep
-- commenting (announcements), but they cannot add likes. `is_visible_member()`
-- already encodes "approved member with role = 'user'", so reusing it keeps the
-- rule in one place.
-- ============================================================================

drop policy if exists "post_likes_insert_own" on public.post_likes;

create policy "post_likes_insert_own"
  on public.post_likes for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and public.is_visible_member((select auth.uid()))
  );
