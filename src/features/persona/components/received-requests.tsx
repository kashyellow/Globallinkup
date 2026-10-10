"use client";

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
    <div className="space-y-space-md rounded-xl border border-outline-variant bg-surface-low p-space-lg shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-space-xs">
          <span className="font-headline-sm text-headline-sm text-on-surface">
            {t("requests.title")}
          </span>
          <span className="rounded-full bg-primary-container px-2 py-0.5 font-label-caps text-label-caps text-white">
            {t("requests.pending", { count: pendingCount })}
          </span>
        </div>
        <a href="#" className="font-label-md text-label-md text-primary-container hover:underline">
          {t("requests.manageAll")}
        </a>
      </div>

      <div className="space-y-space-sm">
        {visible.map((request) => {
          const name = t(`requests.items.${request.nameKey}.name`);
          const meta = t(`requests.items.${request.nameKey}.meta`);
          const status = statuses[request.id];

          return (
            <div
              key={request.id}
              className="flex flex-col items-start justify-between gap-space-sm rounded-xl border border-outline-variant bg-surface-container p-space-md sm:flex-row sm:items-center"
            >
              {status === "accepted" ? (
                <div className="w-full rounded border border-tertiary/40 bg-success-surface p-2 text-center text-xs font-semibold text-success-text">
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
                      className="inline-flex min-h-10 items-center justify-center rounded-lg bg-tertiary px-space-sm py-1.5 font-label-md text-label-md font-semibold text-white transition-colors hover:bg-success-hover"
                    >
                      {tCommon("accept")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatus(request.id, "declined")}
                      className="inline-flex min-h-10 items-center justify-center rounded-lg border border-outline-variant bg-surface-variant px-space-sm py-1.5 font-label-md text-label-md text-on-surface-variant shadow-sm transition-colors hover:bg-[#2a2724] hover:text-on-surface"
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
  );
}
