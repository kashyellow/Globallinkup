"use client";

import type { CSSProperties } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { DefaultAvatar } from "@/components/ui/default-avatar";
import { Icon } from "@/components/ui/icon";
import { acceptConnectionAction, declineConnectionAction } from "@/features/connect/actions";
import { useRouter } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";
import type { ReceivedRequestDto } from "../queries";

const EASE = "ease-[cubic-bezier(0.32,0.72,0,1)]";

export function ReceivedRequestsPanel({ requests }: { requests: ReceivedRequestDto[] }) {
  const t = useTranslations("Connections.requests");
  const format = useFormatter();
  const router = useRouter();

  async function decide(id: string, action: "accept" | "decline") {
    const result =
      action === "accept"
        ? await acceptConnectionAction({ id })
        : await declineConnectionAction({ id });
    if (result.ok) router.refresh();
  }

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
          <span className="rounded-full border border-primary-container/40 bg-primary-container/10 px-space-md py-1.5 font-label-md text-label-md font-semibold whitespace-nowrap text-primary tabular-nums">
            {t("awaitingDecision", { count: requests.length })}
          </span>
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="bezel-tray">
          <div
            className="flex flex-col items-center gap-2 bezel-core py-space-xl text-center"
            style={{ "--bezel-core-bg": "var(--color-surface-low)" } as CSSProperties}
          >
            <Icon name="mark_email_read" className="text-3xl text-secondary" />
            <p className="font-label-lg text-label-lg font-semibold text-on-surface">
              {t("emptyTitle")}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-space-lg md:grid-cols-2">
          {requests.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              sentAgo={format.relativeTime(new Date(request.createdAt), new Date())}
              onAccept={() => void decide(request.id, "accept")}
              onDecline={() => void decide(request.id, "decline")}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function RequestCard({
  request,
  sentAgo,
  onAccept,
  onDecline,
}: {
  request: ReceivedRequestDto;
  sentAgo: string;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const t = useTranslations("Connections.requests");
  const tDiscover = useTranslations("Discover");

  return (
    <article className="bezel-tray">
      <div
        className="flex h-full flex-col justify-between gap-space-md bezel-core p-space-lg"
        style={{ "--bezel-core-bg": "var(--color-surface-low)" } as CSSProperties}
      >
        <div className="space-y-space-md">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-space-md">
              {request.avatar ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt={request.name}
                    className="h-16 w-16 shrink-0 rounded-full object-cover ring-1 ring-outline-variant"
                    src={request.avatar}
                    loading="lazy"
                  />
                </>
              ) : (
                <DefaultAvatar className="h-16 w-16 shrink-0 rounded-full ring-1 ring-outline-variant" />
              )}
              <div className="min-w-0">
                <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                  {request.age > 0 ? `${request.name}, ${request.age}` : request.name}
                </h3>
                <p className="flex items-center gap-1 font-body-sm text-body-sm text-secondary">
                  <Icon name="location_on" className="text-sm" />
                  {[request.location, request.neighborhood].filter(Boolean).join(" · ")}
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-1">
                  {request.languages.map((language) => (
                    <span
                      key={language.code}
                      className="rounded-full border border-outline-variant bg-surface-container px-2.5 py-0.5 font-label-md text-label-md text-on-surface-strong"
                    >
                      {language.code} ·{" "}
                      {tDiscover.has(`fluency.${language.level}`)
                        ? tDiscover(`fluency.${language.level}`)
                        : language.level}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <span className="shrink-0 rounded-full border border-outline-variant bg-surface-container px-2.5 py-1 font-label-md text-label-md text-secondary">
              {t("sentAgo", { time: sentAgo })}
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

          {/* The vault stays masked until the request is accepted (RLS-gated). */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-outline-variant bg-surface-container p-space-sm">
            <div className="flex min-w-0 items-center gap-space-xs">
              <Icon name="encrypted" className="shrink-0 text-base text-secondary" />
              <span className="truncate font-label-md font-mono text-label-md text-on-surface-strong">
                {t("lockedPreview")}
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
