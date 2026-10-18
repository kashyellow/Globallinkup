-- ============================================================================
-- S3.0 — Storage buckets + RLS (brought forward from S4)
--
-- Posts, marketplace products and avatars all render images, so the pillars
-- cannot go live without somewhere to put them. Buckets are PRIVATE: reads go
-- through short-lived signed URLs generated server-side, so RLS still decides
-- who may see what. Paths are `<user-id>/<uuid>.<ext>`, which lets the policies
-- authorise writes by folder.
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', false, 5242880, array['image/png', 'image/jpeg', 'image/webp']),
  ('post-images', 'post-images', false, 10485760, array['image/png', 'image/jpeg', 'image/webp']),
  ('product-images', 'product-images', false, 10485760, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ----------------------------------------------------------------------------
-- avatars — owner writes (even while pending, needed during onboarding),
-- approved users read.
-- ----------------------------------------------------------------------------
drop policy if exists "avatars_select_approved" on storage.objects;
create policy "avatars_select_approved"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'avatars' and public.is_approved());

drop policy if exists "avatars_write_own" on storage.objects;
create policy "avatars_write_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "avatars_update_own" on storage.objects;
create policy "avatars_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "avatars_delete_own" on storage.objects;
create policy "avatars_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- ----------------------------------------------------------------------------
-- post-images — approved users read, approved owners write.
-- ----------------------------------------------------------------------------
drop policy if exists "post_images_select_approved" on storage.objects;
create policy "post_images_select_approved"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'post-images' and public.is_approved());

drop policy if exists "post_images_write_own" on storage.objects;
create policy "post_images_write_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'post-images'
    and public.is_approved()
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "post_images_delete_own" on storage.objects;
create policy "post_images_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'post-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- ----------------------------------------------------------------------------
-- product-images — approved users read, admins write (catalog is official).
-- ----------------------------------------------------------------------------
drop policy if exists "product_images_select_approved" on storage.objects;
create policy "product_images_select_approved"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'product-images' and public.is_approved());

drop policy if exists "product_images_write_admin" on storage.objects;
create policy "product_images_write_admin"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "product_images_delete_admin" on storage.objects;
create policy "product_images_delete_admin"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'product-images' and public.is_admin());
