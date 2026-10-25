-- ============================================================================
-- Atomic post creation with gallery
--
-- Supabase JS cannot span two table inserts in one transaction, so the post and
-- its images are created by this function. Both writes succeed or both roll
-- back; the caller can never leave a post without its gallery.
-- ============================================================================

create or replace function public.create_post(
  p_caption text,
  p_image_paths text[]
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_post_id uuid;
  v_path text;
begin
  if v_uid is null or not public.is_approved() then
    raise exception 'not authorized to create a post' using errcode = '42501';
  end if;

  if p_caption is null
    or char_length(pg_catalog.btrim(p_caption)) not between 1 and 600 then
    raise exception 'invalid caption' using errcode = '22023';
  end if;

  if p_image_paths is null
    or coalesce(pg_catalog.array_length(p_image_paths, 1), 0) not between 1 and 6 then
    raise exception 'a post needs between one and six images' using errcode = '22023';
  end if;

  foreach v_path in array p_image_paths loop
    if v_path is null or v_path not like v_uid::text || '/%' then
      raise exception 'image path must belong to the author' using errcode = '22023';
    end if;
  end loop;

  insert into public.posts (author_id, image_path, caption)
  values (v_uid, p_image_paths[1], pg_catalog.btrim(p_caption))
  returning id into v_post_id;

  insert into public.post_images (post_id, storage_path, sort)
  select
    v_post_id,
    image_path,
    (ordinality - 1)::integer
  from pg_catalog.unnest(p_image_paths) with ordinality as images(image_path, ordinality);

  return v_post_id;
end;
$$;

revoke all on function public.create_post(text, text[]) from public;
grant execute on function public.create_post(text, text[]) to authenticated;
