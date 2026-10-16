"use server";

import { getLocale } from "next-intl/server";

import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { savePersonaSchema } from "@/lib/validation/persona";

/**
 * Persona write path (S2). One action covers both onboarding (no profile yet)
 * and the rejected-user resubmit (FR-2.5) — the latter is an update, enabled by
 * the SB-1c guard. Writes `profiles` + `profile_private` (DOB) + `contact_details`.
 */

export type PersonaError = "invalid" | "unknown";

export type PersonaResult = { ok: true; redirectTo: string } | { ok: false; error: PersonaError };

export async function savePersonaAction(input: unknown): Promise<PersonaResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: true, redirectTo: "/login" };

  const parsed = savePersonaSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const data = parsed.data;

  const locale = await getLocale();
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("profiles")
    .select("approval_status")
    .eq("id", user.id)
    .maybeSingle();

  const nullable = (value?: string) => (value && value.length > 0 ? value : null);
  // The single bio field writes to the active locale's column (SB-3).
  const bioFields = locale === "es" ? { bio_es: data.bio } : { bio_en: data.bio };
  const fields = {
    display_name: data.fullName,
    country_code: data.country,
    city: data.city,
    origin_flavor: nullable(data.originFlavor),
    languages: data.languages,
    interests: data.interests,
    ...bioFields,
  };

  if (!existing) {
    const { error } = await supabase.from("profiles").insert({
      id: user.id,
      ...fields,
      approval_status: "pending",
      submitted_at: new Date().toISOString(),
    });
    if (error) return { ok: false, error: "unknown" };
  } else {
    const resubmitting = existing.approval_status === "rejected";
    const { error } = await supabase
      .from("profiles")
      .update({
        ...fields,
        ...(resubmitting
          ? { approval_status: "pending" as const, submitted_at: new Date().toISOString() }
          : {}),
      })
      .eq("id", user.id);
    if (error) return { ok: false, error: "unknown" };
  }

  if (data.dateOfBirth) {
    const { error } = await supabase
      .from("profile_private")
      .upsert({ profile_id: user.id, date_of_birth: data.dateOfBirth });
    if (error) return { ok: false, error: "unknown" };
  }

  const { error: contactError } = await supabase.from("contact_details").upsert({
    profile_id: user.id,
    instagram: nullable(data.instagram),
    other: data.chat ? { chat: data.chat } : {},
  });
  if (contactError) return { ok: false, error: "unknown" };

  const redirectTo = existing?.approval_status === "approved" ? "/profile" : "/verify";
  return { ok: true, redirectTo };
}
