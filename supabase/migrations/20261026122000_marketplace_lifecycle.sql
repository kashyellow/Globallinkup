-- ============================================================================
-- Marketplace product lifecycle
--
-- Published is not enough state for an admin catalog: a piece can be a draft,
-- taken down after being live, or soft-deleted. Derive one status column so
-- filters and UI chips cannot disagree, and keep the existing `is_published`
-- boolean for compatibility with current reads/writes.
-- ============================================================================

create type public.marketplace_status as enum ('draft', 'live', 'unpublished', 'trashed');

alter table public.marketplace_products
  add column published_at timestamptz,
  add column deleted_at timestamptz,
  add column catalog_status public.marketplace_status
    generated always as (
      case
        when deleted_at is not null then 'trashed'::public.marketplace_status
        when is_published then 'live'::public.marketplace_status
        when published_at is not null then 'unpublished'::public.marketplace_status
        else 'draft'::public.marketplace_status
      end
    ) stored;

-- Existing live rows were published when they were created.
update public.marketplace_products
set published_at = created_at
where is_published and published_at is null;

create index marketplace_products_catalog_status_idx
  on public.marketplace_products (catalog_status, created_at desc);

-- Direct PostgREST writes still get a valid publish timestamp even if they
-- bypass the Server Action.
create or replace function public.set_product_published_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.is_published and new.published_at is null then
    new.published_at = pg_catalog.now();
  end if;
  return new;
end;
$$;

create trigger marketplace_products_set_published_at
  before insert or update of is_published, published_at
  on public.marketplace_products
  for each row execute function public.set_product_published_at();

-- Public readers must not see trashed rows. Admin writes still see everything
-- through the admin policy.
drop policy if exists "marketplace_products_select_published"
  on public.marketplace_products;
create policy "marketplace_products_select_published"
  on public.marketplace_products for select
  to authenticated
  using (
    (is_published and deleted_at is null and public.is_approved())
    or public.is_admin()
  );

drop policy if exists "marketplace_product_images_select"
  on public.marketplace_product_images;
create policy "marketplace_product_images_select"
  on public.marketplace_product_images for select
  to authenticated
  using (
    exists (
      select 1
      from public.marketplace_products p
      where p.id = product_id
        and p.deleted_at is null
        and ((p.is_published and public.is_approved()) or public.is_admin())
    )
  );
