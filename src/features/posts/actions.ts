"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { uuidSchema } from "@/lib/validation/ids";

import { getCurrentProfile, getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/** S3c — feed writes. Approved authors only; RLS is the backstop. */

export type PostResult = { ok: true; id?: string } | { ok: false; error: string };

const createSchema = z.object({
  caption: z.string().trim().min(1, "captionRequired").max(600),
  imagePaths: z.array(z.string().trim().min(1).max(400)).min(1).max(6),
});

export async function createPostAction(input: unknown): Promise<PostResult> {
  const user = await getCurrentUser();
  const profile = await getCurrentProfile();
  if (!user || !profile || profile.approval_status !== "approved") {
    return { ok: false, error: "forbidden" };
  }

  const parsed = createSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  // The author may only attach objects from their own storage folder.
  if (parsed.data.imagePaths.some((path) => !path.startsWith(`${user.id}/`))) {
    return { ok: false, error: "invalid" };
  }

  const supabase = await createClient();
  // Post + gallery are written atomically by the RPC.
  const { data, error } = await supabase.rpc("create_post", {
    p_caption: parsed.data.caption,
    p_image_paths: parsed.data.imagePaths,
  });

  if (error || !data) return { ok: false, error: "unknown" };
  return { ok: true, id: data };
}

const likeSchema = z.object({ postId: uuidSchema, liked: z.boolean() });

export async function toggleLikeAction(input: unknown): Promise<PostResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "unauthenticated" };

  const parsed = likeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  const supabase = await createClient();
  const { error } = parsed.data.liked
    ? await supabase
        .from("post_likes")
        .upsert(
          { post_id: parsed.data.postId, user_id: user.id },
          { onConflict: "post_id,user_id", ignoreDuplicates: true },
        )
    : await supabase
        .from("post_likes")
        .delete()
        .eq("post_id", parsed.data.postId)
        .eq("user_id", user.id);

  if (error) return { ok: false, error: "unknown" };
  return { ok: true };
}

const idSchema = z.object({ postId: uuidSchema });

/** Hide a post without losing it; the author can undo this at any time. */
export async function archivePostAction(input: unknown): Promise<PostResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "unauthenticated" };

  const parsed = idSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .update({ state: "archived", archived_at: new Date().toISOString() })
    .eq("id", parsed.data.postId)
    .eq("author_id", user.id)
    .select("id");

  if (error) return { ok: false, error: "unknown" };
  if (!data || data.length === 0) return { ok: false, error: "forbidden" };

  revalidatePath("/profile");
  revalidatePath("/posts");
  return { ok: true };
}

export async function unarchivePostAction(input: unknown): Promise<PostResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "unauthenticated" };

  const parsed = idSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .update({ state: "visible", archived_at: null })
    .eq("id", parsed.data.postId)
    .eq("author_id", user.id)
    .select("id");

  if (error) return { ok: false, error: "unknown" };
  if (!data || data.length === 0) return { ok: false, error: "forbidden" };

  revalidatePath("/profile");
  revalidatePath("/posts");
  return { ok: true };
}

/**
 * Permanent delete (ADR 0001): storage objects first, then the row. A storage
 * failure does not block the row delete — the bucket policy keys reads off the
 * owning post, so residue becomes unreadable and the purge job sweeps orphans.
 */
export async function deletePostAction(input: unknown): Promise<PostResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "unauthenticated" };

  const parsed = idSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  const supabase = await createClient();
  const { data: post, error: readError } = await supabase
    .from("posts")
    .select("id, image_path")
    .eq("id", parsed.data.postId)
    .eq("author_id", user.id)
    .maybeSingle();

  if (readError) return { ok: false, error: "unknown" };
  if (!post) return { ok: false, error: "forbidden" };

  const { data: images } = await supabase
    .from("post_images")
    .select("storage_path")
    .eq("post_id", parsed.data.postId);

  const paths = new Set<string>();
  for (const row of images ?? []) {
    if (row.storage_path) paths.add(row.storage_path);
  }
  if (post.image_path && !post.image_path.startsWith("http")) {
    paths.add(post.image_path);
  }

  if (paths.size > 0) {
    await supabase.storage.from("post-images").remove([...paths]);
  }

  const { data, error } = await supabase
    .from("posts")
    .delete()
    .eq("id", parsed.data.postId)
    .eq("author_id", user.id)
    .select("id");

  if (error) return { ok: false, error: "unknown" };
  if (!data || data.length === 0) return { ok: false, error: "forbidden" };

  revalidatePath("/profile");
  revalidatePath("/posts");
  return { ok: true };
}
