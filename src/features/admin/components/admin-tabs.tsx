"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";

import { LinkPending } from "@/components/layout/link-pending";
import { Icon } from "@/components/ui/icon";
import { Link, usePathname } from "@/lib/i18n/navigation";
import type { AdminCapability } from "@/lib/admin-capabilities";
import { cn } from "@/lib/utils";

export const ADMIN_TABS = [
  { href: "/admin", key: "dashboard", icon: "dashboard", requires: "reports.manage" },
  { href: "/admin/users", key: "users", icon: "how_to_reg", requires: "members.review" },
  {
    href: "/admin/marketplace",
    key: "marketplace",
    icon: "storefront",
    requires: "marketplace.manage",
  },
  {
    href: "/admin/moderation",
    key: "moderation",
    icon: "gavel",
    requires: "reports.manage",
    requiresAny: ["reports.manage", "posts.moderate"],
  },
  { href: "/admin/audit", key: "audit", icon: "article", requires: "audit.read" },
  { href: "/admin/team", key: "team", icon: "badge", requires: "admins.manage" },
] as const satisfies ReadonlyArray<{
  href: string;
  key: string;
  icon: string;
  requires: AdminCapability | null;
  requiresAny?: readonly AdminCapability[];
}>;

export function AdminTabs({
  capabilities,
  counts,
}: {
  capabilities: AdminCapability[];
  /** Items waiting for a decision, shown as a badge on the matching tab. */
  counts?: { users: number; moderation: number };
}) {
  const t = useTranslations("Admin.tabs");
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);

  // On a phone the row scrolls sideways, so a desk further right (Audit, Team)
  // would open with its own tab off-screen. Bring the active tab into view by
  // moving the row only, never the page.
  useEffect(() => {
    const nav = navRef.current;
    const active = nav?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!nav || !active) return;
    const overflowRight =
      active.offsetLeft + active.offsetWidth - (nav.scrollLeft + nav.clientWidth);
    const overflowLeft = nav.scrollLeft - active.offsetLeft;
    if (overflowRight > 0) nav.scrollLeft += overflowRight + 24;
    else if (overflowLeft > 0) nav.scrollLeft -= overflowLeft + 24;
  }, [pathname]);

  return (
    <nav
      aria-label={t("label")}
      ref={navRef}
      className="relative -mx-margin-mobile -mb-space-md no-scrollbar flex items-stretch overflow-x-auto px-margin-mobile lg:mx-0 lg:px-0"
    >
      {ADMIN_TABS.filter((tab) =>
        "requiresAny" in tab
          ? tab.requiresAny.some((capability) => capabilities.includes(capability))
          : tab.requires === null || capabilities.includes(tab.requires),
      ).map((tab) => {
        const active =
          tab.href === "/admin" ? pathname === "/admin" : pathname.startsWith(tab.href);
        const badge =
          tab.key === "users" ? counts?.users : tab.key === "moderation" ? counts?.moderation : 0;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            aria-label={badge ? `${t(tab.key)} (${badge})` : t(tab.key)}
            className={cn(
              "relative inline-flex min-h-12 shrink-0 items-center gap-2 border-b-2 px-3 font-label-lg text-label-lg whitespace-nowrap transition-colors duration-200 first:pl-0 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary",
              active
                ? "border-primary font-semibold text-on-surface"
                : "border-transparent text-secondary hover:text-on-surface",
            )}
          >
            <LinkPending />
            <Icon
              name={tab.icon}
              className={cn("text-lg max-sm:hidden!", active && "text-primary")}
            />
            <span className="sm:hidden">{t(`${tab.key}Short`)}</span>
            <span className="hidden whitespace-nowrap sm:inline">{t(tab.key)}</span>
            {badge ? (
              <span
                aria-hidden
                className="min-w-5 rounded-full bg-danger px-1.5 py-0.5 text-center font-label-md text-label-md leading-none font-semibold text-on-error tabular-nums"
              >
                {badge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
