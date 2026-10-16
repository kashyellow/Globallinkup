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
