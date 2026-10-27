import type { CSSProperties } from "react";
import { getTranslations } from "next-intl/server";
import { Icon } from "@/components/ui/icon";
import { Link } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";
import type { Persona } from "../data";
import { DiscoverWorkspace } from "./discover-workspace";

const STEPS = [
  { label: "step1", accent: false },
  { label: "step2", accent: false },
  { label: "step3", accent: true },
  { label: "step4", accent: true },
] as const;

export async function DiscoverView({
  personas,
  total,
  seed,
  countries,
}: {
  personas: Persona[];
  total: number;
  seed: string;
  countries: string[];
}) {
  const t = await getTranslations("Discover");
  const tCommon = await getTranslations("Common");

  const privacy = (
    <section key="privacy" className="mt-block-mobile bezel-tray md:mt-block">
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
            <h2 className="font-headline-lg text-headline-lg-mobile text-balance text-on-surface md:text-headline-lg">
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
              <li key={index} className="relative">
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
  );

  const trustStrip = (
    <div className="flex flex-col justify-between gap-space-sm rounded-2xl border border-outline-variant bg-surface-low px-space-md py-space-sm sm:flex-row sm:items-center">
      <div className="flex items-center gap-space-xs">
        <Icon name="verified_user" className="text-base text-tertiary" />
        <span className="font-body-sm text-body-sm text-secondary">{t("trustSeal")}</span>
      </div>
      <Link
        href="/standards"
        className="inline-flex w-fit items-center gap-1 font-label-md text-label-md font-semibold text-primary transition-colors hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        {tCommon("guidelines")}
        <Icon name="arrow_forward" className="text-sm" />
      </Link>
    </div>
  );

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
            {t("activePersonas", { count: total })}
          </span>
        </div>
      </header>

      <DiscoverWorkspace
        initialPersonas={personas}
        initialSeed={seed}
        initialTotal={total}
        countryOptions={countries}
        privacy={privacy}
        trustStrip={trustStrip}
      />
    </div>
  );
}
