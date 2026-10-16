import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import {
  CreatePersonaView,
  type PersonaInitial,
} from "@/features/persona/components/create-persona-view";
import { getCurrentProfile, getServerClient } from "@/lib/auth";

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
  let instagram = "";
  let chat = "";
  let dateOfBirth = "";

  if (supabase) {
    const { data: contact } = await supabase
      .from("contact_details")
      .select("instagram, other")
      .eq("profile_id", profile.id)
      .maybeSingle();
    instagram = contact?.instagram ?? "";
    const other = (contact?.other ?? null) as { chat?: string } | null;
    chat = other?.chat ?? "";

    const { data: privateRow } = await supabase
      .from("profile_private")
      .select("date_of_birth")
      .eq("profile_id", profile.id)
      .maybeSingle();
    dateOfBirth = privateRow?.date_of_birth ?? "";
  }

  const languages = Array.isArray(profile.languages)
    ? (profile.languages as { code?: string }[])
        .map((entry) => entry?.code ?? "")
        .filter((code) => code.length > 0)
    : [];

  return {
    fullName: profile.display_name,
    country: profile.country_code ?? "ES",
    city: profile.city ?? "",
    originFlavor: profile.origin_flavor ?? "",
    dateOfBirth,
    languages,
    interests: profile.interests ?? [],
    bio: profile.bio_en ?? profile.bio_es ?? "",
    instagram,
    chat,
  };
}

export default async function CreatePersonaPage() {
  const initial = await loadInitial();

  return <CreatePersonaView initial={initial} />;
}
