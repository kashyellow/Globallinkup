-- ============================================================================
-- Avatars — the owner may read their own object regardless of approval
--
-- The onboarding form lets a pending/rejected member upload a photo, but the
-- only SELECT policy required `is_approved()`, so a rejected member resubmitting
-- could not see the avatar they had just uploaded. Policies are OR-ed, so this
-- adds the owner path without widening anyone else's access.
-- ============================================================================

drop policy if exists "avatars_select_own" on storage.objects;
create policy "avatars_select_own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
