"use client";

import { useTranslations } from "next-intl";

import { Icon } from "@/components/ui/icon";
import { Link } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";

/**
 * Notification inbox entry point. The count comes from the server layout, so the
 * badge is correct on first paint; opening the inbox marks the list read.
 */
export function NotificationBell({ count, className }: { count: number; className?: string }) {
  const t = useTranslations("Notifications");

  return (
    <Link
      href="/notifications"
      aria-label={count > 0 ? t("bellWithCount", { count }) : t("bell")}
      title={t("bell")}
      className={cn(
        "relative flex h-10 w-10 items-center justify-center rounded-full text-secondary transition-colors duration-200 hover:bg-surface-container hover:text-on-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        className,
      )}
    >
      <Icon name="notifications" className="text-[20px]" />
      {count > 0 ? (
        <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 font-label-caps text-label-caps text-on-primary tabular-nums">
          {count > 9 ? "9+" : count}
        </span>
      ) : null}
    </Link>
  );
}
