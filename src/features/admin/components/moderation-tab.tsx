"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { INCIDENTS, type Incident } from "../data";

export function AdminModerationTab() {
  const t = useTranslations("Admin.moderation");

  return (
    <div className="flex flex-col gap-space-lg">
      <div className="flex items-center justify-between rounded-xl border border-outline-variant bg-surface-low p-space-md">
        <div className="flex items-center gap-space-md">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-danger-border bg-danger-surface text-danger">
            <Icon name="flag" />
          </div>
          <div>
            <h2 className="font-headline-sm text-headline-sm text-on-surface">{t("title")}</h2>
            <p className="font-body-sm text-body-sm text-secondary">{t("body")}</p>
          </div>
        </div>
        <span className="rounded border border-danger-border bg-danger-surface px-2.5 py-1 font-label-caps text-label-caps font-semibold text-on-error-container">
          {t("needsReview", { count: 3 })}
        </span>
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
    <article className="flex flex-col justify-between gap-space-md rounded-xl border border-outline-variant bg-surface-low p-space-lg">
      <div className="flex flex-col gap-space-sm">
        <div className="flex items-start justify-between">
          <span
            className={cn(
              "rounded border px-2 py-0.5 font-label-caps text-label-caps",
              isDanger
                ? "border-danger-border bg-danger-surface text-on-error-container"
                : "border-admin-border bg-admin-surface text-admin-text-soft",
            )}
          >
            {t(`incidents.${incident.badgeKey}`)}
          </span>
          <span className="font-label-caps text-label-caps text-secondary">
            {t(`incidents.${incident.timeKey}`)}
          </span>
        </div>

        <h3 className="font-headline-sm text-base font-semibold text-on-surface">
          {t(`incidents.${incident.titleKey}`)}
        </h3>

        <p className="rounded-lg border border-outline-variant bg-surface-dim p-3 font-body-sm text-body-sm text-on-surface-muted">
          {t(`incidents.${incident.bodyKey}`)}
        </p>

        <div className="flex items-center justify-between pt-1 font-label-md text-label-md text-secondary">
          <span>
            {t("author")}{" "}
            <strong className="text-on-surface">{t(`incidents.${incident.authorKey}`)}</strong>
          </span>
          <span>
            {t("reportedBy")}{" "}
            <strong className="text-on-surface">{t(`incidents.${incident.reporterKey}`)}</strong>
          </span>
        </div>
      </div>

      <div className="flex items-center justify-end gap-space-sm border-t border-outline-variant pt-space-sm">
        {incident.actions.map((action) => {
          if (action === "removePost") {
            return (
              <button
                key={action}
                type="button"
                className="flex items-center gap-1 rounded-lg bg-danger px-4 py-1.5 font-label-md text-label-md text-white shadow-sm hover:opacity-90"
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
                className="flex items-center gap-1 rounded-lg bg-primary-container px-4 py-1.5 font-label-md text-label-md text-white shadow-sm hover:opacity-90"
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
              className="rounded-lg border border-outline-variant bg-surface-dim px-3 py-1.5 font-label-md text-label-md text-on-surface hover:bg-surface-container"
            >
              {action === "dismiss" ? t("dismissFlag") : t("askForVerification")}
            </button>
          );
        })}
      </div>
    </article>
  );
}
