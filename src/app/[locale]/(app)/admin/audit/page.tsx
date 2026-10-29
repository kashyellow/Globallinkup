import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { AdminPagination } from "@/features/admin/components/admin-pagination";
import { AuditList } from "@/features/admin/components/audit-list";
import { pageCount } from "@/features/admin/params";
import { getAuditEvents } from "@/features/admin/queries";
import { getAdminCapabilities } from "@/lib/admin";
import { requireAdmin } from "@/lib/auth";

const ACTIONS = [
  "all",
  "member",
  "post",
  "appeal",
  "interest",
  "product",
  "report",
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
    <div className="mx-auto w-full max-w-[1000px] px-margin-mobile pt-block-mobile pb-page-mobile md:px-margin md:pt-block md:pb-page">
      <h1 className="font-display-md text-display-md-mobile text-on-surface md:text-display-md">
        {t("title")}
      </h1>
      <p className="mt-2 max-w-[70ch] font-body-md text-body-md text-secondary">{t("body")}</p>

      <form method="get" className="mt-space-lg flex flex-col gap-2 sm:flex-row">
        <input
          name="q"
          defaultValue={query}
          placeholder={t("searchPlaceholder")}
          className="min-h-11 flex-1 rounded-full border border-outline-variant bg-surface-low px-4 font-body-sm text-body-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        />
        <select
          name="action"
          defaultValue={actionType}
          className="min-h-11 rounded-full border border-outline-variant bg-surface-low px-4 font-label-md text-label-md"
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
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-5 font-label-md text-label-md font-semibold text-on-primary hover:bg-primary-hover"
        >
          {t("searchAction")}
        </button>
      </form>

      <p className="mt-space-sm font-label-md text-label-md text-text-muted">
        {t("results", { count: total })}
      </p>

      {events.length === 0 ? (
        <p className="mt-space-lg rounded-2xl border border-dashed border-outline-variant p-space-lg text-center font-body-sm text-body-sm text-text-muted">
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
