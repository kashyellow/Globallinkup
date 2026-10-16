"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getCurrentProfile, getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * Admin persona review (S2, SA-1). Approve / reject / suspend a profile. Runs on
 * the RLS client — `profiles_update_admin` plus the guard's admin bypass cover
 * it — so no service-role key is needed.
 *
 * The admin check is done without redirecting: `requireAdmin()` is route-only
 * (it calls `getLocale()`, unavailable in Server Actions).
 */

const reviewSchema = z.object({
  profileId: z.uuid(),
  decision: z.enum(["approved", "rejected", "suspended"]),
});

export type ReviewResult = { ok: true } | { ok: false; error: string };

export async function reviewPersonaAction(input: unknown): Promise<ReviewResult> {
  const user = await getCurrentUser();
  const profile = await getCurrentProfile();
  if (!user || !profile || profile.role !== "admin" || profile.approval_status !== "approved") {
    return { ok: false, error: "forbidden" };
  }

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
