import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { RegistrationDraftProvider } from "@/features/auth/components/registration-draft-provider";
import { CreatePersonaView } from "@/features/persona/components/create-persona-view";
import { loadPersonaInitial } from "@/features/persona/initial";
import { getInterestCatalog } from "@/features/persona/queries";
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
  await requireApprovedUser();
  const [initial, interestCatalog] = await Promise.all([
    loadPersonaInitial(),
    getInterestCatalog(),
  ]);

  return (
    <RegistrationDraftProvider>
      <CreatePersonaView
        initial={initial}
        interestCatalog={interestCatalog}
        isAuthenticated
        mode="edit"
      />
    </RegistrationDraftProvider>
  );
}
