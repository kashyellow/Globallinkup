import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ProfileView } from "@/features/profile/components/profile-view";
import { PROFILE_IDENTITY } from "@/features/profile/data";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Profile.meta" });
  return { title: `${PROFILE_IDENTITY.name} · ${t("dossier")}` };
}

export default function ProfilePage() {
  return <ProfileView />;
}
