import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ProfileView } from "@/features/profile/components/profile-view";
import { getOwnProfile } from "@/features/profile/queries";
import { requireApprovedUser } from "@/lib/auth";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Profile.meta" });
  return { title: t("dossier") };
}

export default async function ProfilePage() {
  const { user } = await requireApprovedUser();
  const profile = await getOwnProfile(user.id);

  if (!profile) {
    return null;
  }

  return <ProfileView profile={profile} />;
}
