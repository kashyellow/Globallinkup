import "server-only";

import { createSignedImageUrls, resolveImageUrl } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";
import { unwrap } from "@/lib/supabase/unwrap";

/** S3d — the official catalog (admin-authored). Approved users read published rows. */

export type MarketplaceProduct = {
  id: string;
  name: string;
  originLabel: string;
  createdAt: string;
  price: number;
  description: string;
  sellerPhone: string;
  image: string | null;
  imageAlt: string;
};

export type MarketplaceContact = {
  whatsappNumber: string;
  whatsappLink: string;
  email: string;
};

export async function getPublishedProducts(): Promise<MarketplaceProduct[]> {
  const supabase = await createClient();

  const rows = unwrap(
    await supabase
      .from("marketplace_products")
      .select("id, name, price_cents, description, origin_label, contact_information, created_at")
      .eq("is_published", true)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
  );

  if (!rows || rows.length === 0) return [];

  const ids = rows.map((row) => row.id);
  const images = unwrap(
    await supabase
      .from("marketplace_product_images")
      .select("product_id, storage_path, sort")
      .in("product_id", ids)
      .order("sort", { ascending: true }),
  );

  const firstPathByProduct = new Map<string, string>();
  for (const image of images ?? []) {
    if (!firstPathByProduct.has(image.product_id)) {
      firstPathByProduct.set(image.product_id, image.storage_path);
    }
  }

  const signed = await createSignedImageUrls(supabase, "product-images", [
    ...firstPathByProduct.values(),
  ]);

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    originLabel: row.origin_label ?? "",
    createdAt: row.created_at ?? "",
    price: (row.price_cents ?? 0) / 100,
    description: row.description ?? "",
    sellerPhone: row.contact_information ?? "",
    image: resolveImageUrl(firstPathByProduct.get(row.id), signed),
    imageAlt: row.name,
  }));
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

  const value = (data?.value ?? {}) as {
    whatsapp?: string;
    whatsappLink?: string;
    email?: string;
  };

  // The admin-editable settings row wins; env is the easy-to-find fallback for
  // local/staging environments where settings have not been seeded yet.
  return {
    whatsappNumber: value.whatsapp ?? process.env.NEXT_PUBLIC_MARKETPLACE_WHATSAPP ?? "",
    whatsappLink: value.whatsappLink ?? process.env.NEXT_PUBLIC_MARKETPLACE_WHATSAPP_LINK ?? "",
    email: value.email ?? process.env.NEXT_PUBLIC_MARKETPLACE_EMAIL ?? "",
  };
}
