"use client";

import { useTranslations } from "next-intl";

import { LinkPending } from "@/components/layout/link-pending";
import { Icon } from "@/components/ui/icon";
import { Link, usePathname } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";

export const ADMIN_TABS = [
  { href: "/admin", key: "dashboard", icon: "dashboard" },
  { href: "/admin/users", key: "users", icon: "how_to_reg" },
  { href: "/admin/marketplace", key: "marketplace", icon: "storefront" },
  { href: "/admin/moderation", key: "moderation", icon: "gavel" },
  { href: "/admin/interests", key: "interests", icon: "tag" },
] as const;

export function AdminTabs() {
  const t = useTranslations("Admin.tabs");
  const pathname = usePathname();

  return (
    <nav
      aria-label={t("label")}
      className="-mx-margin-mobile no-scrollbar flex items-center gap-1 overflow-x-auto px-margin-mobile pb-1 md:mx-0 md:px-0"
    >
      {ADMIN_TABS.map((tab) => {
        const active =
          tab.href === "/admin" ? pathname === "/admin" : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full px-space-md py-2 font-label-md text-label-md whitespace-nowrap transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
              active
                ? "bg-surface-container-high font-semibold text-on-surface"
                : "text-secondary hover:bg-surface-container hover:text-on-surface",
            )}
          >
            <LinkPending />
            <Icon name={tab.icon} className={cn("text-lg", active && "text-primary")} />
            {t(tab.key)}
          </Link>
        );
      })}
    </nav>
  );
}
