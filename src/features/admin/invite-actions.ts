"use server";

import { revalidatePath } from "next/cache";

import { requireAdminCapability } from "@/features/admin/guard";
import { recordAudit } from "@/lib/audit";
import { getRequestOrigin } from "@/lib/origin";
import { ALLOWED_IMAGE_TYPES, BUCKET_MAX_BYTES, buildStoragePath } from "@/lib/storage";
import { createAdminClient } from "@/lib/supabase/admin";
import { uuidSchema } from "@/lib/validation/ids";
import { inviteMemberSchema } from "@/lib/validation/invite";

/**
 * Member invites (ADR 0010). Supabase sends the email and creates the auth user;
 * the name, photo and language wait in `member_invites` until the invitee
 * submits their persona, which approves them. Writes use the service role, so
 * every action checks the members desk first.
 */

export type InviteError =
  | "forbidden"
  | "invalid"
  | "photoInvalid"
  | "emailInUse"
  | "alreadyInvited"
  | "sendFailed"
  | "notResendable"
  | "notRevocable"
  | "unknown";

export type InviteState = { ok: boolean; error?: InviteError };

async function confirmUrl(locale: string) {
  return `${await getRequestOrigin()}/${locale}/auth/confirm`;
}

function readPhoto(formData: FormData): File | null | "invalid" {
  const photo = formData.get("photo");
  if (!(photo instanceof File) || photo.size === 0) return null;
  const typeOk = (ALLOWED_IMAGE_TYPES as readonly string[]).includes(photo.type);
  return typeOk && photo.size <= BUCKET_MAX_BYTES.avatars ? photo : "invalid";
}

export async function inviteMemberAction(
  _previous: InviteState,
  formData: FormData,
): Promise<InviteState> {
  const ctx = await requireAdminCapability("members.review");
  if (!ctx) return { ok: false, error: "forbidden" };

  const parsed = inviteMemberSchema.safeParse({
    email: formData.get("email"),
    fullName: formData.get("fullName"),
    locale: formData.get("locale"),
  });
  if (!parsed.success) return { ok: false, error: "invalid" };
  const photo = readPhoto(formData);
  if (photo === "invalid") return { ok: false, error: "photoInvalid" };
  const { email, fullName, locale } = parsed.data;

  const admin = createAdminClient();
  const { data: pending } = await admin
    .from("member_invites")
    .select("user_id")
    .eq("email", email)
    .is("accepted_at", null)
    .maybeSingle();
  if (pending) return { ok: false, error: "alreadyInvited" };

  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: await confirmUrl(locale),
    data: { locale },
  });
  if (error || !data.user) {
    const exists = error?.code === "email_exists" || error?.status === 422;
    return { ok: false, error: exists ? "emailInUse" : "sendFailed" };
  }
  const userId = data.user.id;

  let avatarPath: string | null = null;
  if (photo) {
    avatarPath = buildStoragePath(userId, photo.name);
    const { error: uploadError } = await admin.storage
      .from("avatars")
      .upload(avatarPath, photo, { contentType: photo.type });
    if (uploadError) avatarPath = null;
  }

  const { error: insertError } = await admin.from("member_invites").insert({
    user_id: userId,
    email,
    display_name: fullName,
    avatar_path: avatarPath,
    locale,
    invited_by: ctx.user.id,
  });
  if (insertError) {
    // Do not leave an invited login behind that nobody can see or revoke.
    if (avatarPath) await admin.storage.from("avatars").remove([avatarPath]);
    await admin.auth.admin.deleteUser(userId);
    return { ok: false, error: "unknown" };
  }

  await recordAudit({ action: "member.invite", targetType: "profile", targetId: userId });
  revalidatePath("/admin/invite");
  return { ok: true };
}

export async function resendInviteAction(
  _previous: InviteState,
  formData: FormData,
): Promise<InviteState> {
  if (!(await requireAdminCapability("members.review"))) return { ok: false, error: "forbidden" };
  const userId = uuidSchema.safeParse(formData.get("userId"));
  if (!userId.success) return { ok: false, error: "invalid" };

  const admin = createAdminClient();
  const { data: invite } = await admin
    .from("member_invites")
    .select("email, locale, opened_at, accepted_at")
    .eq("user_id", userId.data)
    .maybeSingle();
  // Once the link is used Supabase treats the email as confirmed and refuses a re-invite.
  if (!invite || invite.opened_at || invite.accepted_at) {
    return { ok: false, error: "notResendable" };
  }

  const { error } = await admin.auth.admin.inviteUserByEmail(invite.email, {
    redirectTo: await confirmUrl(invite.locale),
    data: { locale: invite.locale },
  });
  if (error) return { ok: false, error: "sendFailed" };

  await admin
    .from("member_invites")
    .update({ last_sent_at: new Date().toISOString() })
    .eq("user_id", userId.data);
  await recordAudit({
    action: "member.invite_resend",
    targetType: "profile",
    targetId: userId.data,
  });
  revalidatePath("/admin/invite");
  return { ok: true };
}

export async function revokeInviteAction(
  _previous: InviteState,
  formData: FormData,
): Promise<InviteState> {
  if (!(await requireAdminCapability("members.review"))) return { ok: false, error: "forbidden" };
  const userId = uuidSchema.safeParse(formData.get("userId"));
  if (!userId.success) return { ok: false, error: "invalid" };

  const admin = createAdminClient();
  const { data: invite } = await admin
    .from("member_invites")
    .select("avatar_path, accepted_at")
    .eq("user_id", userId.data)
    .maybeSingle();
  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("id", userId.data)
    .maybeSingle();
  // A submitted persona is a member now: suspend from the Users tab instead.
  if (!invite || invite.accepted_at || profile) return { ok: false, error: "notRevocable" };

  if (invite.avatar_path) await admin.storage.from("avatars").remove([invite.avatar_path]);
  const { error } = await admin.auth.admin.deleteUser(userId.data);
  if (error) return { ok: false, error: "unknown" };

  await recordAudit({
    action: "member.invite_revoke",
    targetType: "profile",
    targetId: userId.data,
  });
  revalidatePath("/admin/invite");
  return { ok: true };
}
