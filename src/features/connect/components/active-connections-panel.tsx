"use client";

import { useFormatter, useTranslations } from "next-intl";
import { Icon } from "@/components/ui/icon";
import { ACTIVE_CONNECTIONS, RECEIVED_REQUESTS, type ActiveConnection } from "../data";
import { ContactVault } from "./contact-vault";

export function ActiveConnectionsPanel({ onReviewInquiries }: { onReviewInquiries: () => void }) {
  const t = useTranslations("Connections.active");

  return (
    <div className="space-y-space-xl">
      {/* Pending action callout */}
      <div className="flex flex-col items-start justify-between gap-space-md rounded-xl border border-border-dark bg-secondary-container-alt p-space-md shadow-sm md:flex-row md:items-center md:p-space-lg">
        <div className="flex items-start gap-space-md">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-outline-variant bg-surface-low text-primary shadow-sm">
            <Icon name="contact_mail" className="text-xl" />
          </div>
          <div>
            <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
              {t("calloutTitle", { count: RECEIVED_REQUESTS.length })}
            </h3>
            <p className="mt-0.5 font-body-sm text-body-sm text-on-surface-strong">
              {t("calloutBody")}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onReviewInquiries}
          className="inline-flex items-center gap-space-xs rounded-xl bg-primary-container px-space-lg py-2 font-label-lg text-label-lg whitespace-nowrap text-white shadow-sm transition-all hover:opacity-95"
        >
          <span>{t("reviewInquiries")}</span>
          <Icon name="arrow_forward" className="text-sm" />
        </button>
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
    <article className="flex flex-col justify-between overflow-hidden rounded-xl border border-outline-variant bg-surface-low shadow-sm transition-all hover:border-border-dark hover:shadow-md">
      <div className="space-y-space-md p-space-lg">
        {/* Header + stamp */}
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 rounded border border-tertiary/30 bg-tertiary/15 px-2.5 py-1 font-label-caps text-label-caps font-semibold text-tertiary">
            <Icon name="verified" className="text-xs" />
            {t(`badges.${connection.badge}`)}
          </span>
          <span className="font-label-caps text-label-caps text-secondary">
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
            className="h-20 w-20 shrink-0 rounded-full object-cover shadow-sm ring-1 ring-outline-variant"
            src={connection.avatar}
            loading="lazy"
          />
          <div className="flex flex-col">
            <div className="flex items-center gap-space-xs">
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
                  className="rounded border border-outline-variant bg-surface-variant px-1.5 py-0.5 font-label-caps text-label-caps text-on-surface-strong"
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
              className="rounded border border-outline-variant bg-surface-container px-2 py-0.5 font-label-md text-label-md text-secondary"
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
      <div className="flex items-center justify-between gap-space-sm border-t border-outline-variant bg-surface p-space-md">
        <div className="flex items-center gap-space-xs">
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-xl border border-outline-variant bg-surface-container px-space-md py-1.5 font-label-md text-label-md text-on-surface shadow-sm transition-all hover:bg-surface-variant"
          >
            <Icon name="edit_note" className="text-sm" />
            <span>{t("sendNote")}</span>
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-xl border border-outline-variant bg-surface-container px-space-md py-1.5 font-label-md text-label-md text-on-surface shadow-sm transition-all hover:bg-surface-variant"
          >
            <Icon name="calendar_month" className="text-sm" />
            <span>{t("coordinateCall")}</span>
          </button>
        </div>
        <button
          type="button"
          title={t("settings")}
          className="rounded p-1.5 text-secondary transition-colors hover:text-danger"
        >
          <Icon name="shield_with_heart" className="text-lg" />
        </button>
      </div>
    </article>
  );
}
