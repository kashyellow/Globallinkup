import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LandingView } from "@/features/landing/components/landing-view";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });
  return { title: t("title"), description: t("description") };
}

export default function LandingPage() {
  return <LandingView />;
}
