"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { recordAudit } from "@/lib/audit";
import { deskCapabilities, deskRole, type DeskAccess } from "@/features/admin/desks";
import { getCurrentProfile, getCurrentUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { uuidSchema } from "@/lib/validation/ids";

export type TeamState = { ok: boolean; error?: string };

const emailSchema = z.email();
// Same rule the sign-up form enforces: 8+ characters with upper, lower and a digit.
const passwordSchema = z.string().min(8).max(72).regex(/[a-z]/).regex(/[A-Z]/).regex(/\d/);
const nameSchema = z.string().trim().min(2).max(60);

async function requireAdminsManager() {
  const user = await getCurrentUser();
  const profile = await getCurrentProfile();
  if (!user || !profile || profile.role !== "admin" || profile.approval_status !== "approved") {
    return null;
  }
  const supabase = await createClient();
  const { data } = await supabase.rpc("my_capabilities");
  const capabilities = Array.isArray(data) ? data : [];
  if (!capabilities.includes("admins.manage")) return null;
  return { user, profile, supabase };
}

function readAccess(formData: FormData): DeskAccess {
  return {
    members: formData.get("members") === "on",
    moderation: formData.get("moderation") === "on",
    marketplace: formData.get("marketplace") === "on",
  };
}

/**
 * Each combination of desks is one hidden role, created on first use. Keeping
 * the capabilities in sync here means a change to a desk reaches everyone on it.
 */
async function resolveDeskRole(access: DeskAccess) {
  const desk = deskRole(access);
  if (!desk) return null;
  const { data } = await createAdminClient()
    .from("admin_roles")
    .upsert(
      { slug: desk.slug, name: desk.name, capabilities: deskCapabilities(access) },
      { onConflict: "slug" },
    )
    .select("id, slug")
    .single();
  return data;
}

/** Create the account directly: the owner chooses the name, email and password. */
export async function createSubAdminAction(
  _previous: TeamState,
  formData: FormData,
): Promise<TeamState> {
  const ctx = await requireAdminsManager();
  if (!ctx) return { ok: false, error: "forbidden" };

  const parsed = z
    .object({ name: nameSchema, email: emailSchema, password: passwordSchema })
    .safeParse({
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
    });
  const role = await resolveDeskRole(readAccess(formData));
  if (!parsed.success || !role) return { ok: false, error: "invalid" };

  const admin = createAdminClient();
  const created = await admin.auth.admin.createUser({
    email: parsed.data.email.trim().toLowerCase(),
    password: parsed.data.password,
    email_confirm: true,
  });
  if (created.error || !created.data.user) {
    return { ok: false, error: created.error?.code === "email_exists" ? "exists" : "unknown" };
  }

  const userId = created.data.user.id;
  const { error } = await admin.from("profiles").upsert(
    {
      id: userId,
      display_name: parsed.data.name,
      role: "admin",
      approval_status: "approved",
      admin_role_id: role.id,
      reviewed_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );
  if (error) {
    // Do not leave a login behind that has no profile.
    await admin.auth.admin.deleteUser(userId);
    return { ok: false, error: "unknown" };
  }

  await recordAudit({
    action: "admin.created",
    targetType: "profile",
    targetId: userId,
    metadata: {
      before: { role_slug: null, role_id: null },
      after: { role_slug: role.slug, role_id: role.id },
    },
  });

  revalidatePath("/admin/team");
  return { ok: true };
}

/** The owner changes a sub-admin's name, desks and, optionally, password. */
export async function updateSubAdminAction(formData: FormData): Promise<TeamState> {
  const ctx = await requireAdminsManager();
  if (!ctx) return { ok: false, error: "forbidden" };

  const newPassword = String(formData.get("password") ?? "");
  const parsed = z
    .object({
      profileId: uuidSchema,
      name: nameSchema,
      password: z.union([z.literal(""), passwordSchema]),
    })
    .safeParse({
      profileId: formData.get("profileId"),
      name: formData.get("name"),
      password: newPassword,
    });
  const role = await resolveDeskRole(readAccess(formData));
  if (!parsed.success || !role) return { ok: false, error: "invalid" };

  const admin = createAdminClient();
  const target = await loadSubAdmin(admin, parsed.data.profileId);
  if (!target) return { ok: false, error: "invalid" };
  if (target.isOwner) return { ok: false, error: "owner" };

  if (parsed.data.password) {
    const reset = await admin.auth.admin.updateUserById(parsed.data.profileId, {
      password: parsed.data.password,
    });
    if (reset.error) return { ok: false, error: "unknown" };
  }

  await recordAudit({
    action: "admin.role_changed",
    targetType: "profile",
    targetId: parsed.data.profileId,
    metadata: {
      before: { role_slug: target.slug, role_id: target.roleId },
      after: {
        role_slug: role.slug,
        role_id: role.id,
        // The password itself is never recorded, only that it was reset.
        password_reset: parsed.data.password !== "",
      },
    },
  });

  const { error } = await admin
    .from("profiles")
    .update({ admin_role_id: role.id, display_name: parsed.data.name })
    .eq("id", parsed.data.profileId);
  if (error) return { ok: false, error: "unknown" };

  revalidatePath("/admin/team");
  return { ok: true };
}

/** Removing a sub-admin deletes their login. Owners cannot be removed. */
export async function removeSubAdminAction(formData: FormData): Promise<TeamState> {
  const ctx = await requireAdminsManager();
  if (!ctx) return { ok: false, error: "forbidden" };

  const parsed = z
    .object({ profileId: uuidSchema })
    .safeParse({ profileId: formData.get("profileId") });
  if (!parsed.success) return { ok: false, error: "invalid" };

  const admin = createAdminClient();
  const target = await loadSubAdmin(admin, parsed.data.profileId);
  if (!target) return { ok: false, error: "invalid" };
  if (target.isOwner) return { ok: false, error: "owner" };

  await recordAudit({
    action: "admin.removed",
    targetType: "profile",
    targetId: parsed.data.profileId,
    metadata: {
      before: { role_slug: target.slug, role_id: target.roleId },
      after: { role_slug: null, role_id: null },
    },
  });

  const { error } = await admin.auth.admin.deleteUser(parsed.data.profileId);
  if (error) return { ok: false, error: "unknown" };

  revalidatePath("/admin/team");
  return { ok: true };
}

/** An admin account and whether it holds `admins.manage` (an owner). */
async function loadSubAdmin(admin: ReturnType<typeof createAdminClient>, profileId: string) {
  const { data: profile } = await admin
    .from("profiles")
    .select("admin_role_id")
    .eq("id", profileId)
    .eq("role", "admin")
    .maybeSingle();
  if (!profile) return null;

  const role = profile.admin_role_id
    ? (
        await admin
          .from("admin_roles")
          .select("slug, capabilities")
          .eq("id", profile.admin_role_id)
          .maybeSingle()
      ).data
    : null;

  return {
    roleId: profile.admin_role_id,
    slug: role?.slug ?? null,
    isOwner: role?.capabilities.includes("admins.manage") ?? false,
  };
}
