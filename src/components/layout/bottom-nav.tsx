"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@/components/ui/icon";
import { LinkPending } from "@/components/layout/link-pending";
import { Link, usePathname } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";

const EASE = "ease-[cubic-bezier(0.32,0.72,0,1)]";

const NAV_ITEMS = [
  { href: "/discover", key: "discover", icon: "explore" },
  { href: "/posts", key: "posts", icon: "dynamic_feed" },
  { href: "/marketplace", key: "marketplace", icon: "storefront" },
  { href: "/connections", key: "connections", icon: "group" },
] as const;

/**
 * Mobile tab bar for the four primary destinations.
 *
 * The top pill only carries the brand, the locale switcher, the profile chip
 * and the menu toggle below `lg`, so the sheet it opens held all four
 * sections behind a tap. Promoting them to a persistent bottom bar keeps
 * one-tap reachability on phones, which is what a five-destination product
 * needs. Profile and the admin portal deliberately stay in the sheet — they
 * are occasional, not primary.
 *
 * Same floating-glass treatment as the top pill so the shell reads as one
 * system, and `backdrop-blur` is safe here because the element is fixed.
 */
export function BottomNav({ pendingRequests = 0 }: { pendingRequests?: number }) {
  const t = useTranslations("Nav");
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  // Admin has its own tab rail; the member destinations would compete with it
  // and eat the limited bottom space on phones.
  if (pathname.startsWith("/admin")) return null;

  return (
    <nav
      aria-label={t("primaryNavigation")}
      className="fixed inset-x-0 bottom-0 z-30 px-margin-mobile pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <div className="mx-auto mb-3 flex max-w-[1240px] items-stretch gap-0.5 rounded-full border border-outline-variant bg-surface-low/85 p-1 shadow-lift-sm backdrop-blur-xl">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex min-h-12 flex-1 flex-col items-center justify-center gap-0.5 rounded-full px-1 transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                EASE,
                active ? "bg-surface-container-high" : "hover:bg-surface-container",
              )}
            >
              <LinkPending />
              <span className="relative flex items-center justify-center">
                <Icon
                  name={item.icon}
                  filled={active}
                  className={cn(
                    "text-[22px] transition-colors",
                    active ? "text-primary" : "text-secondary",
                  )}
                />
                {item.key === "connections" && pendingRequests > 0 ? (
                  <span
                    className={cn(
                      "absolute -top-1 -right-[0.55rem] flex h-4 min-w-4 items-center justify-center rounded-full px-1 font-label-caps text-[11px] tabular-nums",
                      active ? "bg-primary text-on-primary" : "bg-primary/15 text-primary",
                    )}
                  >
                    {pendingRequests}
                  </span>
                ) : null}
              </span>
              <span
                className={cn(
                  "max-w-full truncate text-[10px] leading-none min-[360px]:text-[11px] min-[390px]:text-[12px]",
                  active ? "font-semibold text-on-surface" : "font-medium text-secondary",
                )}
              >
                {t(item.key)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
