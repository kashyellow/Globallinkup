"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import { Link, usePathname, useRouter } from "@/lib/i18n/navigation";
import { routing, type Locale } from "@/lib/i18n/routing";
import { cn } from "@/lib/utils";

/**
 * Landing-page nav targets. The marketing shell only wraps the landing page, so these
 * are in-page anchors that scroll to a section rather than navigating into the app.
 */
const SECTION_LINKS = [
  { anchor: "discover-personas", key: "discoverPersonas" },
  { anchor: "editorial-feed", key: "editorialFeed" },
  { anchor: "artisan-goods", key: "artisanGoods" },
] as const;

/** Marketing header used on the public landing page. */
function LocaleSwitch({
  locale,
  onSwitch,
  className,
}: {
  locale: string;
  onSwitch: (next: Locale) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center rounded-full border border-[#282622] bg-[#201E1B] p-1",
        className,
      )}
    >
      {routing.locales.map((code, index) => (
        <span key={code} className="flex items-center">
          {index > 0 ? <span className="px-0.5 text-xs text-[#5B564E]">|</span> : null}
          <button
            type="button"
            onClick={() => onSwitch(code)}
            className={cn(
              "min-h-8 rounded-full px-2.5 py-1 font-label-md text-label-md transition-colors",
              code === locale
                ? "bg-[#2E2B27] font-semibold text-[#F5F2EB]"
                : "font-medium text-[#9E988F] hover:text-[#F5F2EB]",
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
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const [menuOpen, setMenuOpen] = useState(false);

  function switchLocale(next: Locale) {
    if (next === locale) return;
    router.replace(pathname, { locale: next });
  }

  return (
    <header className="fixed top-0 right-0 left-0 z-50 border-b border-[#282622] bg-[#161513]/95 shadow-md backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-[1280px] items-center justify-between gap-2 px-margin-mobile md:gap-space-md md:px-margin">
        <div className="flex min-w-0 items-center gap-space-md">
          <a href="#hero" className="flex min-w-0 items-center gap-3">
            <span className="flex min-w-0 flex-col">
              <span className="truncate font-headline-sm text-headline-sm leading-none font-bold tracking-tight text-[#F5F2EB]">
                GlobalLinkup
              </span>
              <span className="mt-0.5 truncate font-label-caps text-[10px] font-bold tracking-widest text-[#E86A5B] uppercase">
                {t("tagline")}
              </span>
            </span>
          </a>
          <div className="ml-2 hidden items-center gap-1.5 rounded-full border border-[#2E2B27] bg-[#201E1B] px-2.5 py-1 font-label-caps text-label-caps tracking-wider text-[#C4BEB5] uppercase xl:inline-flex">
            <span className="h-1.5 w-1.5 rounded-full bg-[#38a36f]" />
            <span>{t("vettedBadge")}</span>
          </div>
        </div>

        <nav className="hidden items-center gap-6 lg:flex xl:gap-8">
          <a
            href="#how-it-works"
            className="relative rounded-sm py-1 font-label-lg text-label-lg font-medium text-[#F5F2EB] transition-colors after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-[#E86A5B] hover:text-[#E86A5B]"
          >
            {t("howItWorks")}
          </a>
          {SECTION_LINKS.map((item) => (
            <a
              key={item.anchor}
              href={`#${item.anchor}`}
              className="py-1 font-label-lg text-label-lg text-[#9E988F] transition-colors hover:text-[#F5F2EB]"
            >
              {t(item.key)}
            </a>
          ))}
          <a
            href="#privacy-protocol"
            className="flex items-center gap-1 py-1 font-label-lg text-label-lg text-[#9E988F] transition-colors hover:text-[#F5F2EB]"
          >
            <Icon name="verified_user" className="text-[16px] text-[#38a36f]" />
            <span>{t("privacyProtocol")}</span>
          </a>
        </nav>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <LocaleSwitch locale={locale} onSwitch={switchLocale} className="hidden sm:flex" />

          <Link
            href="/login"
            className="hidden min-h-10 items-center justify-center rounded-full px-4 py-2 font-label-lg text-label-lg font-medium text-[#C4BEB5] transition-colors hover:bg-[#201E1B] hover:text-[#F5F2EB] md:inline-flex"
          >
            {t("signIn")}
          </Link>

          <Link
            href="/register"
            className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full bg-[#E86A5B] px-4 py-2.5 font-label-lg text-label-lg font-semibold text-white shadow-sm transition-all hover:bg-[#d4584a] sm:px-5"
          >
            <span className="hidden sm:inline">{t("join")}</span>
            <span className="sm:hidden">{t("joinShort")}</span>
            <Icon name="north_east" className="text-[18px]" />
          </Link>

          <div className="hidden h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-[#2E2B27] bg-[#24211D] text-[#C4BEB5] transition-colors hover:bg-[#2A2723] hover:text-[#F5F2EB] lg:flex">
            <Icon name="person" className="text-[20px]" />
          </div>

          <button
            type="button"
            aria-label={t("toggleMenu")}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#2E2B27] bg-[#201E1B] text-[#C4BEB5] transition-colors hover:text-[#F5F2EB] lg:hidden"
          >
            <Icon name={menuOpen ? "close" : "menu"} className="text-[22px]" />
          </button>
        </div>
      </div>

      {menuOpen ? (
        <div className="max-h-[calc(100vh-5rem)] overflow-y-auto border-t border-[#282622] bg-[#161513] px-margin-mobile py-space-md md:px-margin lg:hidden">
          <nav className="flex flex-col">
            <a
              href="#how-it-works"
              onClick={() => setMenuOpen(false)}
              className="border-b border-[#282622] py-3 font-label-lg text-label-lg font-semibold text-[#F5F2EB]"
            >
              {t("howItWorks")}
            </a>
            {SECTION_LINKS.map((item) => (
              <a
                key={item.anchor}
                href={`#${item.anchor}`}
                onClick={() => setMenuOpen(false)}
                className="border-b border-[#282622] py-3 font-label-lg text-label-lg text-[#C4BEB5]"
              >
                {t(item.key)}
              </a>
            ))}
            <a
              href="#privacy-protocol"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 border-b border-[#282622] py-3 font-label-lg text-label-lg text-[#C4BEB5]"
            >
              <Icon name="verified_user" className="text-[16px] text-[#38a36f]" />
              <span>{t("privacyProtocol")}</span>
            </a>
            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="border-b border-[#282622] py-3 font-label-lg text-label-lg text-[#C4BEB5]"
            >
              {t("signIn")}
            </Link>
          </nav>
          <div className="flex items-center justify-between gap-space-sm pt-space-md sm:hidden">
            <span className="font-label-caps text-label-caps tracking-wider text-[#9E988F] uppercase">
              {t("language")}
            </span>
            <LocaleSwitch locale={locale} onSwitch={switchLocale} />
          </div>
        </div>
      ) : null}
    </header>
  );
}
