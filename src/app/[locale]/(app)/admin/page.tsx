import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AdminView } from "@/features/admin/components/admin-view";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Admin" });
  return { title: t("title") };
}

export default function AdminPage() {
  return <AdminView />;
}
