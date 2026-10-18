import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ConnectionsView } from "@/features/connect/components/connections-view";
import { getConnectionsData } from "@/features/connect/queries";
import { requireApprovedUser } from "@/lib/auth";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Connections.header" });
  return { title: t("title") };
}

export default async function ConnectionsPage() {
  const { user } = await requireApprovedUser();
  const data = await getConnectionsData(user.id);

  return <ConnectionsView data={data} />;
}
