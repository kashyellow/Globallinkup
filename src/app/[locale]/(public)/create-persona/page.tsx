import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import {
  CreatePersonaView,
  type PersonaInitial,
} from "@/features/persona/components/create-persona-view";
import { getCurrentProfile, getServerClient } from "@/lib/auth";
import { createSignedImageUrl } from "@/lib/storage";

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
    avatarUrl = !avatarPath
      ? null
      : avatarPath.startsWith("http")
        ? avatarPath
        : await createSignedImageUrl(supabase, "avatars", avatarPath);

    const { data: contact } = await supabase
      .from("contact_details")
      .select("whatsapp, instagram, other")
      .eq("profile_id", profile.id)
      .maybeSingle();
    const other = (contact?.other ?? null) as Record<string, string> | null;
    contacts.whatsapp = contact?.whatsapp ?? "";
    contacts.instagram = contact?.instagram ?? "";
    contacts.telegram = other?.telegram ?? "";
    contacts.facebook = other?.facebook ?? "";
    contacts.tiktok = other?.tiktok ?? "";
    contacts.x = other?.x ?? "";

    const { data: privateRow } = await supabase
      .from("profile_private")
      .select("date_of_birth")
      .eq("profile_id", profile.id)
      .maybeSingle();
    dateOfBirth = privateRow?.date_of_birth ?? "";
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
  const initial = await loadInitial();

  return <CreatePersonaView initial={initial} />;
}
