"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { LocaleSwitch } from "@/components/layout/locale-switch";
import { LinkPending } from "@/components/layout/link-pending";
import { BrandMark } from "@/components/ui/brand-mark";
import { DefaultAvatar } from "@/components/ui/default-avatar";
import { Icon } from "@/components/ui/icon";
import { useLocaleSwitch } from "@/features/shared/use-locale-switch";
import { Link, usePathname } from "@/lib/i18n/navigation";
import { routing } from "@/lib/i18n/routing";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/discover", key: "discover" },
  { href: "/posts", key: "posts" },
  { href: "/marketplace", key: "marketplace" },
  { href: "/connections", key: "connections" },
] as const;

const EASE = "ease-[cubic-bezier(0.32,0.72,0,1)]";

export function Navbar({
  isAdmin = false,
  viewerName,
  viewerAvatar,
  pendingRequests = 0,
}: {
  isAdmin?: boolean;
  viewerName: string;
  viewerAvatar: string | null;
  /** Inbound requests awaiting review, from the layout's count query. */
  pendingRequests?: number;
}) {
  const t = useTranslations("Nav");
  const pathname = usePathname();
  const { locale, pending: localePending, switchLocale } = useLocaleSwitch();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const query = window.matchMedia("(min-width: 1024px)");
    const close = () => setMenuOpen(false);
    query.addEventListener("change", close);
    return () => query.removeEventListener("change", close);
  }, [menuOpen]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-outline-variant bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex h-20 w-full max-w-[1240px] items-center justify-between gap-space-sm px-margin-mobile md:px-margin">
        <Link
          href="/discover"
          className="flex min-h-11 min-w-0 items-center gap-2.5 rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary">
            <BrandMark className="h-5 w-5" />
          </span>
          <span className="flex min-w-0 flex-col leading-none">
            <span className="truncate font-headline-sm text-headline-sm font-bold tracking-tight text-on-surface">
              GlobalLinkup
            </span>
            <span className="mt-0.5 hidden truncate font-label-md text-label-md text-secondary sm:block">
              {t("tagline")}
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label={t("primaryNavigation")}>
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 py-2 font-label-lg text-label-lg transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                  EASE,
                  active
                    ? "bg-surface-container-high font-semibold text-on-surface"
                    : "font-medium text-secondary hover:bg-surface-container hover:text-on-surface",
                )}
              >
                <LinkPending />
                {t(item.key)}
                {item.key === "connections" && pendingRequests > 0 ? (
                  <span
                    className={cn(
                      "inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 font-label-caps text-label-caps tabular-nums",
                      active
                        ? "bg-primary/20 text-primary"
                        : "bg-surface-container-highest text-secondary",
                    )}
                  >
                    {pendingRequests}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <div className="hidden sm:block">
            <LocaleSwitch
              locale={locale}
              onSwitch={switchLocale}
              disabled={localePending}
              label={t("language")}
            />
          </div>

          {isAdmin ? (
            <Link
              href="/admin"
              className="hidden min-h-9 items-center rounded-full px-3 font-label-lg text-label-lg font-medium text-secondary transition-colors duration-300 hover:text-on-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:inline-flex"
            >
              {t("adminPortal")}
            </Link>
          ) : null}

          <Link
            href="/profile"
            aria-current={isActive("/profile") ? "page" : undefined}
            className={cn(
              "flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-full py-0.5 pr-2.5 pl-0.5 transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
              EASE,
              isActive("/profile") ? "bg-surface-container-high" : "hover:bg-surface-container",
            )}
          >
            {viewerAvatar ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt={t("profileAlt")}
                  className={cn(
                    "h-7 w-7 rounded-full object-cover",
                    isActive("/profile") ? "ring-2 ring-primary" : "ring-1 ring-outline-variant",
                  )}
                  src={viewerAvatar}
                />
              </>
            ) : (
              <DefaultAvatar
                className={cn(
                  "h-7 w-7 rounded-full",
                  isActive("/profile") ? "ring-2 ring-primary" : "ring-1 ring-outline-variant",
                )}
              />
            )}
            <span
              className={cn(
                "hidden font-label-lg text-label-lg leading-none font-semibold xl:inline",
                isActive("/profile") ? "text-on-surface" : "text-secondary",
              )}
            >
              {viewerName}
            </span>
          </Link>

          <button
            type="button"
            aria-label={t("toggleMenu")}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((value) => !value)}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-outline-variant bg-surface-container text-secondary transition-colors duration-300 hover:text-on-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary lg:hidden"
          >
            <Icon name={menuOpen ? "close" : "menu"} className="text-[20px]" />
          </button>
        </div>
      </div>

      {menuOpen ? (
        <div className="border-t border-outline-variant bg-background px-margin-mobile py-2 md:px-margin lg:hidden">
          <nav
            aria-label={t("primaryNavigation")}
            className="mx-auto max-h-[calc(100dvh-5rem)] w-full max-w-[1240px] overflow-y-auto"
          >
            <Link
              href="/profile"
              onClick={() => setMenuOpen(false)}
              aria-current={isActive("/profile") ? "page" : undefined}
              className={cn(
                "flex min-h-12 items-center justify-between rounded-[0.75rem] px-3 py-2.5 font-label-lg text-label-lg transition-colors duration-200",
                isActive("/profile")
                  ? "bg-surface-container-high font-semibold text-on-surface"
                  : "text-secondary hover:bg-surface-container hover:text-on-surface",
              )}
            >
              {t("profile")}
              {viewerAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt=""
                  aria-hidden
                  className="h-6 w-6 rounded-full object-cover ring-1 ring-outline-variant"
                  src={viewerAvatar}
                />
              ) : (
                <DefaultAvatar className="h-6 w-6 rounded-full ring-1 ring-outline-variant" />
              )}
            </Link>
            {isAdmin ? (
              <Link
                href="/admin"
                onClick={() => setMenuOpen(false)}
                className="flex min-h-12 items-center justify-between rounded-[0.75rem] px-3 py-2.5 font-label-lg text-label-lg text-secondary transition-colors duration-200 hover:bg-surface-container hover:text-on-surface"
              >
                {t("adminPortal")}
              </Link>
            ) : null}
            <div className="my-1 h-px bg-outline-variant" />

            <div className="flex items-center justify-between gap-space-sm px-3 py-2 sm:hidden">
              <span className="font-label-md text-label-md text-text-muted">{t("language")}</span>
              <div className="flex items-center gap-1" role="group" aria-label={t("language")}>
                {routing.locales.map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => switchLocale(code)}
                    disabled={localePending}
                    aria-busy={localePending || undefined}
                    aria-current={code === locale ? "true" : undefined}
                    className={cn(
                      "flex min-h-11 min-w-11 items-center justify-center rounded-full border px-3 font-label-md text-label-md transition-colors duration-200",
                      code === locale
                        ? "border-primary bg-primary/15 font-semibold text-primary"
                        : "border-outline-variant text-secondary hover:bg-surface-container hover:text-on-surface",
                    )}
                  >
                    {code.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
