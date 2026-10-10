"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { PERSONAS, type ConnectState, type Persona } from "../data";

export function PersonaFeed() {
  const t = useTranslations("Discover");
  const [states, setStates] = useState<Record<string, ConnectState>>(() =>
    Object.fromEntries(PERSONAS.map((persona) => [persona.id, persona.state])),
  );

  function sendRequest(id: string) {
    setStates((prev) => ({ ...prev, [id]: "requested" }));
  }

  return (
    <section className="space-y-space-md lg:col-span-7">
      <div className="flex items-center justify-between px-space-xs">
        <span className="font-label-caps text-label-caps tracking-widest text-secondary uppercase">
          {t("feed.listTitle")}
        </span>
        <span className="font-label-md text-label-md text-text-muted">
          {t("feed.resultsCount")}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-space-md sm:grid-cols-2">
        {PERSONAS.map((persona) => (
          <PersonaCard
            key={persona.id}
            persona={persona}
            state={states[persona.id]}
            selected={persona.id === "sofia"}
            onConnect={() => sendRequest(persona.id)}
          />
        ))}

        <article className="flex flex-col justify-between rounded-xl border border-outline-variant bg-surface-container p-space-lg shadow-sm">
          <div className="space-y-space-xs">
            <Icon name="diversity_1" className="text-3xl text-primary-container" />
            <h3 className="font-headline-sm text-headline-sm text-on-surface">
              {t("feed.ctaTitle")}
            </h3>
            <p className="font-body-sm text-body-sm text-secondary">{t("feed.ctaBody")}</p>
          </div>
          <button
            type="button"
            className="mt-space-lg w-full rounded-xl border border-outline-variant bg-surface-low px-space-md py-2.5 font-label-lg text-label-lg font-medium text-on-surface-strong shadow-sm transition-colors hover:bg-surface-variant"
          >
            {t("feed.ctaButton")}
          </button>
        </article>
      </div>
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
        "flex flex-col justify-between overflow-hidden rounded-xl bg-surface-low shadow-sm",
        selected ? "border-2 border-primary-container" : "border border-outline-variant",
      )}
    >
      <div className="relative aspect-[4/3] w-full bg-surface-container">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt={persona.imageAlt}
          className="h-full w-full object-cover"
          src={persona.image}
          loading="lazy"
        />

        <div className="absolute top-2.5 left-2.5 flex items-center gap-1 rounded-full border border-outline-variant bg-surface-low/85 px-2 py-0.5 font-label-caps text-label-caps text-on-surface-strong shadow-sm backdrop-blur">
          <Icon name="verified" className="text-xs text-tertiary" />
          <span>{tCommon("verified")}</span>
        </div>

        {persona.badge === "previewed" ? (
          <div className="absolute right-2.5 bottom-2.5 rounded-md border border-outline-variant bg-background/85 px-2 py-0.5 font-label-caps text-label-caps text-on-surface-strong backdrop-blur">
            {t("feed.profilePreviewed")}
          </div>
        ) : null}

        {persona.badge === "directContact" ? (
          <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1 rounded-md border border-tertiary/30 bg-success-container/90 px-2 py-0.5 font-label-caps text-label-caps text-success-text shadow-sm backdrop-blur">
            <Icon name="lock_open" className="text-xs" />
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
            <Icon name="location_on" className="text-xs" />
            <span className="font-body-sm text-body-sm">{persona.location}</span>
          </div>

          <div className="mt-space-sm flex items-center gap-1.5">
            {persona.languages.map((language) => (
              <span
                key={language.code}
                className="rounded border border-outline-variant bg-surface-variant px-1.5 py-0.5 font-label-caps text-label-caps text-on-surface-variant"
              >
                {language.code} · {t(`fluency.${language.level}`)}
              </span>
            ))}
          </div>

          <div className="mt-2.5 flex flex-wrap gap-1">
            {persona.interests.map((interest) => (
              <span
                key={interest}
                className="rounded border border-outline-variant bg-surface-container px-2 py-0.5 font-label-md text-xs text-on-surface-strong"
              >
                {t(`interests.${interest}`)}
              </span>
            ))}
          </div>
        </div>

        {state === "connected" ? (
          <button
            type="button"
            className="mt-space-sm flex w-full items-center justify-center gap-space-xs rounded-xl border border-tertiary/40 bg-success-surface px-space-md py-2.5 font-label-lg text-label-lg font-semibold text-success-text"
          >
            <Icon name="check_circle" className="text-lg" />
            <span>✓ {tCommon("connected")}</span>
          </button>
        ) : state === "requested" ? (
          <button
            type="button"
            className="mt-space-sm flex w-full cursor-default items-center justify-center gap-space-xs rounded-xl border border-border-strong bg-secondary-container px-space-md py-2.5 font-label-lg text-label-lg text-on-surface-strong"
          >
            <Icon name="schedule" className="text-lg text-primary-container" />
            <span>{tCommon("requestSent")}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onConnect}
            className="mt-space-sm flex w-full items-center justify-center gap-space-xs rounded-xl bg-primary-container px-space-md py-2.5 font-label-lg text-label-lg font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover"
          >
            <Icon name="person_add" className="text-lg" />
            <span>{tCommon("connect")}</span>
          </button>
        )}
      </div>
    </article>
  );
}
