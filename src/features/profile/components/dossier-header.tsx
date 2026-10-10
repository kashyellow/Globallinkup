"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import { Link, useRouter } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";
import { PROFILE_IDENTITY, PROFILE_METRICS, TRUST_SCORE } from "../data";

/** Radial consent-trust gauge (0–100) drawn with a single SVG stroke. */
function TrustGauge({ value }: { value: number }) {
  const radius = 15.9155;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="relative flex h-12 w-12 shrink-0 items-center justify-center">
      <svg className="h-12 w-12 -rotate-90" viewBox="0 0 36 36" aria-hidden>
        <circle
          cx="18"
          cy="18"
          r={radius}
          fill="none"
          strokeWidth="3"
          className="text-surface-container"
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
          className="text-tertiary"
          strokeDasharray={`${(value / 100) * circumference} ${circumference}`}
        />
      </svg>
      <span className="absolute font-label-caps text-label-caps font-bold text-on-surface">
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
    <div className="bg-surface-container-low relative w-full overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-background via-surface-container-high/40 to-background opacity-70" />

      <div className="relative mx-auto max-w-[1240px] px-margin-mobile pt-space-xl pb-space-lg md:px-margin">
        {/* Breadcrumb / meta bar */}
        <div className="mb-space-lg flex flex-wrap items-center justify-between gap-space-sm">
          <div className="flex flex-wrap items-center gap-space-sm">
            <span className="font-label-caps text-label-caps tracking-wider text-text-muted uppercase">
              {t("meta.dossier")}
            </span>
            <span className="text-body-sm text-text-muted">/</span>
            <span className="font-label-caps text-label-caps tracking-wider text-primary uppercase">
              {PROFILE_IDENTITY.dossierId}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-container-highest px-2 py-0.5 font-label-caps text-[10px] font-bold tracking-wider text-tertiary uppercase">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-tertiary" />
              {t("meta.verifiedActive")}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={share}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-surface-container px-3 py-1.5 font-label-md text-label-md text-on-surface transition-colors hover:bg-surface-container-high"
            >
              <Icon
                name={copied ? "check" : "share"}
                className={cn("text-[16px]", copied ? "text-tertiary" : "text-text-muted")}
              />
              <span>{copied ? t("actions.shared") : t("actions.share")}</span>
            </button>
            <Link
              href="/create-persona"
              className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-primary px-4 py-1.5 font-label-md text-label-md text-on-primary shadow-sm transition-all hover:bg-primary-container"
            >
              <Icon name="edit_square" className="text-[16px]" />
              <span>{t("actions.edit")}</span>
            </Link>
            <button
              type="button"
              onClick={logout}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-outline-variant bg-surface-container px-3 py-1.5 font-label-md text-label-md text-secondary transition-colors hover:border-danger/60 hover:text-danger"
            >
              <Icon name="logout" className="text-[16px]" />
              <span>{t("actions.logout")}</span>
            </button>
          </div>
        </div>

        {/* Identity grid */}
        <div className="grid grid-cols-1 items-end gap-space-lg lg:grid-cols-12">
          <div className="flex flex-col items-start gap-space-md sm:flex-row sm:items-end lg:col-span-8">
            <div className="group relative shrink-0">
              <div className="h-28 w-28 overflow-hidden rounded-2xl bg-surface-container shadow-xl ring-2 ring-primary-container/20 sm:h-36 sm:w-36">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt={PROFILE_IDENTITY.avatarAlt}
                  src={PROFILE_IDENTITY.avatar}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="absolute -right-2 -bottom-2 flex items-center gap-1 rounded-full bg-tertiary px-2 py-0.5 font-label-caps text-[10px] font-bold tracking-wider text-on-tertiary uppercase shadow-md">
                <Icon name="verified" filled className="text-[13px]" />
                <span>{t("identity.mutual")}</span>
              </div>
            </div>

            <div className="min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="font-headline-lg text-headline-lg-mobile font-semibold tracking-tight text-on-surface md:text-headline-lg">
                  {PROFILE_IDENTITY.name}
                </h1>
                <span className="font-body-md text-body-md text-text-muted">
                  {PROFILE_IDENTITY.age}
                </span>
                <div className="inline-flex items-center gap-1 rounded-full bg-secondary-container/30 px-2.5 py-0.5 font-label-md text-label-md text-on-surface">
                  <Icon name="location_on" className="text-[15px] text-primary" />
                  <span>{PROFILE_IDENTITY.location}</span>
                </div>
              </div>

              <p className="font-body-md text-body-md text-text-muted">{PROFILE_IDENTITY.role}</p>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="rounded-full bg-surface-container-highest px-2.5 py-0.5 font-label-caps text-label-caps text-text-muted">
                  {PROFILE_IDENTITY.languages}
                </span>
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 font-label-caps text-label-caps text-primary-container">
                  {PROFILE_IDENTITY.tier}
                </span>
                <span className="flex items-center gap-1 rounded-full bg-surface-container px-2.5 py-0.5 font-label-caps text-label-caps text-tertiary">
                  <span className="h-1.5 w-1.5 rounded-full bg-tertiary" />
                  {t("identity.mutualConsent")}
                </span>
              </div>
            </div>
          </div>

          {/* Trust metric card */}
          <div className="flex justify-start lg:col-span-4 lg:justify-end">
            <div className="flex w-full items-center gap-space-md rounded-2xl bg-surface-container-high p-space-md shadow-sm sm:w-auto">
              <TrustGauge value={TRUST_SCORE} />
              <div className="min-w-0">
                <p className="font-label-caps text-label-caps tracking-wider text-tertiary uppercase">
                  {t("trust.label")}
                </p>
                <p className="font-body-sm text-body-sm text-text-muted">{t("trust.body")}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick metrics strip */}
        <div className="mt-space-lg grid grid-cols-2 gap-space-sm pt-space-md sm:grid-cols-4">
          {PROFILE_METRICS.map((metric) => (
            <div
              key={metric.id}
              className="rounded-xl bg-surface-container/60 p-space-sm transition-colors hover:bg-surface-container"
            >
              <span
                className={cn(
                  "block font-headline-md text-headline-md font-semibold",
                  metric.accent ? "text-tertiary" : "text-on-surface",
                )}
              >
                {metric.value}
              </span>
              <span className="font-label-caps text-label-caps tracking-wider text-text-muted uppercase">
                {t(`metrics.${metric.id}`)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
