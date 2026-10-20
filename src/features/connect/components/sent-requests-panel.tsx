"use client";

import type { CSSProperties } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";
import { DefaultAvatar } from "@/components/ui/default-avatar";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import type { SentRequestDto } from "../queries";

const EASE = "ease-[cubic-bezier(0.32,0.72,0,1)]";

export function SentRequestsPanel({ requests }: { requests: SentRequestDto[] }) {
  const t = useTranslations("Connections.sent");
  const format = useFormatter();
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="bezel-tray">
      <div
        className="space-y-space-md bezel-core p-space-lg"
        style={{ "--bezel-core-bg": "var(--color-surface-low)" } as CSSProperties}
      >
        <div>
          <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface tabular-nums">
            {t("title", { count: requests.length })}
          </h3>
          <p className="mt-space-xs font-body-md text-body-md text-on-surface-strong">
            {t("body")}
          </p>
        </div>

        {requests.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-outline-variant bg-surface-container py-space-xl text-center">
            <Icon name="outbox" className="text-3xl text-secondary" />
            <p className="font-label-lg text-label-lg font-semibold text-on-surface">
              {t("emptyTitle")}
            </p>
            <p className="max-w-[46ch] font-body-sm text-body-sm text-secondary">
              {t("emptyBody")}
            </p>
          </div>
        ) : (
          <div className="space-y-space-sm">
            {requests.map((request) => (
              <div
                key={request.id}
                className="flex flex-col justify-between gap-space-md rounded-2xl border border-outline-variant bg-surface-container p-space-md sm:flex-row sm:items-center"
              >
                <div className="flex min-w-0 items-center gap-space-md">
                  {request.avatar ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        alt={request.name}
                        className="h-14 w-14 shrink-0 rounded-full object-cover ring-1 ring-outline-variant"
                        src={request.avatar}
                        loading="lazy"
                      />
                    </>
                  ) : (
                    <DefaultAvatar className="h-14 w-14 shrink-0 rounded-full ring-1 ring-outline-variant" />
                  )}
                  <div className="min-w-0">
                    <h4 className="font-headline-sm text-headline-sm font-medium text-on-surface">
                      {request.age > 0 ? `${request.name}, ${request.age}` : request.name}
                    </h4>
                    <p className="font-body-sm text-body-sm text-secondary">{request.location}</p>
                    <span className="mt-1 inline-flex items-center gap-1.5 font-label-md text-label-md text-secondary">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary-container" />
                      {t("sentAgoAwaiting", {
                        time: format.relativeTime(new Date(request.createdAt), new Date()),
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-space-xs">
                  <button
                    type="button"
                    onClick={() =>
                      setOpenId((current) => (current === request.id ? null : request.id))
                    }
                    aria-expanded={openId === request.id}
                    className={cn(
                      "inline-flex min-h-11 items-center rounded-full border border-outline-variant bg-surface-container-high px-space-md py-2 font-label-md text-label-md text-on-surface",
                      "hover:border-outline-hover hover:bg-surface-variant focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px",
                      "transition-colors duration-300",
                      EASE,
                    )}
                  >
                    {t("viewNote")}
                  </button>
                </div>
                {openId === request.id ? (
                  <p className="w-full rounded-xl border border-outline-variant bg-surface-low p-space-sm font-body-sm text-body-sm text-on-surface-strong sm:basis-full">
                    {request.intro}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function ArchivedPanel() {
  const t = useTranslations("Connections.archived");

  return (
    <div className="bezel-tray">
      <div
        className="flex flex-col items-center justify-center gap-space-sm bezel-core p-space-xl text-center"
        style={{ "--bezel-core-bg": "var(--color-surface-low)" } as CSSProperties}
      >
        <Icon name="inventory_2" className="text-4xl text-secondary" />
        <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
          {t("title")}
        </h3>
        <p className="max-w-[46ch] font-body-md text-body-md text-secondary">{t("body")}</p>
      </div>
    </div>
  );
}
