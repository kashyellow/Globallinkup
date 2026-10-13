import { createBrowserClient } from "@supabase/ssr";

import { getPublicEnv } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Browser Supabase client for client components. RLS-scoped: it carries the
 * anon key and the user's session cookies, never the service role.
 *
 * Create a fresh client per call; use this for realtime/auth listeners rather
 * than for app reads (reads go through server components — see
 * docs/plan/api-layer/README.md §5).
 */
export function createClient() {
  const env = getPublicEnv();

  return createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
