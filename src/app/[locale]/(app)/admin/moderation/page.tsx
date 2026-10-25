import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { AdminModerationTab } from "@/features/admin/components/moderation-tab";
import {
  parseEnum,
  parsePage,
  parseQuery,
  pageCount,
  type SearchParams,
} from "@/features/admin/params";
import {
  ADMIN_PAGE_SIZES,
  getAdminModeration,
  type AdminReportFilter,
  type AdminReportTarget,
} from "@/features/admin/queries";

const STATUSES = ["open", "resolved", "dismissed", "all"] as const;
const TARGETS = ["all", "user", "post"] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Admin.moderation" });
  return { title: t("title") };
}

export default async function AdminModerationPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const query = parseQuery(sp.q);
  const status = parseEnum<AdminReportFilter>(sp.status, STATUSES, "open");
  const target = parseEnum<AdminReportTarget>(sp.target, TARGETS, "all");
  const page = parsePage(sp.page);
  const { reports, total } = await getAdminModeration({
    query,
    status,
    target,
    page,
    pageSize: ADMIN_PAGE_SIZES.moderation,
  });

  return (
    <AdminModerationTab
      reports={reports}
      query={query}
      status={status}
      target={target}
      page={page}
      total={total}
      totalPages={pageCount(total, ADMIN_PAGE_SIZES.moderation)}
    />
  );
}
