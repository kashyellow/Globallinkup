import type { CSSProperties } from "react";
import { getTranslations } from "next-intl/server";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { PersonaDossier } from "./persona-dossier";
import { PersonaFeed } from "./persona-feed";
import { ReceivedRequests } from "./received-requests";
import { SearchRibbon } from "./search-ribbon";

const STEPS = [
  { label: "step1", accent: false },
  { label: "step2", accent: false },
  { label: "step3", accent: true },
  { label: "step4", accent: true },
] as const;

export async function DiscoverView() {
  const t = await getTranslations("Discover");
  const tCommon = await getTranslations("Common");

  return (
    <div className="mx-auto w-full max-w-[1240px] px-margin-mobile pt-block-mobile pb-page-mobile md:px-margin md:pt-block md:pb-page">
      {/* Editorial header */}
      <header className="flex flex-col justify-between gap-space-md md:flex-row md:items-end">
        <div className="max-w-2xl space-y-space-sm">
          <p className="font-label-caps text-label-caps tracking-[0.16em] text-primary uppercase">
            {t("eyebrow")}
          </p>
          <h1 className="font-display-md text-display-md-mobile font-bold text-balance text-on-surface md:text-display-md">
            {t("title")}
          </h1>
          <p className="max-w-[58ch] font-body-lg text-body-lg text-pretty text-on-surface-variant">
            {t("intro")}
          </p>
        </div>

        <div className="flex w-fit shrink-0 items-center gap-space-sm rounded-full border border-outline-variant bg-surface-low px-space-md py-2 shadow-lift-sm">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-tertiary opacity-60 motion-reduce:hidden" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-tertiary" />
          </span>
          <span className="font-label-lg text-label-lg font-semibold text-on-surface">
            {t("activePersonas")}
          </span>
        </div>
      </header>

      <SearchRibbon />

      {/*
       * Privacy connect model. Presented as a connected rail with numeric
       * markers rather than a 4-equal-card row: the steps are genuinely
       * sequential, so a rail communicates order that equal cards cannot.
       */}
      <section className="mt-block-mobile bezel-tray md:mt-block">
        <div
          className="flex flex-col gap-space-xl bezel-core p-space-lg md:p-space-xl"
          style={{ "--bezel-core-bg": "var(--color-surface-container)" } as CSSProperties}
        >
          <div className="flex flex-col gap-space-lg lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-lg space-y-space-xs">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-success-border bg-success-surface px-2.5 py-0.5 font-label-caps text-label-caps text-success-text">
                <Icon name="shield" className="text-sm" />
                {t("privacy.badge")}
              </span>
              <h2 className="font-headline-lg text-headline-lg text-balance text-on-surface">
                {t("privacy.title")}
              </h2>
              <p className="font-body-sm text-body-sm text-pretty text-on-surface-variant">
                {t("privacy.body")}
              </p>
            </div>
          </div>

          {/* The rail: one hairline behind, four stops on top. */}
          <div className="relative">
            <div
              aria-hidden
              className="absolute top-5 right-0 left-0 hidden h-px bg-gradient-to-r from-outline-variant via-outline to-outline-variant md:block"
            />
            <ol className="grid grid-cols-1 gap-space-lg md:grid-cols-2 md:gap-y-space-xl lg:grid-cols-4">
              {STEPS.map((step, index) => (
                <li key={step.label} className="relative">
                  <div className="flex items-center gap-space-sm">
                    <span
                      className={cn(
                        "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border font-label-caps text-label-caps font-bold tabular-nums",
                        step.accent
                          ? "border-success-border bg-success-surface text-success-text"
                          : "border-outline-variant bg-surface-low text-primary",
                      )}
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="font-label-lg text-label-lg font-semibold text-on-surface">
                      {t(`privacy.${step.label}Title`)}
                    </span>
                  </div>
                  <p className="mt-space-sm max-w-[34ch] font-body-sm text-body-sm text-pretty text-secondary">
                    {t(`privacy.${step.label}Body`)}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* Workspace */}
      <div className="mt-page-mobile grid grid-cols-1 items-start gap-space-lg md:mt-page lg:grid-cols-12">
        <PersonaFeed />

        <aside className="space-y-space-lg lg:sticky lg:top-24 lg:col-span-5">
          <PersonaDossier />
          <ReceivedRequests />

          <div className="bezel-tray">
            <div
              className="flex items-center justify-between gap-space-sm bezel-core px-space-md py-space-sm"
              style={{ "--bezel-core-bg": "var(--color-surface-low)" } as CSSProperties}
            >
              <div className="flex items-center gap-space-xs">
                <Icon name="verified_user" className="text-base text-tertiary" />
                <span className="font-body-sm text-body-sm text-secondary">{t("trustSeal")}</span>
              </div>
              {/*
               * No guidelines page yet: rendered as text rather than an `href="#"`
               * anchor so it is not a focusable control that leads nowhere.
               */}
              <span className="font-label-lg text-label-lg font-semibold text-text-muted">
                {tCommon("guidelines")}
              </span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
