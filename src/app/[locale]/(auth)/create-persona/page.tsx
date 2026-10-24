import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import {
  CreatePersonaView,
  type PersonaInitial,
} from "@/features/persona/components/create-persona-view";
import { getInterestCatalog } from "@/features/persona/queries";
import { getCurrentProfile, getCurrentUser, getServerClient } from "@/lib/auth";
import { createSignedImageUrl } from "@/lib/storage";
import { unwrap } from "@/lib/supabase/unwrap";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "PersonaForm" });
  return { title: t("title") };
}

/** Prefill on the resubmit/edit path; `undefined` for a first-time onboarding. */
async function loadInitial(): Promise<PersonaInitial | undefined> {
  const profile = await getCurrentProfile();
  if (!profile) return undefined;

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
    country: profile.country_code ?? "ES",
    city: profile.city ?? "",
    dateOfBirth,
    languages,
    interests: profile.interests ?? [],
    bio: profile.bio_en ?? profile.bio_es ?? "",
    avatarUrl,
    ...contacts,
  };
}

export default async function CreatePersonaPage() {
  const [user, interestCatalog] = await Promise.all([getCurrentUser(), getInterestCatalog()]);
  const initial = user ? await loadInitial() : undefined;

  return (
    <CreatePersonaView
      initial={initial}
      interestCatalog={interestCatalog}
      isAuthenticated={Boolean(user)}
    />
  );
}
