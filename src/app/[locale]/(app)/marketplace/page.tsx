import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { MarketplaceView } from "@/features/marketplace/components/marketplace-view";
import { getMarketplaceContact, getPublishedProducts } from "@/features/marketplace/queries";
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
  const [products, contact] = await Promise.all([getPublishedProducts(), getMarketplaceContact()]);

  return <MarketplaceView products={products} contact={contact} />;
}
