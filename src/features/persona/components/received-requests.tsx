"use client";

import type { CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { INBOUND_REQUESTS } from "../data";

type RequestStatus = "pending" | "accepted" | "declined";

export function ReceivedRequests() {
  const t = useTranslations("Discover");
  const tCommon = useTranslations("Common");
  const [statuses, setStatuses] = useState<Record<string, RequestStatus>>(() =>
    Object.fromEntries(INBOUND_REQUESTS.map((request) => [request.id, "pending"])),
  );

  const visible = INBOUND_REQUESTS.filter((request) => statuses[request.id] !== "declined");
  const pendingCount = Object.values(statuses).filter((status) => status === "pending").length;

  function setStatus(id: string, status: RequestStatus) {
    setStatuses((prev) => ({ ...prev, [id]: status }));
  }

  return (
    <section className="bezel-tray">
      <div
        className="space-y-space-md bezel-core p-space-lg"
        style={{ "--bezel-core-bg": "var(--color-surface-low)" } as CSSProperties}
      >
        <div className="flex flex-wrap items-center justify-between gap-x-space-sm gap-y-1">
          <div className="flex items-center gap-space-xs">
            <span className="font-headline-sm text-headline-sm text-on-surface">
              {t("requests.title")}
            </span>
            <span className="shrink-0 rounded-full bg-primary-container px-2 py-0.5 font-label-caps text-label-caps whitespace-nowrap text-on-primary">
              {t("requests.pending", { count: pendingCount })}
            </span>
          </div>
          {/* No "manage all requests" route exists yet, so this is text rather than a dead href="#". */}
          <span className="ml-auto shrink-0 font-label-md text-label-md whitespace-nowrap text-primary">
            {t("requests.manageAll")}
          </span>
        </div>

        <div className="space-y-space-sm">
          {visible.map((request) => {
            const name = t(`requests.items.${request.nameKey}.name`);
            const meta = t(`requests.items.${request.nameKey}.meta`);
            const status = statuses[request.id];

            return (
              <div
                key={request.id}
                className="flex flex-col items-start justify-between gap-space-sm rounded-2xl border border-outline-variant bg-surface-container p-space-md sm:flex-row sm:items-center"
              >
                {status === "accepted" ? (
                  <div className="w-full rounded-2xl border border-success-border bg-success-surface p-2 text-center font-label-md text-label-md font-semibold text-success-text">
                    {t("requests.connectedToast", { name: name.split(" ")[0] })}
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-space-sm">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        alt={request.avatarAlt}
                        className="h-11 w-11 rounded-full object-cover ring-1 ring-outline-variant"
                        src={request.avatar}
                        loading="lazy"
                      />
                      <div>
                        <h4 className="font-label-lg text-label-lg font-semibold text-on-surface-strong">
                          {name}
                        </h4>
                        <p className="font-body-sm text-body-sm text-secondary">{meta}</p>
                      </div>
                    </div>

                    <div className="flex w-full items-center justify-end gap-space-xs sm:w-auto">
                      <button
                        type="button"
                        onClick={() => setStatus(request.id, "accepted")}
                        className="inline-flex min-h-11 items-center justify-center rounded-full bg-tertiary px-space-md py-2 font-label-md text-label-md font-semibold text-on-primary transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-success-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px"
                      >
                        {tCommon("accept")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setStatus(request.id, "declined")}
                        className="inline-flex min-h-11 items-center justify-center rounded-full border border-outline-variant bg-surface-variant px-space-md py-2 font-label-md text-label-md text-on-surface-variant transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-surface-container-high hover:text-on-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px"
                      >
                        {tCommon("decline")}
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
