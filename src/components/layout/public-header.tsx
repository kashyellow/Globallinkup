"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { BrandMark } from "@/components/ui/brand-mark";
import { Icon } from "@/components/ui/icon";
import { useLocaleSwitch } from "@/features/shared/use-locale-switch";
import { Link, usePathname } from "@/lib/i18n/navigation";
import { routing, type Locale } from "@/lib/i18n/routing";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/login", key: "signIn" },
  { href: "/register", key: "register" },
] as const;

const EASE = "duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]";

/** Header for the unauthenticated surfaces (login, register, verify, persona setup). */
function LocaleSwitch({
  locale,
  onSwitch,
  disabled = false,
  className,
}: {
  locale: string;
  onSwitch: (next: Locale) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-0.5 rounded-full border border-outline-variant bg-surface-low p-1",
        className,
      )}
    >
      {routing.locales.map((code) => {
        const active = code === locale;
        return (
          <button
            key={code}
            type="button"
            onClick={() => onSwitch(code)}
            disabled={disabled}
            aria-busy={disabled || undefined}
            aria-pressed={active}
            className={cn(
              "min-h-11 min-w-11 rounded-full px-space-sm py-1 font-label-md text-label-md font-semibold transition-colors sm:min-h-8",
              EASE,
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px",
              active
                ? "bg-surface-container-high text-on-surface"
                : "text-secondary hover:text-on-surface",
            )}
          >
            {code.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}

export function PublicHeader() {
  const t = useTranslations("PublicNav");
  const pathname = usePathname();
  const { locale, pending: localePending, switchLocale } = useLocaleSwitch();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="fixed top-0 right-0 left-0 z-50 w-full border-b border-outline-variant bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-[1240px] items-center justify-between gap-space-sm px-margin-mobile lg:px-margin">
        <Link
          href="/"
          className="flex min-h-11 min-w-0 items-center gap-space-sm rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
        >
          <BrandMark className="h-8 w-8 shrink-0 text-primary" />
          <span className="flex min-w-0 flex-col">
            <span className="truncate font-headline-sm text-headline-sm leading-tight font-semibold text-on-surface">
              GlobalLinkup
            </span>
            <span className="hidden truncate font-label-md text-label-md text-secondary sm:block">
              {t("tagline")}
            </span>
          </span>
        </Link>

        <div className="flex shrink-0 items-center gap-space-sm lg:gap-space-md">
          <nav className="hidden items-center gap-1 sm:flex">
            {NAV.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex min-h-10 items-center rounded-full px-space-md py-2 font-label-md text-label-md transition-colors",
                    EASE,
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                    active
                      ? "bg-surface-container-high font-semibold text-on-surface"
                      : "text-secondary hover:bg-surface-container hover:text-on-surface",
                  )}
                >
                  {t(item.key)}
                </Link>
              );
            })}
          </nav>

          <LocaleSwitch locale={locale} onSwitch={switchLocale} disabled={localePending} />

          <div className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full border border-outline-variant bg-surface-container text-secondary sm:flex">
            <Icon name="person" className="text-lg" />
          </div>

          <button
            type="button"
            aria-label={t("toggleMenu")}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((value) => !value)}
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-outline-variant bg-surface-low text-secondary transition-colors sm:hidden",
              EASE,
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px",
            )}
          >
            <Icon name={menuOpen ? "close" : "menu"} className="text-lg" />
          </button>
        </div>
      </div>

      {menuOpen ? (
        <div className="border-t border-outline-variant bg-background px-margin-mobile py-space-sm sm:hidden">
          <nav className="flex flex-col gap-1">
            {NAV.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "rounded-full px-space-md py-3 font-label-md text-label-md transition-colors",
                    EASE,
                    active
                      ? "bg-surface-container-high font-semibold text-on-surface"
                      : "text-secondary hover:bg-surface-container hover:text-on-surface",
                  )}
                >
                  {t(item.key)}
                </Link>
              );
            })}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
