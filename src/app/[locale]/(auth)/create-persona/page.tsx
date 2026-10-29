import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CreatePersonaView } from "@/features/persona/components/create-persona-view";
import { loadPersonaInitial } from "@/features/persona/initial";
import { getCurrentUser } from "@/lib/auth";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "PersonaForm" });
  return { title: t("title") };
}

export default async function CreatePersonaPage() {
  const user = await getCurrentUser();
  const initial = user ? await loadPersonaInitial() : undefined;

  return <CreatePersonaView initial={initial} isAuthenticated={Boolean(user)} />;
}
