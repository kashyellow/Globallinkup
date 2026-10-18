import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { DiscoverView } from "@/features/persona/components/discover-view";
import { getDiscoverPersonas } from "@/features/persona/queries";
import { requireApprovedUser } from "@/lib/auth";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Discover" });
  return { title: t("title") };
}

export default async function DiscoverPage() {
  const { user } = await requireApprovedUser();
  const personas = await getDiscoverPersonas(user.id);

  return <DiscoverView personas={personas} />;
}
