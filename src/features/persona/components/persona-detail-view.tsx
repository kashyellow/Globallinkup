"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { BackLink } from "@/components/layout/back-link";
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
import type { PersonaDetail } from "@/features/persona/queries";
import type { ConnectState } from "@/features/persona/data";
import { ReportDialog } from "@/features/reports/components/report-dialog";
import { ConnectDialog } from "@/features/shared/connect-dialog";
import { usePendingAction } from "@/features/shared/use-pending-action";
import { useRefresh } from "@/features/shared/refresh-provider";
import { Link } from "@/lib/i18n/navigation";

export function PersonaDetailView({
  persona,
  isSelf = false,
  canConnect = true,
}: {
  persona: PersonaDetail;
  isSelf?: boolean;
  canConnect?: boolean;
}) {
  const t = useTranslations("Discover.detail");
  const tDiscover = useTranslations("Discover");
  const tCommon = useTranslations("Common");
  const { refresh } = useRefresh();
  const { isPending, run } = usePendingAction();

  const [state, setState] = useState<ConnectState>(persona.state);
  const [connectionId, setConnectionId] = useState<string | undefined>(persona.connectionId);
  const [connectOpen, setConnectOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(note: string): Promise<boolean> {
    setError(null);
    const result = await run(`connect:${persona.id}`, async () => {
      try {
        const response = await sendConnectRequestAction({ recipientId: persona.id, note });
        if (!response.ok) {
          setError(tDiscover("sendError"));
          return false;
        }
        setState("requested");
        refresh();
        return true;
      } catch {
        setError(tDiscover("sendError"));
        return false;
      }
    });
    return result ?? false;
  }

  async function decide(accept: boolean) {
    if (!connectionId) return;

    await run(`decision:${connectionId}`, async () => {
      setError(null);
      try {
        const result = accept
          ? await acceptConnectionAction({ id: connectionId })
          : await declineConnectionAction({ id: connectionId });
        if (!result.ok) {
          setError(tDiscover("sendError"));
          return;
        }
        setState(accept ? "connected" : "declined");
        if (!accept) setConnectionId(undefined);
        refresh();
      } catch {
        setError(tDiscover("sendError"));
      }
    });
  }

  return (
    <div className="mx-auto w-full max-w-[1000px] px-margin-mobile pt-block-mobile pb-page-mobile md:px-margin md:pt-block md:pb-page">
      <BackLink label={t("back")} fallbackHref="/discover" />

      <div className="mt-space-md grid grid-cols-1 gap-space-lg md:grid-cols-12">
        <div className="md:col-span-5">
          <div className="aspect-[4/5] w-full overflow-hidden rounded-[1.5rem] border border-outline-variant bg-surface-container">
            {persona.image ? (
              <MediaImage
                src={persona.image}
                alt={persona.imageAlt}
                wrapperClassName="h-full w-full"
                loading="eager"
              />
            ) : (
              <DefaultAvatar className="h-full w-full" />
            )}
          </div>
        </div>

        <div className="md:col-span-7">
          <h1 className="font-title text-title-mobile font-bold text-balance text-on-surface md:text-title">
            {persona.age > 0 ? `${persona.name}, ${persona.age}` : persona.name}
          </h1>
          {persona.headline ? (
            <p className="mt-1 font-body-lg text-body-lg text-primary">{persona.headline}</p>
          ) : null}
          <p className="mt-1 flex items-center gap-1.5 font-body-md text-body-md text-secondary">
            <Icon name="location_on" className="text-base text-primary" />
            {persona.location}
          </p>

          <p className="mt-space-md font-body-md text-body-md leading-relaxed text-on-surface">
            {persona.bio}
          </p>

          <div className="mt-space-md space-y-space-sm">
            <span className="block font-label-md text-label-md font-semibold text-text-muted">
              {tCommon("languages")}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {persona.languages.map((language) => (
                <span
                  key={language.code}
                  className="rounded-full border border-outline-variant bg-surface-variant px-2.5 py-1 font-label-md text-label-md text-on-surface-variant"
                >
                  {language.code} ·{" "}
                  {tDiscover.has(`fluency.${language.level}`)
                    ? tDiscover(`fluency.${language.level}`)
                    : language.level}
                </span>
              ))}
            </div>
          </div>

          <p className="mt-space-md rounded-2xl border border-outline-variant bg-surface-container p-space-sm font-body-sm text-body-sm text-secondary">
            <Icon name="lock" className="mr-1.5 inline text-base text-tertiary" />
            {t("contactNote")}
          </p>

          {error ? <InlineAlert className="mt-space-sm">{error}</InlineAlert> : null}

          <div className="mt-space-lg flex flex-wrap items-center gap-space-sm">
            {isSelf ? (
              <Link
                href="/profile/edit"
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-4 font-label-lg text-label-lg font-semibold text-on-primary hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px"
              >
                <Icon name="edit_square" className="text-lg" />
                {t("editProfile")}
              </Link>
            ) : state === "connected" ? (
              <span className="inline-flex min-h-11 items-center gap-2 rounded-full border border-success-border bg-success-surface px-4 font-label-lg text-label-lg font-semibold text-success-text">
                <Icon name="check_circle" className="text-lg" />
                {tCommon("connected")}
              </span>
            ) : state === "received" && canConnect ? (
              <>
                <button
                  type="button"
                  onClick={() => void decide(true)}
                  disabled={isPending(`decision:${connectionId}`)}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-4 font-label-lg text-label-lg font-semibold text-on-primary hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px disabled:opacity-60"
                >
                  {isPending(`decision:${connectionId}`) ? (
                    <Spinner className="h-4 w-4 text-current" label={tCommon("processing")} />
                  ) : (
                    <Icon name="check" className="text-lg" />
                  )}
                  {isPending(`decision:${connectionId}`)
                    ? tCommon("processing")
                    : tCommon("accept")}
                </button>
                <button
                  type="button"
                  onClick={() => void decide(false)}
                  disabled={isPending(`decision:${connectionId}`)}
                  className="inline-flex min-h-11 items-center rounded-full border border-outline-variant px-4 font-label-lg text-label-lg text-on-surface hover:bg-surface-container focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px disabled:opacity-60"
                >
                  {tCommon("decline")}
                </button>
              </>
            ) : state === "requested" ? (
              <span className="inline-flex min-h-11 items-center gap-2 rounded-full border border-outline-variant bg-surface-container px-4 font-label-lg text-label-lg text-on-surface">
                <Icon name="schedule" className="text-lg text-primary" />
                {tCommon("requestSent")}
              </span>
            ) : canConnect ? (
              <button
                type="button"
                onClick={() => setConnectOpen(true)}
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-4 font-label-lg text-label-lg font-semibold text-on-primary hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px"
              >
                <Icon name="person_add" className="text-lg" />
                {tCommon("connect")}
              </button>
            ) : null}

            {!isSelf && canConnect ? (
              <button
                type="button"
                onClick={() => setReportOpen(true)}
                className="inline-flex min-h-11 items-center gap-2 rounded-full px-4 font-label-md text-label-md text-secondary transition-colors hover:bg-surface-container hover:text-danger focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <Icon name="flag" className="text-base" />
                {t("report")}
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <ConnectDialog
        target={{
          id: persona.id,
          name: persona.name,
          age: persona.age,
          location: persona.location,
          image: persona.image,
          imageAlt: persona.imageAlt,
        }}
        open={canConnect && connectOpen}
        onClose={() => setConnectOpen(false)}
        onSend={send}
      />

      <ReportDialog
        target={{ type: "user", id: persona.id, name: persona.name }}
        open={reportOpen}
        onClose={() => setReportOpen(false)}
      />
    </div>
  );
}
