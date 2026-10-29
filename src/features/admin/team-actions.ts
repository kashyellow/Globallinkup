"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { isAdminCapability } from "@/lib/admin-capabilities";
import { getCurrentProfile, getCurrentUser } from "@/lib/auth";
import { getPublicEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { uuidSchema } from "@/lib/validation/ids";

export type TeamState = { ok: boolean; error?: string; link?: string };

const emailSchema = z.email();
const passwordSchema = z.string().min(8).max(72);

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

function readCapabilities(formData: FormData): string[] {
  const values = formData.getAll("capability").map(String).filter(isAdminCapability);
  return [...new Set(values)];
}

function siteUrl() {
  return getPublicEnv().NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

/** Create the account shell and return a one-time invite link, shown once. */
export async function inviteAdminAction(
  _previous: TeamState,
  formData: FormData,
): Promise<TeamState> {
  const ctx = await requireAdminsManager();
  if (!ctx) return { ok: false, error: "forbidden" };

  const rawRoleId = String(formData.get("roleId") ?? "").trim();
  const parsed = z
    .object({ email: emailSchema, roleId: z.union([uuidSchema, z.literal("")]) })
    .safeParse({ email: formData.get("email"), roleId: rawRoleId });
  if (!parsed.success) return { ok: false, error: "invalid" };

  const email = parsed.data.email.trim().toLowerCase();
  // Empty means "assign later": the account starts with no role and shows "—".
  const role = rawRoleId
    ? ((await ctx.supabase.from("admin_roles").select("id, slug").eq("id", rawRoleId).maybeSingle())
        .data ?? null)
    : null;
  if (rawRoleId && !role) return { ok: false, error: "invalid" };

  const admin = createAdminClient();
  const link = await admin.auth.admin.generateLink({ type: "invite", email });
  if (link.error || !link.data.properties?.hashed_token) {
    return { ok: false, error: link.error?.message.includes("already") ? "exists" : "unknown" };
  }

  const { error } = await admin.from("admin_invites").upsert(
    {
      email,
      admin_role_id: role?.id ?? null,
      invited_by: ctx.user.id,
      accepted_at: null,
    },
    { onConflict: "email" },
  );
  if (error) return { ok: false, error: "unknown" };

  revalidatePath("/admin/team");
  return {
    ok: true,
    link: `${siteUrl()}/accept-invite?token_hash=${encodeURIComponent(link.data.properties.hashed_token)}`,
  };
}

/** Consume the invite link, set the password, and create the admin profile. */
export async function acceptInviteAction(
  _previous: TeamState,
  formData: FormData,
): Promise<TeamState> {
  const tokenHash = String(formData.get("token_hash") ?? "");

  // Validate first: `verifyOtp` burns the single-use invite token, so a rejected
  // password must not reach it.
  const password = passwordSchema.safeParse(formData.get("password"));
  if (!password.success) return { ok: false, error: "password" };
  if (password.data !== formData.get("confirm")) return { ok: false, error: "mismatch" };

  const parsed = z
    .object({ tokenHash: z.string().min(10), password: z.string() })
    .safeParse({ tokenHash, password: password.data });
  if (!parsed.success) return { ok: false, error: "invalid" };

  const supabase = await createClient();
  const verified = await supabase.auth.verifyOtp({ type: "invite", token_hash: tokenHash });
  if (verified.error || !verified.data.user) return { ok: false, error: "link" };

  const user = verified.data.user;
  const updated = await supabase.auth.updateUser({ password: parsed.data.password });
  if (updated.error) return { ok: false, error: "weak" };

  const email = (user.email ?? "").toLowerCase();
  const admin = createAdminClient();
  const { data: invite } = await admin
    .from("admin_invites")
    .select("id, admin_role_id, accepted_at")
    .eq("email", email)
    .maybeSingle();

  if (!invite || invite.accepted_at) {
    await supabase.auth.signOut();
    return { ok: false, error: "link" };
  }

  const displayName = email.split("@")[0] || "Admin";
  const { error: profileError } = await admin.from("profiles").upsert(
    {
      id: user.id,
      display_name: displayName,
      role: "admin",
      approval_status: "approved",
      admin_role_id: invite.admin_role_id,
      reviewed_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );
  if (profileError) return { ok: false, error: "unknown" };

  await admin
    .from("admin_invites")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", invite.id);

  await recordInviteAudit(user.id, invite.admin_role_id, email);
  await supabase.auth.signOut();
  redirect("/login");
}

async function recordInviteAudit(actorId: string, roleId: string | null, email: string) {
  const admin = createAdminClient();
  const role = roleId
    ? (await admin.from("admin_roles").select("slug").eq("id", roleId).maybeSingle()).data
    : null;
  await admin.from("audit_events").insert({
    actor_id: actorId,
    actor_role: role?.slug ?? null,
    action: "admin.invite_accepted",
    target_type: "profile",
    target_id: actorId,
    metadata: { email_domain: email.split("@")[1] ?? "" },
  });
}

export async function revokeInviteAction(formData: FormData): Promise<void> {
  const ctx = await requireAdminsManager();
  if (!ctx) return;

  const parsed = z
    .object({ inviteId: uuidSchema })
    .safeParse({ inviteId: formData.get("inviteId") });
  if (!parsed.success) return;

  await ctx.supabase.from("admin_invites").delete().eq("id", parsed.data.inviteId);
  revalidatePath("/admin/team");
}

export async function saveRoleAction(_previous: TeamState, formData: FormData): Promise<TeamState> {
  const ctx = await requireAdminsManager();
  if (!ctx) return { ok: false, error: "forbidden" };

  const parsed = z.object({ roleId: uuidSchema }).safeParse({ roleId: formData.get("roleId") });
  if (!parsed.success) return { ok: false, error: "invalid" };

  const capabilities = readCapabilities(formData);
  const { error } = await ctx.supabase
    .from("admin_roles")
    .update({ capabilities })
    .eq("id", parsed.data.roleId);
  if (error) return { ok: false, error: "unknown" };

  revalidatePath("/admin/team");
  return { ok: true };
}

export async function createRoleAction(
  _previous: TeamState,
  formData: FormData,
): Promise<TeamState> {
  const ctx = await requireAdminsManager();
  if (!ctx) return { ok: false, error: "forbidden" };

  const parsed = z
    .object({ name: z.string().trim().min(2).max(40) })
    .safeParse({ name: formData.get("name") });
  if (!parsed.success) return { ok: false, error: "invalid" };

  const name = parsed.data.name;
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const { error } = await ctx.supabase.from("admin_roles").insert({
    slug,
    name,
    capabilities: readCapabilities(formData),
  });
  if (error) return { ok: false, error: error.code === "23505" ? "exists" : "unknown" };

  revalidatePath("/admin/team");
  return { ok: true };
}

export async function assignRoleAction(formData: FormData): Promise<void> {
  const ctx = await requireAdminsManager();
  if (!ctx) return;

  const parsed = z
    .object({ profileId: uuidSchema, roleId: uuidSchema })
    .safeParse({ profileId: formData.get("profileId"), roleId: formData.get("roleId") });
  if (!parsed.success) return;

  const admin = createAdminClient();
  const { data: ownerRole } = await admin
    .from("admin_roles")
    .select("id")
    .eq("slug", "owner")
    .maybeSingle();

  // The last owner cannot be demoted.
  if (ownerRole && parsed.data.roleId !== ownerRole.id) {
    const { data: target } = await admin
      .from("profiles")
      .select("admin_role_id")
      .eq("id", parsed.data.profileId)
      .maybeSingle();
    if (target?.admin_role_id === ownerRole.id) {
      const { count } = await admin
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("admin_role_id", ownerRole.id);
      if ((count ?? 0) <= 1) return;
    }
  }

  await admin
    .from("profiles")
    .update({ admin_role_id: parsed.data.roleId })
    .eq("id", parsed.data.profileId);

  revalidatePath("/admin/team");
}
