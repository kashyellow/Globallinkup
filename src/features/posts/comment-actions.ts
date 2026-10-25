"use server";

import { z } from "zod";
import { uuidSchema } from "@/lib/validation/ids";

import { getCurrentProfile, getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/** Post comments — not chat. Approved members only, RLS is the backstop. */

export type CommentResult =
  { ok: true; id?: string } | { ok: false; error: "forbidden" | "invalid" | "unknown" };

const createSchema = z.object({
  postId: uuidSchema,
  parentId: uuidSchema.optional(),
  body: z.string().trim().min(1).max(1000),
});

export async function createCommentAction(input: unknown): Promise<CommentResult> {
  const user = await getCurrentUser();
  const profile = await getCurrentProfile();
  if (!user || !profile || profile.approval_status !== "approved") {
    return { ok: false, error: "forbidden" };
  }

  const parsed = createSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("post_comments")
    .insert({
      post_id: parsed.data.postId,
      author_id: user.id,
      parent_id: parsed.data.parentId ?? null,
      body: parsed.data.body.trim(),
    })
    .select("id")
    .single();

  if (error || !data) return { ok: false, error: "unknown" };
  return { ok: true, id: data.id };
}

const deleteSchema = z.object({ commentId: uuidSchema });

export async function deleteCommentAction(input: unknown): Promise<CommentResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "forbidden" };

  const parsed = deleteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("post_comments")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", parsed.data.commentId)
    .eq("author_id", user.id)
    .is("deleted_at", null)
    .select("id");

  if (error) return { ok: false, error: "unknown" };
  if (!data || data.length === 0) return { ok: false, error: "forbidden" };
  return { ok: true };
}
