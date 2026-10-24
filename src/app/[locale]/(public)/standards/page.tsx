import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { PlaceholderPage } from "@/components/layout/placeholder-page";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Resources.standards" });
  return { title: t("title") };
}

export default async function StandardsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Resources.standards" });

  return (
    <PlaceholderPage
      eyebrow={t("eyebrow")}
      title={t("title")}
      noticeTitle={t("noticeTitle")}
      noticeBody={t("noticeBody")}
      backLabel={t("backHome")}
    />
  );
}
