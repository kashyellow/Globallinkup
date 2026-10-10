"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { Link, usePathname, useRouter } from "@/lib/i18n/navigation";
import { routing, type Locale } from "@/lib/i18n/routing";
import { cn } from "@/lib/utils";

/**
 * Landing-page nav targets. The marketing shell only wraps the landing page, so
 * these are in-page anchors that scroll to a section rather than app routes.
 */
const SECTION_LINKS = [
  { anchor: "how-it-works", key: "howItWorks" },
  { anchor: "pillars", key: "theThree" },
  { anchor: "privacy-protocol", key: "privacyProtocol" },
] as const;

const EASE = "ease-[cubic-bezier(0.32,0.72,0,1)]";

function LocaleSwitch({ locale, onSwitch }: { locale: string; onSwitch: (next: Locale) => void }) {
  return (
    <div className="flex items-center rounded-full border border-outline-variant bg-marketing-raised p-0.5">
      {routing.locales.map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => onSwitch(code)}
          aria-current={code === locale ? "true" : undefined}
          className={cn(
            "min-h-7 rounded-full px-2.5 font-label-md text-label-md transition-colors duration-300",
            EASE,
            code === locale
              ? "bg-marketing-high font-semibold text-on-surface"
              : "font-medium text-text-muted hover:text-on-surface",
          )}
        >
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

export function MarketingHeader() {
  const t = useTranslations("MarketingNav");
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

  return (
    /*
     * A floating glass pill instead of an edge-to-edge bar: detached from the top
     * of the viewport so the page reads as a surface the nav sits on. Sits inside
     * the 5rem `pt-20` reserve declared by the marketing layout.
     */
    <header className="fixed inset-x-0 top-0 z-40 px-margin-mobile md:px-margin">
      <div className="mx-auto mt-3 flex h-14 max-w-[1240px] items-center justify-between gap-2 rounded-full border border-outline-variant bg-marketing-shell/80 pr-1.5 pl-4 shadow-lift-sm backdrop-blur-xl md:gap-space-md">
        <a
          href="#hero"
          className="flex min-w-0 items-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
        >
          <span className="truncate font-headline-sm text-headline-sm leading-none font-bold tracking-tight text-on-surface">
            GlobalLinkup
          </span>
        </a>

        <nav className="hidden items-center gap-1 lg:flex">
          {SECTION_LINKS.map((item) => (
            <a
              key={item.anchor}
              href={`#${item.anchor}`}
              className={cn(
                "rounded-full px-3 py-2 font-label-lg text-label-lg text-on-surface-variant transition-colors duration-300 hover:bg-marketing-raised hover:text-on-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                EASE,
              )}
            >
              {t(item.key)}
            </a>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <LocaleSwitch locale={locale} onSwitch={switchLocale} />

          {/* One sign-in affordance and one join affordance, both single-line. */}
          <Link
            href="/login"
            className="hidden min-h-9 items-center rounded-full px-3.5 font-label-lg text-label-lg font-medium text-on-surface-variant transition-colors duration-300 hover:text-on-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:inline-flex"
          >
            {t("signIn")}
          </Link>

          <Link
            href="/register"
            className="group inline-flex h-9 items-center gap-1.5 rounded-full bg-primary pr-1.5 pl-4 font-label-lg text-label-lg whitespace-nowrap text-on-primary transition-colors duration-300 hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <span className="hidden sm:inline">{t("join")}</span>
            <span className="sm:hidden">{t("joinShort")}</span>
            <span
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full bg-on-primary/15 transition-transform duration-500",
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
            className="flex h-9 w-9 items-center justify-center rounded-full border border-outline-variant bg-marketing-raised text-on-surface-variant transition-colors duration-300 hover:text-on-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary lg:hidden"
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
          "mx-auto mt-2 max-w-[1240px] origin-top overflow-hidden rounded-[1.25rem] border border-outline-variant bg-marketing-shell/95 shadow-lift-lg backdrop-blur-xl transition-[opacity,transform] duration-500 lg:hidden",
          EASE,
          menuOpen
            ? "max-h-[calc(100dvh-5.5rem)] scale-100 opacity-100"
            : "pointer-events-none max-h-0 scale-[0.98] border-transparent opacity-0",
        )}
      >
        <nav className="max-h-[calc(100dvh-5.5rem)] overflow-y-auto p-2" aria-hidden={!menuOpen}>
          {SECTION_LINKS.map((item) => (
            <a
              key={item.anchor}
              href={`#${item.anchor}`}
              onClick={() => setMenuOpen(false)}
              tabIndex={menuOpen ? undefined : -1}
              className="block rounded-xl px-4 py-3 font-label-lg text-label-lg text-on-surface-variant transition-colors duration-300 hover:bg-marketing-raised hover:text-on-surface"
            >
              {t(item.key)}
            </a>
          ))}
          <Link
            href="/login"
            onClick={() => setMenuOpen(false)}
            tabIndex={menuOpen ? undefined : -1}
            className="block rounded-xl px-4 py-3 font-label-lg text-label-lg text-on-surface-variant transition-colors duration-300 hover:bg-marketing-raised hover:text-on-surface"
          >
            {t("signIn")}
          </Link>
        </nav>
      </div>
    </header>
  );
}
