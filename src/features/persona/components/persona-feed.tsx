"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { DefaultAvatar } from "@/components/ui/default-avatar";
import { Icon } from "@/components/ui/icon";
import { InlineAlert } from "@/components/ui/inline-alert";
import { MediaImage } from "@/components/ui/media-image";
import { Spinner } from "@/components/ui/spinner";
import {
  acceptConnectionAction,
  declineConnectionAction,
  sendConnectRequestAction,
} from "@/features/connect/actions";
import { ConnectDialog } from "@/features/shared/connect-dialog";
import { usePendingAction } from "@/features/shared/use-pending-action";
import { useRefresh } from "@/features/shared/refresh-provider";
import { Link } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";
import type { ConnectState, Persona } from "../data";

const EASE = "ease-[cubic-bezier(0.32,0.72,0,1)]";

/**
 * A local override may be ahead of the server (request just sent) but must never
 * hide a terminal server state such as "connected" or "declined" after a refresh.
 */
function effectiveState(override: ConnectState | undefined, server: ConnectState): ConnectState {
  if (!override) return server;
  if (server === "connected" || server === "declined") return server;
  return override;
}

export function PersonaFeed({
  personas,
  total,
  hasMore,
  loadingMore,
  onLoadMore,
  canConnect,
}: {
  personas: Persona[];
  total: number;
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
  canConnect: boolean;
}) {
  const t = useTranslations("Discover");
  const { refresh } = useRefresh();
  const { isPending, run } = usePendingAction();
  // Only overrides live here; the server prop stays the source of truth for
  // untouched cards. This survives a search/region change without remounting
  // the feed (which used to resurrect a stale "Connect" button).
  const [states, setStates] = useState<Record<string, ConnectState>>({});
  const [target, setTarget] = useState<Persona | null>(null);
  const [error, setError] = useState<string | null>(null);

  function closeDialog() {
    setTarget(null);
  }

  async function sendRequest(note: string): Promise<boolean> {
    if (!target) return false;
    const recipientId = target.id;

    const result = await run(`connect:${recipientId}`, async () => {
      setError(null);
      try {
        const response = await sendConnectRequestAction({ recipientId, note });
        if (!response.ok) {
          setError(t("sendError"));
          return false;
        }
        setStates((previous) => ({ ...previous, [recipientId]: "requested" }));
        refresh();
        return true;
      } catch {
        setError(t("sendError"));
        return false;
      }
    });

    return result ?? false;
  }

  async function decide(personaId: string, connectionId: string | undefined, accept: boolean) {
    if (!connectionId) return;

    await run(`decision:${connectionId}`, async () => {
      setError(null);
      try {
        const result = accept
          ? await acceptConnectionAction({ id: connectionId })
          : await declineConnectionAction({ id: connectionId });
        if (!result.ok) {
          setError(t("sendError"));
          return;
        }
        setStates((previous) => ({
          ...previous,
          [personaId]: accept ? "connected" : "declined",
        }));
        refresh();
      } catch {
        setError(t("sendError"));
      }
    });
  }

  if (personas.length === 0) {
    return (
      <section className="space-y-space-md">
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
    <section className="space-y-space-md">
      <div className="flex flex-col gap-1 px-space-xs sm:flex-row sm:items-end sm:justify-between sm:gap-space-sm">
        <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
          {t("feed.listTitle")}
        </h2>
        <span aria-live="polite" className="font-body-sm text-body-sm text-text-muted">
          {t("feed.showing", { shown: personas.length, total })}
        </span>
      </div>

      {error ? <InlineAlert>{error}</InlineAlert> : null}

      <div className="grid grid-cols-1 gap-space-md sm:grid-cols-2 xl:grid-cols-3">
        {personas.map((persona) => (
          <PersonaCard
            key={persona.id}
            persona={persona}
            state={effectiveState(states[persona.id], persona.state)}
            pending={isPending(`decision:${persona.connectionId ?? persona.id}`)}
            canConnect={canConnect}
            onConnect={() => setTarget(persona)}
            onAccept={() => void decide(persona.id, persona.connectionId, true)}
            onDecline={() => void decide(persona.id, persona.connectionId, false)}
          />
        ))}
      </div>

      <div className="flex flex-col items-center gap-space-xs pt-space-sm">
        {hasMore ? (
          <button
            type="button"
            onClick={onLoadMore}
            disabled={loadingMore}
            className={cn(
              "inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-outline-variant bg-surface-low px-space-lg font-label-lg text-label-lg font-semibold text-on-surface shadow-lift-sm transition-colors duration-300 hover:border-outline-hover hover:bg-surface-container focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px disabled:cursor-wait disabled:opacity-60",
              EASE,
            )}
          >
            {loadingMore ? (
              <Spinner className="text-current" label={t("loadingMore")} />
            ) : (
              <Icon name="expand_more" className="text-lg" />
            )}
            {loadingMore ? t("loadingMore") : t("loadMore")}
          </button>
        ) : (
          <p className="font-body-sm text-body-sm text-text-muted">{t("allCaughtUp")}</p>
        )}
      </div>

      <ConnectDialog
        target={target}
        open={target !== null && canConnect}
        onClose={closeDialog}
        onSend={sendRequest}
      />
    </section>
  );
}

function PersonaCard({
  persona,
  state,
  pending,
  canConnect,
  onConnect,
  onAccept,
  onDecline,
}: {
  persona: Persona;
  state: ConnectState;
  pending: boolean;
  canConnect: boolean;
  onConnect: () => void;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const t = useTranslations("Discover");
  const tCommon = useTranslations("Common");

  return (
    <article className="group grid grid-cols-[6.5rem_minmax(0,1fr)] gap-x-space-md gap-y-space-sm overflow-hidden rounded-2xl border border-outline-variant bg-surface-low p-space-sm transition-colors duration-300 hover:border-outline sm:flex sm:flex-col sm:justify-between sm:gap-0 sm:p-0">
      {/* Phones: a portrait thumbnail beside the details, the action across the
          full width below, so three people fit on a screen instead of one. */}
      <Link href={`/persona/${persona.id}`} className="block self-start sm:self-stretch">
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-surface-container sm:aspect-[4/3] sm:rounded-none">
          {persona.image ? (
            <MediaImage
              src={persona.image}
              alt={persona.imageAlt}
              wrapperClassName="h-full w-full"
              className="transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.03] motion-reduce:transform-none"
            />
          ) : (
            <DefaultAvatar className="h-full w-full" />
          )}

          {persona.badge === "directContact" ? (
            <div className="absolute bottom-3 left-3 hidden items-center gap-1 rounded-full border border-success-border bg-success-surface px-2.5 py-1 font-label-md text-label-md text-success-text sm:flex">
              <Icon name="lock_open" className="text-sm" />
              <span>{t("feed.directContactVisible")}</span>
            </div>
          ) : null}
        </div>
      </Link>

      <div className="contents sm:flex sm:flex-1 sm:flex-col sm:justify-between sm:gap-space-sm sm:p-space-md">
        <div className="min-w-0 pt-space-xs sm:pt-0">
          <Link href={`/persona/${persona.id}`} className="block">
            <h3 className="font-headline-sm text-headline-sm text-on-surface">
              {persona.age > 0 ? `${persona.name}, ${persona.age}` : persona.name}
            </h3>
            <div className="mt-0.5 flex items-center gap-1 text-secondary">
              <Icon name="location_on" className="text-sm" />
              <span className="font-body-sm text-body-sm">{persona.location}</span>
            </div>
            {persona.badge === "directContact" ? (
              <span className="mt-1 flex items-center gap-1 font-label-md text-label-md text-success-text sm:hidden">
                <Icon name="lock_open" className="text-sm" />
                {t("feed.directContactVisible")}
              </span>
            ) : null}
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
        </div>

        {state === "connected" ? (
          <div className="col-span-2 flex w-full items-center justify-center gap-space-xs rounded-full border border-success-border bg-success-surface px-space-md py-2.5 font-label-lg text-label-lg font-semibold text-success-text sm:mt-space-sm">
            <Icon name="check_circle" className="text-lg" />
            <span>{tCommon("connected")}</span>
          </div>
        ) : state === "received" && canConnect ? (
          <div className="col-span-2 flex gap-2 sm:mt-space-sm">
            <button
              type="button"
              onClick={onAccept}
              disabled={pending}
              className="flex flex-1 items-center justify-center gap-space-xs rounded-full bg-primary px-space-md py-2.5 font-label-lg text-label-lg font-semibold text-on-primary transition-colors duration-300 hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px disabled:opacity-60"
            >
              {pending ? (
                <Spinner className="h-4 w-4 text-current" label={tCommon("processing")} />
              ) : (
                <Icon name="check" className="text-lg" />
              )}
              {pending ? tCommon("processing") : tCommon("accept")}
            </button>
            <button
              type="button"
              onClick={onDecline}
              disabled={pending}
              className="flex flex-1 items-center justify-center rounded-full border border-outline-variant bg-surface-container px-space-md py-2.5 font-label-lg text-label-lg text-on-surface transition-colors duration-300 hover:border-outline-hover hover:bg-surface-variant focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px disabled:opacity-60"
            >
              {tCommon("decline")}
            </button>
          </div>
        ) : state === "requested" ? (
          <div
            aria-live="polite"
            className="col-span-2 flex w-full items-center justify-center gap-space-xs rounded-full border border-outline-variant bg-surface-container px-space-md py-2.5 font-label-lg text-label-lg text-on-surface-strong sm:mt-space-sm"
          >
            <Icon name="schedule" className="text-lg text-primary" />
            <span>{tCommon("requestSent")}</span>
          </div>
        ) : canConnect ? (
          <button
            type="button"
            onClick={onConnect}
            className={cn(
              "col-span-2 flex w-full items-center justify-center gap-space-xs rounded-full bg-primary px-space-md py-2.5 font-label-lg text-label-lg font-semibold text-on-primary transition-colors duration-300 hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px sm:mt-space-sm",
              EASE,
            )}
          >
            <Icon name="person_add" className="text-lg" />
            <span>{tCommon("connect")}</span>
          </button>
        ) : null}
      </div>
    </article>
  );
}
