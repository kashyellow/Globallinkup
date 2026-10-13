"use client";

import { useTranslations } from "next-intl";
import type { CSSProperties } from "react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { INCIDENTS, type Incident } from "../data";

const ACTION_BASE =
  "inline-flex min-h-11 items-center gap-1.5 rounded-full px-4 py-2 font-label-md text-label-md transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 active:translate-y-px";

export function AdminModerationTab() {
  const t = useTranslations("Admin.moderation");

  return (
    <div className="flex flex-col gap-space-lg">
      <div
        className="bezel-tray"
        style={{ "--bezel-core-bg": "var(--color-surface-low)" } as CSSProperties}
      >
        <div className="flex flex-col justify-between gap-space-md bezel-core p-space-md sm:flex-row sm:items-center">
          <div className="flex items-center gap-space-md">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-danger-border bg-danger-surface text-danger-text">
              <Icon name="flag" />
            </span>
            <div>
              <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                {t("title")}
              </h2>
              <p className="mt-0.5 font-body-sm text-body-sm text-secondary">{t("body")}</p>
            </div>
          </div>
          <span className="self-start rounded-full border border-danger-border bg-danger-surface px-space-md py-1.5 font-label-md text-label-md font-semibold text-danger-text sm:self-auto">
            {t("needsReview", { count: 3 })}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-space-md md:grid-cols-2">
        {INCIDENTS.map((incident) => (
          <IncidentCard key={incident.id} incident={incident} />
        ))}
      </div>
    </div>
  );
}

function IncidentCard({ incident }: { incident: Incident }) {
  const t = useTranslations("Admin.moderation");
  const isDanger = incident.tone === "danger";

  return (
    <div
      className="bezel-tray"
      style={{ "--bezel-core-bg": "var(--color-surface-low)" } as CSSProperties}
    >
      <article className="flex h-full flex-col justify-between gap-space-md bezel-core p-space-lg">
        <div className="flex flex-col gap-space-sm">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <span
              className={cn(
                "rounded-full border px-2.5 py-0.5 font-label-md text-label-md font-semibold",
                isDanger
                  ? "border-danger-border bg-danger-surface text-danger-text"
                  : "border-admin-border bg-admin-surface text-admin-text-soft",
              )}
            >
              {t(`incidents.${incident.badgeKey}`)}
            </span>
            <span className="font-label-md text-label-md text-text-muted">
              {t(`incidents.${incident.timeKey}`)}
            </span>
          </div>

          <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
            {t(`incidents.${incident.titleKey}`)}
          </h3>

          <p className="rounded-2xl border border-outline-variant bg-surface-dim p-space-sm font-body-sm text-body-sm text-text-muted">
            {t(`incidents.${incident.bodyKey}`)}
          </p>

          <div className="flex flex-wrap items-center justify-between gap-x-space-md gap-y-1 pt-1 font-label-md text-label-md text-secondary">
            <span>
              {t("author")}{" "}
              <strong className="font-semibold text-on-surface">
                {t(`incidents.${incident.authorKey}`)}
              </strong>
            </span>
            <span>
              {t("reportedBy")}{" "}
              <strong className="font-semibold text-on-surface">
                {t(`incidents.${incident.reporterKey}`)}
              </strong>
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-space-sm border-t border-outline-variant pt-space-sm">
          {incident.actions.map((action) => {
            if (action === "removePost") {
              return (
                <button
                  key={action}
                  type="button"
                  className={cn(
                    ACTION_BASE,
                    "bg-danger text-on-error hover:bg-danger-border-strong focus-visible:outline-danger-border-strong",
                  )}
                >
                  <Icon name="delete_forever" className="text-sm" />
                  {t("removePostWarn")}
                </button>
              );
            }
            if (action === "suspend") {
              return (
                <button
                  key={action}
                  type="button"
                  className={cn(
                    ACTION_BASE,
                    "bg-primary text-on-primary hover:bg-primary-hover focus-visible:outline-primary",
                  )}
                >
                  <Icon name="lock_reset" className="text-sm" />
                  {t("suspendAccount")}
                </button>
              );
            }
            return (
              <button
                key={action}
                type="button"
                className={cn(
                  ACTION_BASE,
                  "border border-outline-variant bg-surface-dim text-on-surface hover:border-outline-hover hover:bg-surface-container focus-visible:outline-primary",
                )}
              >
                {action === "dismiss" ? t("dismissFlag") : t("askForVerification")}
              </button>
            );
          })}
        </div>
      </article>
    </div>
  );
}
