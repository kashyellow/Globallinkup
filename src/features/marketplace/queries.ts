import "server-only";

import { createSignedImageUrl } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";

/** S3d — the official catalog (admin-authored). Approved users read published rows. */

export type MarketplaceProduct = {
  id: string;
  sku: string;
  name: string;
  originLabel: string;
  category: string;
  badge: string | null;
  price: number;
  summary: string;
  description: string;
  specs: {
    origin: string;
    artisan: string;
    material: string;
    dimensions: string;
    weight: string;
    fulfillment: string;
  };
  image: string | null;
  imageAlt: string;
  gallery: string[];
  galleryAlts: string[];
};

export type MarketplaceContact = {
  whatsappNumber: string;
  whatsappLink: string;
  email: string;
};

export async function getPublishedProducts(): Promise<MarketplaceProduct[]> {
  const supabase = await createClient();

  const { data: rows } = await supabase
    .from("marketplace_products")
    .select(
      "id, name, sku, price_cents, currency, category, summary, description, origin_label, badge, specs, availability, created_at",
    )
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (!rows || rows.length === 0) return [];

  const ids = rows.map((row) => row.id);
  const { data: images } = await supabase
    .from("marketplace_product_images")
    .select("product_id, storage_path, sort")
    .in("product_id", ids)
    .order("sort", { ascending: true });

  const pathsByProduct = new Map<string, string[]>();
  for (const image of images ?? []) {
    const list = pathsByProduct.get(image.product_id) ?? [];
    list.push(image.storage_path);
    pathsByProduct.set(image.product_id, list);
  }

  return Promise.all(
    rows.map(async (row) => {
      const paths = pathsByProduct.get(row.id) ?? [];
      const urls = (
        await Promise.all(
          paths.map((path) => createSignedImageUrl(supabase, "product-images", path)),
        )
      ).filter((url): url is string => Boolean(url));

      const specs = (row.specs ?? {}) as Record<string, string>;

      return {
        id: row.id,
        sku: row.sku ?? "",
        name: row.name,
        originLabel: row.origin_label ?? "",
        category: row.category,
        badge: row.badge ?? null,
        price: (row.price_cents ?? 0) / 100,
        summary: row.summary ?? "",
        description: row.description ?? "",
        specs: {
          origin: specs.origin ?? "",
          artisan: specs.artisan ?? "",
          material: specs.material ?? "",
          dimensions: specs.dimensions ?? "",
          weight: specs.weight ?? "",
          fulfillment: specs.fulfillment ?? "fulfillmentCourier",
        },
        image: urls[0] ?? null,
        imageAlt: row.name,
        gallery: urls,
        galleryAlts: urls.map(() => row.name),
      };
    }),
  );
}

export async function getMarketplaceContact(): Promise<MarketplaceContact> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("platform_settings")
    .select("value")
    .eq("key", "marketplace.contact")
    .maybeSingle();

  const value = (data?.value ?? {}) as {
    whatsapp?: string;
    whatsappLink?: string;
    email?: string;
  };

  return {
    whatsappNumber: value.whatsapp ?? "",
    whatsappLink: value.whatsappLink ?? "",
    email: value.email ?? "",
  };
}
