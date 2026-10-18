import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

/** S3.0 — shared storage helpers. Buckets are private; reads use signed URLs. */

export const IMAGE_BUCKETS = ["avatars", "post-images", "product-images"] as const;
export type ImageBucket = (typeof IMAGE_BUCKETS)[number];

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
export const SIGNED_URL_TTL_SECONDS = 60 * 60;

/** `<user-id>/<uuid>.<ext>` — the folder is what the storage RLS authorises. */
export function buildStoragePath(userId: string, filename: string) {
  const rawExtension = filename.split(".").pop()?.toLowerCase() ?? "";
  const extension = /^[a-z0-9]{1,5}$/.test(rawExtension) ? rawExtension : "jpg";
  return `${userId}/${crypto.randomUUID()}.${extension}`;
}

export async function createSignedImageUrl(
  supabase: SupabaseClient<Database>,
  bucket: ImageBucket,
  path: string | null | undefined,
) {
  if (!path) return null;

  const { data } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

  return data?.signedUrl ?? null;
}
