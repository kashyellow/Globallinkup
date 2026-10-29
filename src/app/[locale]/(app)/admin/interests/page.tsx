import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { getAdminCapabilities } from "@/lib/admin";

import { AdminInterestsTab } from "@/features/admin/components/interests-tab";
import {
  parseEnum,
  parsePage,
  parseQuery,
  pageCount,
  type SearchParams,
} from "@/features/admin/params";
import {
  ADMIN_PAGE_SIZES,
  getAdminInterestCounts,
  getAdminInterests,
  type AdminInterestFilter,
} from "@/features/admin/queries";

const STATUSES = ["all", "pending", "approved", "rejected"] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Admin.interests" });
  return { title: t("title") };
}

export default async function AdminInterestsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  if (!(await getAdminCapabilities()).includes("interests.review")) notFound();
  const sp = await searchParams;
  const query = parseQuery(sp.q);
  const status = parseEnum<AdminInterestFilter>(sp.status, STATUSES, "pending");
  const page = parsePage(sp.page);
  const [{ interests, total }, counts] = await Promise.all([
    getAdminInterests({
      query,
      status,
      page,
      pageSize: ADMIN_PAGE_SIZES.interests,
    }),
    getAdminInterestCounts(),
  ]);

  return (
    <AdminInterestsTab
      interests={interests}
      query={query}
      status={status}
      counts={counts}
      page={page}
      total={total}
      totalPages={pageCount(total, ADMIN_PAGE_SIZES.interests)}
    />
  );
}
