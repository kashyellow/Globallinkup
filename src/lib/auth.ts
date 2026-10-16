import "server-only";

import { cache } from "react";
import { getLocale } from "next-intl/server";

import { redirect } from "@/lib/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

/**
 * Session + profile access layer (S2). Every helper degrades like the proxy:
 * if Supabase is unconfigured or unreachable (CI, a dev without `.env.local`),
 * it is treated as "no session" and the caller is redirected to login — never a
 * 500. `cache()` dedupes the work across a layout and the page beneath it.
 *
 * IMPORTANT: `requireApprovedUser` / `requireAdmin` call next-intl's
 * `getLocale()`, which resolves through `next/root-params` — available in routes
 * only. **Never call these from a Server Action**; check the profile directly
 * there instead (see `reviewPersonaAction`).
 */

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export const getServerClient = cache(async () => {
  try {
    return await createClient();
  } catch {
    return null;
  }
});

export const getCurrentUser = cache(async () => {
  const supabase = await getServerClient();
  if (!supabase) return null;

  try {
    const { data } = await supabase.auth.getUser();
    return data.user;
  } catch {
    return null;
  }
});

export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await getServerClient();
  const user = await getCurrentUser();
  if (!supabase || !user) return null;

  try {
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
    return data;
  } catch {
    return null;
  }
});

/** Signed in + profile exists + approved, else redirect. Used by the app shell. */
export async function requireApprovedUser() {
  const locale = await getLocale();
  const user = await getCurrentUser();
  if (!user) return redirect({ href: "/login", locale });

  const profile = await getCurrentProfile();
  if (!profile) return redirect({ href: "/create-persona", locale });
  if (profile.approval_status !== "approved") return redirect({ href: "/verify", locale });

  return { user, profile };
}

/** Additionally requires `role = admin`. Used by `/admin`. */
export async function requireAdmin() {
  const locale = await getLocale();
  const { user, profile } = await requireApprovedUser();
  if (profile.role !== "admin") return redirect({ href: "/discover", locale });

  return { user, profile };
}
