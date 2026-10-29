import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { MarketplaceView } from "@/features/marketplace/components/marketplace-view";
import { MARKETPLACE_PAGE_SIZE } from "@/features/marketplace/constants";
import { getMarketplaceContact, getMarketplacePage } from "@/features/marketplace/queries";
import { requireApprovedUser } from "@/lib/auth";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Marketplace" });
  return { title: t("banner.title") };
}

export default async function MarketplacePage() {
  await requireApprovedUser();
  const [page, contact] = await Promise.all([
    getMarketplacePage({
      query: "",
      sort: "newest",
      limit: MARKETPLACE_PAGE_SIZE,
      offset: 0,
    }),
    getMarketplaceContact(),
  ]);

  return (
    <MarketplaceView initialProducts={page.products} initialTotal={page.total} contact={contact} />
  );
}
