import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { DiscoverView } from "@/features/persona/components/discover-view";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Discover" });
  return { title: t("title") };
}

export default function DiscoverPage() {
  return <DiscoverView />;
}
