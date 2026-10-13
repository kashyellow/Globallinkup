import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";

import { routing } from "./lib/i18n/routing";
import { updateSession } from "./lib/supabase/proxy";

/**
 * Next.js 16 renamed `middleware` to `proxy`. Runs on every page request to:
 *
 * 1. refresh the Supabase session (auth cookies) — optimistic only; real
 *    authorization lives in the data layer + RLS, never here; and
 * 2. negotiate the locale (`/` → `/en`, or the persisted locale).
 */
const handleI18n = createMiddleware(routing);

export default async function proxy(request: NextRequest) {
  const supabaseResponse = await updateSession(request);
  const response = handleI18n(request);

  // `handleI18n` builds its own response (rewrite or redirect), so carry the
  // refreshed auth cookies — and their no-cache headers — across, otherwise the
  // session is dropped on the next request.
  for (const cookie of supabaseResponse.cookies.getAll()) {
    response.cookies.set(cookie);
  }

  supabaseResponse.headers.forEach((value, key) => {
    const name = key.toLowerCase();
    if (name === "cache-control" || name === "expires" || name === "pragma") {
      response.headers.set(key, value);
    }
  });

  return response;
}

export const config = {
  // Match all pathnames except for API routes, Next internals, and files with
  // an extension (e.g. `favicon.ico`).
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
