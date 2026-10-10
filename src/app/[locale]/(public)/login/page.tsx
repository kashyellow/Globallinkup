import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LoginView } from "@/features/auth/components/login-view";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Auth.login" });
  return { title: t("title") };
}

export default function LoginPage() {
  return <LoginView />;
}
