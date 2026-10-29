"use client";

import { useTranslations } from "next-intl";
import type { CSSProperties } from "react";
import { DefaultAvatar } from "@/components/ui/default-avatar";
import { Icon } from "@/components/ui/icon";
import { AuthBackLink } from "@/features/auth/components/auth-back-link";
import { Link } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";

export type VerifyState = "pending" | "approved" | "rejected" | "suspended";

const EASE = "duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]";

/**
 * The review screen, driven by the real `approval_status` (S2): it renders
 * exactly the state the server passed in.
 */
export type VerifyPersona = {
  displayName: string;
  location: string;
  languages: string[];
};

export function VerifyView({ status, persona }: { status: VerifyState; persona: VerifyPersona }) {
  const t = useTranslations("Auth.verify");
  const state = status;

  const progress = state === "approved" ? "100%" : "78%";

  const step3 = {
    pending: { icon: "hourglass_top", danger: false },
    approved: { icon: "check", danger: false },
    rejected: { icon: "priority_high", danger: true },
    suspended: { icon: "block", danger: true },
  }[state];

  const statusKey = {
    pending: "statusPending",
    approved: "statusApproved",
    rejected: "statusAction",
    suspended: "statusSuspended",
  }[state];

  const nextSteps = [
    { n: 1, icon: "id_card", tone: "primary" as const },
    { n: 2, icon: "notifications_active", tone: "muted" as const },
    { n: 3, icon: "lock_open", tone: "tertiary" as const },
  ];

  const step3Medallion = (
    <div
      className={cn(
        "flex h-11 w-11 items-center justify-center rounded-full border-2",
        step3.danger
          ? "border-danger-border bg-danger-surface text-danger-text"
          : "border-primary bg-primary-container text-on-primary",
      )}
    >
      <Icon name={step3.icon} className="text-lg" />
    </div>
  );

  return (
    <div className="flex w-full flex-col">
      <div className="mx-auto flex w-full max-w-[1100px] flex-col px-margin-mobile pt-space-md pb-page-mobile lg:px-margin lg:pt-space-xl lg:pb-page">
        <AuthBackLink className="mb-space-sm" />
        {/* Progress milestone tracker */}
        <nav aria-label={t("progressLabel")} className="mb-space-lg w-full sm:mb-space-xl">
          <div className="relative flex items-start justify-between">
            <div className="absolute top-[1.375rem] right-[1.375rem] left-[1.375rem] h-0.5 bg-outline-variant">
              <div
                className={cn(
                  "h-full bg-primary transition-all duration-700 motion-reduce:transition-none",
                  EASE,
                )}
                style={{ width: progress }}
              />
            </div>

            {[1, 2].map((step) => (
              <div key={step} className="relative z-10 flex flex-1 flex-col items-center px-1">
                <div className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-primary bg-primary-container text-on-primary">
                  <Icon name="check" className="text-lg" />
                </div>
                <span className="mt-2 text-center font-label-md text-label-md font-semibold text-on-surface">
                  {t(`step${step}`)}
                </span>
                <span className="mt-0.5 hidden text-center font-body-sm text-body-sm text-secondary sm:inline">
                  {t(`step${step}Sub`)}
                </span>
              </div>
            ))}

            <div className="relative z-10 flex flex-1 flex-col items-center px-1">
              {step3Medallion}
              <span
                className={cn(
                  "mt-2 text-center font-label-md text-label-md font-semibold",
                  step3.danger ? "text-danger-text" : "text-primary",
                )}
              >
                {t("step3")}
              </span>
              <span className="mt-0.5 hidden text-center font-body-sm text-body-sm text-secondary sm:inline">
                {t("step3Sub")}
              </span>
            </div>
          </div>
        </nav>

        {/* Approved banner */}
        {state === "approved" ? (
          <div className="mb-space-lg w-full bezel-tray">
            <div
              className="flex flex-col items-start justify-between gap-space-md bezel-core p-space-lg md:flex-row md:items-center"
              style={{ "--bezel-core-bg": "var(--color-surface-low)" } as CSSProperties}
            >
              <div className="flex items-start gap-space-md">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-success-border bg-success-surface text-success-text">
                  <Icon name="verified" filled className="text-2xl" />
                </div>
                <div className="flex flex-col">
                  <div className="flex flex-wrap items-center gap-space-xs">
                    <span className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                      {t("approvedTitle")}
                    </span>
                    <span className="rounded-full bg-success-container px-space-sm py-0.5 font-label-md text-label-md text-success-text-bright">
                      {t("approvedBadge")}
                    </span>
                  </div>
                  <p className="mt-1 font-body-md text-body-md text-secondary">
                    {t("approvedBody")}
                  </p>
                </div>
              </div>
              <Link
                href="/discover"
                className="inline-flex min-h-12 shrink-0 items-center gap-2 rounded-full bg-primary px-space-lg font-label-lg text-label-lg text-on-primary transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px"
              >
                <span>{t("approvedCta")}</span>
                <Icon name="arrow_forward" className="text-lg" />
              </Link>
            </div>
          </div>
        ) : null}

        {/* Rejected — clarification / resubmit banner */}
        {state === "rejected" ? (
          <div className="mb-space-lg w-full bezel-tray">
            <div
              className="flex flex-col items-start justify-between gap-space-md bezel-core p-space-lg md:flex-row md:items-center"
              style={{ "--bezel-core-bg": "var(--color-surface-low)" } as CSSProperties}
            >
              <div className="flex items-start gap-space-md">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-danger-border bg-danger-surface text-danger-text">
                  <Icon name="contact_page" className="text-2xl" />
                </div>
                <div className="flex flex-col">
                  <div className="flex flex-wrap items-center gap-space-xs">
                    <span className="font-headline-sm text-headline-sm font-semibold text-danger-text">
                      {t("actionTitle")}
                    </span>
                    <span className="rounded-full border border-danger-border-strong px-space-sm py-0.5 font-label-md text-label-md text-danger-text">
                      {t("actionBadge")}
                    </span>
                  </div>
                  <p className="mt-1 font-body-md text-body-md text-secondary">{t("actionBody")}</p>
                </div>
              </div>
              <Link
                href="/create-persona"
                className="inline-flex min-h-12 shrink-0 items-center gap-2 rounded-full bg-primary px-space-lg font-label-lg text-label-lg text-on-primary transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px"
              >
                <Icon name="edit_note" className="text-lg" />
                <span>{t("actionCta")}</span>
              </Link>
            </div>
          </div>
        ) : null}

        {/* Suspended notice */}
        {state === "suspended" ? (
          <div className="mb-space-lg w-full bezel-tray">
            <div
              className="flex flex-col items-start gap-space-md bezel-core p-space-lg md:flex-row md:items-center"
              style={{ "--bezel-core-bg": "var(--color-surface-low)" } as CSSProperties}
            >
              <div className="flex items-start gap-space-md">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-danger-border bg-danger-surface text-danger-text">
                  <Icon name="block" className="text-2xl" />
                </div>
                <div className="flex flex-col">
                  <div className="flex flex-wrap items-center gap-space-xs">
                    <span className="font-headline-sm text-headline-sm font-semibold text-danger-text">
                      {t("suspendedTitle")}
                    </span>
                    <span className="rounded-full border border-danger-border-strong px-space-sm py-0.5 font-label-md text-label-md text-danger-text">
                      {t("suspendedBadge")}
                    </span>
                  </div>
                  <p className="mt-1 font-body-md text-body-md text-secondary">
                    {t("suspendedBody")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Main dossier card */}
        <div className="w-full bezel-tray">
          <article
            className="relative overflow-hidden bezel-core p-space-lg md:p-space-xl"
            style={{ "--bezel-core-bg": "var(--color-surface-low)" } as CSSProperties}
          >
            <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center text-center">
              {/* Emblem */}
              <div className="relative mb-space-lg flex items-center justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-outline-variant bg-surface-container">
                  <svg
                    className="h-12 w-12 text-primary"
                    fill="none"
                    viewBox="0 0 48 48"
                    aria-hidden="true"
                  >
                    <path
                      d="M24 4L7 10.5V22C7 32.5 14.3 42.2 24 44.5C33.7 42.2 41 32.5 41 22V10.5L24 4Z"
                      fill="currentColor"
                      fillOpacity="0.15"
                    />
                    <path
                      d="M24 4L7 10.5V22C7 32.5 14.3 42.2 24 44.5C33.7 42.2 41 32.5 41 22V10.5L24 4Z"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M20 23.5L23 26.5L29 19.5"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="stroke-success-ring"
                    />
                    <circle
                      cx="24"
                      cy="24"
                      r="15"
                      strokeWidth="1.5"
                      strokeDasharray="3 3"
                      className="stroke-success-ring"
                    />
                  </svg>
                </div>
                <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-surface-low">
                  <span
                    className={cn(
                      "absolute h-3.5 w-3.5 animate-ping rounded-full motion-reduce:animate-none",
                      step3.danger ? "bg-danger-border-strong" : "bg-primary",
                    )}
                  />
                  <span
                    className={cn(
                      "relative h-3.5 w-3.5 rounded-full",
                      step3.danger ? "bg-danger-border-strong" : "bg-primary",
                    )}
                  />
                </span>
              </div>

              <h1 className="font-title text-title-mobile text-on-surface md:text-title">
                {t("title")}
              </h1>

              <div
                className={cn(
                  "mt-space-lg mb-space-lg inline-flex items-center gap-space-xs rounded-full border px-space-md py-2",
                  step3.danger
                    ? "border-danger-border bg-danger-surface"
                    : "border-outline-variant bg-surface-container",
                )}
              >
                <span className="relative flex h-2.5 w-2.5">
                  <span
                    className={cn(
                      "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 motion-reduce:animate-none",
                      step3.danger ? "bg-danger-border-strong" : "bg-primary",
                    )}
                  />
                  <span
                    className={cn(
                      "relative inline-flex h-2.5 w-2.5 rounded-full",
                      step3.danger ? "bg-danger-border-strong" : "bg-primary",
                    )}
                  />
                </span>
                <span
                  className={cn(
                    "font-label-md text-label-md font-semibold",
                    step3.danger ? "text-danger-text" : "text-primary",
                  )}
                >
                  {t(statusKey)}
                </span>
              </div>

              <div className="mb-space-lg flex items-center gap-space-xs text-secondary">
                <Icon name="schedule" className="text-base" />
                <span className="font-body-sm text-body-sm">
                  {t("timeline")}{" "}
                  <strong className="font-medium text-on-surface">{t("timelineStrong")}</strong>{" "}
                  {t("timelineHint")}
                </span>
              </div>

              {/* Reassuring copy */}
              <div className="mb-space-lg w-full rounded-2xl border border-outline-variant bg-surface-container p-space-md text-left">
                <div className="flex items-start gap-space-sm">
                  <Icon
                    name="sentiment_satisfied"
                    className="mt-0.5 shrink-0 text-xl text-primary"
                  />
                  <div className="space-y-1">
                    <p className="font-body-md text-body-md text-on-surface">
                      {t("reassurePrimary")}
                    </p>
                    <p className="pt-1 font-body-sm text-body-sm text-secondary">
                      {t("reassureSecondary")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Submitted dossier preview */}
              <div className="mb-space-xl w-full rounded-2xl border border-outline-variant bg-surface-container p-space-md text-left">
                <div className="mb-space-sm flex flex-wrap items-center justify-between gap-space-xs">
                  <div className="flex items-center gap-space-xs">
                    <Icon name="badge" className="text-lg text-primary" />
                    <span className="font-label-md text-label-md font-semibold text-on-surface">
                      {t("dossierTitle")}
                    </span>
                  </div>
                  <span className="rounded-full border border-outline-variant bg-surface-container-high px-space-sm py-0.5 font-label-md text-label-md text-secondary">
                    {t("dossierBadge")}
                  </span>
                </div>

                <div className="flex flex-col items-start gap-space-md sm:flex-row">
                  <div className="relative h-28 w-24 shrink-0 overflow-hidden rounded-2xl border border-outline-variant bg-surface">
                    <DefaultAvatar className="h-full w-full" />
                    {/*
                      Privacy stamp on the locked portrait preview. Sized at the
                      11px label-caps floor (was 10px) with enough padding to read
                      as a stamp rather than a caption.
                    */}
                    <span className="absolute right-1.5 bottom-1.5 flex items-center gap-1 rounded-full bg-surface-lowest/90 px-2 py-1">
                      <Icon name="lock" className="text-sm text-primary" />
                      <span className="font-label-caps text-label-caps text-on-surface">
                        {t("private")}
                      </span>
                    </span>
                  </div>

                  <div className="flex min-w-0 grow flex-col justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-space-xs">
                        <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                          {persona.displayName}
                        </h2>
                        <span className="font-label-md text-label-md text-secondary">
                          {persona.location}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        {persona.languages.slice(0, 3).map((code) => (
                          <span
                            key={code}
                            className="rounded-full border border-outline-variant bg-surface-container-high px-space-sm py-0.5 font-label-md text-label-md font-semibold text-on-surface"
                          >
                            {code}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-space-sm flex flex-wrap items-center justify-between gap-space-xs rounded-full border border-outline-variant bg-surface-low px-space-sm py-1.5 text-secondary">
                      <div className="flex items-center gap-1.5">
                        <Icon name="lock_clock" className="text-base text-primary" />
                        <span className="font-body-sm text-body-sm text-on-surface">
                          {t("socialLabel")}
                        </span>
                      </div>
                      <span className="font-label-md text-label-md font-semibold text-secondary">
                        {t("socialLocked")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* What happens next */}
              <div className="mb-space-xl w-full text-left">
                <div className="mb-space-md flex flex-wrap items-baseline justify-between gap-space-xs">
                  <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                    {t("nextTitle")}
                  </h2>
                  <span className="font-label-md text-label-md text-secondary">
                    {t("nextMeta")}
                  </span>
                </div>

                <ol className="flex flex-col gap-space-md">
                  {nextSteps.map((step) => (
                    <li
                      key={step.n}
                      className="flex items-start gap-space-md rounded-2xl border border-outline-variant bg-surface-container p-space-md transition-colors hover:border-outline-hover"
                    >
                      <div
                        className={cn(
                          "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border text-lg",
                          step.tone === "primary" &&
                            "border-outline-variant bg-surface-container-high text-primary",
                          step.tone === "muted" &&
                            "border-outline-variant bg-surface-container-high text-secondary",
                          step.tone === "tertiary" &&
                            "border-outline-variant bg-surface-container-high text-tertiary",
                        )}
                      >
                        <Icon name={step.icon} />
                      </div>
                      <div className="flex min-w-0 flex-col">
                        <span
                          className={cn(
                            "font-label-md text-label-md font-semibold",
                            step.tone === "primary" && "text-primary",
                            step.tone === "muted" && "text-secondary",
                            step.tone === "tertiary" && "text-tertiary",
                          )}
                        >
                          {t(`next${step.n}Title`)}
                        </span>
                        <p className="mt-0.5 font-body-sm text-body-sm text-secondary">
                          {t(`next${step.n}Body`)}
                        </p>
                        <span className="mt-1 flex items-center gap-1 font-body-sm text-body-sm text-text-muted">
                          {t(`next${step.n}Footer`)}
                          {step.tone === "primary" ? (
                            <Icon name="arrow_forward" className="text-sm" />
                          ) : null}
                        </span>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Action bar */}
              <div className="flex w-full flex-col items-center justify-center gap-space-md sm:flex-row">
                {state === "approved" ? (
                  <Link
                    href="/discover"
                    className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-space-lg font-label-lg text-label-lg text-on-primary transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px sm:w-auto"
                  >
                    <span>{t("exploreStories")}</span>
                    <Icon name="auto_stories" className="text-lg" />
                  </Link>
                ) : null}
                <Link
                  href="/create-persona"
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-outline-variant bg-surface-container px-space-lg font-label-lg text-label-lg text-on-surface transition-colors hover:border-outline-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px sm:w-auto"
                >
                  <Icon name="edit_note" className="text-lg" />
                  <span>{t("editPersona")}</span>
                </Link>
              </div>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}
