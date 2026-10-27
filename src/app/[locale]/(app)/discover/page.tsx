import { randomUUID } from "node:crypto";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { DiscoverView } from "@/features/persona/components/discover-view";
import { DISCOVER_PAGE_SIZE } from "@/features/persona/constants";
import { getDiscoverCountries, getDiscoverPersonas } from "@/features/persona/queries";
import { requireApprovedUser } from "@/lib/auth";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Discover" });
  return { title: t("title") };
}

export default async function DiscoverPage() {
  const { user } = await requireApprovedUser();
  const seed = randomUUID();
  const [countries, initial] = await Promise.all([
    getDiscoverCountries(),
    getDiscoverPersonas({
      viewerId: user.id,
      query: "",
      countries: [],
      limit: DISCOVER_PAGE_SIZE,
      offset: 0,
      seed,
    }),
  ]);

  return (
    <DiscoverView
      personas={initial.personas}
      total={initial.total}
      seed={seed}
      countries={countries}
    />
  );
}
