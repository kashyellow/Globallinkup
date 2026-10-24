import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { LoginView } from "@/features/auth/components/login-view";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "@/lib/i18n/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Auth.login" });
  return { title: t("title") };
}

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect({ href: "/discover", locale: await getLocale() });

  return <LoginView />;
}
