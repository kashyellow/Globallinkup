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
  canConnect,
}: {
  personas: Persona[];
  total: number;
  seed: string;
  countries: string[];
  canConnect: boolean;
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
            <h2 className="font-headline-md text-headline-md text-balance text-on-surface">
              {t("privacy.title")}
            </h2>
            <p className="font-body-sm text-body-sm text-pretty text-on-surface-variant">
              {t("privacy.body")}
            </p>
          </div>
        </div>

        {/* Order reads from position; the last two steps carry the privacy green. */}
        <ol className="grid grid-cols-1 gap-space-md sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step) => (
            <li
              key={step.label}
              className={cn(
                "border-l-2 pl-space-md",
                step.accent ? "border-success-border" : "border-outline",
              )}
            >
              <p
                className={cn(
                  "font-label-lg text-label-lg font-semibold",
                  step.accent ? "text-success-text" : "text-on-surface",
                )}
              >
                {t(`privacy.${step.label}Title`)}
              </p>
              <p className="mt-1 max-w-[34ch] font-body-sm text-body-sm text-pretty text-on-surface-variant">
                {t(`privacy.${step.label}Body`)}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );

  const trustStrip = (
    <div className="flex flex-wrap items-center gap-x-space-sm gap-y-1">
      <div className="flex items-center gap-space-xs">
        <Icon name="verified_user" className="text-base text-tertiary" />
        <span className="font-body-sm text-body-sm text-on-surface-variant">{t("trustSeal")}</span>
      </div>
      <Link
        href="/standards"
        className="inline-flex min-h-11 w-fit items-center gap-1 font-label-md text-label-md font-semibold text-primary transition-colors hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
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
          <h1 className="font-title text-title-mobile font-bold text-balance text-on-surface md:text-title">
            {t("title")}
          </h1>
          <p className="max-w-[58ch] font-body-sm text-body-sm text-pretty text-on-surface-variant md:font-body-md md:text-body-md">
            {t("intro")}
          </p>
        </div>

        <p className="flex shrink-0 items-center gap-space-xs font-label-lg text-label-lg text-on-surface-variant">
          <span aria-hidden className="h-2 w-2 rounded-full bg-tertiary" />
          {t("activePersonas", { count: total })}
        </p>
      </header>

      <DiscoverWorkspace
        initialPersonas={personas}
        initialSeed={seed}
        initialTotal={total}
        countryOptions={countries}
        canConnect={canConnect}
        privacy={privacy}
        trustStrip={trustStrip}
      />
    </div>
  );
}
