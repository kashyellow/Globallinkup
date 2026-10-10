import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CreatePersonaView } from "@/features/persona/components/create-persona-view";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "PersonaForm" });
  return { title: t("title") };
}

export default function CreatePersonaPage() {
  return <CreatePersonaView />;
}
