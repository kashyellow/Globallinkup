import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { PlaceholderPage } from "@/components/layout/placeholder-page";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Resources.safety" });
  return { title: t("title") };
}

export default async function SafetyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Resources.safety" });
  const tCommon = await getTranslations({ locale, namespace: "Common" });

  return (
    <PlaceholderPage
      eyebrow={t("eyebrow")}
      title={t("title")}
      noticeTitle={t("noticeTitle")}
      noticeBody={t("noticeBody")}
      backLabel={tCommon("back")}
    />
  );
}
