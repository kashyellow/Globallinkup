import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getPublicEnv } from "@/lib/env";
import type { Database } from "@/types/database";

let warnedAboutMissingEnv = false;

/**
 * Refresh the Supabase session for a request and return a response carrying the
 * updated auth cookies.
 *
 * This is **optimistic only** and deliberately non-fatal: it runs on every page
 * request, so it must never be the reason the whole site fails. If Supabase is
 * unconfigured (CI, or a dev without `.env.local`) or unreachable, we skip the
 * refresh and let the app render logged-out — which is fail-closed, because RLS
 * denies anonymous access anyway. Authoritative authorization lives in the data
 * layer and RLS, never here (see `docs/plan/api-layer/README.md` §1 A2/A6).
 *
 * Do not put logic between creating the client and `getUser()`, or the
 * refreshed cookies will not be written.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  let url: string;
  let anonKey: string;
  try {
    const env = getPublicEnv();
    url = env.NEXT_PUBLIC_SUPABASE_URL;
    anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  } catch (error) {
    if (!warnedAboutMissingEnv) {
      warnedAboutMissingEnv = true;
      console.warn(
        "[supabase/proxy] skipping session refresh — public env is not configured.",
        error instanceof Error ? error.message : error,
      );
    }
    return response;
  }

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }

        response = NextResponse.next({ request });

        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }

        // No-cache headers required so a CDN/reverse proxy never serves one
        // user's session token to another.
        for (const [key, value] of Object.entries(headers)) {
          response.headers.set(key, value);
        }
      },
    },
  });

  try {
    await supabase.auth.getUser();
  } catch {
    // Auth/unreachable — keep whatever cookies already exist.
  }

  return response;
}
