"use server";

import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { savePersonaSchema } from "@/lib/validation/persona";

/**
 * Persona write path (S2). One action covers onboarding (no profile yet) and the
 * rejected-user resubmit (FR-2.5). It calls the `save_persona` RPC so `profiles`
 * + `profile_private` + `contact_details` are written in a single transaction
 * (F-S2-5) and an emptied date of birth is cleared (F-S2-6).
 *
 * Locale arrives in the payload — never call `getLocale()` in a Server Action.
 */

export type PersonaError = "invalid" | "unknown";

export type PersonaResult = { ok: true; redirectTo: string } | { ok: false; error: PersonaError };

const nonEmpty = (value?: string) => (value && value.length > 0 ? value : null);

export async function savePersonaAction(input: unknown): Promise<PersonaResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: true, redirectTo: "/login" };

  const parsed = savePersonaSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const data = parsed.data;

  // The path comes back from the upload action, so it is already ours — but the
  // profile row is what readers resolve, so refuse anything outside the
  // caller's storage folder before it is written.
  const avatarPath = nonEmpty(data.avatarPath);
  if (avatarPath && !avatarPath.startsWith(`${user.id}/`)) {
    return { ok: false, error: "invalid" };
  }

  const supabase = await createClient();
  const { data: status, error } = await supabase.rpc("save_persona", {
    p_display_name: data.fullName,
    p_country_code: data.country,
    p_city: data.city,
    p_bio: data.bio,
    p_bio_locale: data.locale,
    p_languages: data.languages,
    p_interests: data.interests,
    p_date_of_birth: nonEmpty(data.dateOfBirth) ?? undefined,
    p_avatar_url: avatarPath ?? undefined,
    p_whatsapp: nonEmpty(data.whatsapp) ?? undefined,
    p_telegram: nonEmpty(data.telegram) ?? undefined,
    p_instagram: nonEmpty(data.instagram) ?? undefined,
    p_facebook: nonEmpty(data.facebook) ?? undefined,
    p_tiktok: nonEmpty(data.tiktok) ?? undefined,
    p_x: nonEmpty(data.x) ?? undefined,
  });
  if (error) return { ok: false, error: "unknown" };

  const redirectTo = status === "approved" ? "/profile" : "/verify";
  return { ok: true, redirectTo };
}
