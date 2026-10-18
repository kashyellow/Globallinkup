"use server";

import { z } from "zod";

import { getCurrentProfile, getCurrentUser, getServerClient } from "@/lib/auth";
import {
  ALLOWED_IMAGE_TYPES,
  buildStoragePath,
  IMAGE_BUCKETS,
  MAX_IMAGE_BYTES,
} from "@/lib/storage";

/**
 * S3.0 — image upload. Validates the boundary (bucket, type, size), checks the
 * caller is allowed to write that bucket, then stores `<user-id>/<uuid>.<ext>`.
 * Storage RLS is the backstop; this mirrors it so the UI gets a clear error.
 */

const bucketSchema = z.enum(IMAGE_BUCKETS);

export type UploadResult = { ok: true; path: string } | { ok: false; error: string };

export async function uploadImageAction(formData: FormData): Promise<UploadResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "unauthenticated" };

  const bucket = bucketSchema.safeParse(formData.get("bucket"));
  const file = formData.get("file");
  if (!bucket.success || !(file instanceof File)) return { ok: false, error: "invalid" };

  if (file.size === 0 || file.size > MAX_IMAGE_BYTES) return { ok: false, error: "size" };
  if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return { ok: false, error: "type" };
  }

  if (bucket.data !== "avatars") {
    const profile = await getCurrentProfile();
    if (!profile || profile.approval_status !== "approved") {
      return { ok: false, error: "forbidden" };
    }
    if (bucket.data === "product-images" && profile.role !== "admin") {
      return { ok: false, error: "forbidden" };
    }
  }

  const supabase = await getServerClient();
  if (!supabase) return { ok: false, error: "unknown" };

  const path = buildStoragePath(user.id, file.name);
  const { error } = await supabase.storage
    .from(bucket.data)
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) return { ok: false, error: "unknown" };

  return { ok: true, path };
}
