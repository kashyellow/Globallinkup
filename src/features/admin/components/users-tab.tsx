"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useRef, useState } from "react";

import { DefaultAvatar } from "@/components/ui/default-avatar";
import { Icon } from "@/components/ui/icon";
import { InlineAlert } from "@/components/ui/inline-alert";
import { MediaImage } from "@/components/ui/media-image";
import { Spinner } from "@/components/ui/spinner";
import { reviewPersonaAction } from "@/features/admin/actions";
import { AdminSearchForm } from "@/features/admin/components/admin-search-form";
import { AdminStatusLinks } from "@/features/admin/components/admin-status-links";
import { AdminPagination } from "@/features/admin/components/admin-pagination";
import { useDialogA11y } from "@/features/shared/use-dialog-a11y";
import { usePendingAction } from "@/features/shared/use-pending-action";
import { useRefresh } from "@/features/shared/refresh-provider";
import { cn } from "@/lib/utils";
import type { AdminProfileDto, AdminProfileFilter, AdminProfileStatus } from "../queries";

const ACTION_BASE =
  "inline-flex min-h-11 items-center gap-1.5 rounded-full px-4 py-2 font-label-md text-label-md whitespace-nowrap transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 active:translate-y-px disabled:opacity-60";

const STATUS_KEY: Record<AdminProfileStatus, string> = {
  pending: "statusPending",
  approved: "statusApproved",
  rejected: "statusRejected",
  suspended: "statusSuspended",
};

type Decision = "approved" | "rejected" | "suspended";

export function AdminUsersTab({
  users,
  query,
  status,
  page,
  total,
  totalPages,
}: {
  users: AdminProfileDto[];
  query: string;
  status: AdminProfileFilter;
  page: number;
  total: number;
  totalPages: number;
}) {
  const t = useTranslations("Admin.users");
  const tCommon = useTranslations("Common");
  const { refresh } = useRefresh();
  const { isPending, run } = usePendingAction();
  const [statusOverrides, setStatusOverrides] = useState<Record<string, AdminProfileStatus>>({});
  const [dossier, setDossier] = useState<AdminProfileDto | null>(null);
  const [reasonTarget, setReasonTarget] = useState<{
    user: AdminProfileDto;
    decision: Extract<Decision, "rejected" | "suspended">;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function review(user: AdminProfileDto, decision: Decision, reason?: string) {
    const result = await run(`review:${user.id}`, async () => {
      setError(null);
      try {
        const response = await reviewPersonaAction({
          profileId: user.id,
          decision,
          reason,
        });
        if (!response.ok) {
          setError(tCommon("actionError"));
          return false;
        }
        setStatusOverrides((previous) => ({ ...previous, [user.id]: decision }));
        refresh();
        return true;
      } catch {
        setError(tCommon("actionError"));
        return false;
      }
    });

    if (result) {
      setReasonTarget(null);
      setDossier((current) =>
        current && current.id === user.id ? { ...current, status: decision } : current,
      );
    }
    return result ?? false;
  }

  function requestDecision(user: AdminProfileDto, decision: Decision) {
    if (decision === "approved") {
      void review(user, decision);
      return;
    }
    setReasonTarget({ user, decision });
  }

  const statusOptions = [
    { value: "all", label: t("filterAll") },
    { value: "pending", label: t("statusPending") },
    { value: "approved", label: t("statusApproved") },
    { value: "rejected", label: t("statusRejected") },
    { value: "suspended", label: t("statusSuspended") },
  ];

  const activeStatus = statusOverrides[dossier?.id ?? ""] ?? dossier?.status;

  return (
    <div className="mx-auto w-full max-w-[1240px] px-margin-mobile pt-block-mobile pb-page-mobile md:px-margin md:pt-block md:pb-page">
      <div className="flex flex-col justify-between gap-space-md lg:flex-row lg:items-end">
        <div>
          <h1 className="font-title text-title-mobile text-on-surface md:text-title">
            {t("title")}
          </h1>
          <p className="mt-2 max-w-[62ch] font-body-md text-body-md text-secondary">{t("body")}</p>
        </div>
        <p className="font-label-md text-label-md text-secondary">
          {t("resultsCount", { shown: users.length, total })}
        </p>
      </div>

      <div className="mt-space-lg bezel-tray">
        <div className="flex flex-col gap-space-md bezel-core p-space-md md:p-space-lg">
          <div className="flex flex-col gap-space-sm lg:flex-row lg:items-center lg:justify-between">
            <AdminSearchForm
              basePath="/admin/users"
              query={query}
              status={status}
              placeholder={t("searchPlaceholder")}
            />
            <AdminStatusLinks
              basePath="/admin/users"
              current={status}
              options={statusOptions}
              query={query}
            />
          </div>
        </div>
      </div>

      {error ? <InlineAlert className="mt-space-md">{error}</InlineAlert> : null}

      {users.length === 0 ? (
        <div className="mt-space-lg bezel-tray">
          <div className="flex flex-col items-center gap-2 bezel-core py-space-xl text-center">
            <Icon
              name={total === 0 ? "person_off" : "search_off"}
              className="text-3xl text-secondary"
            />
            <p className="font-label-lg text-label-lg font-semibold text-on-surface">
              {total === 0 ? t("emptyTitle") : t("noResultsTitle")}
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-space-lg grid grid-cols-1 gap-space-md">
          {users.map((user) => {
            const effectiveStatus = statusOverrides[user.id] ?? user.status;
            return (
              <UserCard
                key={user.id}
                user={user}
                status={effectiveStatus}
                pending={isPending(`review:${user.id}`)}
                onInspect={() => setDossier(user)}
                onReview={(decision) => requestDecision(user, decision)}
              />
            );
          })}
        </div>
      )}

      <AdminPagination
        basePath="/admin/users"
        page={page}
        totalPages={totalPages}
        query={query}
        status={status}
      />

      {dossier ? (
        <PersonaDossierDialog
          user={{ ...dossier, status: activeStatus ?? dossier.status }}
          pending={isPending(`review:${dossier.id}`)}
          onClose={() => setDossier(null)}
          onReview={(decision) => requestDecision(dossier, decision)}
        />
      ) : null}

      <ReasonDialog
        key={reasonTarget ? `${reasonTarget.user.id}:${reasonTarget.decision}` : "closed"}
        target={reasonTarget}
        pending={reasonTarget ? isPending(`review:${reasonTarget.user.id}`) : false}
        onClose={() => setReasonTarget(null)}
        onSubmit={(reason) => {
          if (reasonTarget) void review(reasonTarget.user, reasonTarget.decision, reason);
        }}
      />
    </div>
  );
}

function StatusChip({ status }: { status: AdminProfileStatus }) {
  const t = useTranslations("Admin.users");
  return (
    <span
      className={cn(
        "shrink-0 rounded-full border px-2.5 py-0.5 font-label-md text-label-md font-semibold whitespace-nowrap",
        status === "approved"
          ? "border-success-border bg-success-surface text-success-text"
          : status === "pending"
            ? "border-outline-variant bg-surface-container text-secondary"
            : "border-danger-border bg-danger-surface text-danger-text",
      )}
    >
      {t(STATUS_KEY[status])}
    </span>
  );
}

function UserCard({
  user,
  status,
  pending,
  onInspect,
  onReview,
}: {
  user: AdminProfileDto;
  status: AdminProfileStatus;
  pending: boolean;
  onInspect: () => void;
  onReview: (decision: Decision) => void;
}) {
  const t = useTranslations("Admin.users");
  const tCommon = useTranslations("Common");
  const format = useFormatter();

  const meta = [
    user.location,
    user.languages.length > 0 ? user.languages.join(" / ") : null,
  ].filter(Boolean);

  return (
    <article className="flex flex-col gap-space-md rounded-2xl border border-outline-variant bg-surface-low p-space-md md:p-space-lg lg:flex-row lg:items-center lg:justify-between">
      <div className="flex min-w-0 items-start gap-space-md">
        {user.avatar ? (
          <MediaImage
            alt={user.name}
            src={user.avatar}
            wrapperClassName="h-16 w-14 shrink-0 rounded-xl border border-outline-variant md:h-20 md:w-16"
            loading="lazy"
          />
        ) : (
          <DefaultAvatar className="h-16 w-14 shrink-0 rounded-xl border border-outline-variant md:h-20 md:w-16" />
        )}

        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-x-space-sm gap-y-1">
            <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
              {user.name}
              {user.age > 0 ? (
                <span className="ml-1.5 font-body-sm text-body-sm font-normal text-secondary">
                  {user.age}
                </span>
              ) : null}
            </h2>
            <StatusChip status={status} />
          </div>

          <p className="flex flex-wrap items-center gap-x-1.5 font-body-sm text-body-sm text-on-surface-variant">
            <Icon name="location_on" className="text-sm" />
            {meta.join(" · ")}
          </p>

          {status === "pending" && user.submittedAt ? (
            <p
              className="font-body-sm text-body-sm text-on-surface-variant"
              suppressHydrationWarning
            >
              {t("registeredAgo", {
                time: format.relativeTime(new Date(user.submittedAt), new Date()),
              })}
            </p>
          ) : null}

          {user.headline ? (
            <p className="font-label-md text-label-md text-primary">{user.headline}</p>
          ) : null}
          <p className="line-clamp-2 max-w-xl font-body-sm text-body-sm text-on-surface-variant">
            {user.bioEn || user.bioEs}
          </p>
        </div>
      </div>

      {/*
       * Phones: equal-width buttons in a grid under the details, the primary
       * decision across the full width. From lg the actions sit on the right.
       * Reject only applies to a pending review; a rejected or suspended member
       * can only be reinstated, an approved one suspended.
       */}
      <div className="grid grid-cols-2 gap-space-xs border-t border-outline-variant pt-space-md lg:flex lg:shrink-0 lg:items-center lg:border-t-0 lg:pt-0">
        <button
          type="button"
          onClick={onInspect}
          className={cn(
            ACTION_BASE,
            "justify-center border border-outline-variant bg-surface-container text-on-surface hover:border-outline-hover hover:bg-surface-container-high",
            status !== "pending" && status !== "approved" && "col-span-2",
          )}
        >
          <Icon name="badge" className="text-base max-sm:hidden!" />
          {t("inspectDossier")}
        </button>

        {status === "approved" ? (
          <button
            type="button"
            onClick={() => onReview("suspended")}
            disabled={pending}
            className={cn(
              ACTION_BASE,
              "justify-center border border-outline-variant text-secondary hover:border-danger-border-strong/60 hover:text-danger focus-visible:outline-danger-border-strong",
            )}
          >
            {pending ? (
              <Spinner className="h-4 w-4 text-current" label={tCommon("processing")} />
            ) : null}
            {t("suspend")}
          </button>
        ) : null}

        {status === "pending" ? (
          <button
            type="button"
            onClick={() => onReview("rejected")}
            disabled={pending}
            className={cn(
              ACTION_BASE,
              "justify-center border border-danger-border bg-danger-surface text-danger-text hover:border-danger-border-strong/60 focus-visible:outline-danger-border-strong",
            )}
          >
            {pending ? (
              <Spinner className="h-4 w-4 text-current" label={tCommon("processing")} />
            ) : (
              <Icon name="close" className="text-base" />
            )}
            {t("reject")}
          </button>
        ) : null}

        {status !== "approved" ? (
          <button
            type="button"
            onClick={() => onReview("approved")}
            disabled={pending}
            className={cn(
              ACTION_BASE,
              "col-span-2 justify-center border border-success-ring/30 bg-success-strong text-white hover:bg-success-hover focus-visible:outline-success-ring",
            )}
          >
            {pending ? (
              <Spinner className="h-4 w-4 text-current" label={tCommon("processing")} />
            ) : (
              <Icon name="check" className="text-base" />
            )}
            {t("approveProfile")}
          </button>
        ) : null}
      </div>
    </article>
  );
}

function PersonaDossierDialog({
  user,
  pending,
  onClose,
  onReview,
}: {
  user: AdminProfileDto;
  pending: boolean;
  onClose: () => void;
  onReview: (decision: Decision) => void;
}) {
  const t = useTranslations("Admin.users");
  const tCommon = useTranslations("Common");
  const format = useFormatter();
  const containerRef = useDialogA11y(true, onClose);

  return (
    <div
      className="fixed inset-0 z-[85] flex items-end justify-center bg-background/80 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm sm:items-center sm:p-space-lg"
      onClick={(event) => {
        if (!pending && event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-dossier-title"
        className="flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-y-auto rounded-t-[1.5rem] border border-outline-variant bg-surface-low shadow-lift-lg sm:rounded-[1.5rem]"
      >
        <div className="flex items-start justify-between gap-space-md border-b border-outline-variant p-space-lg">
          <div className="flex min-w-0 items-start gap-space-md">
            {user.avatar ? (
              <MediaImage
                alt={user.name}
                src={user.avatar}
                wrapperClassName="h-20 w-16 shrink-0 rounded-xl border border-outline-variant"
              />
            ) : (
              <DefaultAvatar className="h-20 w-16 shrink-0 rounded-xl border border-outline-variant" />
            )}
            <div className="min-w-0">
              <h2
                id="admin-dossier-title"
                className="font-headline-md text-headline-md font-semibold text-on-surface"
              >
                {user.name}
                {user.age > 0 ? (
                  <span className="font-normal text-secondary">, {user.age}</span>
                ) : null}
              </h2>
              <p className="mt-0.5 flex items-center gap-1 font-body-sm text-body-sm text-secondary">
                <Icon name="location_on" className="text-sm" />
                {[user.location, user.neighborhood].filter(Boolean).join(" · ")}
              </p>
              <div className="mt-space-xs">
                <StatusChip status={user.status} />
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            aria-label={tCommon("close")}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-outline-variant bg-surface-container text-on-surface transition-colors hover:bg-surface-container-high focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50"
          >
            <Icon name="close" className="text-xl" />
          </button>
        </div>

        <div className="flex flex-col gap-space-lg p-space-lg">
          {user.headline ? (
            <p className="font-label-lg text-label-lg font-semibold text-primary">
              {user.headline}
            </p>
          ) : null}

          <section className="space-y-1.5">
            <h3 className="font-label-md text-label-md font-semibold text-text-muted">
              {t("bioLabel")}
            </h3>
            <p className="font-body-sm text-body-sm leading-relaxed text-on-surface-strong">
              {user.bioEn || user.bioEs || "—"}
            </p>
          </section>

          <div className="grid grid-cols-1 gap-space-md md:grid-cols-2">
            <section className="space-y-1.5">
              <h3 className="font-label-md text-label-md font-semibold text-text-muted">
                {tCommon("languages")}
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {user.languages.length > 0 ? (
                  user.languages.map((language) => (
                    <span
                      key={language}
                      className="rounded-full border border-outline-variant bg-surface-container px-2.5 py-0.5 font-label-md text-label-md text-on-surface-strong"
                    >
                      {language}
                    </span>
                  ))
                ) : (
                  <span className="font-body-sm text-body-sm text-secondary">—</span>
                )}
              </div>
            </section>
          </div>

          <section className="space-y-2">
            <h3 className="font-label-md text-label-md font-semibold text-text-muted">
              {t("moderationHistory")}
            </h3>
            {user.moderation.length > 0 ? (
              <div className="divide-y divide-outline-variant rounded-2xl border border-outline-variant bg-surface-container">
                {user.moderation.map((event, index) => (
                  <div
                    key={`${event.createdAt}-${index}`}
                    className="flex flex-col gap-1 p-space-md"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <StatusChip status={event.decision} />
                      <span
                        className="font-body-sm text-body-sm text-text-muted"
                        suppressHydrationWarning
                      >
                        {format.relativeTime(new Date(event.createdAt), new Date())}
                      </span>
                    </div>
                    {event.reason ? (
                      <p className="font-body-sm text-body-sm text-on-surface-strong">
                        {event.reason}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <p className="font-body-sm text-body-sm text-secondary">{t("noHistory")}</p>
            )}
          </section>
        </div>

        <div className="sticky bottom-0 flex flex-col gap-space-sm border-t border-outline-variant bg-surface-low p-space-lg sm:flex-row sm:items-center sm:justify-end">
          {user.status === "approved" ? (
            <button
              type="button"
              onClick={() => onReview("suspended")}
              disabled={pending}
              className={cn(
                ACTION_BASE,
                "border border-outline-variant text-secondary hover:border-danger-border-strong/60 hover:text-danger focus-visible:outline-danger-border-strong",
              )}
            >
              {t("suspend")}
            </button>
          ) : (
            <>
              {user.status === "pending" ? (
                <button
                  type="button"
                  onClick={() => onReview("rejected")}
                  disabled={pending}
                  className={cn(
                    ACTION_BASE,
                    "border border-danger-border bg-danger-surface text-danger-text hover:border-danger-border-strong/60 focus-visible:outline-danger-border-strong",
                  )}
                >
                  {t("reject")}
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => onReview("approved")}
                disabled={pending}
                className={cn(
                  ACTION_BASE,
                  "border border-success-ring/30 bg-success-strong text-white hover:bg-success-hover focus-visible:outline-success-ring",
                )}
              >
                {pending ? (
                  <Spinner className="h-4 w-4 text-current" label={tCommon("processing")} />
                ) : null}
                {t("approveProfile")}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ReasonDialog({
  target,
  pending,
  onClose,
  onSubmit,
}: {
  target: { user: AdminProfileDto; decision: "rejected" | "suspended" } | null;
  pending: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
}) {
  const t = useTranslations("Admin.users");
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
        "fixed inset-0 z-[90] flex items-end justify-center bg-background/80 p-0 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm transition-opacity duration-300 sm:items-center sm:p-space-lg",
        target ? "opacity-100" : "pointer-events-none opacity-0",
      )}
    >
      <div
        ref={containerRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="admin-reason-title"
        aria-describedby="admin-reason-body"
        className="w-full max-w-md rounded-t-[1.5rem] border border-outline-variant bg-surface-low p-space-lg shadow-lift-lg sm:rounded-[1.5rem]"
      >
        <h2
          id="admin-reason-title"
          className="font-headline-sm text-headline-sm font-semibold text-on-surface"
        >
          {target?.decision === "suspended" ? t("suspend") : t("reject")}
        </h2>
        <p id="admin-reason-body" className="mt-1 font-body-sm text-body-sm text-secondary">
          {t("reasonBody", { name: target?.user.name ?? "" })}
        </p>
        <label className="mt-space-md flex flex-col gap-1.5">
          <span className="font-label-md text-label-md font-semibold text-on-surface">
            {t("reasonLabel")}
          </span>
          <textarea
            ref={textareaRef}
            rows={4}
            maxLength={500}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder={t("reasonPlaceholder")}
            className="w-full resize-none rounded-2xl border border-outline-variant bg-surface-dim p-space-md font-body-sm text-body-sm text-on-surface transition-colors placeholder:text-placeholder hover:border-outline-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          />
        </label>
        <div className="mt-1 flex items-center justify-between font-body-sm text-body-sm text-secondary">
          <span>{t("reasonHint")}</span>
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
            className={cn(
              "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-space-lg py-2.5 font-label-lg text-label-lg font-semibold text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60",
              target?.decision === "suspended"
                ? "bg-danger hover:bg-danger-border-strong focus-visible:outline-danger-border-strong"
                : "bg-danger hover:bg-danger-border-strong focus-visible:outline-danger-border-strong",
            )}
          >
            {pending ? (
              <Spinner className="h-4 w-4 text-current" label={tCommon("processing")} />
            ) : null}
            {target?.decision === "suspended" ? t("suspend") : t("reject")}
          </button>
        </div>
      </div>
    </div>
  );
}
