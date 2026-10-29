import "server-only";

import type { Database } from "@/types/database";
import { createAdminClient } from "@/lib/supabase/admin";

type NotificationType = Database["public"]["Enums"]["notification_type"];

/**
 * Writes a notification row with the service role: clients cannot insert (the
 * table has no insert policy and the grant is revoked), so every notice comes
 * from a server-side decision. Failures are logged, never thrown — a missing
 * notice must not roll back the moderation action that produced it.
 */
export async function notifyMember(input: {
  recipientId: string;
  type: NotificationType;
  targetType?: string;
  targetId?: string | null;
  reason?: string | null;
}): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("notifications").insert({
    recipient_id: input.recipientId,
    type: input.type,
    target_type: input.targetType ?? null,
    target_id: input.targetId ?? null,
    reason: input.reason ?? null,
  });

  if (error) {
    console.error("[notify] insert failed", { code: error.code, type: input.type });
  }
}
