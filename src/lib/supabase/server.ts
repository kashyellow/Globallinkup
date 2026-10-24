import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { getPublicEnv } from "@/lib/env";
import { applyRemember } from "@/lib/supabase/cookies";
import type { Database } from "@/types/database";

/**
 * Server Supabase client for server components, server actions and route
 * handlers. RLS-scoped by the user's session cookies.
 *
 * Create a **new client per request** — never cache it across requests.
 * In Next.js 16 `cookies()` is async.
 */
export async function createClient(clientOptions: { remember?: boolean } = {}) {
  const cookieStore = await cookies();
  const env = getPublicEnv();

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, applyRemember(options, clientOptions.remember));
            }
          } catch {
            // Called from a server component, where cookies are read-only.
            // Writing is handled by `src/lib/supabase/proxy.ts` on refresh.
          }
        },
      },
    },
  );
}
