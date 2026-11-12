import "server-only";

import type { AdminCapability } from "@/lib/admin-capabilities";
import { getCurrentProfile, getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * Server Action guard: an approved admin holding `capability`, else `null`.
 * Actions cannot use `requireAdmin` (it reads the locale from the route).
 */
export async function requireAdminCapability(capability: AdminCapability) {
  const user = await getCurrentUser();
  const profile = await getCurrentProfile();
  if (!user || !profile || profile.role !== "admin" || profile.approval_status !== "approved") {
    return null;
  }
  const supabase = await createClient();
  const { data } = await supabase.rpc("my_capabilities");
  const capabilities = Array.isArray(data) ? data : [];
  if (!capabilities.includes(capability)) return null;
  return { user, profile, supabase };
}
