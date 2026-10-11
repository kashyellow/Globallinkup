"use client";

import type { CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { RECEIVED_REQUESTS, type ReceivedRequest } from "../data";

const EASE = "ease-[cubic-bezier(0.32,0.72,0,1)]";

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
      <div className="bezel-tray">
        <div
          className="flex flex-col items-start justify-between gap-space-md bezel-core p-space-lg md:flex-row md:items-center"
          style={{ "--bezel-core-bg": "var(--color-surface-low)" } as CSSProperties}
        >
          <div className="space-y-1">
            <div className="flex items-center gap-space-xs text-primary">
              <Icon name="lock" className="text-lg" />
              <span className="font-label-lg text-label-lg font-semibold">
                {t("guidanceTitle")}
              </span>
            </div>
            <p className="max-w-[62ch] font-body-md text-body-md text-on-surface-strong">
              {t("guidanceBody")}
            </p>
          </div>
          <span
            className={cn(
              "rounded-full border border-primary-container/40 bg-primary-container/10 px-space-md py-1.5 font-label-md text-label-md font-semibold whitespace-nowrap text-primary",
              "tabular-nums",
            )}
          >
            {t("awaitingDecision", { count: awaiting })}
          </span>
        </div>
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
      <article className="h-full bezel-tray">
        <div
          className="flex h-full flex-col items-center justify-center gap-space-xs bezel-core p-space-lg py-space-xl text-center"
          style={{ "--bezel-core-bg": "var(--color-success-surface)" } as CSSProperties}
        >
          <Icon name="lock_open" className="text-3xl text-success-text" />
          <p className="font-headline-sm text-headline-sm font-semibold text-success-text">
            {t("grantedTitle")}
          </p>
          <p className="max-w-[46ch] font-body-sm text-body-sm text-on-surface-strong">
            {t("grantedBody", { name: request.name })}
          </p>
        </div>
      </article>
    );
  }

  return (
    <article className="bezel-tray">
      <div
        className="flex h-full flex-col justify-between gap-space-md bezel-core p-space-lg"
        style={{ "--bezel-core-bg": "var(--color-surface-low)" } as CSSProperties}
      >
        <div className="space-y-space-md">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-space-md">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt={request.avatarAlt}
                className="h-16 w-16 shrink-0 rounded-full object-cover ring-1 ring-outline-variant"
                src={request.avatar}
                loading="lazy"
              />
              <div className="min-w-0">
                <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                  {request.name}, {request.age}
                </h3>
                <p className="flex items-center gap-1 font-body-sm text-body-sm text-secondary">
                  <Icon name="location_on" className="text-sm" />
                  {request.location} · {request.neighborhood}
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-1">
                  {request.languages.map((language) => (
                    <span
                      key={language.code}
                      className="rounded-full border border-outline-variant bg-surface-container px-2.5 py-0.5 font-label-md text-label-md text-on-surface-strong"
                    >
                      {language.code} · {tDiscover(`fluency.${language.level}`)}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <span className="shrink-0 rounded-full border border-outline-variant bg-surface-container px-2.5 py-1 font-label-md text-label-md text-secondary">
              {t("sentAgo", { time: request.sentAgo })}
            </span>
          </div>

          {/* Introduction letter */}
          <div className="space-y-1.5 rounded-2xl border border-outline-variant bg-surface-container p-space-md">
            <span className="font-label-lg text-label-lg font-semibold text-secondary">
              {t("personalIntroduction")}
            </span>
            <p className="font-body-md text-body-md text-on-surface-strong italic">
              &ldquo;{request.intro}&rdquo;
            </p>
          </div>

          {/* Masked vault preview */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-outline-variant bg-surface-container p-space-sm">
            <div className="flex min-w-0 items-center gap-space-xs">
              <Icon name="encrypted" className="shrink-0 text-base text-secondary" />
              <span className="truncate font-label-md font-mono text-label-md text-on-surface-strong">
                {request.maskedPreview}
              </span>
            </div>
            <span className="shrink-0 font-label-md text-label-md text-secondary">
              {t("masked")}
            </span>
          </div>
        </div>

        {/* Decision CTAs */}
        <div className="flex flex-wrap items-center gap-space-sm pt-space-md">
          <button
            type="button"
            onClick={onAccept}
            className={cn(
              "inline-flex min-h-11 flex-1 items-center justify-center gap-space-xs rounded-full bg-primary px-space-md py-2.5 font-label-lg text-label-lg font-semibold text-on-primary",
              "hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px",
              "transition-colors duration-300",
              EASE,
            )}
          >
            <Icon name="lock_open" className="text-base" />
            <span>{t("accept")}</span>
          </button>
          <button
            type="button"
            onClick={onDecline}
            className={cn(
              "inline-flex min-h-11 items-center justify-center rounded-full border border-outline-variant bg-surface-container px-space-md py-2.5 font-label-md text-label-md text-on-surface",
              "hover:border-outline-hover hover:bg-surface-variant focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px",
              "transition-colors duration-300",
              EASE,
            )}
          >
            {t("decline")}
          </button>
        </div>
      </div>
    </article>
  );
}
