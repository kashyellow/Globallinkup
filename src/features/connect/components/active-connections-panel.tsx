"use client";

import type { CSSProperties } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";
import { DefaultAvatar } from "@/components/ui/default-avatar";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Icon } from "@/components/ui/icon";
import { InlineAlert } from "@/components/ui/inline-alert";
import { MediaImage } from "@/components/ui/media-image";
import { disconnectConnectionAction } from "@/features/connect/actions";
import { usePendingAction } from "@/features/shared/use-pending-action";
import { useRefresh } from "@/features/shared/refresh-provider";
import { Link } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";
import type { ActiveConnectionDto } from "../queries";
import { ContactVault } from "./contact-vault";

const EASE = "ease-[cubic-bezier(0.32,0.72,0,1)]";

export function ActiveConnectionsPanel({
  connections,
  requestCount,
  onReviewInquiries,
}: {
  connections: ActiveConnectionDto[];
  requestCount: number;
  onReviewInquiries: () => void;
}) {
  const t = useTranslations("Connections.active");
  const tCommon = useTranslations("Common");
  const { refresh } = useRefresh();
  const { isPending, run } = usePendingAction();
  const [removedIds, setRemovedIds] = useState<ReadonlySet<string>>(() => new Set());
  const [disconnectTarget, setDisconnectTarget] = useState<ActiveConnectionDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(8);

  const visible = connections.filter((connection) => !removedIds.has(connection.id));
  const paged = visible.slice(0, visibleCount);

  async function disconnect(connection: ActiveConnectionDto) {
    const result = await run(`disconnect:${connection.id}`, async () => {
      setError(null);
      try {
        const response = await disconnectConnectionAction({ id: connection.id });
        if (!response.ok) {
          setError(tCommon("actionError"));
          return false;
        }
        setRemovedIds((previous) => new Set(previous).add(connection.id));
        refresh();
        return true;
      } catch {
        setError(tCommon("actionError"));
        return false;
      }
    });

    if (result) setDisconnectTarget(null);
  }

  return (
    <div className="space-y-space-xl">
      {/* Pending-inquiries callout */}
      {requestCount > 0 ? (
        <div className="bezel-tray">
          <div
            className="flex flex-col items-start justify-between gap-space-md bezel-core p-space-md md:flex-row md:items-center md:p-space-lg"
            style={{ "--bezel-core-bg": "var(--color-secondary-container-alt)" } as CSSProperties}
          >
            <div className="flex items-start gap-space-md">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-primary-container/40 bg-primary-container/10 text-primary">
                <Icon name="contact_mail" className="text-xl" />
              </div>
              <div>
                <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                  {t("calloutTitle", { count: requestCount })}
                </h3>
                <p className="mt-0.5 max-w-[60ch] font-body-sm text-body-sm text-on-surface-strong">
                  {t("calloutBody")}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onReviewInquiries}
              className={cn(
                "inline-flex min-h-11 shrink-0 items-center gap-2.5 rounded-full bg-primary py-1.5 pr-1.5 pl-space-lg font-label-lg text-label-lg whitespace-nowrap text-on-primary",
                "hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px",
                "transition-colors duration-300",
                EASE,
              )}
            >
              <span>{t("reviewInquiries")}</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-on-primary/15">
                <Icon name="arrow_forward" className="text-sm text-on-primary" />
              </span>
            </button>
          </div>
        </div>
      ) : null}

      {error ? <InlineAlert>{error}</InlineAlert> : null}

      {visible.length === 0 ? (
        <div className="bezel-tray">
          <div
            className="flex flex-col items-center gap-2 bezel-core py-space-xl text-center"
            style={{ "--bezel-core-bg": "var(--color-surface-low)" } as CSSProperties}
          >
            <Icon name="group_off" className="text-3xl text-secondary" />
            <p className="font-label-lg text-label-lg font-semibold text-on-surface">
              {t("emptyTitle")}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-space-lg md:grid-cols-2">
          {paged.map((connection) => (
            <ConnectionCard
              key={connection.id}
              connection={connection}
              onDisconnect={() => setDisconnectTarget(connection)}
            />
          ))}
        </div>
      )}

      {visible.length > visibleCount ? (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setVisibleCount((count) => count + 8)}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-outline-variant bg-surface-low px-space-lg font-label-lg text-label-lg font-semibold text-on-surface shadow-lift-sm transition-colors duration-300 hover:border-outline-hover hover:bg-surface-container focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px"
          >
            <Icon name="expand_more" className="text-lg" />
            {t("loadMore", { count: visible.length - visibleCount })}
          </button>
        </div>
      ) : null}

      <ConfirmDialog
        open={disconnectTarget !== null}
        title={t("disconnect")}
        body={tCommon("confirmBody")}
        confirmLabel={tCommon("confirmAction")}
        cancelLabel={tCommon("cancel")}
        pendingLabel={tCommon("processing")}
        pending={disconnectTarget ? isPending(`disconnect:${disconnectTarget.id}`) : false}
        onClose={() => setDisconnectTarget(null)}
        onConfirm={() => {
          if (disconnectTarget) void disconnect(disconnectTarget);
        }}
      />
    </div>
  );
}

function ConnectionCard({
  connection,
  onDisconnect,
}: {
  connection: ActiveConnectionDto;
  onDisconnect: () => void;
}) {
  const t = useTranslations("Connections.active");
  const tDiscover = useTranslations("Discover");
  const format = useFormatter();

  return (
    <article className="bezel-tray">
      <div
        className="flex h-full flex-col justify-between overflow-hidden bezel-core"
        style={{ "--bezel-core-bg": "var(--color-surface-low)" } as CSSProperties}
      >
        <div className="space-y-space-md p-space-lg">
          {/* Tenure */}
          <div className="flex justify-end">
            <span className="font-label-md text-label-md text-secondary">
              {t("connectedSince", {
                date: format.dateTime(new Date(connection.connectedSince), "monthYear"),
              })}
            </span>
          </div>

          {/* Profile snapshot */}
          <Link
            href={`/persona/${connection.profileId}`}
            className="group flex items-start gap-space-md rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {connection.avatar ? (
              <MediaImage
                src={connection.avatar}
                alt={connection.name}
                wrapperClassName="h-20 w-20 shrink-0 rounded-full ring-1 ring-outline-variant"
              />
            ) : (
              <DefaultAvatar className="h-20 w-20 shrink-0 rounded-full ring-1 ring-outline-variant" />
            )}
            <div className="flex min-w-0 flex-col">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface transition-colors group-hover:text-primary">
                  {connection.name}
                </h2>
                {connection.age > 0 ? (
                  <span className="font-body-sm text-body-sm text-secondary">{connection.age}</span>
                ) : null}
              </div>
              <p className="mt-0.5 flex items-center gap-1 font-body-sm text-body-sm text-on-surface-strong">
                <Icon name="location_on" className="text-sm text-secondary" />
                {[connection.location, connection.neighborhood].filter(Boolean).join(" · ")}
              </p>
              <div className="mt-space-xs flex flex-wrap items-center gap-space-xs">
                {connection.languages.map((language) => (
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
          </Link>

          {/* Cultural tags */}
          {connection.interests.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {connection.interests.map((interest) => (
                <span
                  key={interest}
                  className="rounded-full bg-surface-container-highest px-2.5 py-1 font-label-md text-label-md text-secondary"
                >
                  {tDiscover.has(`interests.${interest}`)
                    ? tDiscover(`interests.${interest}`)
                    : interest}
                </span>
              ))}
            </div>
          ) : null}

          {/* Unlocked contact vault */}
          <ContactVault channels={connection.channels} />
        </div>

        {/* Action row */}
        <div className="flex items-center justify-between gap-space-sm border-t border-outline-variant bg-surface-container p-space-md">
          <p className="min-w-0 font-body-sm text-body-sm text-secondary">{t("vaultStatus")}</p>
          <button
            type="button"
            onClick={onDisconnect}
            title={t("disconnect")}
            aria-label={t("disconnect")}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-secondary transition-colors duration-300 hover:bg-surface-variant hover:text-danger focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <Icon name="link_off" className="text-lg" />
          </button>
        </div>
      </div>
    </article>
  );
}
