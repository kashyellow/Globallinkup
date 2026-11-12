import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * Invite link target (ADR 0010). The email template sends `token_hash` here so
 * the server can verify it (the default link uses the URL hash, which a server
 * never sees). Success signs the invitee in and opens the password step; any
 * failure shows the expired-invitation state.
 */
const querySchema = z.object({ token_hash: z.string().min(1), type: z.literal("invite") });

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ locale: string }> },
) {
  const { locale } = await params;
  const url = new URL(request.url);
  const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams));

  if (parsed.success) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.auth.verifyOtp({
        type: "invite",
        token_hash: parsed.data.token_hash,
      });
      if (!error && data.user) {
        // Marks the invite "link opened": Supabase now refuses a re-invite.
        await createAdminClient()
          .from("member_invites")
          .update({ opened_at: new Date().toISOString() })
          .eq("user_id", data.user.id)
          .is("opened_at", null);
        return NextResponse.redirect(new URL(`/${locale}/accept-invite`, url.origin));
      }
    } catch {
      // Unconfigured Supabase or a bad token: fall through to expired.
    }
  }

  return NextResponse.redirect(new URL(`/${locale}/accept-invite?error=expired`, url.origin));
}
