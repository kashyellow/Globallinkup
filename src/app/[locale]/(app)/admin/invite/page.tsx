import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { AdminInviteTab } from "@/features/admin/components/invite-tab";
import { getPendingInvites } from "@/features/admin/queries";
import { getAdminCapabilities } from "@/lib/admin";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Admin.invite" });
  return { title: t("title") };
}

export default async function AdminInvitePage() {
  if (!(await getAdminCapabilities()).includes("members.review")) notFound();
  return <AdminInviteTab invites={await getPendingInvites()} />;
}
