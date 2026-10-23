"use client";

import type { CSSProperties } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";
import { DefaultAvatar } from "@/components/ui/default-avatar";
import { Icon } from "@/components/ui/icon";
import { InlineAlert } from "@/components/ui/inline-alert";
import { MediaImage } from "@/components/ui/media-image";
import { Spinner } from "@/components/ui/spinner";
import { acceptConnectionAction, declineConnectionAction } from "@/features/connect/actions";
import { usePendingAction } from "@/features/shared/use-pending-action";
import { useRefresh } from "@/features/shared/refresh-provider";
import { cn } from "@/lib/utils";
import type { ReceivedRequestDto } from "../queries";

const EASE = "ease-[cubic-bezier(0.32,0.72,0,1)]";

export function ReceivedRequestsPanel({ requests }: { requests: ReceivedRequestDto[] }) {
  const t = useTranslations("Connections.requests");
  const tCommon = useTranslations("Common");
  const format = useFormatter();
  const { refresh } = useRefresh();
  const { isPending, run } = usePendingAction();
  const [handledIds, setHandledIds] = useState<ReadonlySet<string>>(() => new Set());
  const [error, setError] = useState<string | null>(null);

  const visible = requests.filter((request) => !handledIds.has(request.id));

  async function decide(id: string, action: "accept" | "decline") {
    await run(`decision:${id}`, async () => {
      setError(null);
      try {
        const result =
          action === "accept"
            ? await acceptConnectionAction({ id })
            : await declineConnectionAction({ id });
        if (!result.ok) {
          setError(tCommon("actionError"));
          return;
        }
        setHandledIds((previous) => new Set(previous).add(id));
        refresh();
      } catch {
        setError(tCommon("actionError"));
      }
    });
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
            {t("awaitingDecision", { count: visible.length })}
          </span>
        </div>
      </div>

      {error ? <InlineAlert>{error}</InlineAlert> : null}

      {visible.length === 0 ? (
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
          {visible.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              pending={isPending(`decision:${request.id}`)}
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
  pending,
  sentAgo,
  onAccept,
  onDecline,
}: {
  request: ReceivedRequestDto;
  pending: boolean;
  sentAgo: string;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const t = useTranslations("Connections.requests");
  const tDiscover = useTranslations("Discover");
  const tCommon = useTranslations("Common");

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
                <MediaImage
                  src={request.avatar}
                  alt={request.name}
                  wrapperClassName="h-16 w-16 shrink-0 rounded-full ring-1 ring-outline-variant"
                />
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
            <span
              className="shrink-0 rounded-full border border-outline-variant bg-surface-container px-2.5 py-1 font-label-md text-label-md text-secondary"
              suppressHydrationWarning
            >
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
            disabled={pending}
            className={cn(
              "inline-flex min-h-11 flex-1 items-center justify-center gap-space-xs rounded-full bg-primary px-space-md py-2.5 font-label-lg text-label-lg font-semibold text-on-primary",
              "hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px",
              "transition-colors duration-300 disabled:opacity-60",
              EASE,
            )}
          >
            {pending ? (
              <Spinner className="h-4 w-4 text-current" label={tCommon("processing")} />
            ) : (
              <Icon name="lock_open" className="text-base" />
            )}
            <span>{pending ? tCommon("processing") : t("accept")}</span>
          </button>
          <button
            type="button"
            onClick={onDecline}
            disabled={pending}
            className={cn(
              "inline-flex min-h-11 items-center justify-center rounded-full border border-outline-variant bg-surface-container px-space-md py-2.5 font-label-md text-label-md text-on-surface",
              "hover:border-outline-hover hover:bg-surface-variant focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px",
              "transition-colors duration-300 disabled:opacity-60",
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
