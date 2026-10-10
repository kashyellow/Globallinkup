import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { RegisterView } from "@/features/auth/components/register-view";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Auth.register" });
  return { title: t("title") };
}

export default function RegisterPage() {
  return <RegisterView />;
}
