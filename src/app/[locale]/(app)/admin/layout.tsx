import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";

import { Icon } from "@/components/ui/icon";
import { AdminTabs } from "@/features/admin/components/admin-tabs";
import { requireAdmin } from "@/lib/auth";

/** Guarded admin shell: one compact context bar, then route-specific tabs. */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdmin();
  const t = await getTranslations("Admin");

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
          <AdminTabs />
        </div>
      </section>
      {children}
    </>
  );
}
