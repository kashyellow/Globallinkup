import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ConnectionsView } from "@/features/connect/components/connections-view";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Connections.header" });
  return { title: t("title") };
}

export default function ConnectionsPage() {
  return <ConnectionsView />;
}
