-- ============================================================================
-- Post images
--
-- A post can carry a gallery. `posts.image_path` stays as the denormalised
-- cover used by feed cards; the complete ordered gallery lives here. The
-- backfill keeps every existing post renderable during the migration.
-- ============================================================================

create table public.post_images (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  storage_path text not null,
  sort integer not null default 0,
  created_at timestamptz not null default now(),
  constraint post_images_storage_path_length
    check (char_length(storage_path) between 1 and 400),
  constraint post_images_sort_range check (sort between 0 and 20),
  unique (post_id, sort)
);

create index post_images_post_idx on public.post_images (post_id, sort);

alter table public.post_images enable row level security;

-- Approved readers see the gallery of a visible post. Authors keep access to
-- their own removed posts; admins see everything.
create policy "post_images_select_visible"
  on public.post_images for select
  to authenticated
  using (
    exists (
      select 1
      from public.posts p
      where p.id = post_images.post_id
        and (
          (public.is_approved() and p.moderation_status = 'visible')
          or p.author_id = (select auth.uid())
          or public.is_admin()
        )
    )
  );

create policy "post_images_insert_author"
  on public.post_images for insert
  to authenticated
  with check (
    public.is_approved()
    and exists (
      select 1
      from public.posts p
      where p.id = post_images.post_id
        and p.author_id = (select auth.uid())
    )
  );

create policy "post_images_update_author"
  on public.post_images for update
  to authenticated
  using (
    exists (
      select 1
      from public.posts p
      where p.id = post_images.post_id
        and (p.author_id = (select auth.uid()) or public.is_admin())
    )
  )
  with check (
    exists (
      select 1
      from public.posts p
      where p.id = post_images.post_id
        and (p.author_id = (select auth.uid()) or public.is_admin())
    )
  );

create policy "post_images_delete_author"
  on public.post_images for delete
  to authenticated
  using (
    exists (
      select 1
      from public.posts p
      where p.id = post_images.post_id
        and (p.author_id = (select auth.uid()) or public.is_admin())
    )
  );

grant select, insert, update, delete on public.post_images to authenticated;
grant all privileges on public.post_images to service_role;

-- Existing posts keep their cover as image zero.
insert into public.post_images (post_id, storage_path, sort)
select id, image_path, 0
from public.posts
where image_path is not null
on conflict (post_id, sort) do nothing;

comment on column public.posts.image_path is
  'Denormalised cover image for feed cards. Full gallery: public.post_images.';
