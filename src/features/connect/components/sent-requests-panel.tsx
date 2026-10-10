"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import { SENT_REQUESTS } from "../data";

export function SentRequestsPanel() {
  const t = useTranslations("Connections.sent");
  const tConnections = useTranslations("Connections");
  const [withdrawn, setWithdrawn] = useState<Record<string, boolean>>({});

  const visible = SENT_REQUESTS.filter((request) => !withdrawn[request.id]);

  return (
    <div className="rounded-xl border border-outline-variant bg-surface-low p-space-lg shadow-sm">
      <h3 className="mb-space-xs font-headline-sm text-headline-sm font-semibold text-on-surface">
        {t("title", { count: visible.length })}
      </h3>
      <p className="mb-space-lg font-body-md text-body-md text-on-surface-strong">{t("body")}</p>

      <div className="space-y-space-md">
        {visible.map((request) => (
          <div
            key={request.id}
            className="flex flex-col justify-between gap-space-md rounded-xl border border-outline-variant bg-surface p-space-md sm:flex-row sm:items-center"
          >
            <div className="flex items-center gap-space-md">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt={request.avatarAlt}
                className="h-14 w-14 rounded-full object-cover ring-1 ring-outline-variant"
                src={request.avatar}
                loading="lazy"
              />
              <div>
                <h4 className="font-headline-sm text-headline-sm font-medium text-on-surface">
                  {request.name}, {request.age}
                </h4>
                <p className="font-body-sm text-body-sm text-secondary">
                  {request.location} · {tConnections(`topics.${request.topic}`)}
                </p>
                <span className="mt-1 inline-flex items-center gap-1 font-label-caps text-label-caps text-secondary">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary-container" />
                  {t("sentAgoAwaiting", { time: request.sentAgo })}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-space-xs">
              <button
                type="button"
                className="min-h-10 rounded-lg border border-outline-variant bg-surface-container px-space-md py-1.5 font-label-md text-label-md text-on-surface shadow-sm transition-colors hover:bg-surface-variant"
              >
                {t("viewNote")}
              </button>
              <button
                type="button"
                onClick={() => setWithdrawn((prev) => ({ ...prev, [request.id]: true }))}
                className="min-h-10 rounded-lg px-space-md py-1.5 font-label-md text-label-md text-secondary transition-colors hover:text-danger"
              >
                {t("withdraw")}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ArchivedPanel() {
  const t = useTranslations("Connections.archived");

  return (
    <div className="flex flex-col items-center justify-center space-y-space-sm rounded-xl border border-outline-variant bg-surface-low p-space-xl text-center shadow-sm">
      <Icon name="inventory_2" className="text-4xl text-secondary" />
      <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
        {t("title")}
      </h3>
      <p className="max-w-md font-body-md text-body-md text-secondary">{t("body")}</p>
    </div>
  );
}
