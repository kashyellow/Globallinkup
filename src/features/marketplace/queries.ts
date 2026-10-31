import "server-only";

import { createSignedImageUrls, resolveImageUrl } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";
import { type MarketplaceSort } from "./constants";
import { unwrap } from "@/lib/supabase/unwrap";

/** S3d — the official catalog (admin-authored). Approved users read published rows. */

export type MarketplaceProduct = {
  id: string;
  name: string;
  originLabel: string;
  /** Per-product channels; blank means use the catalog-wide concierge contact. */
  contact: MarketplaceContact;
  createdAt: string;
  price: number;
  description: string;
  images: string[];
  imageAlt: string;
};

/** Concierge channels. Both are empty until an admin fills them. */
export type MarketplaceContact = {
  email: string;
  phone: string;
};

export type MarketplacePage = {
  products: MarketplaceProduct[];
  total: number;
};

const PAGE_COLUMNS =
  "id, name, price_cents, description, origin_label, contact_email, contact_phone, created_at";

function safeNeedle(value: string) {
  // PostgREST's `or` expression is comma/parenthesis-delimited; keep the search
  // term from changing the filter shape.
  return value
    .trim()
    .replace(/[%,()]/g, " ")
    .replace(/\s+/g, " ");
}

export async function getMarketplacePage({
  query,
  sort,
  limit,
  offset,
}: {
  query: string;
  sort: MarketplaceSort;
  limit: number;
  offset: number;
}): Promise<MarketplacePage> {
  const supabase = await createClient();

  let request = supabase
    .from("marketplace_products")
    .select(PAGE_COLUMNS, { count: "exact" })
    .eq("is_published", true)
    .is("deleted_at", null);

  const needle = safeNeedle(query);
  if (needle.length > 0) {
    request = request.or(
      `name.ilike.%${needle}%,description.ilike.%${needle}%,origin_label.ilike.%${needle}%`,
    );
  }

  if (sort === "price-low") {
    request = request.order("price_cents", { ascending: true });
  } else if (sort === "price-high") {
    request = request.order("price_cents", { ascending: false });
  } else {
    request = request.order("created_at", { ascending: false });
  }

  const response = await request.range(offset, offset + limit - 1);
  const rows = unwrap(response) ?? [];
  const total = response.count ?? rows.length;
  if (rows.length === 0) return { products: [], total };

  const ids = rows.map((row) => row.id);
  const images = unwrap(
    await supabase
      .from("marketplace_product_images")
      .select("product_id, storage_path, sort")
      .in("product_id", ids)
      .order("sort", { ascending: true }),
  );

  const pathsByProduct = new Map<string, string[]>();
  for (const image of images ?? []) {
    const list = pathsByProduct.get(image.product_id) ?? [];
    list.push(image.storage_path);
    pathsByProduct.set(image.product_id, list);
  }

  const signed = await createSignedImageUrls(
    supabase,
    "product-images",
    (images ?? []).map((image) => image.storage_path),
  );

  return {
    products: rows.map((row) => {
      const paths = pathsByProduct.get(row.id) ?? [];
      const urls = paths
        .map((path) => resolveImageUrl(path, signed))
        .filter((url): url is string => url !== null);
      return {
        id: row.id,
        name: row.name,
        originLabel: row.origin_label ?? "",
        contact: { email: row.contact_email ?? "", phone: row.contact_phone ?? "" },
        createdAt: row.created_at ?? "",
        price: (row.price_cents ?? 0) / 100,
        description: row.description ?? "",
        images: urls,
        imageAlt: row.name,
      } satisfies MarketplaceProduct;
    }),
    total,
  };
}

export async function getMarketplaceContact(): Promise<MarketplaceContact> {
  const supabase = await createClient();

  const data = unwrap<{ value: unknown }>(
    await supabase
      .from("platform_settings")
      .select("value")
      .eq("key", "marketplace.contact")
      .maybeSingle(),
  );

  // Cloud projects have no seeded row: products carry their own contact
  // and this is only the fallback; until either is set the public side warns instead of linking.
  const value = (data?.value ?? {}) as { email?: string; phone?: string };

  return {
    email: value.email ?? "",
    phone: value.phone ?? "",
  };
}
