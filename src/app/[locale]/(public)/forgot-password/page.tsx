import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ForgotPasswordView } from "@/features/auth/components/forgot-password-view";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Auth.forgotPassword" });
  return { title: t("title") };
}

export default function ForgotPasswordPage() {
  return <ForgotPasswordView />;
}
