"use server";

import { z } from "zod";
import { uuidSchema } from "@/lib/validation/ids";

import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * S3b — Connect. Not messaging: a note-backed request, accept/decline, and
 * disconnect. The DB trigger owns the legal transitions; these actions mirror it
 * so the UI gets a clear error and the RLS client stays the only writer.
 */

export type ConnectResult = { ok: true } | { ok: false; error: string };

const requestSchema = z.object({
  recipientId: uuidSchema,
  note: z.string().trim().min(1, "noteRequired").max(2000),
});

const idSchema = z.object({ id: uuidSchema });

export async function sendConnectRequestAction(input: unknown): Promise<ConnectResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "unauthenticated" };

  const parsed = requestSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  if (parsed.data.recipientId === user.id) return { ok: false, error: "self" };

  const supabase = await createClient();
  const { error } = await supabase.from("connections").insert({
    requester_id: user.id,
    recipient_id: parsed.data.recipientId,
    status: "requested",
    intro: parsed.data.note,
  });

  if (!error) return { ok: true };

  // The pair is unique, so a declined row blocks the insert. FR-5.6/OQ-2: the
  // original sender resets that row to `requested` instead of creating a second
  // one. The trigger owns the transition; a non-declined row simply stays as is.
  if (error.code === "23505") {
    const { data: updated, error: updateError } = await supabase
      .from("connections")
      .update({ status: "requested", intro: parsed.data.note })
      .eq("requester_id", user.id)
      .eq("recipient_id", parsed.data.recipientId)
      .eq("status", "declined")
      .select("id");

    if (!updateError && updated && updated.length > 0) return { ok: true };
  }

  return { ok: false, error: "unknown" };
}

async function setStatus(
  input: unknown,
  status: "accepted" | "declined" | "requested",
): Promise<ConnectResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "unauthenticated" };

  const parsed = idSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("connections")
    .update({ status })
    .eq("id", parsed.data.id)
    .select("id");

  // RLS filters rows the caller may not touch; the trigger rejects illegal moves.
  if (error) return { ok: false, error: "transition" };
  if (!data || data.length === 0) return { ok: false, error: "forbidden" };

  return { ok: true };
}

export async function acceptConnectionAction(input: unknown): Promise<ConnectResult> {
  return setStatus(input, "accepted");
}

export async function declineConnectionAction(input: unknown): Promise<ConnectResult> {
  return setStatus(input, "declined");
}

export async function disconnectConnectionAction(input: unknown): Promise<ConnectResult> {
  return setStatus(input, "declined");
}

export async function reRequestConnectionAction(input: unknown): Promise<ConnectResult> {
  return setStatus(input, "requested");
}
