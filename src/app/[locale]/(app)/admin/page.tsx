import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { Icon } from "@/components/ui/icon";
import { getAdminMetrics } from "@/features/admin/queries";
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
  const t = await getTranslations("Admin.dashboard");
  const metrics = await getAdminMetrics();

  const cards = [
    {
      key: "pendingProfiles",
      value: metrics.pendingProfiles,
      href: "/admin/users?status=pending",
      icon: "how_to_reg",
      tone: "primary",
    },
    {
      key: "openReports",
      value: metrics.openReports,
      href: "/admin/moderation?status=open",
      icon: "flag",
      tone: "danger",
    },
    {
      key: "pendingInterests",
      value: metrics.pendingInterests,
      href: "/admin/interests?status=pending",
      icon: "tag",
      tone: "primary",
    },
    {
      key: "liveProducts",
      value: metrics.curatedProducts,
      href: "/admin/marketplace?status=live",
      icon: "storefront",
      tone: "success",
    },
  ] as const;

  return (
    <div className="mx-auto w-full max-w-[1240px] px-margin-mobile pt-block-mobile pb-page-mobile md:px-margin md:pt-block md:pb-page">
      <div className="max-w-2xl">
        <p className="font-label-md text-label-md font-semibold text-primary">{t("eyebrow")}</p>
        <h1 className="mt-1 font-display-md text-display-md-mobile text-on-surface md:text-display-md">
          {t("title")}
        </h1>
        <p className="mt-2 font-body-md text-body-md text-secondary">{t("body")}</p>
      </div>

      <div className="mt-space-xl grid grid-cols-1 gap-space-md sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.key}
            href={card.href}
            className="group bezel-tray focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <div className="flex h-full flex-col justify-between gap-space-lg bezel-core p-space-lg">
              <div className="flex items-start justify-between gap-space-sm">
                <span
                  className={
                    card.tone === "danger"
                      ? "flex h-11 w-11 items-center justify-center rounded-full border border-danger-border bg-danger-surface text-danger-text"
                      : card.tone === "success"
                        ? "flex h-11 w-11 items-center justify-center rounded-full border border-success-border bg-success-surface text-success-text"
                        : "flex h-11 w-11 items-center justify-center rounded-full border border-primary/25 bg-admin-surface text-primary"
                  }
                >
                  <Icon name={card.icon} />
                </span>
                <Icon
                  name="arrow_forward"
                  className="text-lg text-secondary transition-transform duration-300 group-hover:translate-x-0.5"
                />
              </div>
              <div>
                <p className="font-display-md text-display-md-mobile font-bold text-on-surface tabular-nums">
                  {card.value}
                </p>
                <p className="mt-1 font-label-lg text-label-lg font-semibold text-on-surface">
                  {t(`cards.${card.key}.title`)}
                </p>
                <p className="mt-0.5 font-body-sm text-body-sm text-secondary">
                  {t(`cards.${card.key}.body`)}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-space-xl bezel-tray">
        <div className="grid grid-cols-2 gap-space-md bezel-core p-space-lg sm:grid-cols-4">
          {(
            [
              ["approvedProfiles", metrics.approvedProfiles],
              ["rejectedProfiles", metrics.rejectedProfiles],
              ["suspendedProfiles", metrics.suspendedProfiles],
              ["reportedPosts", metrics.reportedPosts],
            ] as const
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
