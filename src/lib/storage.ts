import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

/** S3.0 — shared storage helpers. Buckets are private; reads use signed URLs. */

export const IMAGE_BUCKETS = ["avatars", "post-images", "product-images"] as const;
export type ImageBucket = (typeof IMAGE_BUCKETS)[number];

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
/** Avatar storage is capped at 5 MB by the bucket; mirror it at the boundary. */
export const BUCKET_MAX_BYTES: Record<ImageBucket, number> = {
  avatars: 5 * 1024 * 1024,
  "post-images": MAX_IMAGE_BYTES,
  "product-images": MAX_IMAGE_BYTES,
};
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

/**
 * One Storage request for many paths. This replaces the per-row N+1 signing in
 * the list queries. Signed URLs are bearer tokens, so the map is request-scoped
 * by the caller — never cache it across users.
 */
export async function createSignedImageUrls(
  supabase: SupabaseClient<Database>,
  bucket: ImageBucket,
  paths: readonly (string | null | undefined)[],
) {
  const unique = [
    ...new Set(
      paths.filter(
        (path): path is string =>
          typeof path === "string" && path.length > 0 && !path.startsWith("http"),
      ),
    ),
  ];

  const byPath = new Map<string, string>();
  if (unique.length === 0) return byPath;

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrls(unique, SIGNED_URL_TTL_SECONDS);

  // A missing image should fall back to the avatar/placeholder, not fail the page.
  if (error) return byPath;

  for (const item of data ?? []) {
    if (item.path && item.signedUrl) byPath.set(item.path, item.signedUrl);
  }

  return byPath;
}

/** Resolves a direct URL or a storage path from a batch map. */
export function resolveImageUrl(
  path: string | null | undefined,
  byPath: ReadonlyMap<string, string>,
): string | null {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return byPath.get(path) ?? null;
}
