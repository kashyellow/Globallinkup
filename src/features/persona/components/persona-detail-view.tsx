"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { DefaultAvatar } from "@/components/ui/default-avatar";
import { Icon } from "@/components/ui/icon";
import {
  acceptConnectionAction,
  declineConnectionAction,
  sendConnectRequestAction,
} from "@/features/connect/actions";
import type { PersonaDetail } from "@/features/persona/queries";
import type { ConnectState } from "@/features/persona/data";
import { ReportDialog } from "@/features/reports/components/report-dialog";
import { ConnectDialog } from "@/features/shared/connect-dialog";
import { Link, useRouter } from "@/lib/i18n/navigation";

export function PersonaDetailView({ persona }: { persona: PersonaDetail }) {
  const t = useTranslations("Discover.detail");
  const tDiscover = useTranslations("Discover");
  const tCommon = useTranslations("Common");
  const router = useRouter();

  const [state, setState] = useState<ConnectState>(persona.state);
  const [connectionId, setConnectionId] = useState<string | undefined>(persona.connectionId);
  const [connectOpen, setConnectOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(note: string) {
    setConnectOpen(false);
    setError(null);
    const result = await sendConnectRequestAction({ recipientId: persona.id, note });
    if (result.ok) setState("requested");
    else setError(tDiscover("sendError"));
  }

  async function decide(accept: boolean) {
    if (!connectionId) return;
    setError(null);
    const result = accept
      ? await acceptConnectionAction({ id: connectionId })
      : await declineConnectionAction({ id: connectionId });
    if (!result.ok) {
      setError(tDiscover("sendError"));
      return;
    }
    setState(accept ? "connected" : "declined");
    if (!accept) setConnectionId(undefined);
    router.refresh();
  }

  return (
    <div className="mx-auto w-full max-w-[1000px] px-margin-mobile pt-block-mobile pb-page-mobile md:px-margin md:pt-block md:pb-page">
      <Link
        href="/discover"
        className="inline-flex min-h-11 items-center gap-1.5 font-label-md text-label-md text-secondary transition-colors hover:text-on-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <Icon name="arrow_back" className="text-base" />
        {t("back")}
      </Link>

      <div className="mt-space-md grid grid-cols-1 gap-space-lg md:grid-cols-12">
        <div className="md:col-span-5">
          <div className="aspect-[4/5] w-full overflow-hidden rounded-[1.5rem] border border-outline-variant bg-surface-container">
            {persona.image ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt={persona.imageAlt}
                  src={persona.image}
                  className="h-full w-full object-cover"
                />
              </>
            ) : (
              <DefaultAvatar className="h-full w-full" />
            )}
          </div>
        </div>

        <div className="md:col-span-7">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-success-border bg-success-surface px-2.5 py-0.5 font-label-caps text-label-caps text-success-text">
            <Icon name="verified" className="text-sm" />
            {tCommon("verified")}
          </span>

          <h1 className="mt-space-sm font-display-md text-display-md-mobile font-bold text-balance text-on-surface md:text-display-md">
            {persona.age > 0 ? `${persona.name}, ${persona.age}` : persona.name}
          </h1>
          <p className="mt-1 flex items-center gap-1.5 font-body-md text-body-md text-secondary">
            <Icon name="location_on" className="text-base text-primary" />
            {persona.location}
          </p>

          <p className="mt-space-md font-body-md text-body-md leading-relaxed text-on-surface">
            {persona.bio}
          </p>

          <div className="mt-space-md space-y-space-sm">
            <span className="block font-label-md text-label-md font-semibold tracking-[0.08em] text-text-muted uppercase">
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

          <div className="mt-space-md space-y-space-sm">
            <span className="block font-label-md text-label-md font-semibold tracking-[0.08em] text-text-muted uppercase">
              {tCommon("interests")}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {persona.interests.map((interest) => (
                <span
                  key={interest}
                  className="rounded-full border border-outline-variant bg-surface-container px-2.5 py-1 font-label-md text-label-md text-on-surface-strong"
                >
                  {tDiscover.has(`interests.${interest}`)
                    ? tDiscover(`interests.${interest}`)
                    : interest}
                </span>
              ))}
            </div>
          </div>

          <p className="mt-space-md rounded-2xl border border-outline-variant bg-surface-container p-space-sm font-body-sm text-body-sm text-secondary">
            <Icon name="lock" className="mr-1.5 inline text-base text-tertiary" />
            {t("contactNote")}
          </p>

          {error ? (
            <p role="alert" className="mt-space-sm font-body-sm text-body-sm text-danger-text">
              {error}
            </p>
          ) : null}

          <div className="mt-space-lg flex flex-wrap items-center gap-space-sm">
            {state === "connected" ? (
              <span className="inline-flex min-h-11 items-center gap-2 rounded-full border border-success-border bg-success-surface px-4 font-label-lg text-label-lg font-semibold text-success-text">
                <Icon name="check_circle" className="text-lg" />
                {tCommon("connected")}
              </span>
            ) : state === "received" ? (
              <>
                <button
                  type="button"
                  onClick={() => void decide(true)}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-4 font-label-lg text-label-lg font-semibold text-on-primary hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px"
                >
                  <Icon name="check" className="text-lg" />
                  {tCommon("accept")}
                </button>
                <button
                  type="button"
                  onClick={() => void decide(false)}
                  className="inline-flex min-h-11 items-center rounded-full border border-outline-variant px-4 font-label-lg text-label-lg text-on-surface hover:bg-surface-container focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px"
                >
                  {tCommon("decline")}
                </button>
              </>
            ) : state === "requested" ? (
              <span className="inline-flex min-h-11 items-center gap-2 rounded-full border border-outline-variant bg-surface-container px-4 font-label-lg text-label-lg text-on-surface">
                <Icon name="schedule" className="text-lg text-primary" />
                {tCommon("requestSent")}
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setConnectOpen(true)}
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-4 font-label-lg text-label-lg font-semibold text-on-primary hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px"
              >
                <Icon name="person_add" className="text-lg" />
                {tCommon("connect")}
              </button>
            )}

            <button
              type="button"
              onClick={() => setReportOpen(true)}
              className="inline-flex min-h-11 items-center gap-2 rounded-full px-4 font-label-md text-label-md text-secondary transition-colors hover:bg-surface-container hover:text-danger focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <Icon name="flag" className="text-base" />
              {t("report")}
            </button>
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
        open={connectOpen}
        onClose={() => setConnectOpen(false)}
        onSend={(note) => void send(note)}
      />

      <ReportDialog
        target={{ type: "user", id: persona.id, name: persona.name }}
        open={reportOpen}
        onClose={() => setReportOpen(false)}
      />
    </div>
  );
}
