import "server-only";

import { cache } from "react";

import { getServerClient } from "@/lib/auth";
import { isAdminCapability, type AdminCapability } from "@/lib/admin-capabilities";
import { unwrap } from "@/lib/supabase/unwrap";

/**
 * Capabilities a role can hold (ADR 0002). The database is the source of truth;
 * this list exists so the admin shell can filter tabs and so the UI can fail
 * closed when it sees an unknown value.
 */
export { ADMIN_CAPABILITIES, isAdminCapability } from "@/lib/admin-capabilities";
export type { AdminCapability } from "@/lib/admin-capabilities";

/**
 * The caller's capabilities, read through `my_capabilities()` (a definer
 * function) so the admin shell does not need a policy on `admin_roles` for every
 * sub-admin. Cached per request.
 */
export const getAdminCapabilities = cache(async (): Promise<AdminCapability[]> => {
  const supabase = await getServerClient();
  if (!supabase) return [];

  const data = unwrap(await supabase.rpc("my_capabilities"));
  if (!Array.isArray(data)) return [];
  return data.filter(isAdminCapability);
});

/** Cheap capability probe for Server Actions and pages. Cached per request. */
export async function hasCapability(capability: AdminCapability): Promise<boolean> {
  const capabilities = await getAdminCapabilities();
  return capabilities.includes(capability);
}
