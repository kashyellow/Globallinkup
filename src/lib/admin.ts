import "server-only";

import { cache } from "react";

import { getServerClient } from "@/lib/auth";
import { unwrap } from "@/lib/supabase/unwrap";

/**
 * Capabilities a role can hold (ADR 0002). The database is the source of truth;
 * this list exists so the admin shell can filter tabs and so the UI can fail
 * closed when it sees an unknown value.
 */
export const ADMIN_CAPABILITIES = [
  "members.review",
  "posts.moderate",
  "comments.moderate",
  "interests.review",
  "reports.manage",
  "marketplace.manage",
  "admins.manage",
  "settings.manage",
  "audit.read",
] as const;

export type AdminCapability = (typeof ADMIN_CAPABILITIES)[number];

export function isAdminCapability(value: string): value is AdminCapability {
  return (ADMIN_CAPABILITIES as readonly string[]).includes(value);
}

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
