import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { ResetLinkSentView } from "@/features/auth/components/reset-link-sent-view";
import { RESET_REQUEST_COOKIE } from "@/lib/auth-cookies";
import { redirect } from "@/lib/i18n/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Auth.resetLinkSent" });
  return { title: t("title") };
}

export default async function ResetLinkSentPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const cookieStore = await cookies();

  if (!cookieStore.get(RESET_REQUEST_COOKIE)) {
    redirect({ href: "/forgot-password", locale });
  }

  return <ResetLinkSentView />;
}
