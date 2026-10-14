import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { Icon } from "@/components/ui/icon";
import { LegalDocumentView } from "@/features/legal/components/legal-document";
import { termsDocuments } from "@/features/legal/content";
import { Link } from "@/lib/i18n/navigation";
import { routing, type Locale } from "@/lib/i18n/routing";

function isLocale(value: string): value is Locale {
  return (routing.locales as readonly string[]).includes(value);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: termsDocuments[locale].title };
}

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const t = await getTranslations("Legal");
  const document = termsDocuments[locale];

  return (
    <div className="mx-auto w-full max-w-[820px] px-margin-mobile py-space-lg lg:px-margin lg:py-space-xl">
      <Link
        href="/register"
        className="inline-flex min-h-11 items-center gap-1.5 font-label-md text-label-md font-semibold text-secondary transition-colors hover:text-primary"
      >
        <Icon name="arrow_back" className="text-lg" />
        {t("backToRegister")}
      </Link>

      <header className="mt-space-md flex flex-col gap-space-xs">
        <p className="font-label-caps text-label-caps tracking-[0.16em] text-primary uppercase">
          {t("eyebrow")}
        </p>
        <h1 className="font-display-md text-display-md-mobile font-bold text-on-surface md:text-display-md">
          {document.title}
        </h1>
        <p className="font-body-sm text-body-sm text-text-muted">
          {t("lastUpdated", { date: document.lastUpdated })}
        </p>
      </header>

      <div className="mt-space-lg border-t border-outline-variant pt-space-lg">
        <LegalDocumentView document={document} />
      </div>
    </div>
  );
}
