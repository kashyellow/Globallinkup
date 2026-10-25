import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { AdminMarketplaceTab } from "@/features/admin/components/marketplace-tab";
import {
  parseEnum,
  parsePage,
  parseQuery,
  pageCount,
  type SearchParams,
} from "@/features/admin/params";
import {
  ADMIN_PAGE_SIZES,
  getAdminMarketplace,
  type AdminProductFilter,
} from "@/features/admin/queries";

const STATUSES = ["all", "live", "draft", "unpublished", "trashed"] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Admin.marketplace" });
  return { title: t("title") };
}

export default async function AdminMarketplacePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const query = parseQuery(sp.q);
  const status = parseEnum<AdminProductFilter>(sp.status, STATUSES, "all");
  const page = parsePage(sp.page);
  const { products, total } = await getAdminMarketplace({
    query,
    status,
    page,
    pageSize: ADMIN_PAGE_SIZES.marketplace,
  });

  return (
    <AdminMarketplaceTab
      products={products}
      query={query}
      status={status}
      page={page}
      total={total}
      totalPages={pageCount(total, ADMIN_PAGE_SIZES.marketplace)}
    />
  );
}
