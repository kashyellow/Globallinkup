"use server";

import { z } from "zod";

import { getCurrentProfile, getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { uuidSchema } from "@/lib/validation/ids";

/** FR-8.1 — any approved member can report a post or a persona. */

export type ReportResult = { ok: true } | { ok: false; error: string };

const reportSchema = z.object({
  targetType: z.enum(["user", "post"]),
  targetId: uuidSchema,
  reason: z.enum(["spam", "harassment", "inappropriate", "other"]),
  details: z.string().trim().max(1000).optional(),
});

export async function createReportAction(input: unknown): Promise<ReportResult> {
  const user = await getCurrentUser();
  const profile = await getCurrentProfile();
  if (!user || !profile || profile.approval_status !== "approved") {
    return { ok: false, error: "forbidden" };
  }

  const parsed = reportSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  if (parsed.data.targetType === "user" && parsed.data.targetId === user.id) {
    return { ok: false, error: "invalid" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("reports").insert({
    reporter_id: user.id,
    target_type: parsed.data.targetType,
    target_user_id: parsed.data.targetType === "user" ? parsed.data.targetId : null,
    target_post_id: parsed.data.targetType === "post" ? parsed.data.targetId : null,
    reason: parsed.data.reason,
    details: parsed.data.details?.length ? parsed.data.details : null,
  });

  if (error) return { ok: false, error: "unknown" };
  return { ok: true };
}
