import { getTranslations } from "next-intl/server";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { PersonaDossier } from "./persona-dossier";
import { PersonaFeed } from "./persona-feed";
import { ReceivedRequests } from "./received-requests";
import { SearchRibbon } from "./search-ribbon";

const STEPS = [
  { label: "step1", icon: "person_search", tone: "primary" },
  { label: "step2", icon: "forward_to_inbox", tone: "primary" },
  { label: "step3", icon: "how_to_reg", tone: "tertiary" },
  { label: "step4", icon: "lock_open", tone: "tertiary" },
] as const;

export async function DiscoverView() {
  const t = await getTranslations("Discover");
  const tCommon = await getTranslations("Common");

  return (
    <div className="mx-auto w-full max-w-[1240px] px-margin-mobile pb-space-xl md:px-margin">
      {/* Editorial header */}
      <header className="flex flex-col justify-between gap-space-md pt-space-lg pb-space-md md:flex-row md:items-end">
        <div className="max-w-2xl space-y-space-xs">
          <div className="flex items-center gap-space-xs text-primary-container">
            <Icon name="public" className="text-sm" />
            <span className="font-label-caps text-label-caps tracking-wider uppercase">
              {t("eyebrow")}
            </span>
          </div>
          <h1 className="font-headline-xl text-headline-xl-mobile tracking-tight text-on-surface md:text-headline-xl">
            {t("title")}
          </h1>
          <p className="font-body-lg text-body-lg text-secondary">{t("intro")}</p>
        </div>

        <div className="flex items-center gap-space-sm rounded-xl border border-outline-variant bg-surface-low px-space-md py-space-xs shadow-sm">
          <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-tertiary" />
          <span className="font-label-md text-label-md font-medium text-on-surface-strong">
            {t("activePersonas")}
          </span>
        </div>
      </header>

      <SearchRibbon />

      {/* Privacy connect model banner */}
      <section className="mb-space-xl rounded-xl border border-outline-variant bg-surface-low p-space-lg shadow-sm">
        <div className="flex flex-col items-start justify-between gap-space-lg xl:flex-row xl:items-center">
          <div className="max-w-md space-y-space-xs">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-border-strong bg-secondary-container px-2.5 py-0.5 font-label-caps text-label-caps text-primary-container">
              <Icon name="shield" className="text-xs" />
              <span>{t("privacy.badge")}</span>
            </div>
            <h2 className="font-headline-sm text-headline-sm text-on-surface">
              {t("privacy.title")}
            </h2>
            <p className="font-body-sm text-body-sm text-secondary">{t("privacy.body")}</p>
          </div>

          <div className="grid w-full grid-cols-2 gap-space-sm md:grid-cols-4 xl:max-w-3xl">
            {STEPS.map((step, index) => (
              <div
                key={step.label}
                className={cn(
                  "flex flex-col justify-between rounded-xl border p-space-sm",
                  index === STEPS.length - 1
                    ? "border-border-strong bg-[#221f1c]"
                    : "border-outline-variant bg-surface-container",
                )}
              >
                <span
                  className={cn(
                    "mb-1 font-label-caps text-label-caps",
                    index === STEPS.length - 1 ? "text-primary-container" : "text-text-muted",
                  )}
                >
                  {t(`privacy.${step.label}Label`)}
                </span>
                <div className="my-space-xs flex items-center gap-space-xs">
                  <Icon
                    name={step.icon}
                    className={cn(
                      "text-lg",
                      step.tone === "tertiary" ? "text-tertiary" : "text-primary-container",
                    )}
                  />
                  <p className="font-label-md text-label-md font-semibold text-on-surface-strong">
                    {t(`privacy.${step.label}Title`)}
                  </p>
                </div>
                <p className="font-body-sm text-xs text-secondary">
                  {t(`privacy.${step.label}Body`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workspace */}
      <div className="grid grid-cols-1 items-start gap-space-lg lg:grid-cols-12">
        <PersonaFeed />

        <aside className="space-y-space-lg lg:sticky lg:top-24 lg:col-span-5">
          <PersonaDossier />
          <ReceivedRequests />

          <div className="flex items-center justify-between rounded-xl border border-outline-variant bg-surface-low p-space-md text-secondary">
            <div className="flex items-center gap-space-xs">
              <Icon name="verified_user" className="text-base text-tertiary" />
              <span className="font-body-sm text-body-sm">{t("trustSeal")}</span>
            </div>
            <a
              href="#"
              className="inline-flex min-h-10 items-center font-label-caps text-label-caps text-primary-container hover:underline"
            >
              {tCommon("guidelines")}
            </a>
          </div>
        </aside>
      </div>
    </div>
  );
}
