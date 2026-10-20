"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { DefaultAvatar } from "@/components/ui/default-avatar";
import { Icon } from "@/components/ui/icon";
import { Pagination } from "@/components/ui/pagination";
import {
  acceptConnectionAction,
  declineConnectionAction,
  sendConnectRequestAction,
} from "@/features/connect/actions";
import { ConnectDialog } from "@/features/shared/connect-dialog";
import { usePagination } from "@/features/shared/use-pagination";
import { Link, useRouter } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";
import type { ConnectState, Persona } from "../data";

const EASE = "ease-[cubic-bezier(0.32,0.72,0,1)]";

/** Cards per page. Two rows of the 2-up grid, keeping the CTA tile last. */
const PAGE_SIZE = 4;

export function PersonaFeed({ personas }: { personas: Persona[] }) {
  const t = useTranslations("Discover");
  const router = useRouter();
  const [states, setStates] = useState<Record<string, ConnectState>>(() =>
    Object.fromEntries(personas.map((persona) => [persona.id, persona.state])),
  );
  const [target, setTarget] = useState<Persona | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { page, totalPages, pageItems, setPage } = usePagination(personas, PAGE_SIZE);

  function closeDialog() {
    setTarget(null);
  }

  async function sendRequest(note: string) {
    if (!target) return;
    const recipientId = target.id;
    setTarget(null);
    setError(null);

    const result = await sendConnectRequestAction({ recipientId, note });
    if (result.ok) {
      setStates((previous) => ({ ...previous, [recipientId]: "requested" }));
    } else {
      setError(t("sendError"));
    }
  }

  async function decide(personaId: string, connectionId: string | undefined, accept: boolean) {
    if (!connectionId) return;
    setError(null);
    const result = accept
      ? await acceptConnectionAction({ id: connectionId })
      : await declineConnectionAction({ id: connectionId });
    if (!result.ok) {
      setError(t("sendError"));
      return;
    }
    setStates((previous) => ({ ...previous, [personaId]: accept ? "connected" : "declined" }));
    router.refresh();
  }

  if (personas.length === 0) {
    return (
      <section className="space-y-space-md lg:col-span-7">
        <div className="flex flex-col items-center gap-2 rounded-[1.25rem] border border-outline-variant bg-surface-low py-space-xl text-center">
          <Icon name="search_off" className="text-3xl text-secondary" />
          <p className="font-label-lg text-label-lg font-semibold text-on-surface">
            {t("searchEmpty")}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-space-md lg:col-span-7">
      <div className="flex flex-col gap-1 px-space-xs sm:flex-row sm:items-center sm:justify-between sm:gap-space-sm">
        <h2 className="font-label-lg text-label-lg font-semibold text-on-surface">
          {t("feed.listTitle")}
        </h2>
        <span className="font-label-lg text-label-lg text-text-muted">{t("activePersonas")}</span>
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-2xl border border-danger-border bg-danger-surface px-space-md py-2 font-body-sm text-body-sm text-danger-text"
        >
          {error}
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-space-md sm:grid-cols-2">
        {pageItems.map((persona, index) => (
          <PersonaCard
            key={`${persona.id}-${page}-${index}`}
            persona={persona}
            state={states[persona.id] ?? persona.state}
            onConnect={() => setTarget(persona)}
            onAccept={() => void decide(persona.id, persona.connectionId, true)}
            onDecline={() => void decide(persona.id, persona.connectionId, false)}
          />
        ))}
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      <ConnectDialog
        target={target}
        open={target !== null}
        onClose={closeDialog}
        onSend={(note) => void sendRequest(note)}
      />
    </section>
  );
}

function PersonaCard({
  persona,
  state,
  onConnect,
  onAccept,
  onDecline,
}: {
  persona: Persona;
  state: ConnectState;
  onConnect: () => void;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const t = useTranslations("Discover");
  const tCommon = useTranslations("Common");

  return (
    <article className="group flex flex-col justify-between overflow-hidden rounded-[1.25rem] border border-outline-variant bg-surface-low transition-colors duration-300 hover:border-outline">
      <Link href={`/persona/${persona.id}`} className="block">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-container">
          {persona.image ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt={persona.imageAlt}
                className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.03] motion-reduce:transform-none"
                src={persona.image}
                loading="lazy"
              />
            </>
          ) : (
            <DefaultAvatar className="h-full w-full" />
          )}

          <div className="absolute top-3 left-3 flex items-center gap-1 rounded-full border border-outline-variant bg-surface-low/95 px-2.5 py-1 font-label-md text-label-md text-on-surface shadow-lift-sm">
            <Icon name="verified" className="text-sm text-tertiary" />
            <span>{tCommon("verified")}</span>
          </div>

          {persona.badge === "directContact" ? (
            <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full border border-success-border bg-success-surface px-2.5 py-1 font-label-md text-label-md text-success-text shadow-lift-sm">
              <Icon name="lock_open" className="text-sm" />
              <span>{t("feed.directContactVisible")}</span>
            </div>
          ) : null}
        </div>
      </Link>

      <div className="flex flex-1 flex-col justify-between gap-space-sm p-space-md">
        <div>
          <Link href={`/persona/${persona.id}`} className="block">
            <h3 className="font-headline-sm text-headline-sm text-on-surface">
              {persona.age > 0 ? `${persona.name}, ${persona.age}` : persona.name}
            </h3>
            <div className="mt-0.5 flex items-center gap-1 text-secondary">
              <Icon name="location_on" className="text-sm" />
              <span className="font-body-sm text-body-sm">{persona.location}</span>
            </div>
          </Link>

          <div className="mt-space-sm flex flex-wrap items-center gap-1.5">
            {persona.languages.map((language) => (
              <span
                key={language.code}
                className="rounded-full border border-outline-variant bg-surface-variant px-2 py-0.5 font-label-md text-label-md text-on-surface-variant"
              >
                {language.code} ·{" "}
                {t.has(`fluency.${language.level}`)
                  ? t(`fluency.${language.level}`)
                  : language.level}
              </span>
            ))}
          </div>

          <div className="mt-2.5 flex flex-wrap gap-1">
            {persona.interests.map((interest) => (
              <span
                key={interest}
                className="rounded-full border border-outline-variant bg-surface-container px-2 py-0.5 font-label-md text-label-md text-on-surface-strong"
              >
                {t.has(`interests.${interest}`) ? t(`interests.${interest}`) : interest}
              </span>
            ))}
          </div>
        </div>

        {state === "connected" ? (
          <div className="mt-space-sm flex w-full items-center justify-center gap-space-xs rounded-full border border-success-border bg-success-surface px-space-md py-2.5 font-label-lg text-label-lg font-semibold text-success-text">
            <Icon name="check_circle" className="text-lg" />
            <span>{tCommon("connected")}</span>
          </div>
        ) : state === "received" ? (
          <div className="mt-space-sm flex gap-2">
            <button
              type="button"
              onClick={onAccept}
              className="flex flex-1 items-center justify-center gap-space-xs rounded-full bg-primary px-space-md py-2.5 font-label-lg text-label-lg font-semibold text-on-primary transition-colors duration-300 hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px"
            >
              <Icon name="check" className="text-lg" />
              {tCommon("accept")}
            </button>
            <button
              type="button"
              onClick={onDecline}
              className="flex flex-1 items-center justify-center rounded-full border border-outline-variant bg-surface-container px-space-md py-2.5 font-label-lg text-label-lg text-on-surface transition-colors duration-300 hover:border-outline-hover hover:bg-surface-variant focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px"
            >
              {tCommon("decline")}
            </button>
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
