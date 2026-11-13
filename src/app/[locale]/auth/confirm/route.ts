import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * Invite link target (ADR 0010). The email template sends `token_hash` here so
 * the server can verify it (the default link uses the URL hash, which a server
 * never sees).
 *
 * GET only forwards to a "Continue" page: mail scanners prefetch links, and a
 * GET that verified would burn the one-time token before the invitee clicks.
 * The page POSTs back here; success signs the invitee in and opens the
 * password step, any failure shows the expired-invitation state.
 */
const tokenSchema = z.object({ token_hash: z.string().min(1).max(512), type: z.literal("invite") });

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ locale: string }> },
) {
  const { locale } = await params;
  const url = new URL(request.url);
  const parsed = tokenSchema.safeParse(Object.fromEntries(url.searchParams));
  const target = new URL(`/${locale}/accept-invite`, url.origin);
  if (parsed.success) target.searchParams.set("token_hash", parsed.data.token_hash);
  else target.searchParams.set("error", "expired");
  return NextResponse.redirect(target);
}

/** The `session_id` claim of the session `verifyOtp` just issued. */
function sessionIdOf(accessToken: string): string | null {
  try {
    const payload = JSON.parse(Buffer.from(accessToken.split(".")[1], "base64url").toString());
    return typeof payload.session_id === "string" ? payload.session_id : null;
  } catch {
    return null;
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ locale: string }> },
) {
  const { locale } = await params;
  const url = new URL(request.url);
  const form = await request.formData().catch(() => null);
  const parsed = tokenSchema.safeParse({ token_hash: form?.get("token_hash"), type: "invite" });

  if (parsed.success) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.auth.verifyOtp({
        type: "invite",
        token_hash: parsed.data.token_hash,
      });
      const sessionId = data.session ? sessionIdOf(data.session.access_token) : null;
      if (!error && data.user && sessionId) {
        // Binds the invite to the session that proved the mailbox: `/signup`
        // can also sign in as an unconfirmed invitee, and must not be approved.
        const admin = createAdminClient();
        const { data: invite } = await admin
          .from("member_invites")
          .select("opened_at")
          .eq("user_id", data.user.id)
          .maybeSingle();
        await admin
          .from("member_invites")
          .update({
            opened_at: invite?.opened_at ?? new Date().toISOString(),
            verified_session_id: sessionId,
          })
          .eq("user_id", data.user.id);
        // 303: the browser follows a POST redirect with a GET.
        return NextResponse.redirect(new URL(`/${locale}/accept-invite`, url.origin), 303);
      }
      console.error("invite verify failed", error?.status, error?.code, error?.message);
    } catch (e) {
      console.error("invite confirm threw", e instanceof Error ? e.message : e);
      // Unconfigured Supabase or a bad token: fall through to expired.
    }
  }

  return NextResponse.redirect(new URL(`/${locale}/accept-invite?error=expired`, url.origin), 303);
}
