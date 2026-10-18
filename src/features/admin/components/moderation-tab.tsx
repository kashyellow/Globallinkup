"use client";

import { useFormatter, useTranslations } from "next-intl";
import type { CSSProperties } from "react";
import { Icon } from "@/components/ui/icon";
import { removePostAction, resolveReportAction } from "@/features/admin/actions";
import { useRouter } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";
import type { AdminReportDto } from "../queries";

const ACTION_BASE =
  "inline-flex min-h-11 items-center gap-1.5 rounded-full px-4 py-2 font-label-md text-label-md transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 active:translate-y-px";

export function AdminModerationTab({ reports }: { reports: AdminReportDto[] }) {
  const t = useTranslations("Admin.moderation");
  const open = reports.filter((report) => report.status === "open");

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
            <ReportCard key={report.id} report={report} />
          ))}
        </div>
      )}
    </div>
  );
}

function ReportCard({ report }: { report: AdminReportDto }) {
  const t = useTranslations("Admin.moderation");
  const format = useFormatter();
  const router = useRouter();

  async function resolve(status: "resolved" | "dismissed") {
    const result = await resolveReportAction({ reportId: report.id, status });
    if (result.ok) router.refresh();
  }

  async function removePost() {
    if (report.targetType !== "post") return;
    const result = await removePostAction({ postId: report.targetId });
    if (result.ok) {
      await resolveReportAction({ reportId: report.id, status: "resolved" });
      router.refresh();
    }
  }

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
            <span className="font-label-md text-label-md text-text-muted">
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
              onClick={() => void removePost()}
              className={cn(
                ACTION_BASE,
                "bg-danger text-on-error hover:bg-danger-border-strong focus-visible:outline-danger-border-strong",
              )}
            >
              <Icon name="delete_forever" className="text-sm" />
              {t("removePostWarn")}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => void resolve("dismissed")}
            className={cn(
              ACTION_BASE,
              "border border-outline-variant bg-surface-dim text-on-surface hover:border-outline-hover hover:bg-surface-container focus-visible:outline-primary",
            )}
          >
            {t("dismissFlag")}
          </button>
          <button
            type="button"
            onClick={() => void resolve("resolved")}
            className={cn(
              ACTION_BASE,
              "bg-primary text-on-primary hover:bg-primary-hover focus-visible:outline-primary",
            )}
          >
            <Icon name="check" className="text-sm" />
            {t("resolve")}
          </button>
        </div>
      </article>
    </div>
  );
}
