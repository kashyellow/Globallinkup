import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { RegistrationDraftProvider } from "@/features/auth/components/registration-draft-provider";
import { CreatePersonaView } from "@/features/persona/components/create-persona-view";
import { loadPersonaInitial } from "@/features/persona/initial";
import { requireApprovedUser } from "@/lib/auth";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "PersonaForm" });
  return { title: t("editTitle") };
}

/**
 * Editing an approved persona reuses the onboarding form in `edit` mode: the
 * fields are prefilled and saving keeps the current approval status.
 */
export default async function EditPersonaPage() {
  const { profile } = await requireApprovedUser();
  // Admins are operators, not members: they have no persona to edit.
  if (profile.role === "admin") notFound();

  const initial = await loadPersonaInitial();

  return (
    <RegistrationDraftProvider>
      <CreatePersonaView initial={initial} isAuthenticated mode="edit" />
    </RegistrationDraftProvider>
  );
}
