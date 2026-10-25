-- ============================================================================
-- Post comments
--
-- Comments are post engagement, not chat: no inbox, no realtime, no
-- notifications. Threads are deliberately one reply level deep so the UI stays
-- simple and the data cannot grow into an unbounded conversation tree.
-- ============================================================================

create table public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  parent_id uuid references public.post_comments (id) on delete cascade,
  body text not null,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint post_comments_body_length
    check (char_length(pg_catalog.btrim(body)) between 1 and 1000)
);

create index post_comments_post_created_idx
  on public.post_comments (post_id, created_at);
create index post_comments_parent_idx
  on public.post_comments (parent_id)
  where parent_id is not null;

create trigger post_comments_set_updated_at
  before update on public.post_comments
  for each row execute function public.set_updated_at();

-- The parent must exist, belong to the same post, and be a root comment.
-- Structure (post/author/parent/created_at) is immutable after insert; the
-- update path is only for soft deletion (and, later, body edits).
create or replace function public.protect_comment_thread()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_parent public.post_comments%rowtype;
begin
  if tg_op = 'UPDATE' then
    if new.post_id <> old.post_id
      or new.author_id <> old.author_id
      or new.parent_id is distinct from old.parent_id
      or new.created_at <> old.created_at then
      raise exception 'comment structure is immutable' using errcode = '42501';
    end if;
    return new;
  end if;

  if new.parent_id is null then
    return new;
  end if;

  select * into v_parent
  from public.post_comments
  where id = new.parent_id;

  if not found then
    raise exception 'parent comment not found' using errcode = '23503';
  end if;
  if v_parent.post_id <> new.post_id then
    raise exception 'parent comment belongs to another post' using errcode = '23514';
  end if;
  if v_parent.parent_id is not null then
    raise exception 'comments support one reply level' using errcode = '23514';
  end if;
  if v_parent.deleted_at is not null then
    raise exception 'cannot reply to a deleted comment' using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger post_comments_protect_thread
  before insert or update on public.post_comments
  for each row execute function public.protect_comment_thread();

alter table public.post_comments enable row level security;

-- Read comments only when the parent post is visible (or the viewer owns the
-- post / is an admin).
create policy "post_comments_select_visible"
  on public.post_comments for select
  to authenticated
  using (
    exists (
      select 1
      from public.posts p
      where p.id = post_comments.post_id
        and (
          (public.is_approved() and p.moderation_status = 'visible')
          or p.author_id = (select auth.uid())
          or public.is_admin()
        )
    )
  );

create policy "post_comments_insert_own"
  on public.post_comments for insert
  to authenticated
  with check (
    author_id = (select auth.uid())
    and public.is_approved()
    and deleted_at is null
    and exists (
      select 1
      from public.posts p
      where p.id = post_comments.post_id
        and p.moderation_status = 'visible'
    )
  );

-- Soft deletion (and possible edits) by the author; admins can moderate.
create policy "post_comments_update_own"
  on public.post_comments for update
  to authenticated
  using (
    author_id = (select auth.uid())
    or public.is_admin()
  )
  with check (
    author_id = (select auth.uid())
    or public.is_admin()
  );

grant select, insert, update on public.post_comments to authenticated;
grant all privileges on public.post_comments to service_role;

-- Hard deletes are intentionally not granted: deleted comments keep their
-- place in the thread so replies remain readable.
