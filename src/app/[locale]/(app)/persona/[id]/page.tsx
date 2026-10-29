import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { PersonaDetailView } from "@/features/persona/components/persona-detail-view";
import { getPersonaDetail } from "@/features/persona/queries";
import { requireApprovedUser } from "@/lib/auth";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Discover.detail" });
  return { title: t("metaTitle") };
}

export default async function PersonaDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const { user, profile } = await requireApprovedUser();
  const persona = await getPersonaDetail(user.id, id, locale);

  if (!persona) notFound();

  return (
    <PersonaDetailView
      persona={persona}
      isSelf={persona.id === user.id}
      canConnect={profile.role === "user"}
    />
  );
}
