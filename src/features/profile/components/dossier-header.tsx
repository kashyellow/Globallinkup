"use client";

import type { CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import { Link, useRouter } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";
import { PROFILE_IDENTITY, PROFILE_METRICS, TRUST_SCORE } from "../data";

/** Shared button shape for the dossier action row. */
const ACTION_BASE =
  "inline-flex min-h-10 items-center gap-1.5 rounded-full px-4 py-2 font-label-md text-label-md transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px";

/** Radial consent-trust gauge (0–100) drawn with a single SVG stroke. */
function TrustGauge({ value }: { value: number }) {
  const radius = 15.9155;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="relative flex h-14 w-14 shrink-0 items-center justify-center">
      <svg className="h-14 w-14 -rotate-90" viewBox="0 0 36 36" aria-hidden>
        <circle
          cx="18"
          cy="18"
          r={radius}
          fill="none"
          strokeWidth="3"
          className="text-surface-container-highest"
          stroke="currentColor"
        />
        <circle
          cx="18"
          cy="18"
          r={radius}
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
          stroke="currentColor"
          className="text-success-text"
          strokeDasharray={`${(value / 100) * circumference} ${circumference}`}
        />
      </svg>
      <span className="absolute font-label-lg text-label-lg font-bold text-on-surface tabular-nums">
        {value}
      </span>
    </div>
  );
}

export function DossierHeader() {
  const t = useTranslations("Profile");
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  async function share() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard access can be blocked (insecure context / denied permission).
    }
  }

  function logout() {
    // No auth backend yet — end the demo session and return to the landing page.
    // `replace` so the back button cannot return into the signed-in area.
    router.replace("/");
  }

  return (
    <section className="relative w-full overflow-hidden border-b border-outline-variant">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-surface-container-high/50 via-background to-background" />

      <div className="relative mx-auto max-w-[1240px] px-margin-mobile pt-block-mobile pb-page-mobile md:px-margin md:pt-block md:pb-page">
        {/* Breadcrumb / action bar */}
        <div className="flex flex-wrap items-center justify-between gap-space-sm">
          <div className="flex flex-wrap items-center gap-space-sm">
            <span className="font-label-lg text-label-lg font-semibold text-text-muted">
              {t("meta.dossier")}
            </span>
            <span aria-hidden className="text-body-sm text-text-muted">
              /
            </span>
            <span className="font-label-lg text-label-lg font-semibold text-primary tabular-nums">
              {PROFILE_IDENTITY.dossierId}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-success-border bg-success-surface px-2.5 py-1 font-label-md text-label-md font-semibold text-success-text">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success-text" />
              {t("meta.verifiedActive")}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={share}
              className={cn(
                ACTION_BASE,
                "border border-outline-variant bg-surface-container text-on-surface hover:border-outline-hover hover:bg-surface-variant",
              )}
            >
              <Icon
                name={copied ? "check" : "share"}
                className={cn("text-base", copied ? "text-success-text" : "text-text-muted")}
              />
              <span>{copied ? t("actions.shared") : t("actions.share")}</span>
            </button>
            <Link
              href="/create-persona"
              className={cn(ACTION_BASE, "bg-primary text-on-primary hover:bg-primary-hover")}
            >
              <Icon name="edit_square" className="text-base" />
              <span>{t("actions.edit")}</span>
            </Link>
            <button
              type="button"
              onClick={logout}
              className={cn(
                ACTION_BASE,
                "border border-outline-variant bg-surface-container text-secondary hover:border-danger/60 hover:text-danger",
              )}
            >
              <Icon name="logout" className="text-base" />
              <span>{t("actions.logout")}</span>
            </button>
          </div>
        </div>

        {/* Identity block */}
        <div className="mt-space-lg grid grid-cols-1 items-end gap-space-lg lg:grid-cols-12">
          <div className="flex flex-col items-start gap-space-md sm:flex-row sm:items-end lg:col-span-8">
            <div className="group relative shrink-0">
              <div className="h-28 w-28 overflow-hidden rounded-2xl bg-surface-container shadow-lift-md ring-2 ring-primary-container/20 sm:h-36 sm:w-36">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt={PROFILE_IDENTITY.avatarAlt}
                  src={PROFILE_IDENTITY.avatar}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transform-none"
                />
              </div>
              <div className="absolute -right-2 -bottom-2 flex items-center gap-1 rounded-full bg-success-strong px-2.5 py-1 font-label-md text-label-md font-bold text-on-primary">
                <Icon name="verified" filled className="text-sm" />
                <span>{t("identity.mutual")}</span>
              </div>
            </div>

            <div className="min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="font-display-md text-display-md-mobile font-bold tracking-tight text-on-surface md:text-display-md">
                  {PROFILE_IDENTITY.name}
                </h1>
                <span className="font-body-md text-body-md text-text-muted">
                  {PROFILE_IDENTITY.age}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-surface-container px-3 py-1 font-label-md text-label-md text-on-surface">
                  <Icon name="location_on" className="text-base text-primary" />
                  <span>{PROFILE_IDENTITY.location}</span>
                </span>
              </div>

              <p className="font-body-lg text-body-lg text-text-muted">{PROFILE_IDENTITY.role}</p>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="rounded-full bg-surface-container-highest px-3 py-1 font-label-md text-label-md text-text-muted">
                  {PROFILE_IDENTITY.languages}
                </span>
                <span className="rounded-full bg-primary/10 px-3 py-1 font-label-md text-label-md text-primary">
                  {PROFILE_IDENTITY.tier}
                </span>
                <span className="flex items-center gap-1.5 rounded-full border border-success-border bg-success-surface px-3 py-1 font-label-md text-label-md text-success-text">
                  <span className="h-1.5 w-1.5 rounded-full bg-success-text" />
                  {t("identity.mutualConsent")}
                </span>
              </div>
            </div>
          </div>

          {/* Trust metric card */}
          <div className="flex justify-start lg:col-span-4 lg:justify-end">
            <div
              className="flex w-full items-center gap-space-md rounded-2xl border border-outline-variant bg-surface-container p-space-md sm:w-auto"
              style={{ "--bezel-core-bg": "var(--color-surface-container)" } as CSSProperties}
            >
              <TrustGauge value={TRUST_SCORE} />
              <div className="min-w-0">
                <p className="font-label-lg text-label-lg font-semibold text-success-text">
                  {t("trust.label")}
                </p>
                <p className="max-w-[28ch] font-body-sm text-body-sm text-text-muted">
                  {t("trust.body")}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Metrics strip — hairline separated, not four floating cards */}
        <dl className="mt-space-lg grid grid-cols-2 gap-y-space-md border-t border-outline-variant pt-space-md sm:grid-cols-4 sm:gap-y-0">
          {PROFILE_METRICS.map((metric, index) => (
            <div
              key={metric.id}
              className={cn(
                "px-space-sm sm:px-space-md",
                index > 0 && "sm:border-l sm:border-outline-variant",
              )}
            >
              <dt className="font-label-md text-label-md text-text-muted">
                {t(`metrics.${metric.id}`)}
              </dt>
              <dd
                className={cn(
                  "mt-0.5 font-headline-md text-headline-md font-semibold tabular-nums",
                  metric.accent ? "text-success-text" : "text-on-surface",
                )}
              >
                {metric.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
