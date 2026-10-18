"use client";

import type { CSSProperties } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { DefaultAvatar } from "@/components/ui/default-avatar";
import { Icon } from "@/components/ui/icon";
import { disconnectConnectionAction } from "@/features/connect/actions";
import { useRouter } from "@/lib/i18n/navigation";
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

      {connections.length === 0 ? (
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
          {connections.map((connection) => (
            <ConnectionCard key={connection.id} connection={connection} />
          ))}
        </div>
      )}
    </div>
  );
}

function ConnectionCard({ connection }: { connection: ActiveConnectionDto }) {
  const t = useTranslations("Connections.active");
  const tDiscover = useTranslations("Discover");
  const format = useFormatter();
  const router = useRouter();

  async function disconnect() {
    const result = await disconnectConnectionAction({ id: connection.id });
    if (result.ok) router.refresh();
  }

  return (
    <article className="bezel-tray">
      <div
        className="flex h-full flex-col justify-between overflow-hidden bezel-core"
        style={{ "--bezel-core-bg": "var(--color-surface-low)" } as CSSProperties}
      >
        <div className="space-y-space-md p-space-lg">
          {/* Verified stamp + tenure */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            {connection.badge && t.has(`badges.${connection.badge}`) ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-success-border bg-success-surface px-2.5 py-1 font-label-md text-label-md font-semibold text-success-text">
                <Icon name="verified" className="text-xs" />
                {t(`badges.${connection.badge}`)}
              </span>
            ) : (
              <span />
            )}
            <span className="font-label-md text-label-md text-secondary">
              {t("connectedSince", {
                date: format.dateTime(new Date(connection.connectedSince), "monthYear"),
              })}
            </span>
          </div>

          {/* Profile snapshot */}
          <div className="flex items-start gap-space-md">
            {connection.avatar ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt={connection.name}
                  className="h-20 w-20 shrink-0 rounded-full object-cover ring-1 ring-outline-variant"
                  src={connection.avatar}
                  loading="lazy"
                />
              </>
            ) : (
              <DefaultAvatar className="h-20 w-20 shrink-0 rounded-full ring-1 ring-outline-variant" />
            )}
            <div className="flex min-w-0 flex-col">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
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
          </div>

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
            onClick={() => void disconnect()}
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
