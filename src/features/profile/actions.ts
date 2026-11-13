"use server";

import { z } from "zod";

import { signOutAction } from "@/features/auth/actions";
import { getCurrentProfile, getCurrentUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Self-service account deletion: immediate and permanent. Deleting the auth
 * user cascades the persona, posts, comments, likes and connections; uploaded
 * files are not covered by the cascade, so they are removed first.
 */

export type DeleteAccountError = "forbidden" | "invalid" | "unknown";

export type DeleteAccountResult =
  { ok: true; redirectTo: string } | { ok: false; error: DeleteAccountError };

const BUCKETS = ["avatars", "post-images"] as const;
const PAGE_SIZE = 100;

async function removeUserFolder(
  admin: ReturnType<typeof createAdminClient>,
  bucket: (typeof BUCKETS)[number],
  userId: string,
) {
  // Every upload lives under `<user-id>/` (buildStoragePath). Removed files drop
  // out of the listing, so reading page one until it is empty covers a folder of
  // any size.
  for (;;) {
    const { data, error } = await admin.storage.from(bucket).list(userId, { limit: PAGE_SIZE });
    if (error) {
      console.error("[delete-account] storage list failed", { bucket });
      return;
    }
    if (!data || data.length === 0) return;
    const removed = await admin.storage
      .from(bucket)
      .remove(data.map((file) => `${userId}/${file.name}`));
    if (removed.error) {
      console.error("[delete-account] storage remove failed", { bucket });
      return;
    }
  }
}

export async function deleteOwnAccountAction(input: unknown): Promise<DeleteAccountResult> {
  const parsed = z.object({ confirm: z.literal("DELETE") }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  const user = await getCurrentUser();
  const profile = user ? await getCurrentProfile() : null;
  // A suspended member must not erase the reports against them.
  if (!user || !profile || profile.role === "admin" || profile.approval_status === "suspended") {
    return { ok: false, error: "forbidden" };
  }

  const admin = createAdminClient();
  for (const bucket of BUCKETS) await removeUserFolder(admin, bucket, user.id);

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return { ok: false, error: "unknown" };

  // Ids only (ADR 0003). A missing trail entry must not undo the deletion.
  const { error: auditError } = await admin
    .from("audit_events")
    .insert({ action: "member.deleted", target_type: "profile", target_id: user.id });
  if (auditError) console.error("[delete-account] audit write failed", { code: auditError.code });

  await signOutAction();
  return { ok: true, redirectTo: "/" };
}
