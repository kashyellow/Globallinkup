-- ============================================================================
-- Post image access (ADR 0001, safety slice)
--
-- Before this migration any approved member could read any object in the
-- `post-images` bucket if they knew its path — including images of posts that had
-- been removed. The UI hid them; RLS did not. This gates reads on the owning
-- post instead of on the viewer alone.
--
-- Admins get no exception (round 1): removed content must not be downloadable,
-- even for moderation. The moderation desk falls back to a placeholder when the
-- post is not visible.
-- ============================================================================

-- Seed rows carried a `post-images/` bucket prefix that uploads never write.
-- Strip it so `post_images.storage_path` always equals the storage object name.
update public.post_images
set storage_path = regexp_replace(storage_path, '^post-images/', '')
where storage_path like 'post-images/%';

update public.posts
set image_path = regexp_replace(image_path, '^post-images/', '')
where image_path like 'post-images/%';

create index if not exists post_images_storage_path_idx
  on public.post_images (storage_path);

create or replace function public.can_read_post_image(p_path text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.post_images pi
    join public.posts p on p.id = pi.post_id
    where pi.storage_path = p_path
      and (
        p.moderation_status = 'visible'
        or p.author_id = (select auth.uid())
      )
  );
$$;

comment on function public.can_read_post_image(text) is
  'True for images of visible posts, or when the caller owns the post. Admin-removed content stays unreadable.';

-- Supabase grants EXECUTE to anon on new public functions by default.
revoke all on function public.can_read_post_image(text) from public, anon;
grant execute on function public.can_read_post_image(text) to authenticated, service_role;

drop policy if exists "post_images_select_approved" on storage.objects;

create policy "post_images_select_visible_or_author"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'post-images'
    and public.is_approved()
    and public.can_read_post_image(name)
  );
