import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

/**
 * Append one audit row (ADR 0003). Fails silently in the app: a missing trail
 * entry is bad, but it must not roll back the moderation action that produced it.
 * Metadata is ids and state only — never content, contact channels or birthdays.
 */
export async function recordAudit(input: {
  action: string;
  targetType?: string;
  targetId?: string | null;
  reason?: string | null;
  metadata?: Record<string, string | number | boolean | null>;
}): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("record_audit", {
    p_action: input.action,
    p_target_type: input.targetType ?? undefined,
    p_target_id: input.targetId ?? undefined,
    p_reason: input.reason ?? undefined,
    p_metadata: (input.metadata ?? {}) as Json,
  });

  if (error) {
    console.error("[audit] write failed", { code: error.code, action: input.action });
  }
}
