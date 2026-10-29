import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { getLocale } from "next-intl/server";

import { LinkPending } from "@/components/layout/link-pending";
import { Icon } from "@/components/ui/icon";
import { getAdminMetrics } from "@/features/admin/queries";
import { getAdminCapabilities } from "@/lib/admin";
import { redirect } from "@/lib/i18n/navigation";
import { Link } from "@/lib/i18n/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Admin" });
  return { title: t("title") };
}

export default async function AdminDashboardPage() {
  // The control room aggregates every desk, so it is owner-level. Sub-admins land
  // on the desk they can actually use.
  const capabilities = await getAdminCapabilities();
  if (!capabilities.includes("reports.manage")) {
    const locale = await getLocale();
    const target = capabilities.includes("members.review")
      ? "/admin/users"
      : capabilities.includes("marketplace.manage")
        ? "/admin/marketplace"
        : capabilities.includes("posts.moderate")
          ? "/admin/moderation"
          : capabilities.includes("audit.read")
            ? "/admin/audit"
            : "/discover";
    redirect({ href: target, locale });
    return null;
  }

  const t = await getTranslations("Admin.dashboard");
  const metrics = await getAdminMetrics();

  const cards = [
    {
      key: "pendingProfiles",
      value: metrics.pendingProfiles,
      href: "/admin/users?status=pending",
      icon: "how_to_reg",
      tone: "primary",
      capability: "members.review",
    },
    {
      key: "openReports",
      value: metrics.openReports,
      href: "/admin/moderation?status=open",
      icon: "flag",
      tone: "danger",
      capability: "reports.manage",
    },
    {
      key: "liveProducts",
      value: metrics.curatedProducts,
      href: "/admin/marketplace?status=live",
      icon: "storefront",
      tone: "success",
      capability: "marketplace.manage",
    },
  ] as const;

  // Sub-admins only see the desks their role can actually read.
  const visibleCards = cards.filter((card) => capabilities.includes(card.capability));
  // One column per visible queue on wide screens, so no cell is left empty.
  const wideColumns =
    visibleCards.length >= 3 ? "xl:grid-cols-3" : visibleCards.length === 2 ? "" : "xl:grid-cols-1";

  return (
    <div className="mx-auto w-full max-w-[1240px] px-margin-mobile pt-block-mobile pb-page-mobile md:px-margin md:pt-block md:pb-page">
      <div className="max-w-2xl">
        <h1 className="font-title text-title-mobile text-on-surface md:text-title">{t("title")}</h1>
        <p className="mt-1 font-body-md text-body-md text-on-surface-variant">{t("body")}</p>
      </div>

      {/*
       * The queues as one divided strip: a label, the count, what it means, and
       * the whole cell links to its desk. Colour only marks reports that need a
       * decision; a zero stays in ink.
       */}
      <div
        className={`mt-space-lg grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-outline-variant bg-outline-variant md:mt-space-xl ${wideColumns}`}
      >
        {visibleCards.map((card) => (
          <Link
            key={card.key}
            href={card.href}
            className="group relative flex flex-col gap-1 bg-surface-low p-space-md transition-colors duration-200 hover:bg-surface-container focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary md:p-space-lg [&:last-child:nth-child(odd)]:col-span-2 xl:[&:last-child:nth-child(odd)]:col-span-1"
          >
            <LinkPending className="rounded-none" />
            <span className="flex items-center justify-between gap-space-xs font-label-lg text-label-lg font-semibold text-on-surface">
              {t(`cards.${card.key}.title`)}
              <Icon
                name="arrow_forward"
                className="text-base text-secondary transition-transform duration-200 group-hover:translate-x-0.5"
              />
            </span>
            <span
              className={
                card.tone === "danger" && card.value > 0
                  ? "font-title text-title font-bold text-danger-text tabular-nums"
                  : "font-title text-title font-bold text-on-surface tabular-nums"
              }
            >
              {card.value}
            </span>
            <span className="font-body-sm text-body-sm text-pretty text-on-surface-variant">
              {t(`cards.${card.key}.body`)}
            </span>
          </Link>
        ))}
      </div>

      <div className="mt-space-xl bezel-tray">
        <div className="grid grid-cols-2 gap-space-md bezel-core p-space-lg sm:grid-cols-4">
          {(
            [
              ...(capabilities.includes("members.review")
                ? ([
                    ["approvedProfiles", metrics.approvedProfiles],
                    ["rejectedProfiles", metrics.rejectedProfiles],
                    ["suspendedProfiles", metrics.suspendedProfiles],
                  ] as const)
                : []),
              ...(capabilities.includes("reports.manage")
                ? ([["reportedPosts", metrics.reportedPosts]] as const)
                : []),
            ] as ReadonlyArray<
              readonly [
                "approvedProfiles" | "rejectedProfiles" | "suspendedProfiles" | "reportedPosts",
                number,
              ]
            >
          ).map(([key, value]) => (
            <div key={key}>
              <p className="font-label-md text-label-md text-secondary">{t(`stats.${key}`)}</p>
              <p className="mt-1 font-headline-md text-headline-md font-semibold text-on-surface tabular-nums">
                {value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
