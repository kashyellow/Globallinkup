"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { BrandMark } from "@/components/ui/brand-mark";
import { DefaultAvatar } from "@/components/ui/default-avatar";
import { Icon } from "@/components/ui/icon";
import { Link, usePathname, useRouter } from "@/lib/i18n/navigation";
import { routing, type Locale } from "@/lib/i18n/routing";
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
  const router = useRouter();
  const locale = useLocale();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close the mobile sheet whenever the viewport grows past `lg`, otherwise it
  // sits expanded but hidden and reappears open on the next shrink.
  useEffect(() => {
    if (!menuOpen) return;
    const query = window.matchMedia("(min-width: 1024px)");
    const close = () => setMenuOpen(false);
    query.addEventListener("change", close);
    return () => query.removeEventListener("change", close);
  }, [menuOpen]);

  function switchLocale(next: Locale) {
    if (next === locale) return;
    router.replace(pathname, { locale: next });
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    /*
     * Floating glass pill rather than an edge-to-edge bar, matching the
     * marketing shell so the product reads as one system. Sits inside the 5rem
     * `pt-20` reserve declared by the (app) layout.
     */
    <header className="fixed inset-x-0 top-0 z-40 px-margin-mobile md:px-margin">
      <div className="mx-auto mt-3 flex h-14 max-w-[1240px] items-center justify-between gap-2 rounded-full border border-outline-variant bg-surface-low/85 pr-1.5 pl-1.5 shadow-lift-sm backdrop-blur-xl md:gap-space-md">
        <Link
          href="/discover"
          className="flex min-h-11 min-w-0 items-center gap-2 rounded-full px-2.5 py-1.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <BrandMark className="h-6 w-6 shrink-0 text-primary" />
          <span className="truncate font-headline-sm text-headline-sm leading-none font-bold tracking-tight text-on-surface">
            GlobalLinkup
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-2 font-label-lg text-label-lg transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                  EASE,
                  active
                    ? "bg-surface-container-high font-semibold text-on-surface"
                    : "font-medium text-secondary hover:bg-surface-container hover:text-on-surface",
                )}
              >
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
          <div className="hidden items-center rounded-full border border-outline-variant bg-surface-container p-0.5 sm:flex">
            {routing.locales.map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => switchLocale(code)}
                aria-current={code === locale ? "true" : undefined}
                className={cn(
                  "min-h-11 rounded-full px-2.5 font-label-md text-label-md transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:min-h-7",
                  EASE,
                  code === locale
                    ? "bg-surface-container-highest font-semibold text-on-surface"
                    : "font-medium text-text-muted hover:text-on-surface",
                )}
              >
                {code.toUpperCase()}
              </button>
            ))}
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
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-outline-variant bg-surface-container text-secondary transition-colors duration-300 hover:text-on-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary lg:hidden"
          >
            <Icon name={menuOpen ? "close" : "menu"} className="text-[20px]" />
          </button>
        </div>
      </div>

      {/*
       * Mobile sheet. Holds the occasional destinations only — profile, the admin
       * portal and the locale switch. The four primary sections move to the
       * bottom tab bar (`BottomNav`), which keeps them one tap away instead of
       * two. Animates opacity and transform only, and is fully removed from the
       * tab order while closed.
       */}
      <div
        className={cn(
          "mx-auto mt-2 max-w-[1240px] origin-top overflow-hidden rounded-[1.25rem] border border-outline-variant bg-surface-low/95 shadow-lift-lg backdrop-blur-xl transition-[opacity,transform] duration-500 lg:hidden",
          EASE,
          menuOpen
            ? "max-h-[calc(100dvh-5.5rem)] scale-100 opacity-100"
            : "pointer-events-none max-h-0 scale-[0.98] border-transparent opacity-0",
        )}
      >
        <nav className="max-h-[calc(100dvh-5.5rem)] overflow-y-auto p-2" aria-hidden={!menuOpen}>
          <Link
            href="/profile"
            onClick={() => setMenuOpen(false)}
            aria-current={isActive("/profile") ? "page" : undefined}
            tabIndex={menuOpen ? undefined : -1}
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
              tabIndex={menuOpen ? undefined : -1}
              className="flex min-h-12 items-center justify-between rounded-[0.75rem] px-3 py-2.5 font-label-lg text-label-lg text-secondary transition-colors duration-200 hover:bg-surface-container hover:text-on-surface"
            >
              {t("adminPortal")}
            </Link>
          ) : null}
          <div className="my-1 h-px bg-outline-variant" />

          {/*
           * The pill in the top bar only shows the switch from `sm` up, so the
           * sheet carries it too — otherwise a 360px phone has no way to change
           * locale.
           */}
          <div className="flex items-center justify-between gap-space-sm px-3 py-2">
            <span className="font-label-md text-label-md text-text-muted">{t("language")}</span>
            <div className="flex items-center gap-1" role="group" aria-label={t("language")}>
              {routing.locales.map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => switchLocale(code)}
                  aria-current={code === locale ? "true" : undefined}
                  tabIndex={menuOpen ? undefined : -1}
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
    </header>
  );
}
