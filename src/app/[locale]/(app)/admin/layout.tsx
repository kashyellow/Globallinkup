import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";

import { Icon } from "@/components/ui/icon";
import { AdminTabs } from "@/features/admin/components/admin-tabs";
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

  return (
    <>
      <section className="border-b border-outline-variant bg-surface">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-space-md px-margin-mobile py-space-md lg:px-margin">
          <div className="flex flex-wrap items-center justify-between gap-space-sm">
            <div className="flex items-center gap-space-sm">
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/25 bg-admin-surface text-primary">
                <Icon name="shield_person" className="text-xl" />
              </span>
              <div>
                <p className="font-label-caps text-label-caps tracking-[0.16em] text-primary uppercase">
                  {t("portal")}
                </p>
                <p className="font-label-lg text-label-lg font-semibold text-on-surface">
                  {t("panelTitle")}
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-admin-border bg-admin-surface px-space-sm py-1 font-label-md text-label-md font-semibold text-admin-text">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              {t("roleBadge")}
            </span>
          </div>
          <AdminTabs capabilities={capabilities} />
        </div>
      </section>
      {children}
    </>
  );
}
