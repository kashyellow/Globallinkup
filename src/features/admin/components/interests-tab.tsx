"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";
import type { CSSProperties } from "react";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Icon } from "@/components/ui/icon";
import { InlineAlert } from "@/components/ui/inline-alert";
import { Spinner } from "@/components/ui/spinner";
import { reviewInterestAction } from "@/features/admin/actions";
import { usePendingAction } from "@/features/shared/use-pending-action";
import { useRefresh } from "@/features/shared/refresh-provider";
import { cn } from "@/lib/utils";
import type { AdminInterestDto } from "../queries";

const ACTION_BASE =
  "inline-flex min-h-11 items-center gap-1.5 rounded-full px-4 py-2 font-label-md text-label-md transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 active:translate-y-px disabled:opacity-60";

type InterestDecision = "approved" | "rejected";

export function AdminInterestsTab({ interests }: { interests: AdminInterestDto[] }) {
  const t = useTranslations("Admin.interests");
  const tCommon = useTranslations("Common");
  const { refresh } = useRefresh();
  const { isPending, run } = usePendingAction();
  const [handledIds, setHandledIds] = useState<ReadonlySet<string>>(() => new Set());
  const [confirmTarget, setConfirmTarget] = useState<AdminInterestDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  const open = interests.filter((interest) => !handledIds.has(interest.id));
  const pending = open.filter((interest) => interest.status === "pending");
  const published = open.filter((interest) => interest.status === "approved");

  async function review(interest: AdminInterestDto, decision: InterestDecision) {
    return run(`interest:${interest.id}`, async () => {
      setError(null);
      try {
        const response = await reviewInterestAction({
          interestId: interest.id,
          decision,
        });
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

  async function approve(interest: AdminInterestDto) {
    await review(interest, "approved");
  }

  return (
    <div className="flex flex-col gap-space-lg">
      <div
        className="bezel-tray"
        style={{ "--bezel-core-bg": "var(--color-surface-low)" } as CSSProperties}
      >
        <div className="flex flex-col justify-between gap-space-md bezel-core p-space-md sm:flex-row sm:items-center">
          <div className="flex items-center gap-space-md">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-admin-surface text-primary">
              <Icon name="tag" />
            </span>
            <div>
              <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                {t("title")}
              </h2>
              <p className="mt-0.5 max-w-2xl font-body-sm text-body-sm text-secondary">
                {t("body")}
              </p>
            </div>
          </div>
          <span className="self-start rounded-full border border-outline-variant bg-surface-container px-space-md py-1.5 font-label-md text-label-md font-semibold text-secondary sm:self-auto">
            {t("needsReview", { count: pending.length })}
          </span>
        </div>
      </div>

      {error ? <InlineAlert>{error}</InlineAlert> : null}

      {pending.length > 0 ? (
        <section className="flex flex-col gap-space-sm">
          <h3 className="px-space-xs font-label-lg text-label-lg font-semibold text-on-surface">
            {t("pendingTitle")}
          </h3>
          <div className="grid grid-cols-1 gap-space-md md:grid-cols-2">
            {pending.map((interest) => (
              <InterestCard
                key={interest.id}
                interest={interest}
                pending={isPending(`interest:${interest.id}`)}
                onApprove={() => void approve(interest)}
                onReject={() => setConfirmTarget(interest)}
              />
            ))}
          </div>
        </section>
      ) : null}

      {published.length > 0 ? (
        <section className="flex flex-col gap-space-sm">
          <h3 className="px-space-xs font-label-lg text-label-lg font-semibold text-on-surface">
            {t("publishedTitle")}
          </h3>
          <div className="grid grid-cols-1 gap-space-md md:grid-cols-2">
            {published.map((interest) => (
              <InterestCard
                key={interest.id}
                interest={interest}
                pending={isPending(`interest:${interest.id}`)}
                onUnpublish={() => setConfirmTarget(interest)}
              />
            ))}
          </div>
        </section>
      ) : null}

      {open.length === 0 ? (
        <div className="bezel-tray">
          <div
            className="flex flex-col items-center gap-2 bezel-core py-space-xl text-center"
            style={{ "--bezel-core-bg": "var(--color-surface-low)" } as CSSProperties}
          >
            <Icon name="tag" className="text-3xl text-success-text" />
            <p className="font-label-lg text-label-lg font-semibold text-on-surface">
              {t("emptyTitle")}
            </p>
          </div>
        </div>
      ) : null}

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

function InterestCard({
  interest,
  pending,
  onApprove,
  onReject,
  onUnpublish,
}: {
  interest: AdminInterestDto;
  pending: boolean;
  onApprove?: () => void;
  onReject?: () => void;
  onUnpublish?: () => void;
}) {
  const t = useTranslations("Admin.interests");
  const format = useFormatter();
  const isPublished = interest.status === "approved";

  return (
    <div
      className="bezel-tray"
      style={{ "--bezel-core-bg": "var(--color-surface-low)" } as CSSProperties}
    >
      <article className="flex h-full flex-col justify-between gap-space-md bezel-core p-space-lg">
        <div className="flex flex-col gap-space-sm">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <span
              className={cn(
                "rounded-full border px-2.5 py-0.5 font-label-md text-label-md font-semibold",
                isPublished
                  ? "border-success-border bg-success-surface text-success-text"
                  : "border-outline-variant bg-surface-container text-secondary",
              )}
            >
              {isPublished ? t("publishedBadge") : t("pendingBadge")}
            </span>
            <span className="font-label-md text-label-md text-text-muted" suppressHydrationWarning>
              {format.relativeTime(new Date(interest.createdAt), new Date())}
            </span>
          </div>

          <h3 className="font-headline-sm text-headline-sm font-semibold break-words text-on-surface">
            {interest.label}
          </h3>
          <p className="font-body-sm text-body-sm text-secondary">
            {interest.createdByName
              ? t("createdBy", { name: interest.createdByName })
              : t("platform")}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-space-sm border-t border-outline-variant pt-space-sm">
          {!isPublished && onApprove && onReject ? (
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

          {isPublished && onUnpublish ? (
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
      </article>
    </div>
  );
}
