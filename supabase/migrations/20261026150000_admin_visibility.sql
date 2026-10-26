-- ============================================================================
-- Admin invisibility
--
-- Admins are operators, not members: they sign in, review, and publish the
-- occasional announcement, but they must never show up in Discover, a persona
-- dossier, the connection graph, or the public profile view.
--
-- The block lives in RLS, not the UI (AGENTS.md: never hide with UI). Every
-- people-facing read goes through `profiles_public` / `posts_feed`, both
-- `security_invoker`, so narrowing the `profiles` policies hides admins
-- everywhere at once.
--
-- Admin *posts* stay visible on purpose (announcements). `posts_feed` keeps them
-- through a LEFT JOIN plus `is_admin_author()`: the author columns resolve to
-- null, and the app renders the platform label instead of a persona.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Helpers
-- ----------------------------------------------------------------------------

-- Approved member (role `user`). Policies use this instead of a bare subquery so
-- reading `profiles` inside a policy cannot recurse through its own RLS.
create or replace function public.is_visible_member(p_id uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = p_id
      and p.role = 'user'
      and p.approval_status = 'approved'
  );
$$;

comment on function public.is_visible_member(uuid) is
  'True for approved member profiles; admins stay invisible to everyone but admins.';

-- Used only by `posts_feed`, so a visible post keeps rendering when its admin
-- author is hidden from `profiles_public`.
create or replace function public.is_admin_author(p_id uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = p_id
      and p.role = 'admin'
  );
$$;

comment on function public.is_admin_author(uuid) is
  'True for admin profiles. Only `posts_feed` uses it, to keep announcements visible.';

revoke all on function public.is_visible_member(uuid) from public;
revoke all on function public.is_admin_author(uuid) from public;
grant execute on function public.is_visible_member(uuid) to authenticated, service_role;
grant execute on function public.is_admin_author(uuid) to authenticated, service_role;

-- ----------------------------------------------------------------------------
-- Profiles: approved members only
--
-- Own rows stay readable through `profiles_select_own`, and admins read
-- everything through `profiles_select_admin`, so dropping `role = 'user'` from
-- the approved-member branch hides only admins.
-- ----------------------------------------------------------------------------

drop policy if exists "profiles_select_approved" on public.profiles;

create policy "profiles_select_approved"
  on public.profiles for select
  to authenticated
  using (
    public.is_approved()
    and approval_status = 'approved'
    and role = 'user'
  );

-- ----------------------------------------------------------------------------
-- Connections: nobody can request an invisible profile
--
-- Without this, a crafted insert could still open a connection to an admin and
-- unlock their contact details once accepted.
-- ----------------------------------------------------------------------------

drop policy if exists "connections_insert_requester" on public.connections;

create policy "connections_insert_requester"
  on public.connections for insert
  to authenticated
  with check (
    requester_id = (select auth.uid())
    and status = 'requested'
    and public.is_approved()
    and public.is_visible_member(recipient_id)
  );

-- ----------------------------------------------------------------------------
-- Feed: show member posts, plus admin announcements with a masked author
--
-- A plain LEFT JOIN would also resurrect posts from suspended or rejected
-- authors, so the WHERE keeps the old "visible profile" rule and re-admits
-- admins explicitly.
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
  ) as like_count
from public.posts p
left join public.profiles_public pr on pr.id = p.author_id
where pr.id is not null
   or public.is_admin_author(p.author_id);

grant select on public.posts_feed to authenticated, service_role;
