import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { getAuditEvents } from "@/features/admin/queries";
import { getAdminCapabilities } from "@/lib/admin";
import { requireAdmin } from "@/lib/auth";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Admin.audit" });
  return { title: t("title") };
}

export default async function AdminAuditPage() {
  await requireAdmin();
  const capabilities = await getAdminCapabilities();
  const t = await getTranslations("Admin.audit");

  if (!capabilities.includes("audit.read")) {
    return (
      <div className="mx-auto max-w-3xl px-margin-mobile py-block md:px-margin">
        <h1 className="font-headline-lg text-headline-lg text-on-surface">{t("title")}</h1>
        <p className="mt-2 font-body-md text-body-md text-secondary">{t("forbidden")}</p>
      </div>
    );
  }

  const events = await getAuditEvents();

  return (
    <div className="mx-auto w-full max-w-[1000px] px-margin-mobile pt-block-mobile pb-page-mobile md:px-margin md:pt-block md:pb-page">
      <h1 className="font-display-md text-display-md-mobile text-on-surface md:text-display-md">
        {t("title")}
      </h1>
      <p className="mt-2 max-w-[70ch] font-body-md text-body-md text-secondary">{t("body")}</p>

      {events.length === 0 ? (
        <p className="mt-block rounded-2xl border border-dashed border-outline-variant p-space-lg text-center font-body-sm text-body-sm text-text-muted">
          {t("empty")}
        </p>
      ) : (
        <ul className="mt-space-lg divide-y divide-outline-variant overflow-hidden rounded-2xl border border-outline-variant bg-surface-low">
          {events.map((event) => (
            <li key={event.id} className="flex flex-col gap-1 p-space-md">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-label-lg text-label-lg font-semibold text-on-surface">
                  {event.action}
                </span>
                <span
                  className="font-label-md text-label-md text-text-muted"
                  suppressHydrationWarning
                >
                  {new Date(event.occurredAt).toLocaleString()}
                </span>
              </div>
              <span className="font-body-sm text-body-sm text-secondary">
                {event.actorRole ?? "admin"}
                {event.targetType ? ` · ${event.targetType}` : ""}
                {event.targetId ? ` ${event.targetId.slice(0, 8)}` : ""}
              </span>
              {event.reason ? (
                <span className="font-body-sm text-body-sm text-on-surface-strong">
                  {event.reason}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
