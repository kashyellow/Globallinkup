import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CreatePersonaView } from "@/features/persona/components/create-persona-view";
import { loadPersonaInitial } from "@/features/persona/initial";
import { getCurrentProfile, getCurrentUser, getServerClient } from "@/lib/auth";
import { redirect } from "@/lib/i18n/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "PersonaForm" });
  return { title: t("title") };
}

export default async function CreatePersonaPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await getCurrentUser();

  // An invitee sets their password and accepts the terms first (ADR 0010).
  const supabase = user && !(await getCurrentProfile()) ? await getServerClient() : null;
  if (user && supabase) {
    const { data: invite } = await supabase
      .from("member_invites")
      .select("terms_accepted_at")
      .eq("user_id", user.id)
      .is("accepted_at", null)
      .maybeSingle();
    if (invite && !invite.terms_accepted_at) redirect({ href: "/accept-invite", locale });
  }
  const initial = user ? await loadPersonaInitial() : undefined;

  return <CreatePersonaView initial={initial} isAuthenticated={Boolean(user)} />;
}
