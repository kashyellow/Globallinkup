import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ResetPasswordView } from "@/features/auth/components/reset-password-view";
import { getCurrentUser } from "@/lib/auth";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Auth.resetPassword" });
  return { title: t("title") };
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const user = await getCurrentUser();
  const hasRecoverySession = Boolean(user) && error !== "invalid";

  return <ResetPasswordView hasRecoverySession={hasRecoverySession} />;
}
