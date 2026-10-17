"use client";

import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { Pagination } from "@/components/ui/pagination";
import { cn } from "@/lib/utils";
import { PERSONAS, type ConnectState, type Persona } from "../data";
import { usePagination } from "@/features/shared/use-pagination";
import { ConnectDialog } from "@/features/shared/connect-dialog";

const EASE = "ease-[cubic-bezier(0.32,0.72,0,1)]";

/** Cards per page. Two rows of the 2-up grid, keeping the CTA tile last. */
const PAGE_SIZE = 4;

export function PersonaFeed() {
  const t = useTranslations("Discover");
  const [states, setStates] = useState<Record<string, ConnectState>>(() =>
    Object.fromEntries(PERSONAS.map((persona) => [persona.id, persona.state])),
  );
  const [target, setTarget] = useState<Persona | null>(null);
  const { page, totalPages, pageItems, setPage } = usePagination(PERSONAS, PAGE_SIZE);

  const closeDialog = useCallback(() => setTarget(null), []);

  const sendRequest = useCallback(() => {
    if (!target) return;
    setStates((prev) => ({ ...prev, [target.id]: "requested" }));
    setTarget(null);
  }, [target]);

  return (
    <section className="space-y-space-md lg:col-span-7">
      <div className="flex flex-col gap-1 px-space-xs sm:flex-row sm:items-center sm:justify-between sm:gap-space-sm">
        <h2 className="font-label-lg text-label-lg font-semibold text-on-surface">
          {t("feed.listTitle")}
        </h2>
        <span className="font-label-lg text-label-lg text-text-muted">
          {t("feed.resultsCount")}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-space-md sm:grid-cols-2">
        {pageItems.map((persona, index) => (
          <PersonaCard
            key={`${persona.id}-${page}-${index}`}
            persona={persona}
            state={states[persona.id]}
            selected={persona.id === "sofia"}
            onConnect={() => setTarget(persona)}
          />
        ))}
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      <ConnectDialog
        target={target}
        open={target !== null}
        onClose={closeDialog}
        onSend={sendRequest}
      />
    </section>
  );
}

function PersonaCard({
  persona,
  state,
  selected,
  onConnect,
}: {
  persona: Persona;
  state: ConnectState;
  selected: boolean;
  onConnect: () => void;
}) {
  const t = useTranslations("Discover");
  const tCommon = useTranslations("Common");

  return (
    <article
      className={cn(
        "group flex flex-col justify-between overflow-hidden rounded-[1.25rem] bg-surface-low transition-colors duration-300",
        selected ? "border border-primary" : "border border-outline-variant hover:border-outline",
      )}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-container">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt={persona.imageAlt}
          className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.03] motion-reduce:transform-none"
          src={persona.image}
          loading="lazy"
        />

        {/*
         * Solid tinted surfaces rather than `backdrop-blur`: these sit in normal
         * flow over a photo, and the design rules reserve blur for fixed/sticky
         * chrome.
         */}
        <div className="absolute top-3 left-3 flex items-center gap-1 rounded-full border border-outline-variant bg-surface-low/95 px-2.5 py-1 font-label-md text-label-md text-on-surface shadow-lift-sm">
          <Icon name="verified" className="text-sm text-tertiary" />
          <span>{tCommon("verified")}</span>
        </div>

        {persona.badge === "previewed" ? (
          <div className="absolute right-3 bottom-3 rounded-full border border-outline-variant bg-surface-low/95 px-2.5 py-1 font-label-md text-label-md text-on-surface shadow-lift-sm">
            {t("feed.profilePreviewed")}
          </div>
        ) : null}

        {persona.badge === "directContact" ? (
          <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full border border-success-border bg-success-surface px-2.5 py-1 font-label-md text-label-md text-success-text shadow-lift-sm">
            <Icon name="lock_open" className="text-sm" />
            <span>{t("feed.directContactVisible")}</span>
          </div>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col justify-between gap-space-sm p-space-md">
        <div>
          <h3 className="font-headline-sm text-headline-sm text-on-surface">
            {persona.name}, {persona.age}
          </h3>
          <div className="mt-0.5 flex items-center gap-1 text-secondary">
            <Icon name="location_on" className="text-sm" />
            <span className="font-body-sm text-body-sm">{persona.location}</span>
          </div>

          <div className="mt-space-sm flex flex-wrap items-center gap-1.5">
            {persona.languages.map((language) => (
              <span
                key={language.code}
                className="rounded-full border border-outline-variant bg-surface-variant px-2 py-0.5 font-label-md text-label-md text-on-surface-variant"
              >
                {language.code} · {t(`fluency.${language.level}`)}
              </span>
            ))}
          </div>

          <div className="mt-2.5 flex flex-wrap gap-1">
            {persona.interests.map((interest) => (
              <span
                key={interest}
                className="rounded-full border border-outline-variant bg-surface-container px-2 py-0.5 font-label-md text-label-md text-on-surface-strong"
              >
                {t(`interests.${interest}`)}
              </span>
            ))}
          </div>
        </div>

        {state === "connected" ? (
          <div className="mt-space-sm flex w-full items-center justify-center gap-space-xs rounded-full border border-success-border bg-success-surface px-space-md py-2.5 font-label-lg text-label-lg font-semibold text-success-text">
            <Icon name="check_circle" className="text-lg" />
            <span>{tCommon("connected")}</span>
          </div>
        ) : state === "requested" ? (
          <div
            aria-live="polite"
            className="mt-space-sm flex w-full items-center justify-center gap-space-xs rounded-full border border-outline-variant bg-surface-container px-space-md py-2.5 font-label-lg text-label-lg text-on-surface-strong"
          >
            <Icon name="schedule" className="text-lg text-primary" />
            <span>{tCommon("requestSent")}</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={onConnect}
            className={cn(
              "mt-space-sm flex w-full items-center justify-center gap-space-xs rounded-full bg-primary px-space-md py-2.5 font-label-lg text-label-lg font-semibold text-on-primary transition-colors duration-300 hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px",
              EASE,
            )}
          >
            <Icon name="person_add" className="text-lg" />
            <span>{tCommon("connect")}</span>
          </button>
        )}
      </div>
    </article>
  );
}
