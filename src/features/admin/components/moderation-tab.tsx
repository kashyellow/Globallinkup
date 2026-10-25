"use client";

import type { CSSProperties } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Icon } from "@/components/ui/icon";
import { InlineAlert } from "@/components/ui/inline-alert";
import { MediaImage } from "@/components/ui/media-image";
import { Spinner } from "@/components/ui/spinner";
import { removePostAction, resolveReportAction } from "@/features/admin/actions";
import { AdminPagination } from "@/features/admin/components/admin-pagination";
import { AdminSearchForm } from "@/features/admin/components/admin-search-form";
import { AdminStatusLinks } from "@/features/admin/components/admin-status-links";
import { usePendingAction } from "@/features/shared/use-pending-action";
import { useRefresh } from "@/features/shared/refresh-provider";
import { cn } from "@/lib/utils";
import type { AdminReportDto, AdminReportFilter, AdminReportTarget } from "../queries";

const ACTION_BASE =
  "inline-flex min-h-11 items-center gap-1.5 rounded-full px-4 py-2 font-label-md text-label-md transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 active:translate-y-px disabled:opacity-60";

type ResolveStatus = "resolved" | "dismissed";

export function AdminModerationTab({
  reports,
  query,
  status,
  target,
  page,
  total,
  totalPages,
}: {
  reports: AdminReportDto[];
  query: string;
  status: AdminReportFilter;
  target: AdminReportTarget;
  page: number;
  total: number;
  totalPages: number;
}) {
  const t = useTranslations("Admin.moderation");
  const tCommon = useTranslations("Common");
  const { refresh } = useRefresh();
  const { isPending, run } = usePendingAction();
  const [handledIds, setHandledIds] = useState<ReadonlySet<string>>(() => new Set());
  const [confirmTarget, setConfirmTarget] = useState<AdminReportDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  const visible = reports.filter((report) => !handledIds.has(report.id));

  async function resolve(report: AdminReportDto, nextStatus: ResolveStatus) {
    const result = await run(`report:${report.id}`, async () => {
      setError(null);
      try {
        const response = await resolveReportAction({ reportId: report.id, status: nextStatus });
        if (!response.ok) {
          setError(tCommon("actionError"));
          return false;
        }
        setHandledIds((previous) => new Set(previous).add(report.id));
        refresh();
        return true;
      } catch {
        setError(tCommon("actionError"));
        return false;
      }
    });

    if (result) setConfirmTarget(null);
  }

  async function removePost(report: AdminReportDto) {
    if (report.targetType !== "post" || !report.targetId) return;

    const result = await run(`remove:${report.id}`, async () => {
      setError(null);
      try {
        const removed = await removePostAction({ postId: report.targetId! });
        if (!removed.ok) {
          setError(tCommon("actionError"));
          return false;
        }
        const resolved = await resolveReportAction({
          reportId: report.id,
          status: "resolved",
        });
        if (!resolved.ok) {
          setError(tCommon("actionError"));
          return false;
        }
        setHandledIds((previous) => new Set(previous).add(report.id));
        refresh();
        return true;
      } catch {
        setError(tCommon("actionError"));
        return false;
      }
    });

    if (result) setConfirmTarget(null);
  }

  const statusOptions = [
    { value: "open", label: t("filterOpen") },
    { value: "resolved", label: t("filterResolved") },
    { value: "dismissed", label: t("filterDismissed") },
    { value: "all", label: t("filterAll") },
  ];
  const targetOptions = [
    { value: "all", label: t("targetAll") },
    { value: "user", label: t("targetUser") },
    { value: "post", label: t("targetPost") },
  ];
  const extra = target !== "all" ? { target } : undefined;

  return (
    <div className="mx-auto w-full max-w-[1240px] px-margin-mobile pt-block-mobile pb-page-mobile md:px-margin md:pt-block md:pb-page">
      <div className="flex flex-col justify-between gap-space-md lg:flex-row lg:items-end">
        <div>
          <p className="font-label-md text-label-md font-semibold text-primary">{t("eyebrow")}</p>
          <h1 className="mt-1 font-display-md text-display-md-mobile text-on-surface md:text-display-md">
            {t("title")}
          </h1>
          <p className="mt-2 max-w-[62ch] font-body-md text-body-md text-secondary">{t("body")}</p>
        </div>
        <span className="inline-flex items-center gap-1.5 self-start rounded-full border border-danger-border bg-danger-surface px-space-md py-1.5 font-label-md text-label-md font-semibold text-danger-text">
          <span className="h-1.5 w-1.5 rounded-full bg-danger" />
          {t("needsReview", { count: total })}
        </span>
      </div>

      <div className="mt-space-lg bezel-tray">
        <div className="flex flex-col gap-space-md bezel-core p-space-md md:p-space-lg">
          <div className="flex flex-col gap-space-sm lg:flex-row lg:items-center lg:justify-between">
            <AdminSearchForm
              basePath="/admin/moderation"
              query={query}
              status={status}
              placeholder={t("searchPlaceholder")}
              extra={target !== "all" ? { target } : undefined}
            />
          </div>
          <div className="flex flex-col gap-space-sm lg:flex-row lg:items-center lg:justify-between">
            <AdminStatusLinks
              basePath="/admin/moderation"
              current={status}
              options={statusOptions}
              query={query}
              extra={extra}
            />
            <AdminStatusLinks
              basePath="/admin/moderation"
              current={target}
              options={targetOptions}
              query={query}
              extra={status !== "all" ? { status } : undefined}
              param="target"
            />
          </div>
        </div>
      </div>

      {error ? <InlineAlert className="mt-space-md">{error}</InlineAlert> : null}

      {visible.length === 0 ? (
        <div className="mt-space-lg bezel-tray">
          <div className="flex flex-col items-center gap-2 bezel-core py-space-xl text-center">
            <Icon name="verified_user" className="text-3xl text-success-text" />
            <p className="font-label-lg text-label-lg font-semibold text-on-surface">
              {t("emptyTitle")}
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-space-lg grid grid-cols-1 gap-space-md md:grid-cols-2">
          {visible.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              pending={isPending(`report:${report.id}`) || isPending(`remove:${report.id}`)}
              onResolve={(nextStatus) => void resolve(report, nextStatus)}
              onRemove={() => setConfirmTarget(report)}
            />
          ))}
        </div>
      )}

      <AdminPagination
        basePath="/admin/moderation"
        page={page}
        totalPages={totalPages}
        query={query}
        status={status}
        extra={target !== "all" ? { target } : undefined}
      />

      <ConfirmDialog
        open={confirmTarget !== null}
        title={t("removePostWarn")}
        body={tCommon("confirmBody")}
        confirmLabel={tCommon("confirmAction")}
        cancelLabel={tCommon("cancel")}
        pendingLabel={tCommon("processing")}
        pending={confirmTarget ? isPending(`remove:${confirmTarget.id}`) : false}
        onClose={() => setConfirmTarget(null)}
        onConfirm={() => {
          if (confirmTarget) void removePost(confirmTarget);
        }}
      />
    </div>
  );
}

function ReportCard({
  report,
  pending,
  onResolve,
  onRemove,
}: {
  report: AdminReportDto;
  pending: boolean;
  onResolve: (status: ResolveStatus) => void;
  onRemove: () => void;
}) {
  const t = useTranslations("Admin.moderation");
  const tCommon = useTranslations("Common");
  const format = useFormatter();

  return (
    <div
      className="bezel-tray"
      style={{ "--bezel-core-bg": "var(--color-surface-low)" } as CSSProperties}
    >
      <article className="flex h-full flex-col justify-between gap-space-md bezel-core p-space-lg">
        <div className="flex flex-col gap-space-sm">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-danger-border bg-danger-surface px-2.5 py-0.5 font-label-md text-label-md font-semibold text-danger-text">
                {report.reason}
              </span>
              <span className="rounded-full border border-outline-variant bg-surface-container px-2.5 py-0.5 font-label-md text-label-md text-secondary">
                {report.targetType === "post" ? t("targetPost") : t("targetUser")}
              </span>
              {report.status !== "open" ? (
                <span className="rounded-full border border-success-border bg-success-surface px-2.5 py-0.5 font-label-md text-label-md font-semibold text-success-text">
                  {report.status === "resolved" ? t("filterResolved") : t("filterDismissed")}
                </span>
              ) : null}
            </div>
            <span className="font-label-md text-label-md text-text-muted" suppressHydrationWarning>
              {format.relativeTime(new Date(report.createdAt), new Date())}
            </span>
          </div>

          <div className="flex items-start gap-space-sm">
            {report.targetImage ? (
              <MediaImage
                src={report.targetImage}
                alt={report.targetLabel}
                wrapperClassName="h-16 w-16 shrink-0 rounded-xl border border-outline-variant"
              />
            ) : (
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-outline-variant bg-surface-variant text-secondary">
                <Icon name={report.targetType === "post" ? "image" : "person"} />
              </span>
            )}
            <div className="min-w-0">
              <h3 className="line-clamp-2 font-headline-sm text-headline-sm font-semibold text-on-surface">
                {report.targetLabel}
              </h3>
              {report.details ? (
                <p className="mt-1 line-clamp-3 font-body-sm text-body-sm text-text-muted">
                  {report.details}
                </p>
              ) : null}
            </div>
          </div>

          <p className="font-label-md text-label-md text-secondary">
            {t("reportedBy")} <strong className="text-on-surface">{report.reporterName}</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-space-sm border-t border-outline-variant pt-space-sm">
          {report.targetType === "post" && report.status === "open" ? (
            <button
              type="button"
              onClick={onRemove}
              disabled={pending}
              className={cn(
                ACTION_BASE,
                "bg-danger text-on-error hover:bg-danger-border-strong focus-visible:outline-danger-border-strong",
              )}
            >
              {pending ? (
                <Spinner className="h-4 w-4 text-current" label={tCommon("processing")} />
              ) : (
                <Icon name="delete_forever" className="text-sm" />
              )}
              {t("removePostWarn")}
            </button>
          ) : null}
          {report.status === "open" ? (
            <>
              <button
                type="button"
                onClick={() => onResolve("dismissed")}
                disabled={pending}
                className={cn(
                  ACTION_BASE,
                  "border border-outline-variant bg-surface-dim text-on-surface hover:border-outline-hover hover:bg-surface-container focus-visible:outline-primary",
                )}
              >
                {t("dismissFlag")}
              </button>
              <button
                type="button"
                onClick={() => onResolve("resolved")}
                disabled={pending}
                className={cn(
                  ACTION_BASE,
                  "bg-primary text-on-primary hover:bg-primary-hover focus-visible:outline-primary",
                )}
              >
                {pending ? (
                  <Spinner className="h-4 w-4 text-current" label={tCommon("processing")} />
                ) : (
                  <Icon name="check" className="text-sm" />
                )}
                {t("resolve")}
              </button>
            </>
          ) : null}
        </div>
      </article>
    </div>
  );
}
