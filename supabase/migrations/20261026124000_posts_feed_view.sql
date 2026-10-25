-- ============================================================================
-- posts_feed view
--
-- Server-side feed filters need the author's country without a second,
-- page-scoped query. The view is security_invoker so the posts/profiles RLS
-- policies remain in charge. Counts are included for the feed card without an
-- N+1 read; the viewer's own like state is still resolved per request.
-- ============================================================================

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
join public.profiles_public pr on pr.id = p.author_id;

grant select on public.posts_feed to authenticated, service_role;
