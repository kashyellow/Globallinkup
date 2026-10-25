"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Icon } from "@/components/ui/icon";
import { InlineAlert } from "@/components/ui/inline-alert";
import { Spinner } from "@/components/ui/spinner";
import { reviewInterestAction } from "@/features/admin/actions";
import { AdminPagination } from "@/features/admin/components/admin-pagination";
import { AdminSearchForm } from "@/features/admin/components/admin-search-form";
import { AdminStatusLinks } from "@/features/admin/components/admin-status-links";
import { usePendingAction } from "@/features/shared/use-pending-action";
import { useRefresh } from "@/features/shared/refresh-provider";
import { cn } from "@/lib/utils";
import type { AdminInterestDto, AdminInterestFilter } from "../queries";

const ACTION_BASE =
  "inline-flex min-h-11 items-center gap-1.5 rounded-full px-4 py-2 font-label-md text-label-md transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 active:translate-y-px disabled:opacity-60";

export function AdminInterestsTab({
  interests,
  query,
  status,
  counts,
  page,
  total,
  totalPages,
}: {
  interests: AdminInterestDto[];
  query: string;
  status: AdminInterestFilter;
  counts: Record<AdminInterestFilter, number>;
  page: number;
  total: number;
  totalPages: number;
}) {
  const t = useTranslations("Admin.interests");
  const tCommon = useTranslations("Common");
  const { refresh } = useRefresh();
  const { isPending, run } = usePendingAction();
  const [handledIds, setHandledIds] = useState<ReadonlySet<string>>(() => new Set());
  const [confirmTarget, setConfirmTarget] = useState<AdminInterestDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  const visible = interests.filter((interest) => !handledIds.has(interest.id));

  async function review(interest: AdminInterestDto, decision: "approved" | "rejected") {
    return run(`interest:${interest.id}`, async () => {
      setError(null);
      try {
        const response = await reviewInterestAction({ interestId: interest.id, decision });
        if (!response.ok) {
          setError(tCommon("actionError"));
          return false;
        }
        setHandledIds((previous) => new Set(previous).add(interest.id));
        refresh();
        return true;
      } catch {
        setError(tCommon("actionError"));
        return false;
      }
    });
  }

  async function reject(interest: AdminInterestDto) {
    const result = await review(interest, "rejected");
    if (result) setConfirmTarget(null);
  }

  const statusOptions = [
    { value: "all", label: t("filterAll"), count: counts.all },
    { value: "pending", label: t("pendingBadge"), count: counts.pending },
    { value: "approved", label: t("publishedBadge"), count: counts.approved },
    { value: "rejected", label: t("rejectedBadge"), count: counts.rejected },
  ];

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
        <p className="font-label-md text-label-md text-secondary">
          {t("resultsCount", { shown: interests.length, total })}
        </p>
      </div>

      <div className="mt-space-lg bezel-tray">
        <div className="flex flex-col gap-space-md bezel-core p-space-md md:p-space-lg">
          <div className="flex flex-col gap-space-sm lg:flex-row lg:items-center lg:justify-between">
            <AdminSearchForm
              basePath="/admin/interests"
              query={query}
              status={status}
              placeholder={t("searchPlaceholder")}
            />
            <AdminStatusLinks
              basePath="/admin/interests"
              current={status}
              options={statusOptions}
              query={query}
            />
          </div>
        </div>
      </div>

      {error ? <InlineAlert className="mt-space-md">{error}</InlineAlert> : null}

      {visible.length === 0 ? (
        <div className="mt-space-lg bezel-tray">
          <div className="flex flex-col items-center gap-2 bezel-core py-space-xl text-center">
            <Icon name="tag" className="text-3xl text-secondary" />
            <p className="font-label-lg text-label-lg font-semibold text-on-surface">
              {t("emptyTitle")}
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-space-lg overflow-hidden rounded-[1.25rem] border border-outline-variant bg-surface-low">
          {visible.map((interest) => (
            <InterestRow
              key={interest.id}
              interest={interest}
              pending={isPending(`interest:${interest.id}`)}
              onApprove={() => void review(interest, "approved")}
              onReject={() => setConfirmTarget(interest)}
              onUnpublish={() => setConfirmTarget(interest)}
            />
          ))}
        </div>
      )}

      <AdminPagination
        basePath="/admin/interests"
        page={page}
        totalPages={totalPages}
        query={query}
        status={status}
      />

      <ConfirmDialog
        open={confirmTarget !== null}
        title={confirmTarget?.status === "approved" ? t("unpublishTitle") : t("rejectPendingTitle")}
        body={
          confirmTarget?.status === "approved"
            ? t("unpublishBody", { label: confirmTarget.label })
            : t("rejectPendingBody", { label: confirmTarget?.label ?? "" })
        }
        confirmLabel={confirmTarget?.status === "approved" ? t("unpublish") : t("reject")}
        cancelLabel={tCommon("cancel")}
        pendingLabel={tCommon("processing")}
        pending={confirmTarget ? isPending(`interest:${confirmTarget.id}`) : false}
        onClose={() => setConfirmTarget(null)}
        onConfirm={() => {
          if (confirmTarget) void reject(confirmTarget);
        }}
      />
    </div>
  );
}

function InterestRow({
  interest,
  pending,
  onApprove,
  onReject,
  onUnpublish,
}: {
  interest: AdminInterestDto;
  pending: boolean;
  onApprove: () => void;
  onReject: () => void;
  onUnpublish: () => void;
}) {
  const t = useTranslations("Admin.interests");
  const format = useFormatter();
  const isPublished = interest.status === "approved";
  const isPending = interest.status === "pending";

  return (
    <div
      data-interest-label={interest.label}
      className="flex flex-col gap-space-sm border-b border-outline-variant p-space-md last:border-b-0 sm:flex-row sm:items-center sm:justify-between sm:p-space-lg"
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-headline-sm text-headline-sm font-semibold break-words text-on-surface">
            {interest.label}
          </h2>
          <span
            className={cn(
              "rounded-full border px-2.5 py-0.5 font-label-md text-label-md font-semibold",
              isPublished
                ? "border-success-border bg-success-surface text-success-text"
                : interest.status === "pending"
                  ? "border-outline-variant bg-surface-container text-secondary"
                  : "border-danger-border bg-danger-surface text-danger-text",
            )}
          >
            {isPublished
              ? t("publishedBadge")
              : interest.status === "pending"
                ? t("pendingBadge")
                : t("rejectedBadge")}
          </span>
        </div>
        <p className="mt-1 font-body-sm text-body-sm text-secondary">
          {interest.createdByName
            ? t("createdBy", { name: interest.createdByName })
            : t("platform")}
          {" · "}
          <span suppressHydrationWarning>
            {format.relativeTime(new Date(interest.createdAt), new Date())}
          </span>
        </p>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-space-sm">
        {isPending ? (
          <>
            <button
              type="button"
              onClick={onReject}
              disabled={pending}
              className={cn(
                ACTION_BASE,
                "border border-danger-border bg-danger-surface text-danger-text hover:bg-danger-surface/70 focus-visible:outline-danger-border-strong",
              )}
            >
              {pending ? (
                <Spinner className="h-4 w-4 text-current" label={t("reject")} />
              ) : (
                <Icon name="close" className="text-base" />
              )}
              {t("reject")}
            </button>
            <button
              type="button"
              onClick={onApprove}
              disabled={pending}
              className={cn(
                ACTION_BASE,
                "border border-transparent bg-primary text-on-primary hover:bg-primary-hover focus-visible:outline-primary",
              )}
            >
              {pending ? (
                <Spinner className="h-4 w-4 text-current" label={t("approve")} />
              ) : (
                <Icon name="check" className="text-base" />
              )}
              {t("approve")}
            </button>
          </>
        ) : null}

        {isPublished ? (
          <button
            type="button"
            onClick={onUnpublish}
            disabled={pending}
            className={cn(
              ACTION_BASE,
              "border border-outline-variant bg-surface-container text-on-surface hover:border-outline-hover hover:bg-surface-container-high focus-visible:outline-primary",
            )}
          >
            {pending ? (
              <Spinner className="h-4 w-4 text-current" label={t("unpublish")} />
            ) : (
              <Icon name="visibility_off" className="text-base" />
            )}
            {t("unpublish")}
          </button>
        ) : null}
      </div>
    </div>
  );
}
