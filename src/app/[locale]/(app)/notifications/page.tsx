import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { Icon } from "@/components/ui/icon";
import { getNotifications, markAllNotificationsRead } from "@/features/notifications/queries";
import { Link } from "@/lib/i18n/navigation";
import { requireApprovedUser } from "@/lib/auth";
import { cn } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Notifications" });
  return { title: t("title") };
}

const HREF: Record<string, string> = {
  "post.removed": "/profile",
  "post.restored": "/profile",
  "appeal.declined": "/profile",
  "persona.approved": "/profile",
  "persona.rejected": "/profile",
  "persona.suspended": "/profile",
  "interest.approved": "/profile/edit",
  "interest.rejected": "/profile/edit",
};

export default async function NotificationsPage() {
  await requireApprovedUser();
  const t = await getTranslations("Notifications");

  // Read state is captured before the visit clears it, so unread rows still look
  // unread on this render.
  const notifications = await getNotifications();
  await markAllNotificationsRead();

  return (
    <div className="mx-auto w-full max-w-3xl px-margin-mobile py-block-mobile md:px-margin md:py-block">
      <h1 className="font-headline-lg text-headline-lg-mobile font-semibold text-on-surface md:text-headline-lg">
        {t("title")}
      </h1>
      <p className="mt-1 font-body-md text-body-md text-secondary">{t("intro")}</p>

      {notifications.length === 0 ? (
        <div className="mt-block flex flex-col items-center gap-space-sm rounded-2xl border border-dashed border-outline-variant px-space-lg py-block text-center">
          <Icon name="notifications" className="text-3xl text-secondary" />
          <p className="font-label-lg text-label-lg font-semibold text-on-surface">
            {t("emptyTitle")}
          </p>
          <p className="font-body-sm text-body-sm text-text-muted">{t("emptyBody")}</p>
        </div>
      ) : (
        <ul className="mt-space-lg divide-y divide-outline-variant overflow-hidden rounded-2xl border border-outline-variant bg-surface-low">
          {notifications.map((notification) => {
            const unread = notification.read_at === null;
            return (
              <li key={notification.id}>
                <Link
                  href={HREF[notification.type] ?? "/profile"}
                  className={cn(
                    "flex items-start gap-space-sm p-space-md transition-colors hover:bg-surface-container",
                    unread ? "bg-primary/5" : undefined,
                  )}
                >
                  <span
                    className={cn(
                      "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                      unread ? "bg-primary" : "bg-outline-variant",
                    )}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="font-label-lg text-label-lg font-semibold text-on-surface">
                        {t(`types.${notification.type}`)}
                      </span>
                      <span
                        className="font-label-md text-label-md text-text-muted"
                        suppressHydrationWarning
                      >
                        {new Date(notification.created_at).toLocaleDateString()}
                      </span>
                    </span>
                    {notification.reason ? (
                      <span className="mt-1 block font-body-sm text-body-sm text-secondary">
                        {notification.reason}
                      </span>
                    ) : null}
                  </span>
                  <Icon name="chevron_right" className="mt-0.5 text-base text-secondary" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
