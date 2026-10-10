"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import { Link } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";

type VerifyState = "pending" | "approved" | "action";

const PORTRAIT =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuChgUiDvARrc_Bw8m37Od2StWpcgREYi9FgPC_NGDUO0m5K2HvD71pDpGV9areRHYo9sXfndYKiosc-UIzCwa09HUk5Wv_-HLhiY_vrHP81qLYhOU_V4N6LvTLlcuccLFPLAEacMrnV4iUaN-izqKRMoMNbRkMMcYKFvuNLizu2SyqeB_sMe1-uzLl5Ez_NpeqZUf16ky1nPh8QnRia9PZ9tUdN2TGF6V9PkS53kNwaoufEwFEJ5N0adA";

export function VerifyView() {
  const t = useTranslations("Auth.verify");
  const [state, setState] = useState<VerifyState>("pending");

  const progress = state === "approved" ? "100%" : "78%";

  const step3 = {
    pending: { icon: "hourglass_top", tone: "primary" as const },
    approved: { icon: "check", tone: "primary" as const },
    action: { icon: "priority_high", tone: "danger" as const },
  }[state];

  const statusKey = {
    pending: "statusPending",
    approved: "statusApproved",
    action: "statusAction",
  }[state];

  const nextSteps = [
    { n: 1, icon: "id_card", tone: "primary" as const, footer: "primary" as const },
    { n: 2, icon: "mark_email_read", tone: "muted" as const, footer: "muted" as const },
    { n: 3, icon: "lock_open", tone: "tertiary" as const, footer: "tertiary" as const },
  ];

  const metrics = [
    { n: 1, icon: "encrypted", tone: "text-primary" },
    { n: 2, icon: "timer", tone: "text-tertiary" },
    { n: 3, icon: "translate", tone: "text-secondary" },
  ];

  return (
    <div className="flex w-full flex-col">
      {process.env.NODE_ENV === "development" ? (
        <aside className="w-full border-b border-outline-variant bg-surface-low px-margin-mobile py-space-sm shadow-sm lg:px-margin">
          <div className="mx-auto flex max-w-[1240px] flex-col items-center justify-between gap-space-sm sm:flex-row">
            <div className="flex items-center gap-space-xs">
              <Icon name="tune" filled className="text-[18px] text-primary" />
              <span className="font-label-caps text-label-caps tracking-wider text-on-surface uppercase">
                {t("previewLabel")}
              </span>
              <span className="hidden font-body-sm text-body-sm text-secondary md:inline">
                {t("previewHint")}
              </span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg border border-outline-variant bg-surface p-1 shadow-sm">
              {(["pending", "approved", "action"] as const).map((key) => {
                const active = state === key;
                const dot = {
                  pending: "bg-primary animate-pulse",
                  approved: "bg-tertiary",
                  action: "bg-error",
                }[key];
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setState(key)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-label-md text-label-md transition-all",
                      active
                        ? "border border-primary/30 bg-[#2E2321] font-semibold text-on-surface shadow-sm"
                        : "text-secondary hover:text-on-surface",
                    )}
                  >
                    <span className={cn("h-2 w-2 rounded-full", dot)} />
                    {t(`state_${key}`)}
                  </button>
                );
              })}
            </div>
          </div>
        </aside>
      ) : null}

      <div className="mx-auto flex w-full max-w-[1040px] flex-col items-center px-margin-mobile py-space-xl lg:px-margin">
        {/* Progress milestone tracker */}
        <nav aria-label={t("progressLabel")} className="mb-space-xl w-full max-w-[760px]">
          <div className="relative flex items-center justify-between">
            <div className="absolute top-1/2 right-8 left-8 -z-0 h-1 -translate-y-1/2 rounded-full border-y border-outline-variant/60 bg-surface-container">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-[#ff8c7e] transition-all duration-500"
                style={{ width: progress }}
              />
            </div>

            {[1, 2].map((step) => (
              <div
                key={step}
                className="relative z-10 flex flex-col items-center bg-background px-2"
              >
                <div className="mb-1.5 flex h-9 w-9 items-center justify-center rounded-full bg-primary-container text-white shadow-sm">
                  <Icon name="check" className="text-[18px]" />
                </div>
                <span className="font-label-caps text-label-caps tracking-wider text-on-surface uppercase">
                  {t(`step${step}`)}
                </span>
                <span className="hidden font-body-sm text-body-sm text-secondary sm:inline">
                  {t(`step${step}Sub`)}
                </span>
              </div>
            ))}

            <div className="relative z-10 flex flex-col items-center bg-background px-2">
              <div
                className={cn(
                  "mb-1.5 flex h-9 w-9 items-center justify-center rounded-full border shadow-sm",
                  step3.tone === "danger"
                    ? "border-error/20 bg-danger-surface text-error"
                    : "border-primary/20 bg-[#2E2321] text-primary ring-2 ring-primary/30",
                )}
              >
                <Icon name={step3.icon} className="text-[18px]" />
              </div>
              <span
                className={cn(
                  "font-label-caps text-label-caps tracking-wider uppercase",
                  step3.tone === "danger" ? "font-bold text-error" : "font-bold text-primary",
                )}
              >
                {t("step3")}
              </span>
              <span className="hidden font-body-sm text-body-sm text-secondary sm:inline">
                {t("step3Sub")}
              </span>
            </div>
          </div>
        </nav>

        {/* Approved banner */}
        {state === "approved" ? (
          <section className="mb-space-lg w-full">
            <div className="relative flex flex-col items-start justify-between gap-space-md overflow-hidden rounded-xl border border-outline-variant bg-surface-low p-space-lg shadow-lg md:flex-row md:items-center">
              <div className="absolute top-0 bottom-0 left-0 w-2 bg-tertiary" />
              <div className="flex items-start gap-space-md pl-2">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-tertiary/20 bg-tertiary/15 text-tertiary">
                  <Icon name="verified" filled className="text-[28px]" />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-space-xs">
                    <span className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                      {t("approvedTitle")}
                    </span>
                    <span className="rounded bg-tertiary px-2 py-0.5 font-label-caps text-label-caps text-white uppercase">
                      {t("approvedBadge")}
                    </span>
                  </div>
                  <p className="mt-1 font-body-md text-body-md text-on-surface-strong">
                    {t("approvedBody")}
                  </p>
                </div>
              </div>
              <Link
                href="/discover"
                className="flex shrink-0 items-center gap-2 rounded-lg bg-tertiary px-6 py-3 font-label-lg text-label-lg text-white shadow-sm transition-all hover:bg-success-hover"
              >
                <span>{t("approvedCta")}</span>
                <Icon name="arrow_forward" className="text-[18px]" />
              </Link>
            </div>
          </section>
        ) : null}

        {/* Action required banner */}
        {state === "action" ? (
          <section className="mb-space-lg w-full">
            <div className="relative flex flex-col items-start justify-between gap-space-md overflow-hidden rounded-xl border border-outline-variant bg-surface-low p-space-lg shadow-lg md:flex-row md:items-center">
              <div className="absolute top-0 bottom-0 left-0 w-2 bg-error" />
              <div className="flex items-start gap-space-md pl-2">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-error/20 bg-error-container text-error">
                  <Icon name="contact_page" className="text-[28px]" />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-space-xs">
                    <span className="font-headline-sm text-headline-sm font-semibold text-error">
                      {t("actionTitle")}
                    </span>
                    <span className="rounded border border-error/30 bg-[#3c1d1a] px-2 py-0.5 font-label-caps text-label-caps text-on-error-container uppercase">
                      {t("actionBadge")}
                    </span>
                  </div>
                  <p className="mt-1 font-body-md text-body-md text-on-surface-strong">
                    {t("actionBody")}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="flex shrink-0 items-center gap-2 rounded-lg bg-primary-container px-6 py-3 font-label-lg text-label-lg text-white shadow-sm transition-all hover:bg-primary-hover"
              >
                <Icon name="add_a_photo" className="text-[18px]" />
                <span>{t("actionCta")}</span>
              </button>
            </div>
          </section>
        ) : null}

        {/* Main dossier card */}
        <article className="relative w-full overflow-hidden rounded-xl border border-outline-variant bg-surface-low p-space-lg shadow-xl md:p-space-xl">
          <div className="pointer-events-none absolute -top-24 -right-24 -z-0 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
          <div className="pointer-events-none absolute bottom-10 -left-20 -z-0 h-64 w-64 rounded-full bg-tertiary/10 blur-3xl" />

          <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center text-center">
            {/* Emblem */}
            <div className="relative mb-space-md flex items-center justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-outline-variant bg-surface-container shadow-inner">
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
                    stroke="#38a36f"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle
                    cx="24"
                    cy="24"
                    r="15"
                    stroke="#38a36f"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                  />
                </svg>
              </div>
              <div className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-surface-low shadow-sm">
                <span
                  className={cn(
                    "absolute h-3.5 w-3.5 animate-ping rounded-full",
                    step3.tone === "danger" ? "bg-error" : "bg-primary",
                  )}
                />
                <span
                  className={cn(
                    "relative h-3.5 w-3.5 rounded-full",
                    step3.tone === "danger" ? "bg-error" : "bg-primary",
                  )}
                />
              </div>
            </div>

            <h1 className="font-headline-xl text-headline-xl-mobile font-semibold tracking-tight text-on-surface md:text-headline-xl">
              {t("title")}
            </h1>
            <p className="mt-0.5 font-headline-md text-headline-md font-normal text-secondary italic">
              {t("titleAlt")}
            </p>

            <div
              className={cn(
                "mt-space-md mb-space-md inline-flex items-center gap-space-xs rounded-full border px-4 py-2 shadow-sm",
                step3.tone === "danger"
                  ? "border-error/25 bg-danger-surface"
                  : "border-primary/25 bg-[#2E2321]",
              )}
            >
              <span className="relative flex h-2.5 w-2.5">
                <span
                  className={cn(
                    "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
                    step3.tone === "danger" ? "bg-error" : "bg-primary",
                  )}
                />
                <span
                  className={cn(
                    "relative inline-flex h-2.5 w-2.5 rounded-full",
                    step3.tone === "danger" ? "bg-error" : "bg-primary",
                  )}
                />
              </span>
              <span
                className={cn(
                  "font-label-caps text-label-caps tracking-wider uppercase",
                  step3.tone === "danger"
                    ? "font-bold text-error"
                    : "font-bold text-admin-text-soft",
                )}
              >
                {t(statusKey)}
              </span>
            </div>

            <div className="mb-space-lg flex items-center gap-space-xs text-secondary">
              <Icon name="schedule" className="text-[17px]" />
              <span className="font-body-sm text-body-sm">
                {t("timeline")}{" "}
                <strong className="font-medium text-on-surface">{t("timelineStrong")}</strong>{" "}
                {t("timelineHint")}
              </span>
            </div>

            {/* Reassuring copy */}
            <div className="mb-space-lg w-full rounded-xl border border-outline-variant bg-surface-container p-space-md text-left shadow-sm">
              <div className="flex items-start gap-space-sm">
                <Icon
                  name="sentiment_satisfied"
                  className="mt-0.5 shrink-0 text-[22px] text-primary"
                />
                <div className="space-y-1">
                  <p className="font-body-md text-body-md text-on-surface-strong">
                    {t("reassurePrimary")}
                  </p>
                  <p className="pt-1 font-body-sm text-body-sm text-secondary">
                    {t("reassureSecondary")}
                  </p>
                </div>
              </div>
            </div>

            {/* Submitted dossier preview */}
            <div className="mb-space-xl w-full rounded-xl border border-outline-variant bg-surface-container p-space-md text-left shadow-sm">
              <div className="mb-space-sm flex items-center justify-between">
                <div className="flex items-center gap-space-xs">
                  <Icon name="badge" className="text-[18px] text-primary" />
                  <span className="font-label-caps text-label-caps font-bold tracking-wider text-on-surface uppercase">
                    {t("dossierTitle")}
                  </span>
                </div>
                <span className="rounded border border-outline-variant bg-surface-variant px-2 py-0.5 font-label-caps text-label-caps text-secondary uppercase">
                  {t("dossierBadge")}
                </span>
              </div>

              <div className="flex flex-col items-start gap-space-md sm:flex-row">
                <div className="relative h-28 w-24 shrink-0 overflow-hidden rounded-lg border border-outline-variant bg-surface shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt={t("portraitAlt")}
                    className="h-full w-full object-cover"
                    src={PORTRAIT}
                    loading="lazy"
                  />
                  <div className="absolute right-1 bottom-1 flex items-center gap-0.5 rounded border border-outline-variant bg-surface-low/90 px-1 py-0.5 backdrop-blur-sm">
                    <Icon name="lock" className="text-[12px] text-primary" />
                    <span className="font-label-caps text-[9px] tracking-tighter text-on-surface uppercase">
                      {t("private")}
                    </span>
                  </div>
                </div>

                <div className="flex min-w-0 flex-grow flex-col justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-space-xs">
                      <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                        {t("name")}
                      </h2>
                      <span className="font-label-md text-label-md text-secondary">
                        {t("location")}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="rounded border border-primary/20 bg-[#2E2321] px-2 py-0.5 font-label-caps text-label-caps font-bold text-admin-text-soft uppercase">
                        {t("langEs")}
                      </span>
                      <span className="rounded border border-outline-variant bg-surface-variant px-2 py-0.5 font-label-caps text-label-caps text-on-surface-strong uppercase shadow-sm">
                        {t("langEn")}
                      </span>
                    </div>
                    <div className="mt-space-sm flex flex-wrap gap-1.5">
                      {[1, 2, 3].map((n) => (
                        <span
                          key={n}
                          className="rounded border border-outline-variant bg-surface-variant px-2.5 py-1 font-label-md text-label-md text-on-surface-strong shadow-sm"
                        >
                          {t(`interest${n}`)}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-space-sm flex items-center justify-between rounded border border-outline-variant bg-surface-low px-3 py-1.5 text-secondary shadow-sm">
                    <div className="flex items-center gap-1.5">
                      <Icon name="lock_clock" className="text-[16px] text-primary" />
                      <span className="font-body-sm text-body-sm text-on-surface-strong">
                        {t("socialLabel")}
                      </span>
                    </div>
                    <span className="font-label-caps text-label-caps font-bold tracking-wider text-secondary uppercase">
                      {t("socialLocked")}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* What happens next */}
            <div className="mb-space-xl w-full text-left">
              <div className="mb-space-md flex items-baseline justify-between">
                <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                  {t("nextTitle")}
                </h3>
                <span className="font-label-caps text-label-caps tracking-wider text-secondary uppercase">
                  {t("nextMeta")}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-space-md md:grid-cols-3">
                {nextSteps.map((step) => (
                  <div
                    key={step.n}
                    className="flex flex-col justify-between rounded-xl border border-outline-variant bg-surface-container p-space-md shadow-sm transition-all hover:border-outline-hover"
                  >
                    <div className="flex flex-col">
                      <div
                        className={cn(
                          "mb-space-sm flex h-10 w-10 items-center justify-center rounded-lg border",
                          step.tone === "primary" && "border-primary/20 bg-[#2E2321] text-primary",
                          step.tone === "muted" &&
                            "border-outline-variant bg-surface-variant text-on-surface",
                          step.tone === "tertiary" &&
                            "border-tertiary/25 bg-tertiary/15 text-tertiary",
                        )}
                      >
                        <Icon name={step.icon} className="text-[20px]" />
                      </div>
                      <div
                        className={cn(
                          "mb-1 font-label-caps text-label-caps tracking-widest uppercase",
                          step.tone === "primary" && "text-primary",
                          step.tone === "muted" && "text-secondary",
                          step.tone === "tertiary" && "text-tertiary",
                        )}
                      >
                        {t(`next${step.n}Label`)}
                      </div>
                      <h4 className="mb-1 font-label-lg text-label-lg font-semibold text-on-surface">
                        {t(`next${step.n}Title`)}
                      </h4>
                      <p className="font-body-sm text-body-sm text-secondary">
                        {t(`next${step.n}Body`)}
                      </p>
                    </div>
                    <div
                      className={cn(
                        "mt-space-md flex items-center gap-1 pt-space-xs",
                        step.footer === "primary" && "text-primary",
                        step.footer === "muted" && "text-secondary",
                        step.footer === "tertiary" && "font-bold text-tertiary",
                      )}
                    >
                      <span className="font-label-caps text-label-caps uppercase">
                        {t(`next${step.n}Footer`)}
                      </span>
                      {step.footer === "primary" ? (
                        <Icon name="arrow_forward" className="text-[14px]" />
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action bar */}
            <div className="flex w-full flex-col items-center justify-center gap-space-md sm:flex-row">
              <Link
                href="/discover"
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-container px-8 py-3.5 font-label-lg text-label-lg text-white shadow-sm transition-all hover:bg-primary-hover sm:w-auto"
              >
                <span>{t("exploreStories")}</span>
                <Icon name="auto_stories" className="text-[18px]" />
              </Link>
              <Link
                href="/create-persona"
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-outline-variant bg-surface-container px-6 py-3.5 font-label-lg text-label-lg text-on-surface shadow-sm transition-all hover:bg-surface-variant sm:w-auto"
              >
                <Icon name="edit_note" className="text-[18px]" />
                <span>{t("editPersona")}</span>
              </Link>
            </div>

            <div className="mt-space-xl flex flex-col items-center justify-center gap-space-sm text-center text-secondary sm:flex-row">
              <div className="flex items-center gap-1">
                <Icon name="verified_user" className="text-[16px] text-tertiary" />
                <span className="font-body-sm text-body-sm font-medium">{t("trustDesk")}</span>
              </div>
              <span className="hidden sm:inline">•</span>
              <a href="#" className="font-body-sm text-body-sm text-primary hover:underline">
                {t("trustManifesto")}
              </a>
            </div>
          </div>
        </article>

        {/* Trust metrics ribbon */}
        <section className="mt-space-lg grid w-full max-w-[1040px] grid-cols-1 gap-space-md md:grid-cols-3">
          {metrics.map((metric) => (
            <div
              key={metric.n}
              className="flex items-center gap-space-md rounded-xl border border-outline-variant bg-surface-low p-space-md shadow-sm"
            >
              <div
                className={cn(
                  "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-outline-variant bg-surface-container",
                  metric.tone,
                )}
              >
                <Icon name={metric.icon} className="text-[24px]" />
              </div>
              <div className="flex flex-col">
                <span className="font-label-caps text-label-caps text-secondary uppercase">
                  {t(`metric${metric.n}Label`)}
                </span>
                <span className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                  {t(`metric${metric.n}Value`)}
                </span>
                <span className="font-body-sm text-body-sm text-secondary">
                  {t(`metric${metric.n}Body`)}
                </span>
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
