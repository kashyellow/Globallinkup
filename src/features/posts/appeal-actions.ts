"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { uuidSchema } from "@/lib/validation/ids";

export type AppealResult = { ok: true } | { ok: false; error: string };

const appealSchema = z.object({
  postId: uuidSchema,
  message: z.string().trim().min(10).max(500),
});

/**
 * One bounded appeal per removal (ADR 0001). RLS proves the caller owns the post
 * and that the post is removed; the unique partial index makes a second open
 * appeal impossible.
 */
export async function submitAppealFormAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;

  const parsed = appealSchema.safeParse({
    postId: formData.get("postId"),
    message: formData.get("message"),
  });
  if (!parsed.success) return;

  const supabase = await createClient();
  await supabase.from("post_appeals").insert({
    post_id: parsed.data.postId,
    author_id: user.id,
    message: parsed.data.message,
  });

  revalidatePath("/profile");
}
