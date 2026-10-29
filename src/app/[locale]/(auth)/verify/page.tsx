import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { VerifyView, type VerifyState } from "@/features/auth/components/verify-view";
import { getCurrentProfile, getCurrentUser } from "@/lib/auth";
import { redirect } from "@/lib/i18n/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Auth.verify" });
  return { title: t("title") };
}

export default async function VerifyPage() {
  const locale = await getLocale();
  const user = await getCurrentUser();
  if (!user) redirect({ href: "/login", locale });

  const profile = await getCurrentProfile();
  if (!profile) {
    redirect({ href: "/create-persona", locale });
    return null;
  }

  const status: VerifyState = profile.approval_status;

  const languages = Array.isArray(profile?.languages)
    ? (profile?.languages as { code?: string }[])
        .map((entry) => entry?.code ?? "")
        .filter((code) => code.length > 0)
    : [];
  const location = [profile?.city, profile?.country_code].filter(Boolean).join(", ");

  return (
    <VerifyView
      status={status}
      persona={{
        displayName: profile?.display_name ?? "",
        location,
        languages,
      }}
    />
  );
}
