-- ============================================================================
-- Purge, appeals and notifications (ADR 0001 / ADR 0004)
--
-- * Comment bodies are blanked 14 days after deletion; the tombstone stays so
--   threads never lose their shape.
-- * A removed post can be appealed once; the admin answers once.
-- * Notifications are rows with a deep link, written by the server only.
-- * `purge_expired_content()` is the single entry point used by the daily cron
--   and by `scripts/purge.mjs`; it returns the storage paths the caller must
--   delete.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Comment content purge
-- ----------------------------------------------------------------------------

alter table public.post_comments
  alter column body drop not null,
  drop constraint if exists post_comments_body_length,
  add constraint post_comments_body_length
    check (body is null or char_length(pg_catalog.btrim(body)) between 1 and 1000),
  add column purged_at timestamptz;

-- ----------------------------------------------------------------------------
-- Moderation appeals
-- ----------------------------------------------------------------------------

create type public.appeal_status as enum ('open', 'accepted', 'declined');

create table public.post_appeals (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  message text not null,
  status public.appeal_status not null default 'open',
  admin_id uuid references public.profiles (id) on delete set null,
  admin_note text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  constraint post_appeals_message_length
    check (char_length(pg_catalog.btrim(message)) between 10 and 500),
  constraint post_appeals_note_length
    check (admin_note is null or char_length(pg_catalog.btrim(admin_note)) between 1 and 500)
);

create unique index post_appeals_one_open_idx
  on public.post_appeals (post_id)
  where status = 'open';

create index post_appeals_author_idx
  on public.post_appeals (author_id, created_at desc);

alter table public.post_appeals enable row level security;

create policy post_appeals_select_own
  on public.post_appeals for select
  to authenticated
  using (author_id = (select auth.uid()));

create policy post_appeals_select_admin
  on public.post_appeals for select
  to authenticated
  using (public.is_admin());

create policy post_appeals_insert_own
  on public.post_appeals for insert
  to authenticated
  with check (
    author_id = (select auth.uid())
    and status = 'open'
    and exists (
      select 1
      from public.posts p
      where p.id = post_id
        and p.author_id = (select auth.uid())
        and p.state = 'removed'
    )
  );

create policy post_appeals_update_admin
  on public.post_appeals for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- Notifications
-- ----------------------------------------------------------------------------

create type public.notification_type as enum (
  'post.removed',
  'post.restored',
  'appeal.declined',
  'persona.approved',
  'persona.rejected',
  'persona.suspended',
  'interest.approved',
  'interest.rejected'
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  type public.notification_type not null,
  target_type text,
  target_id uuid,
  reason text,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '90 days'
);

create index notifications_recipient_idx
  on public.notifications (recipient_id, created_at desc);

create index notifications_unread_idx
  on public.notifications (recipient_id)
  where read_at is null;

alter table public.notifications enable row level security;

create policy notifications_select_own
  on public.notifications for select
  to authenticated
  using (recipient_id = (select auth.uid()));

create policy notifications_update_own
  on public.notifications for update
  to authenticated
  using (recipient_id = (select auth.uid()))
  with check (recipient_id = (select auth.uid()));

-- Rows are written by the service role only; clients cannot forge or delete.
revoke insert, delete on public.notifications from anon, authenticated;

-- ----------------------------------------------------------------------------
-- Purge
-- ----------------------------------------------------------------------------

create or replace function public.purge_expired_content(p_dry_run boolean default false)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cutoff timestamptz := pg_catalog.now() - interval '14 days';
  v_paths text[] := '{}';
  v_posts integer := 0;
  v_comments integer := 0;
  v_notifications integer := 0;
begin
  select count(*)::integer
  into v_comments
  from public.post_comments
  where deleted_at is not null
    and deleted_at < v_cutoff
    and body is not null;

  select count(*)::integer
  into v_posts
  from public.posts
  where state = 'removed'
    and purge_after is not null
    and purge_after < pg_catalog.now();

  select coalesce(pg_catalog.array_agg(distinct path), '{}')
  into v_paths
  from (
    select pi.storage_path as path
    from public.post_images pi
    join public.posts p on p.id = pi.post_id
    where p.state = 'removed'
      and p.purge_after is not null
      and p.purge_after < pg_catalog.now()
    union
    select p.image_path
    from public.posts p
    where p.state = 'removed'
      and p.purge_after is not null
      and p.purge_after < pg_catalog.now()
      and p.image_path is not null
  ) paths
  where path is not null;

  select count(*)::integer
  into v_notifications
  from public.notifications
  where expires_at < pg_catalog.now();

  if not p_dry_run then
    update public.post_comments
    set body = null, purged_at = pg_catalog.now()
    where deleted_at is not null
      and deleted_at < v_cutoff
      and body is not null;

    delete from public.posts
    where state = 'removed'
      and purge_after is not null
      and purge_after < pg_catalog.now();

    delete from public.notifications
    where expires_at < pg_catalog.now();
  end if;

  return pg_catalog.jsonb_build_object(
    'dry_run', p_dry_run,
    'posts', v_posts,
    'comments', v_comments,
    'notifications', v_notifications,
    'paths', to_jsonb(v_paths)
  );
end;
$$;

comment on function public.purge_expired_content(boolean) is
  'Daily purge: removed posts past their deadline, deleted comment bodies, expired notifications. Returns storage paths for the caller to delete.';

revoke all on function public.purge_expired_content(boolean) from public, anon, authenticated;
grant execute on function public.purge_expired_content(boolean) to service_role;
