-- ============================================================================
-- Post lifecycle (ADR 0001)
--
-- `moderation_status` was binary and could not express "hidden by the author but
-- kept" (archive) or "removed by an admin, pending purge". `state` becomes the
-- source of truth:
--
--   visible  -> in the feed
--   archived -> hidden by the author, permanent, revertible
--   removed  -> hidden by an admin, reason required, purged after 14 days
--
-- Author deletion is a hard delete, so there is deliberately no `deleted` state.
-- `moderation_status` is kept as a mirrored legacy column until the UI switches
-- to `state`; the mirror is maintained by the trigger below.
-- ============================================================================

create type public.post_state as enum ('visible', 'archived', 'removed');

alter table public.posts
  add column state public.post_state not null default 'visible',
  add column archived_at timestamptz,
  add column removed_reason text,
  add column previous_state public.post_state,
  add column purge_after timestamptz,
  add constraint posts_removed_reason_length
    check (removed_reason is null or char_length(removed_reason) between 10 and 500);

update public.posts
set state = case
  when moderation_status = 'visible' then 'visible'::public.post_state
  else 'removed'::public.post_state
end;

update public.posts
set purge_after = coalesce(removed_at, now()) + interval '14 days'
where state = 'removed';

create index posts_purge_after_idx
  on public.posts (purge_after)
  where state = 'removed';

create index posts_author_state_idx
  on public.posts (author_id, state, created_at desc);

-- ----------------------------------------------------------------------------
-- Guard + legacy mirror
--
-- Authors may only hide and unhide their own post. Everything the moderator owns
-- (removal metadata, purge deadline) is forced back to its previous value, so a
-- crafted update cannot shorten the appeal window or clear a reason.
-- ----------------------------------------------------------------------------

create or replace function public.protect_post_state()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and (select auth.uid()) is not null and not public.is_admin() then
    if new.state is distinct from old.state and new.state not in ('visible', 'archived') then
      raise exception 'illegal post state transition % -> %', old.state, new.state
        using errcode = '42501';
    end if;
    new.removed_by := old.removed_by;
    new.removed_at := old.removed_at;
    new.removed_reason := old.removed_reason;
    new.previous_state := old.previous_state;
    new.purge_after := old.purge_after;
  end if;

  -- Legacy mirror for the queries that still filter on moderation_status.
  new.moderation_status := case
    when new.state = 'visible' then 'visible'::public.moderation_status
    else 'removed'::public.moderation_status
  end;

  return new;
end;
$$;

drop trigger if exists posts_protect_moderation on public.posts;
drop function if exists public.protect_post_moderation();

create trigger posts_protect_state
  before insert or update on public.posts
  for each row execute function public.protect_post_state();

-- ----------------------------------------------------------------------------
-- Policies
-- ----------------------------------------------------------------------------

drop policy if exists "posts_select_visible" on public.posts;
create policy "posts_select_visible"
  on public.posts for select
  to authenticated
  using (
    (public.is_approved() and state = 'visible')
    or author_id = (select auth.uid())
    or public.is_admin()
  );

drop policy if exists "posts_insert_author" on public.posts;
create policy "posts_insert_author"
  on public.posts for insert
  to authenticated
  with check (
    author_id = (select auth.uid())
    and state = 'visible'
    and public.is_approved()
  );

-- Hard delete: the author removes their own post and its storage objects. A
-- post removed by an admin cannot be deleted by the author while the appeal
-- window is open.
drop policy if exists "posts_delete_author" on public.posts;
create policy "posts_delete_author"
  on public.posts for delete
  to authenticated
  using (author_id = (select auth.uid()) and state <> 'removed');

drop policy if exists "posts_delete_admin" on public.posts;
create policy "posts_delete_admin"
  on public.posts for delete
  to authenticated
  using (public.is_admin());

-- ----------------------------------------------------------------------------
-- Feed view: expose the lifecycle fields, keep the old column for compatibility
-- ----------------------------------------------------------------------------

create or replace view public.posts_feed
with (security_invoker = true)
as
select
  p.id,
  p.author_id,
  p.image_path,
  p.caption,
  p.moderation_status,
  p.created_at,
  p.updated_at,
  pr.display_name as author_name,
  pr.country_code as author_country_code,
  pr.city as author_city,
  pr.avatar_url as author_avatar_url,
  (
    select count(*)::integer
    from public.post_comments c
    where c.post_id = p.id
      and c.deleted_at is null
  ) as comment_count,
  (
    select count(*)::integer
    from public.post_likes l
    where l.post_id = p.id
  ) as like_count,
  p.state,
  p.archived_at,
  p.removed_reason,
  p.purge_after
from public.posts p
left join public.profiles_public pr on pr.id = p.author_id
where pr.id is not null
   or public.is_admin_author(p.author_id);

grant select on public.posts_feed to authenticated, service_role;
