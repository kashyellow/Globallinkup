"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { BrandMark } from "@/components/ui/brand-mark";
import { Icon } from "@/components/ui/icon";
import { Link } from "@/lib/i18n/navigation";
import { routing, type Locale } from "@/lib/i18n/routing";
import { useLocaleSwitch } from "@/features/shared/use-locale-switch";
import { cn } from "@/lib/utils";

const EASE = "ease-[cubic-bezier(0.32,0.72,0,1)]";

const SECTION_LINKS = [
  { anchor: "how-it-works", key: "howItWorks" },
  { anchor: "people", key: "discoverPeople" },
  { anchor: "dispatches", key: "fieldDispatches" },
  { anchor: "marketplace", key: "artisanMarketplace" },
] as const;

function LocaleSwitch({
  locale,
  onSwitch,
  disabled = false,
  label,
}: {
  locale: string;
  onSwitch: (next: Locale) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <div className="flex items-center gap-1" role="group" aria-label={label}>
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
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60",
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

/**
 * One header for the whole public site.
 *
 * `landing` keeps the section nav, auth CTAs and the mobile burger; `content`
 * (auth/legal pages) only needs the brand and the locale switch.
 */
export function SiteHeader({ mode = "content" }: { mode?: "landing" | "content" }) {
  const t = useTranslations("MarketingNav");
  const { locale, pending: localePending, switchLocale } = useLocaleSwitch();
  const [menuOpen, setMenuOpen] = useState(false);
  const isLanding = mode === "landing";

  useEffect(() => {
    if (!menuOpen) return;
    const query = window.matchMedia("(min-width: 1280px)");
    const close = () => setMenuOpen(false);
    query.addEventListener("change", close);
    return () => query.removeEventListener("change", close);
  }, [menuOpen]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-outline-variant bg-background/90 backdrop-blur-xl">
      <div className="gap-space-xsm mx-auto flex h-20 w-full max-w-[1240px] items-center justify-between px-margin-mobile md:px-margin">
        <Link
          href="/"
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

        {isLanding ? (
          <>
            <nav className="hidden items-center justify-center gap-1 xl:flex">
              {SECTION_LINKS.map((item) => (
                <a
                  key={item.anchor}
                  href={`#${item.anchor}`}
                  className="rounded-full px-3 py-2 font-label-lg text-label-lg font-medium whitespace-nowrap text-on-surface-variant transition-colors duration-300 hover:bg-surface-container hover:text-on-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  {t(item.key)}
                </a>
              ))}
            </nav>

            <div className="flex shrink-0 items-center gap-2">
              <LocaleSwitch
                locale={locale}
                onSwitch={switchLocale}
                disabled={localePending}
                label={t("language")}
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
                onClick={() => setMenuOpen((value) => !value)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-outline-variant bg-surface-container text-secondary transition-colors duration-300 hover:text-on-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary xl:hidden"
              >
                <Icon name={menuOpen ? "close" : "menu"} className="text-[20px]" />
              </button>
            </div>
          </>
        ) : (
          <LocaleSwitch
            locale={locale}
            onSwitch={switchLocale}
            disabled={localePending}
            label={t("language")}
          />
        )}
      </div>

      {isLanding && menuOpen ? (
        <div className="border-t border-outline-variant bg-background px-margin-mobile py-2 md:px-margin xl:hidden">
          <nav className="mx-auto max-h-[calc(100dvh-5rem)] w-full max-w-[1240px] overflow-y-auto">
            {SECTION_LINKS.map((item) => (
              <a
                key={item.anchor}
                href={`#${item.anchor}`}
                onClick={() => setMenuOpen(false)}
                className="block rounded-xl px-3 py-3 font-label-lg text-label-lg text-on-surface-variant transition-colors duration-300 hover:bg-surface-container hover:text-on-surface"
              >
                {t(item.key)}
              </a>
            ))}
            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="block rounded-xl px-3 py-3 font-label-lg text-label-lg text-on-surface-variant transition-colors duration-300 hover:bg-surface-container hover:text-on-surface"
            >
              {t("signIn")}
            </Link>
            <Link
              href="/register"
              onClick={() => setMenuOpen(false)}
              className="block rounded-xl px-3 py-3 font-label-lg text-label-lg font-semibold text-primary transition-colors duration-300 hover:bg-surface-container"
            >
              {t("join")}
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
