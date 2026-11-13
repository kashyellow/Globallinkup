import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * Recovery callback (S2). Supabase sends the email link here with a `?code=`;
 * we exchange it for a session (cookies), then send the user to the locale's
 * set-new-password screen. A missing/invalid code lands on the invalid state.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ locale: string }> },
) {
  const { locale } = await params;
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");

  // Fresh from the email: show a one-click page, so a link scanner's GET cannot
  // burn the one-time token (the POST below verifies it).
  if (tokenHash) {
    const target = new URL(`/${locale}/reset-password`, url.origin);
    target.searchParams.set("token_hash", tokenHash);
    return NextResponse.redirect(target);
  }

  const requested = url.searchParams.get("next") ?? "/reset-password";
  // Never redirect off-site: only same-app, absolute-path targets.
  const next =
    requested.startsWith("/") && !requested.startsWith("//") ? requested : "/reset-password";

  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(new URL(`/${locale}${next}`, url.origin));
      }
    } catch {
      // Unconfigured Supabase or a bad exchange — fall through to invalid.
    }
  }

  return NextResponse.redirect(new URL(`/${locale}/reset-password?error=invalid`, url.origin));
}

/**
 * Recovery `token_hash` verify. It needs no PKCE verifier cookie, so the link
 * works in a different browser than the one that asked for the reset.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ locale: string }> },
) {
  const { locale } = await params;
  const url = new URL(request.url);
  const tokenHash = (await request.formData().catch(() => null))?.get("token_hash");

  if (typeof tokenHash === "string" && tokenHash.length > 0 && tokenHash.length <= 512) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.verifyOtp({ type: "recovery", token_hash: tokenHash });
      if (!error) {
        // 303: the browser follows a POST redirect with a GET.
        return NextResponse.redirect(new URL(`/${locale}/reset-password`, url.origin), 303);
      }
    } catch {
      // Unconfigured Supabase or a bad token: fall through to invalid.
    }
  }

  return NextResponse.redirect(new URL(`/${locale}/reset-password?error=invalid`, url.origin), 303);
}
