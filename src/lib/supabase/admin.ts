import "server-only";

import { createClient } from "@supabase/supabase-js";

import { getPublicEnv } from "@/lib/env";
import { getServerEnv } from "@/lib/env.server";
import type { Database } from "@/types/database";

/**
 * Service-role Supabase client. **Bypasses RLS entirely.**
 *
 * Server-only, and every caller must perform an explicit admin check first
 * (PRD §7.1). Reserved for privileged/bootstrap flows — normal reads and writes
 * use the RLS-scoped clients instead.
 */
export function createAdminClient() {
  const env = getPublicEnv();
  const serverEnv = getServerEnv();

  return createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, serverEnv.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
