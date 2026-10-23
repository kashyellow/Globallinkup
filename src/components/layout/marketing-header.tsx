"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { BrandMark } from "@/components/ui/brand-mark";
import { Icon } from "@/components/ui/icon";
import { useLocaleSwitch } from "@/features/shared/use-locale-switch";
import { Link } from "@/lib/i18n/navigation";
import { routing, type Locale } from "@/lib/i18n/routing";
import { cn } from "@/lib/utils";

/**
 * Landing-page nav targets. The marketing shell only wraps the landing page, so
 * these are in-page anchors that scroll to a section rather than app routes.
 * Order tracks the mockup and the page's own section order.
 */
const SECTION_LINKS = [
  { anchor: "how-it-works", key: "howItWorks" },
  { anchor: "people", key: "discoverPeople" },
  { anchor: "dispatches", key: "fieldDispatches" },
  { anchor: "marketplace", key: "artisanMarketplace" },
] as const;

const EASE = "ease-[cubic-bezier(0.32,0.72,0,1)]";

function LocaleSwitch({
  locale,
  onSwitch,
  label,
  disabled = false,
  className,
}: {
  locale: string;
  onSwitch: (next: Locale) => void;
  label: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-1", className)} role="group" aria-label={label}>
      {routing.locales.map((code, index) => (
        <span key={code} className="flex items-center gap-1">
          {index > 0 ? (
            <span aria-hidden className="h-1 w-1 rounded-full bg-outline-strong" />
          ) : null}
          <button
            type="button"
            onClick={() => onSwitch(code)}
            disabled={disabled}
            aria-busy={disabled || undefined}
            aria-current={code === locale ? "true" : undefined}
            className={cn(
              "min-h-9 rounded-full px-1.5 font-label-md text-label-md transition-colors duration-300",
              EASE,
              code === locale
                ? "font-bold text-on-surface"
                : "font-medium text-text-muted hover:text-on-surface",
            )}
          >
            {code.toUpperCase()}
          </button>
        </span>
      ))}
    </div>
  );
}

export function MarketingHeader() {
  const t = useTranslations("MarketingNav");
  const { locale, pending: localePending, switchLocale } = useLocaleSwitch();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close the mobile sheet whenever the viewport grows past `xl`, otherwise it
  // sits expanded but hidden and reappears open on the next shrink.
  useEffect(() => {
    if (!menuOpen) return;
    const query = window.matchMedia("(min-width: 1280px)");
    const close = () => setMenuOpen(false);
    query.addEventListener("change", close);
    return () => query.removeEventListener("change", close);
  }, [menuOpen]);

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-outline-variant bg-marketing-shell/92 backdrop-blur-xl">
      <div className="mx-auto grid h-20 w-full max-w-[1240px] grid-cols-[auto_1fr_auto] items-center gap-space-md px-margin-mobile md:px-margin">
        <a
          href="#hero"
          className="flex min-h-11 min-w-0 items-center gap-2.5 rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary">
            <BrandMark className="h-6 w-6" />
          </span>
          <span className="flex min-w-0 flex-col leading-none">
            <span className="truncate font-headline-sm text-headline-sm font-bold tracking-tight text-on-surface">
              GlobalLinkup
            </span>
            <span className="mt-0.5 hidden truncate font-label-caps text-label-caps tracking-[0.16em] text-text-muted uppercase sm:block">
              {t("tagline")}
            </span>
          </span>
        </a>

        <nav className="hidden items-center justify-center gap-1 xl:flex">
          {SECTION_LINKS.map((item) => (
            <a
              key={item.anchor}
              href={`#${item.anchor}`}
              className="rounded-full px-3 py-2 font-label-lg text-label-lg font-medium whitespace-nowrap text-on-surface-variant transition-colors duration-300 hover:bg-marketing-raised hover:text-on-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              {t(item.key)}
            </a>
          ))}
        </nav>

        <div className="col-start-3 flex shrink-0 items-center gap-2">
          <LocaleSwitch
            locale={locale}
            onSwitch={switchLocale}
            label={t("language")}
            disabled={localePending}
            className="hidden sm:flex"
          />

          <Link
            href="/login"
            className="hidden min-h-9 items-center rounded-full px-3 font-label-lg text-label-lg font-medium text-on-surface-variant transition-colors duration-300 hover:text-on-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:inline-flex"
          >
            {t("signIn")}
          </Link>

          <Link
            href="/register"
            className="group inline-flex h-10 items-center gap-1.5 rounded-full bg-primary pr-1.5 pl-1.5 font-label-lg text-label-lg whitespace-nowrap text-on-primary transition-colors duration-300 hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:pl-4"
          >
            <span className="md:hidden">{t("joinShort")}</span>
            <span className="hidden md:inline">{t("join")}</span>
            <span
              className={cn(
                "hidden h-7 w-7 items-center justify-center rounded-full bg-on-primary/15 transition-transform duration-500 sm:flex",
                EASE,
                "group-hover:translate-x-0.5 group-hover:-translate-y-px",
              )}
            >
              <Icon name="north_east" className="text-[15px]" />
            </span>
          </Link>

          <button
            type="button"
            aria-label={t("toggleMenu")}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-outline-variant bg-marketing-raised text-on-surface-variant transition-colors duration-300 hover:text-on-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary xl:hidden"
          >
            <Icon name={menuOpen ? "close" : "menu"} className="text-[20px]" />
          </button>
        </div>
      </div>

      {/*
       * Mobile sheet. Animates opacity and transform only, and is fully removed
       * from the tab order while closed.
       */}
      <div
        className={cn(
          "origin-top overflow-hidden border-b border-outline-variant bg-marketing-shell/98 shadow-lift-lg transition-[max-height,opacity] duration-500 xl:hidden",
          EASE,
          menuOpen
            ? "max-h-[calc(100dvh-5rem)] opacity-100"
            : "max-h-0 border-transparent opacity-0",
        )}
      >
        <nav
          className="mx-auto max-h-[calc(100dvh-5rem)] w-full max-w-[1240px] overflow-y-auto px-margin-mobile py-2 md:px-margin"
          aria-hidden={!menuOpen}
        >
          {SECTION_LINKS.map((item) => (
            <a
              key={item.anchor}
              href={`#${item.anchor}`}
              onClick={() => setMenuOpen(false)}
              tabIndex={menuOpen ? undefined : -1}
              className="block rounded-xl px-3 py-3 font-label-lg text-label-lg text-on-surface-variant transition-colors duration-300 hover:bg-marketing-raised hover:text-on-surface"
            >
              {t(item.key)}
            </a>
          ))}
          <Link
            href="/login"
            onClick={() => setMenuOpen(false)}
            tabIndex={menuOpen ? undefined : -1}
            className="block rounded-xl px-3 py-3 font-label-lg text-label-lg text-on-surface-variant transition-colors duration-300 hover:bg-marketing-raised hover:text-on-surface"
          >
            {t("signIn")}
          </Link>

          <div className="flex items-center justify-between gap-space-sm border-t border-outline-variant px-3 py-3">
            <span className="font-label-md text-label-md text-text-muted">{t("language")}</span>
            <div className="flex items-center gap-1" role="group" aria-label={t("language")}>
              {routing.locales.map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => {
                    switchLocale(code);
                    setMenuOpen(false);
                  }}
                  aria-pressed={code === locale}
                  disabled={localePending}
                  aria-busy={localePending || undefined}
                  tabIndex={menuOpen ? undefined : -1}
                  className={cn(
                    "flex min-h-11 min-w-11 items-center justify-center rounded-full border px-3 font-label-md text-label-md transition-colors duration-200",
                    code === locale
                      ? "border-primary bg-primary/10 font-semibold text-primary"
                      : "border-outline-variant text-secondary hover:bg-marketing-raised hover:text-on-surface",
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
