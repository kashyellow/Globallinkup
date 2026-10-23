import type { Metadata } from "next";
import { Instrument_Sans, Manrope } from "next/font/google";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { ICON_FONT_HREF } from "@/components/ui/icon-names";
import { routing } from "@/lib/i18n/routing";
import "../globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const body = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: t("title"),
      template: `%s · GlobalLinkup`,
    },
    description: t("description"),
    applicationName: "GlobalLinkup",
    manifest: "/manifest.webmanifest",
    openGraph: {
      type: "website",
      siteName: "GlobalLinkup",
      title: t("title"),
      description: t("description"),
      locale,
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
    },
  };
}

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${manrope.variable} ${body.variable} h-full scroll-pt-24 antialiased motion-safe:scroll-smooth`}
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Material Symbols icon font (App Router has no pages/_document).
            Subset via `icon_names` keeps this at ~15 KB instead of ~4 MB. */}
        <link rel="stylesheet" href={ICON_FONT_HREF} />
      </head>
      <body className="flex min-h-full flex-col bg-background font-body-md text-body-md text-on-surface">
        {/* Shell chrome (Navbar/Footer vs public header/footer) lives in the
            (app) and (public) route-group layouts below. */}
        <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
