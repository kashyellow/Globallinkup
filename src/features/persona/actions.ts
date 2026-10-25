"use server";

import { revalidatePath } from "next/cache";

import { getCurrentProfile, getCurrentUser } from "@/lib/auth";
import { SEEDED_INTEREST_KEYS } from "@/lib/persona/interests";
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

export type PersonaError =
  "invalid" | "unknown" | "avatarRequired" | "interestRateLimit" | "interestRejected";

export type PersonaResult =
  | { ok: true; redirectTo: string }
  | { ok: false; error: PersonaError; rejectedInterests?: string[] };

type RegisterInterestResult = {
  status?: "ok" | "rate_limited";
  accepted?: string[];
  rejected?: string[];
};

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

  // A profile photo is required for new personas, but editing an existing
  // persona may keep its stored avatar. The RPC only overwrites when a new
  // path is supplied, so the check is app-level rather than a nullable-column
  // constraint (admins and legacy rows may still have no avatar).
  const currentProfile = await getCurrentProfile();
  if (!avatarPath && !currentProfile?.avatar_url) {
    return { ok: false, error: "avatarRequired" };
  }

  const supabase = await createClient();

  // Custom labels are registered before the profile write so a rejected label
  // or the 24-hour suggestion limit cannot leave a half-saved persona behind.
  const customInterests = data.interests.filter((interest) => !SEEDED_INTEREST_KEYS.has(interest));
  if (customInterests.length > 0) {
    const { data: registered, error: registerError } = await supabase.rpc(
      "register_custom_interests",
      { p_labels: customInterests },
    );
    if (registerError) return { ok: false, error: "unknown" };

    const interestResult = (registered ?? {}) as RegisterInterestResult;
    if (interestResult.status === "rate_limited") {
      return { ok: false, error: "interestRateLimit" };
    }
    if (interestResult.rejected && interestResult.rejected.length > 0) {
      return {
        ok: false,
        error: "interestRejected",
        rejectedInterests: interestResult.rejected,
      };
    }
  }

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
    p_headline: data.headline ?? "",
    p_whatsapp: nonEmpty(data.whatsapp) ?? undefined,
    p_telegram: nonEmpty(data.telegram) ?? undefined,
    p_instagram: nonEmpty(data.instagram) ?? undefined,
    p_facebook: nonEmpty(data.facebook) ?? undefined,
    p_tiktok: nonEmpty(data.tiktok) ?? undefined,
    p_x: nonEmpty(data.x) ?? undefined,
  });
  if (error) return { ok: false, error: "unknown" };

  revalidatePath("/profile");
  revalidatePath("/discover");
  revalidatePath("/verify");

  const redirectTo = status === "approved" ? "/profile" : "/verify";
  return { ok: true, redirectTo };
}
