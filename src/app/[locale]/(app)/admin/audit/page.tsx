import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { AdminPagination } from "@/features/admin/components/admin-pagination";
import { AuditList } from "@/features/admin/components/audit-list";
import { pageCount } from "@/features/admin/params";
import { getAuditEvents } from "@/features/admin/queries";
import { getAdminCapabilities } from "@/lib/admin";
import { Icon } from "@/components/ui/icon";
import { AdminPageHeader } from "@/features/admin/components/admin-page-header";
import { requireAdmin } from "@/lib/auth";

const ACTIONS = [
  "all",
  "member",
  "post",
  "appeal",
  "product",
  "report",
  "comment",
  "role",
  "admin",
  "system",
] as const;
const PAGE_SIZE = 15;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Admin.audit" });
  return { title: t("title") };
}

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; action?: string; page?: string }>;
}) {
  await requireAdmin();
  const capabilities = await getAdminCapabilities();
  if (!capabilities.includes("audit.read")) notFound();

  const t = await getTranslations("Admin.audit");
  const sp = await searchParams;
  const query = typeof sp.q === "string" ? sp.q.slice(0, 100) : "";
  const actionType = ACTIONS.includes(sp.action as (typeof ACTIONS)[number])
    ? (sp.action as string)
    : "all";
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);

  const { events, total } = await getAuditEvents({ query, actionType, page, pageSize: PAGE_SIZE });

  return (
    <div className="mx-auto w-full max-w-[1000px] px-margin-mobile pt-space-lg pb-page-mobile md:px-margin md:pt-block md:pb-page">
      <AdminPageHeader
        title={t("title")}
        description={t("body")}
        meta={t("results", { count: total })}
      />

      {/* Phones: search + button on one row, the action filter under it. */}
      <form
        method="get"
        className="mt-space-md grid grid-cols-[minmax(0,1fr)_auto] gap-space-xs sm:flex sm:flex-row sm:items-center md:mt-space-lg"
      >
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder={t("searchPlaceholder")}
          aria-label={t("searchPlaceholder")}
          className="min-h-11 min-w-0 flex-1 rounded-full border border-outline-variant bg-surface-low px-4 font-body-sm text-body-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        />
        <select
          name="action"
          defaultValue={actionType}
          aria-label={t("actionFilter")}
          className="col-span-2 row-start-2 min-h-11 min-w-0 rounded-full border border-outline-variant bg-surface-low px-4 font-label-md text-label-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:col-span-1"
        >
          <option value="all">{t("allActions")}</option>
          {ACTIONS.filter((value) => value !== "all").map((value) => (
            <option key={value} value={value}>
              {t(`actions.${value}`)}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="col-start-2 row-start-1 inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-full bg-primary px-3 font-label-md text-label-md font-semibold text-on-primary hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:col-start-auto sm:row-start-auto sm:px-5"
        >
          <Icon name="search" className="text-lg sm:hidden" />
          <span className="sr-only sm:not-sr-only">{t("searchAction")}</span>
        </button>
      </form>

      {events.length === 0 ? (
        <p className="mt-space-md rounded-2xl border border-dashed border-outline-variant p-space-lg text-center font-body-sm text-body-sm text-text-muted">
          {t("empty")}
        </p>
      ) : (
        <AuditList events={events} />
      )}

      <AdminPagination
        basePath="/admin/audit"
        page={page}
        totalPages={pageCount(total, PAGE_SIZE)}
        query={query}
        extra={actionType !== "all" ? { action: actionType } : undefined}
      />
    </div>
  );
}
