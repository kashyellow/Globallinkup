"use client";

import type { CSSProperties } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { ACTIVE_CONNECTIONS, RECEIVED_REQUESTS, type ActiveConnection } from "../data";
import { ContactVault } from "./contact-vault";

const EASE = "ease-[cubic-bezier(0.32,0.72,0,1)]";

export function ActiveConnectionsPanel({ onReviewInquiries }: { onReviewInquiries: () => void }) {
  const t = useTranslations("Connections.active");

  return (
    <div className="space-y-space-xl">
      {/* Pending-inquiries callout */}
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
                {t("calloutTitle", { count: RECEIVED_REQUESTS.length })}
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

      {/* Dossier cards */}
      <div className="grid grid-cols-1 gap-space-lg md:grid-cols-2">
        {ACTIVE_CONNECTIONS.map((connection) => (
          <ConnectionCard key={connection.id} connection={connection} />
        ))}
      </div>
    </div>
  );
}

function ConnectionCard({ connection }: { connection: ActiveConnection }) {
  const t = useTranslations("Connections.active");
  const tConnections = useTranslations("Connections");
  const tDiscover = useTranslations("Discover");
  const format = useFormatter();

  return (
    <article className="bezel-tray">
      <div
        className="flex h-full flex-col justify-between overflow-hidden bezel-core"
        style={{ "--bezel-core-bg": "var(--color-surface-low)" } as CSSProperties}
      >
        <div className="space-y-space-md p-space-lg">
          {/* Verified stamp + tenure */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-success-border bg-success-surface px-2.5 py-1 font-label-md text-label-md font-semibold text-success-text">
              <Icon name="verified" className="text-xs" />
              {t(`badges.${connection.badge}`)}
            </span>
            <span className="font-label-md text-label-md text-secondary">
              {t("connectedSince", {
                date: format.dateTime(new Date(connection.connectedSince), "monthYear"),
              })}
            </span>
          </div>

          {/* Profile snapshot */}
          <div className="flex items-start gap-space-md">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt={connection.avatarAlt}
              className="h-20 w-20 shrink-0 rounded-full object-cover ring-1 ring-outline-variant"
              src={connection.avatar}
              loading="lazy"
            />
            <div className="flex min-w-0 flex-col">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                  {connection.name}
                </h2>
                <span className="font-body-sm text-body-sm text-secondary">{connection.age}</span>
              </div>
              <p className="mt-0.5 flex items-center gap-1 font-body-sm text-body-sm text-on-surface-strong">
                <Icon name="location_on" className="text-sm text-secondary" />
                {connection.location} · {connection.neighborhood}
              </p>
              <div className="mt-space-xs flex flex-wrap items-center gap-space-xs">
                {connection.languages.map((language) => (
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

          {/* Cultural tags */}
          <div className="flex flex-wrap gap-1.5">
            {connection.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-surface-container-highest px-2.5 py-1 font-label-md text-label-md text-secondary"
              >
                {tConnections(`tags.${tag}`)}
              </span>
            ))}
          </div>

          {/* Unlocked contact vault */}
          <ContactVault connection={connection} />

          {/* Relationship context */}
          <p className="pt-1 font-body-sm text-body-sm text-secondary italic">
            {tConnections(`context.${connection.id}`)}
          </p>
        </div>

        {/* Action row */}
        <div className="flex items-center justify-between gap-space-sm border-t border-outline-variant bg-surface-container p-space-md">
          <p className="min-w-0 font-body-sm text-body-sm text-secondary">{t("vaultStatus")}</p>
          <button
            type="button"
            title={t("settings")}
            aria-label={t("settings")}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-secondary transition-colors duration-300 hover:bg-surface-variant hover:text-danger focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <Icon name="shield_with_heart" className="text-lg" />
          </button>
        </div>
      </div>
    </article>
  );
}
