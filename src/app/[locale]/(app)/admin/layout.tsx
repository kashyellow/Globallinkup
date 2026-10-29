import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";

import { AdminTabs } from "@/features/admin/components/admin-tabs";
import { getAdminTabCounts } from "@/features/admin/queries";
import { getAdminCapabilities } from "@/lib/admin";
import { requireAdmin } from "@/lib/auth";

/** Guarded admin shell: one compact context bar, then route-specific tabs. */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const { profile } = await requireAdmin();
  const capabilities = await getAdminCapabilities();
  const t = await getTranslations("Admin");

  // An invited admin has no role until an owner assigns one. They can sign in,
  // but there is nothing to show: explain it instead of an empty shell.
  if (profile.role === "admin" && capabilities.length === 0) {
    return (
      <section className="mx-auto max-w-xl px-margin-mobile py-block text-center md:px-margin">
        <h1 className="font-headline-lg text-headline-lg font-semibold text-on-surface">
          {t("pendingRoleTitle")}
        </h1>
        <p className="mt-2 font-body-md text-body-md text-secondary">{t("pendingRoleBody")}</p>
      </section>
    );
  }

  const counts = await getAdminTabCounts({
    members: capabilities.includes("members.review"),
    reports: capabilities.includes("reports.manage"),
  });

  return (
    <>
      {/*
       * On a phone the tab bar stays pinned under the app header, so switching
       * desks is one tap from anywhere in a long list. From lg it scrolls away.
       */}
      <section className="sticky top-14 z-30 border-b border-outline-variant bg-background lg:static">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-space-sm px-margin-mobile pb-space-md sm:pt-space-md lg:gap-space-md lg:px-margin">
          <div className="hidden items-center justify-between gap-space-sm sm:flex">
            <p className="min-w-0 truncate font-label-lg text-label-lg font-semibold text-on-surface sm:block">
              {t("panelTitle")}
            </p>
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-admin-border bg-admin-surface px-space-sm py-1 font-label-md text-label-md font-semibold whitespace-nowrap text-admin-text">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              {t("roleBadge")}
            </span>
          </div>
          <AdminTabs capabilities={capabilities} counts={counts} />
        </div>
      </section>
      {children}
    </>
  );
}
