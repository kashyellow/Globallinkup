import "server-only";

import { getCurrentProfile, getServerClient } from "@/lib/auth";
import { createSignedImageUrl } from "@/lib/storage";
import { unwrap } from "@/lib/supabase/unwrap";

import type { PersonaInitial } from "./components/create-persona-view";

/**
 * Prefill for the edit/resubmit path: the stored persona, contact channels,
 * date of birth and a signed avatar URL. `undefined` for a first-time
 * onboarding, where the form starts empty.
 */
export async function loadPersonaInitial(): Promise<PersonaInitial | undefined> {
  const profile = await getCurrentProfile();
  if (!profile) return loadInviteInitial();

  const supabase = await getServerClient();
  const contacts = {
    whatsapp: "",
    telegram: "",
    instagram: "",
    facebook: "",
    tiktok: "",
    x: "",
  };
  let dateOfBirth = "";
  let avatarUrl: string | null = null;

  if (supabase) {
    const avatarPath = profile.avatar_url;

    const [signedAvatar, contact, privateRow] = await Promise.all([
      !avatarPath
        ? Promise.resolve(null)
        : avatarPath.startsWith("http")
          ? Promise.resolve(avatarPath)
          : createSignedImageUrl(supabase, "avatars", avatarPath),
      supabase
        .from("contact_details")
        .select("whatsapp, instagram, other")
        .eq("profile_id", profile.id)
        .maybeSingle()
        .then(unwrap),
      supabase
        .from("profile_private")
        .select("date_of_birth")
        .eq("profile_id", profile.id)
        .maybeSingle()
        .then(unwrap),
    ]);

    const other = (contact?.other ?? null) as Record<string, string> | null;
    contacts.whatsapp = contact?.whatsapp ?? "";
    contacts.instagram = contact?.instagram ?? "";
    contacts.telegram = other?.telegram ?? "";
    contacts.facebook = other?.facebook ?? "";
    contacts.tiktok = other?.tiktok ?? "";
    contacts.x = other?.x ?? "";
    dateOfBirth = privateRow?.date_of_birth ?? "";
    avatarUrl = signedAvatar;
  }

  const languages = Array.isArray(profile.languages)
    ? (profile.languages as { code?: string; level?: string }[])
        .filter((entry) => typeof entry?.code === "string" && entry.code.length > 0)
        .map((entry) => ({ code: entry.code as string, level: entry.level ?? "fluent" }))
    : [];

  return {
    fullName: profile.display_name,
    headline: profile.headline ?? "",
    country: profile.country_code ?? "ES",
    city: profile.city ?? "",
    dateOfBirth,
    languages,
    bio: profile.bio_en ?? profile.bio_es ?? "",
    avatarUrl,
    hasStoredAvatar: Boolean(profile.avatar_url),
    ...contacts,
  };
}

/**
 * An invited member's first persona (ADR 0010): the name and photo the admin
 * entered, editable like any other field. `undefined` without an open invite.
 */
async function loadInviteInitial(): Promise<PersonaInitial | undefined> {
  const supabase = await getServerClient();
  if (!supabase) return undefined;

  const { data: invite } = await supabase
    .from("member_invites")
    .select("display_name, avatar_path")
    .is("accepted_at", null)
    .maybeSingle();
  if (!invite) return undefined;

  return {
    fullName: invite.display_name,
    headline: "",
    country: "ES",
    city: "",
    dateOfBirth: "",
    languages: [],
    bio: "",
    avatarUrl: invite.avatar_path
      ? await createSignedImageUrl(supabase, "avatars", invite.avatar_path)
      : null,
    hasStoredAvatar: Boolean(invite.avatar_path),
    whatsapp: "",
    telegram: "",
    instagram: "",
    facebook: "",
    tiktok: "",
    x: "",
  };
}
