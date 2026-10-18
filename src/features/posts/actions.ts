"use server";

import { z } from "zod";

import { getCurrentProfile, getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/** S3c — feed writes. Approved authors only; RLS is the backstop. */

export type PostResult = { ok: true; id?: string } | { ok: false; error: string };

const createSchema = z.object({
  caption: z.string().trim().min(1, "captionRequired").max(600),
  imagePath: z.string().trim().min(1, "imageRequired").max(400),
});

export async function createPostAction(input: unknown): Promise<PostResult> {
  const user = await getCurrentUser();
  const profile = await getCurrentProfile();
  if (!user || !profile || profile.approval_status !== "approved") {
    return { ok: false, error: "forbidden" };
  }

  const parsed = createSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .insert({
      author_id: user.id,
      image_path: parsed.data.imagePath,
      caption: parsed.data.caption,
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: "unknown" };
  return { ok: true, id: data.id };
}

const likeSchema = z.object({ postId: z.uuid(), liked: z.boolean() });

export async function toggleLikeAction(input: unknown): Promise<PostResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "unauthenticated" };

  const parsed = likeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  const supabase = await createClient();
  const { error } = parsed.data.liked
    ? await supabase.from("post_likes").insert({ post_id: parsed.data.postId, user_id: user.id })
    : await supabase
        .from("post_likes")
        .delete()
        .eq("post_id", parsed.data.postId)
        .eq("user_id", user.id);

  if (error) return { ok: false, error: "unknown" };
  return { ok: true };
}

const idSchema = z.object({ postId: z.uuid() });

export async function deletePostAction(input: unknown): Promise<PostResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "unauthenticated" };

  const parsed = idSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  const supabase = await createClient();
  // Soft removal (FR-6.5); the moderation guard blocks un-removing it.
  const { data, error } = await supabase
    .from("posts")
    .update({ moderation_status: "removed" })
    .eq("id", parsed.data.postId)
    .eq("author_id", user.id)
    .select("id");

  if (error) return { ok: false, error: "unknown" };
  if (!data || data.length === 0) return { ok: false, error: "forbidden" };
  return { ok: true };
}
