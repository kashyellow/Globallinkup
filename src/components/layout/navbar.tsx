"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { BrandMark } from "@/components/ui/brand-mark";
import { Icon } from "@/components/ui/icon";
import { Link, usePathname, useRouter } from "@/lib/i18n/navigation";
import { routing, type Locale } from "@/lib/i18n/routing";
import { CURRENT_USER, PENDING_REQUEST_COUNT } from "@/lib/brand";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/discover", key: "discover" },
  { href: "/posts", key: "posts" },
  { href: "/marketplace", key: "marketplace" },
  { href: "/connections", key: "connections" },
] as const;

export function Navbar() {
  const t = useTranslations("Nav");
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const [menuOpen, setMenuOpen] = useState(false);

  function switchLocale(next: Locale) {
    if (next === locale) return;
    router.replace(pathname, { locale: next });
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="fixed top-0 right-0 left-0 z-50 border-b border-outline-variant bg-surface">
      <div className="mx-auto flex h-20 max-w-[1240px] items-center justify-between gap-space-md px-margin-mobile md:px-margin">
        <div className="flex items-center gap-space-md">
          <Link href="/discover" className="flex items-center gap-space-sm">
            <BrandMark className="h-8 w-8 shrink-0 text-primary-container" />
            <span className="font-headline-sm text-headline-sm font-semibold tracking-tight text-on-surface">
              GlobalLinkup
            </span>
          </Link>
        </div>

        <nav className="hidden items-center gap-space-xl lg:flex">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return item.key === "connections" ? (
              <div key={item.href} className="flex items-center gap-space-xs">
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "pb-1 font-label-lg text-label-lg transition-colors",
                    active
                      ? "border-b-2 border-primary-container font-semibold text-primary-container"
                      : "text-secondary hover:text-on-surface",
                  )}
                >
                  {t(item.key)}
                </Link>
                <span className="inline-flex items-center justify-center rounded-full border border-border-strong bg-secondary-container px-1.5 py-0.5 font-label-caps text-label-caps text-primary-container">
                  {PENDING_REQUEST_COUNT}
                </span>
              </div>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "pb-1 font-label-lg text-label-lg transition-colors",
                  active
                    ? "border-b-2 border-primary-container font-semibold text-primary-container"
                    : "text-secondary hover:text-on-surface",
                )}
              >
                {t(item.key)}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-space-md">
          <div className="hidden items-center rounded-xl border border-outline-variant bg-surface-low p-0.5 sm:flex">
            {routing.locales.map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => switchLocale(code)}
                className={cn(
                  "min-h-9 rounded px-2.5 py-1 font-label-caps text-label-caps uppercase transition-colors",
                  code === locale
                    ? "bg-secondary-container font-semibold text-on-surface-strong"
                    : "text-text-muted hover:text-on-surface",
                )}
              >
                {code}
              </button>
            ))}
          </div>

          <Link
            href="/admin"
            className="hidden items-center gap-1 rounded border border-outline-variant bg-surface-low px-space-sm py-1 font-label-md text-label-md text-secondary transition-colors hover:text-primary-container md:inline-flex"
          >
            <span className="font-label-caps text-label-caps tracking-wider uppercase">
              {t("adminPortal")}
            </span>
          </Link>

          <div className="flex items-center gap-space-xs border-l border-outline-variant pl-space-xs">
            <Link
              href="/profile"
              aria-current={isActive("/profile") ? "page" : undefined}
              className="group flex min-h-10 items-center gap-space-xs rounded-lg px-1 focus:outline-none"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt={t("profileAlt")}
                className={cn(
                  "h-8 w-8 rounded-full object-cover",
                  isActive("/profile")
                    ? "ring-2 ring-primary-container"
                    : "ring-1 ring-outline-variant",
                )}
                src={CURRENT_USER.avatarUrl}
              />
              <span className="hidden flex-col text-left xl:flex">
                <span
                  className={cn(
                    "font-label-md text-label-md leading-tight font-semibold",
                    isActive("/profile") ? "text-primary-container" : "text-on-surface",
                  )}
                >
                  {CURRENT_USER.name}
                </span>
                <span className="font-label-caps text-label-caps leading-tight text-text-muted">
                  {CURRENT_USER.meta}
                </span>
              </span>
              <Icon
                name="expand_more"
                className="text-base text-text-muted transition-colors group-hover:text-on-surface"
              />
            </Link>
          </div>

          <button
            type="button"
            aria-label={t("toggleMenu")}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-secondary transition-colors hover:text-on-surface lg:hidden"
          >
            <Icon name={menuOpen ? "close" : "menu"} />
          </button>
        </div>
      </div>

      {menuOpen ? (
        <nav className="border-t border-outline-variant bg-surface px-margin-mobile py-space-sm lg:hidden">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={cn(
                "block py-2 font-label-lg text-label-lg transition-colors",
                isActive(item.href) ? "text-primary-container" : "text-secondary",
              )}
            >
              {t(item.key)}
            </Link>
          ))}
          <Link
            href="/profile"
            onClick={() => setMenuOpen(false)}
            aria-current={isActive("/profile") ? "page" : undefined}
            className={cn(
              "block py-2 font-label-lg text-label-lg transition-colors",
              isActive("/profile") ? "text-primary-container" : "text-secondary",
            )}
          >
            {t("profile")}
          </Link>
          <Link
            href="/admin"
            onClick={() => setMenuOpen(false)}
            className="block py-2 font-label-lg text-label-lg text-secondary transition-colors"
          >
            {t("adminPortal")}
          </Link>
        </nav>
      ) : null}
    </header>
  );
}
