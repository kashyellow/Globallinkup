"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import { RECEIVED_REQUESTS, type ReceivedRequest } from "../data";

type Decision = "pending" | "accepted" | "declined";

export function ReceivedRequestsPanel() {
  const t = useTranslations("Connections.requests");
  const [decisions, setDecisions] = useState<Record<string, Decision>>(() =>
    Object.fromEntries(RECEIVED_REQUESTS.map((request) => [request.id, "pending"])),
  );

  const visible = RECEIVED_REQUESTS.filter((request) => decisions[request.id] !== "declined");
  const awaiting = Object.values(decisions).filter((decision) => decision === "pending").length;

  return (
    <div className="space-y-space-lg">
      {/* Editorial guidance bar */}
      <div className="flex flex-col items-start justify-between gap-space-md rounded-xl border border-outline-variant bg-surface-low p-space-lg shadow-sm md:flex-row md:items-center">
        <div className="space-y-1">
          <div className="flex items-center gap-space-xs font-semibold text-primary">
            <Icon name="lock" className="text-lg" />
            <span className="font-label-caps text-label-caps tracking-wider uppercase">
              {t("guidanceTitle")}
            </span>
          </div>
          <p className="max-w-3xl font-body-md text-body-md text-on-surface-strong">
            {t("guidanceBody")}
          </p>
        </div>
        <span className="rounded border border-border-dark bg-secondary-container-alt px-space-md py-1 font-label-caps text-label-caps font-bold whitespace-nowrap text-on-surface">
          {t("awaitingDecision", { count: awaiting })}
        </span>
      </div>

      {/* Request dossiers */}
      <div className="grid grid-cols-1 gap-space-lg md:grid-cols-2">
        {visible.map((request) => (
          <RequestCard
            key={request.id}
            request={request}
            decision={decisions[request.id]}
            onAccept={() => setDecisions((prev) => ({ ...prev, [request.id]: "accepted" }))}
            onDecline={() => setDecisions((prev) => ({ ...prev, [request.id]: "declined" }))}
          />
        ))}
      </div>
    </div>
  );
}

function RequestCard({
  request,
  decision,
  onAccept,
  onDecline,
}: {
  request: ReceivedRequest;
  decision: Decision;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const t = useTranslations("Connections.requests");
  const tDiscover = useTranslations("Discover");

  if (decision === "accepted") {
    return (
      <article className="flex flex-col items-center justify-center rounded-xl border border-tertiary/30 bg-tertiary/10 p-space-lg py-space-xl text-center">
        <Icon name="lock_open" className="mb-space-xs text-3xl text-tertiary" />
        <p className="font-headline-sm text-headline-sm font-semibold text-tertiary">
          {t("grantedTitle")}
        </p>
        <p className="mt-space-xs max-w-md font-body-sm text-body-sm text-on-surface-strong">
          {t("grantedBody", { name: request.name })}
        </p>
      </article>
    );
  }

  return (
    <article className="flex flex-col justify-between space-y-space-md rounded-xl border border-outline-variant bg-surface-low p-space-lg shadow-sm">
      <div>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-space-md">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt={request.avatarAlt}
              className="h-16 w-16 rounded-full object-cover shadow-sm ring-1 ring-outline-variant"
              src={request.avatar}
              loading="lazy"
            />
            <div>
              <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                {request.name}, {request.age}
              </h3>
              <p className="flex items-center gap-1 font-body-sm text-body-sm text-secondary">
                <Icon name="location_on" className="text-xs" />
                {request.location} · {request.neighborhood}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-1">
                {request.languages.map((language) => (
                  <span
                    key={language.code}
                    className="rounded border border-outline-variant bg-surface-variant px-1.5 py-0.5 font-label-caps text-label-caps text-on-surface-strong"
                  >
                    {language.code} · {tDiscover(`fluency.${language.level}`)}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <span className="rounded border border-outline-variant bg-surface-variant px-2 py-0.5 font-label-caps text-label-caps text-secondary">
            {t("sentAgo", { time: request.sentAgo })}
          </span>
        </div>

        {/* Introduction letter */}
        <div className="mt-space-md space-y-space-xs rounded-xl border border-outline-variant bg-surface p-space-md">
          <span className="font-label-caps text-label-caps tracking-wider text-secondary uppercase">
            {t("personalIntroduction")}
          </span>
          <p className="font-body-md text-body-md text-on-surface-strong italic">
            &ldquo;{request.intro}&rdquo;
          </p>
        </div>

        {/* Masked vault preview */}
        <div className="mt-space-md flex items-center justify-between rounded-lg border border-outline-variant bg-surface-container p-space-sm text-secondary">
          <div className="flex items-center gap-space-xs">
            <Icon name="encrypted" className="text-base" />
            <span className="font-label-md font-mono text-label-md text-on-surface-strong">
              {request.maskedPreview}
            </span>
          </div>
          <span className="font-label-caps text-label-caps text-secondary uppercase">
            {t("masked")}
          </span>
        </div>
      </div>

      {/* Decision CTAs */}
      <div className="flex flex-wrap items-center gap-space-sm pt-space-md">
        <button
          type="button"
          onClick={onAccept}
          className="flex flex-1 items-center justify-center gap-space-xs rounded-xl bg-primary-container px-space-md py-2.5 font-label-lg text-label-lg text-white shadow-sm transition-all hover:opacity-95"
        >
          <Icon name="lock_open" className="text-base" />
          <span>{t("accept")}</span>
        </button>
        <button
          type="button"
          onClick={onDecline}
          className="rounded-xl border border-outline-variant bg-surface-variant px-space-md py-2.5 font-label-md text-label-md text-on-surface transition-all hover:bg-[#2e2b27]"
        >
          {t("decline")}
        </button>
      </div>
    </article>
  );
}
