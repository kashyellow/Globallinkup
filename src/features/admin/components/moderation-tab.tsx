"use client";

import type { CSSProperties } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { useRef, useState } from "react";

import { Icon } from "@/components/ui/icon";
import { InlineAlert } from "@/components/ui/inline-alert";
import { MediaImage } from "@/components/ui/media-image";
import { Spinner } from "@/components/ui/spinner";
import {
  removePostAction,
  resolveAppealFormAction,
  resolveReportAction,
  restorePostAction,
} from "@/features/admin/actions";
import { AdminPagination } from "@/features/admin/components/admin-pagination";
import { AdminSearchForm } from "@/features/admin/components/admin-search-form";
import { AdminStatusLinks } from "@/features/admin/components/admin-status-links";
import { useDialogA11y } from "@/features/shared/use-dialog-a11y";
import { usePendingAction } from "@/features/shared/use-pending-action";
import { useRefresh } from "@/features/shared/refresh-provider";
import { cn } from "@/lib/utils";
import type {
  AdminAppealDto,
  AdminReportDto,
  AdminReportFilter,
  AdminReportTarget,
} from "../queries";

const ACTION_BASE =
  "inline-flex min-h-11 items-center gap-1.5 rounded-full px-4 py-2 font-label-md text-label-md transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 active:translate-y-px disabled:opacity-60";

type ResolveStatus = "resolved" | "dismissed";

export function AdminModerationTab({
  reports,
  appeals,
  canManageReports,
  canModeratePosts,
  query,
  status,
  target,
  page,
  total,
  totalPages,
}: {
  reports: AdminReportDto[];
  appeals: AdminAppealDto[];
  canManageReports: boolean;
  canModeratePosts: boolean;
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
  const [removeTarget, setRemoveTarget] = useState<AdminReportDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  const visible = reports.filter((report) => !handledIds.has(report.id));

  async function resolve(report: AdminReportDto, nextStatus: ResolveStatus) {
    await run(`report:${report.id}`, async () => {
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
  }

  async function removePost(report: AdminReportDto, reason: string) {
    if (report.targetType !== "post" || !report.targetId) return;

    const result = await run(`remove:${report.id}`, async () => {
      setError(null);
      try {
        const removed = await removePostAction({ postId: report.targetId!, reason });
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

    if (result) setRemoveTarget(null);
  }

  async function restorePost(report: AdminReportDto) {
    if (report.targetType !== "post" || !report.targetId) return;
    await run(`restore:${report.id}`, async () => {
      setError(null);
      try {
        const restored = await restorePostAction({ postId: report.targetId! });
        if (!restored.ok) {
          setError(tCommon("actionError"));
          return false;
        }
        refresh();
        return true;
      } catch {
        setError(tCommon("actionError"));
        return false;
      }
    });
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
      {canModeratePosts ? (
        appeals.length > 0 ? (
          <section className="mb-space-lg space-y-space-sm rounded-2xl border border-outline-variant bg-surface-low p-space-md">
            <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
              {t("appealsTitle", { count: appeals.length })}
            </h2>
            <p className="font-body-sm text-body-sm text-secondary">{t("appealsBody")}</p>
            <ul className="space-y-space-sm">
              {appeals.map((appeal) => (
                <li
                  key={appeal.id}
                  className="space-y-2 rounded-xl border border-outline-variant bg-surface-container p-space-sm"
                >
                  <p className="font-label-lg text-label-lg font-semibold text-on-surface">
                    {appeal.postCaption || t("appealsUntitled")}
                  </p>
                  <p className="font-label-md text-label-md text-text-muted">{appeal.authorName}</p>
                  <p className="font-body-sm text-body-sm text-on-surface-strong">
                    {appeal.message}
                  </p>
                  <form
                    action={resolveAppealFormAction}
                    className="flex flex-col gap-2 sm:flex-row sm:items-center"
                  >
                    <input type="hidden" name="appealId" value={appeal.id} />
                    <input
                      name="note"
                      maxLength={500}
                      placeholder={t("appealNotePlaceholder")}
                      className="min-h-10 flex-1 rounded-full border border-outline-variant bg-surface-dim px-3 font-body-sm text-body-sm text-on-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    />
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        name="decision"
                        value="accepted"
                        className={cn(
                          ACTION_BASE,
                          "bg-primary text-on-primary hover:bg-primary-hover focus-visible:outline-primary",
                        )}
                      >
                        {t("appealAccept")}
                      </button>
                      <button
                        type="submit"
                        name="decision"
                        value="declined"
                        className={cn(
                          ACTION_BASE,
                          "border border-outline-variant bg-surface-dim text-on-surface hover:border-outline-hover hover:bg-surface-container focus-visible:outline-primary",
                        )}
                      >
                        {t("appealDecline")}
                      </button>
                    </div>
                  </form>
                </li>
              ))}
            </ul>
          </section>
        ) : (
          <div className="mb-space-lg bezel-tray">
            <div className="flex flex-col items-center gap-2 bezel-core py-space-xl text-center">
              <Icon name="verified_user" className="text-3xl text-success-text" />
              <p className="font-label-lg text-label-lg font-semibold text-on-surface">
                {t("appealsEmpty")}
              </p>
            </div>
          </div>
        )
      ) : null}

      <div className="flex flex-col justify-between gap-space-md lg:flex-row lg:items-end">
        <div>
          <p className="font-label-md text-label-md font-semibold text-primary">{t("eyebrow")}</p>
          <h1 className="mt-1 font-display-md text-display-md-mobile text-on-surface md:text-display-md">
            {t("title")}
          </h1>
          <p className="mt-2 max-w-[62ch] font-body-md text-body-md text-secondary">{t("body")}</p>
        </div>
        {canManageReports ? (
          <span className="inline-flex items-center gap-1.5 self-start rounded-full border border-danger-border bg-danger-surface px-space-md py-1.5 font-label-md text-label-md font-semibold text-danger-text">
            <span className="h-1.5 w-1.5 rounded-full bg-danger" />
            {t("needsReview", { count: total })}
          </span>
        ) : null}
      </div>

      {canManageReports ? (
        <>
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
                  canModeratePosts={canModeratePosts}
                  pending={isPending(`report:${report.id}`) || isPending(`remove:${report.id}`)}
                  onResolve={(nextStatus) => void resolve(report, nextStatus)}
                  onRemove={() => setRemoveTarget(report)}
                  onRestore={() => void restorePost(report)}
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

          <RemovePostDialog
            target={removeTarget}
            pending={removeTarget ? isPending(`remove:${removeTarget.id}`) : false}
            onClose={() => setRemoveTarget(null)}
            onSubmit={(reason) => {
              if (removeTarget) void removePost(removeTarget, reason);
            }}
          />
        </>
      ) : null}
    </div>
  );
}

function ReportCard({
  report,
  canModeratePosts,
  pending,
  onResolve,
  onRemove,
  onRestore,
}: {
  report: AdminReportDto;
  canModeratePosts: boolean;
  pending: boolean;
  onResolve: (status: ResolveStatus) => void;
  onRemove: () => void;
  onRestore: () => void;
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
                {report.targetLabel || t("targetPost")}
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
          {canModeratePosts && report.targetType === "post" && report.targetState === "removed" ? (
            <button
              type="button"
              onClick={onRestore}
              disabled={pending}
              className={cn(
                ACTION_BASE,
                "focus-visible:outline-success-border-strong border border-success-border bg-success-surface text-success-text hover:border-success",
              )}
            >
              {pending ? (
                <Spinner className="h-4 w-4 text-current" label={tCommon("processing")} />
              ) : (
                <Icon name="restore" className="text-sm" />
              )}
              {t("restorePost")}
            </button>
          ) : canModeratePosts && report.targetType === "post" && report.status === "open" ? (
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

function RemovePostDialog({
  target,
  pending,
  onClose,
  onSubmit,
}: {
  target: AdminReportDto | null;
  pending: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
}) {
  const t = useTranslations("Admin.moderation");
  const tCommon = useTranslations("Common");
  const [reason, setReason] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useDialogA11y(target !== null, onClose, textareaRef);
  const valid = reason.trim().length >= 10;

  return (
    <div
      aria-hidden={target === null}
      inert={target === null}
      onClick={(event) => {
        if (!pending && event.target === event.currentTarget) onClose();
      }}
      className={cn(
        "fixed inset-0 z-[90] flex items-end justify-center bg-background/80 p-0 backdrop-blur-sm transition-opacity duration-300 sm:items-center sm:p-space-lg",
        target ? "opacity-100" : "pointer-events-none opacity-0",
      )}
    >
      <div
        ref={containerRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="remove-post-title"
        aria-describedby="remove-post-body"
        className="w-full max-w-md rounded-t-[1.5rem] border border-outline-variant bg-surface-low p-space-lg shadow-lift-lg sm:rounded-[1.5rem]"
      >
        <h2
          id="remove-post-title"
          className="font-headline-sm text-headline-sm font-semibold text-on-surface"
        >
          {t("removeReasonTitle")}
        </h2>
        <p id="remove-post-body" className="mt-1 font-body-sm text-body-sm text-secondary">
          {t("removeReasonBody")}
        </p>
        <label className="mt-space-md flex flex-col gap-1.5">
          <span className="font-label-md text-label-md font-semibold text-on-surface">
            {t("removeReasonLabel")}
          </span>
          <textarea
            ref={textareaRef}
            rows={4}
            maxLength={500}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder={t("removeReasonPlaceholder")}
            className="w-full resize-none rounded-2xl border border-outline-variant bg-surface-dim p-space-md font-body-sm text-body-sm text-on-surface transition-colors placeholder:text-placeholder hover:border-outline-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          />
        </label>
        <div className="mt-1 flex items-center justify-between font-body-sm text-body-sm text-secondary">
          <span>{t("removeReasonHint")}</span>
          <span className="tabular-nums">{reason.trim().length} / 500</span>
        </div>
        <div className="mt-space-lg flex flex-col-reverse gap-space-sm sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-outline-variant bg-surface-dim px-space-lg py-2.5 font-label-lg text-label-lg font-semibold text-on-surface transition-colors hover:border-outline-hover hover:bg-surface-container focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60"
          >
            {tCommon("cancel")}
          </button>
          <button
            type="button"
            onClick={() => {
              if (valid) onSubmit(reason.trim());
            }}
            disabled={pending || !valid}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-danger px-space-lg py-2.5 font-label-lg text-label-lg font-semibold text-white transition-colors hover:bg-danger-border-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger-border-strong disabled:opacity-60"
          >
            {pending ? (
              <Spinner className="h-4 w-4 text-current" label={tCommon("processing")} />
            ) : null}
            {t("removeReasonConfirm")}
          </button>
        </div>
      </div>
    </div>
  );
}
