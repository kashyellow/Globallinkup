import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { AdminUsersTab } from "@/features/admin/components/users-tab";
import {
  parseEnum,
  parsePage,
  parseQuery,
  pageCount,
  type SearchParams,
} from "@/features/admin/params";
import { ADMIN_PAGE_SIZES, getAdminUsers, type AdminProfileFilter } from "@/features/admin/queries";

const STATUSES = ["all", "pending", "approved", "rejected", "suspended"] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Admin.users" });
  return { title: t("title") };
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const query = parseQuery(sp.q);
  const status = parseEnum<AdminProfileFilter>(sp.status, STATUSES, "all");
  const page = parsePage(sp.page);
  const { users, total } = await getAdminUsers({
    query,
    status,
    page,
    pageSize: ADMIN_PAGE_SIZES.users,
  });

  return (
    <AdminUsersTab
      users={users}
      query={query}
      status={status}
      page={page}
      total={total}
      totalPages={pageCount(total, ADMIN_PAGE_SIZES.users)}
    />
  );
}
