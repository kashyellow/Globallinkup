"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * Admin persona review (S2, SA-1). Approve / reject / suspend a profile. Runs on
 * the RLS client — `profiles_update_admin` plus the guard's admin bypass cover
 * it — so no service-role key is needed.
 */

const reviewSchema = z.object({
  profileId: z.uuid(),
  decision: z.enum(["approved", "rejected", "suspended"]),
});

export type ReviewResult = { ok: true } | { ok: false; error: string };

export async function reviewPersonaAction(input: unknown): Promise<ReviewResult> {
  const { user } = await requireAdmin();

  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      approval_status: parsed.data.decision,
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
    })
    .eq("id", parsed.data.profileId);

  if (error) return { ok: false, error: "unknown" };

  revalidatePath("/admin");
  return { ok: true };
}
