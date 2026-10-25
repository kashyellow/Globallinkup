import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { BackLink } from "@/components/layout/back-link";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Legal.privacy" });
  return { title: t("title"), description: t("metaDescription") };
}

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Legal.privacy" });
  const tLegal = await getTranslations({ locale, namespace: "Legal" });
  const tCommon = await getTranslations({ locale, namespace: "Common" });

  return (
    <div className="mx-auto w-full max-w-[820px] px-margin-mobile py-space-lg lg:px-margin lg:py-space-xl">
      <BackLink label={tCommon("back")} />

      <header className="mt-space-md flex flex-col gap-space-xs">
        <p className="font-label-caps text-label-caps tracking-[0.16em] text-primary uppercase">
          {tLegal("eyebrow")}
        </p>
        <h1 className="font-display-md text-display-md-mobile font-bold text-on-surface md:text-display-md">
          {t("title")}
        </h1>
        <p className="font-body-sm text-body-sm text-text-muted">{t("lastUpdated")}</p>
      </header>

      <section className="mt-space-lg flex flex-col gap-space-md border-t border-outline-variant pt-space-lg">
        <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
          {t("noticeTitle")}
        </h2>
        <p className="font-body-md text-body-md leading-relaxed text-secondary">
          {t("noticeBody")}
        </p>
      </section>
    </div>
  );
}
