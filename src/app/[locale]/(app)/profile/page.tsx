import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { ProfileView } from "@/features/profile/components/profile-view";
import { getOwnProfile } from "@/features/profile/queries";
import { requireApprovedUser } from "@/lib/auth";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Nav" });
  return { title: t("profile") };
}

export default async function ProfilePage() {
  const { user } = await requireApprovedUser();
  const profile = await getOwnProfile(user.id);

  if (!profile) {
    notFound();
  }

  return <ProfileView profile={profile} />;
}
