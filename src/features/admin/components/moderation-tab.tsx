"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";
import type { CSSProperties } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Icon } from "@/components/ui/icon";
import { InlineAlert } from "@/components/ui/inline-alert";
import { Spinner } from "@/components/ui/spinner";
import { removePostAction, resolveReportAction } from "@/features/admin/actions";
import { usePendingAction } from "@/features/shared/use-pending-action";
import { useRefresh } from "@/features/shared/refresh-provider";
import { cn } from "@/lib/utils";
import type { AdminReportDto } from "../queries";

const ACTION_BASE =
  "inline-flex min-h-11 items-center gap-1.5 rounded-full px-4 py-2 font-label-md text-label-md transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 active:translate-y-px disabled:opacity-60";

type ResolveStatus = "resolved" | "dismissed";

export function AdminModerationTab({ reports }: { reports: AdminReportDto[] }) {
  const t = useTranslations("Admin.moderation");
  const tCommon = useTranslations("Common");
  const { refresh } = useRefresh();
  const { isPending, run } = usePendingAction();
  const [handledIds, setHandledIds] = useState<ReadonlySet<string>>(() => new Set());
  const [confirmTarget, setConfirmTarget] = useState<AdminReportDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  const open = reports.filter((report) => report.status === "open" && !handledIds.has(report.id));

  async function resolve(report: AdminReportDto, status: ResolveStatus) {
    const result = await run(`report:${report.id}`, async () => {
      setError(null);
      try {
        const response = await resolveReportAction({ reportId: report.id, status });
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

  return (
    <div className="flex flex-col gap-space-lg">
      <div
        className="bezel-tray"
        style={{ "--bezel-core-bg": "var(--color-surface-low)" } as CSSProperties}
      >
        <div className="flex flex-col justify-between gap-space-md bezel-core p-space-md sm:flex-row sm:items-center">
          <div className="flex items-center gap-space-md">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-danger-border bg-danger-surface text-danger-text">
              <Icon name="flag" />
            </span>
            <div>
              <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                {t("title")}
              </h2>
              <p className="mt-0.5 font-body-sm text-body-sm text-secondary">{t("body")}</p>
            </div>
          </div>
          <span className="self-start rounded-full border border-danger-border bg-danger-surface px-space-md py-1.5 font-label-md text-label-md font-semibold text-danger-text sm:self-auto">
            {t("needsReview", { count: open.length })}
          </span>
        </div>
      </div>

      {error ? <InlineAlert>{error}</InlineAlert> : null}

      {open.length === 0 ? (
        <div className="bezel-tray">
          <div
            className="flex flex-col items-center gap-2 bezel-core py-space-xl text-center"
            style={{ "--bezel-core-bg": "var(--color-surface-low)" } as CSSProperties}
          >
            <Icon name="verified_user" className="text-3xl text-success-text" />
            <p className="font-label-lg text-label-lg font-semibold text-on-surface">
              {t("emptyTitle")}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-space-md md:grid-cols-2">
          {open.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              pending={isPending(`report:${report.id}`) || isPending(`remove:${report.id}`)}
              onResolve={(status) => void resolve(report, status)}
              onRemove={() => setConfirmTarget(report)}
            />
          ))}
        </div>
      )}

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
            <span className="rounded-full border border-danger-border bg-danger-surface px-2.5 py-0.5 font-label-md text-label-md font-semibold text-danger-text">
              {report.reason}
            </span>
            <span className="font-label-md text-label-md text-text-muted" suppressHydrationWarning>
              {format.relativeTime(new Date(report.createdAt), new Date())}
            </span>
          </div>

          <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
            {report.targetName}
          </h3>

          {report.details ? (
            <p className="rounded-2xl border border-outline-variant bg-surface-dim p-space-sm font-body-sm text-body-sm text-text-muted">
              {report.details}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-x-space-md gap-y-1 pt-1 font-label-md text-label-md text-secondary">
            <span>
              {t("reportedBy")}{" "}
              <strong className="font-semibold text-on-surface">{report.reporterName}</strong>
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-space-sm border-t border-outline-variant pt-space-sm">
          {report.targetType === "post" ? (
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
        </div>
      </article>
    </div>
  );
}
