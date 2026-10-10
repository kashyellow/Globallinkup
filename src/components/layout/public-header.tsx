"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { BrandMark } from "@/components/ui/brand-mark";
import { Icon } from "@/components/ui/icon";
import { Link, usePathname, useRouter } from "@/lib/i18n/navigation";
import { routing, type Locale } from "@/lib/i18n/routing";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/login", key: "signIn" },
  { href: "/register", key: "register" },
] as const;

/** Header for the unauthenticated surfaces (login, register, verify, persona setup). */
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
        "flex items-center rounded-lg border border-outline-variant bg-surface-low px-space-sm py-space-xs",
        className,
      )}
    >
      {routing.locales.map((code, index) => (
        <span key={code} className="flex items-center">
          {index > 0 ? <span className="px-1 font-body-sm text-outline-variant">|</span> : null}
          <button
            type="button"
            onClick={() => onSwitch(code)}
            className={cn(
              "min-h-8 px-space-xs py-1 font-label-caps text-label-caps font-bold tracking-wider transition-colors",
              code === locale ? "text-on-surface" : "text-secondary hover:text-primary-container",
            )}
          >
            {code.toUpperCase()}
          </button>
        </span>
      ))}
    </div>
  );
}

export function PublicHeader() {
  const t = useTranslations("PublicNav");
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
    <header className="fixed top-0 right-0 left-0 z-50 w-full border-b border-outline-variant bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-[1240px] items-center justify-between gap-space-sm px-margin-mobile lg:px-margin">
        <Link href="/" className="flex min-w-0 items-center gap-space-sm">
          <BrandMark className="h-8 w-8 shrink-0 text-primary-container" />
          <span className="flex min-w-0 flex-col">
            <span className="truncate font-headline-sm text-headline-sm leading-tight font-semibold tracking-tight text-on-surface">
              GlobalLinkup
            </span>
            <span className="truncate font-label-caps text-label-caps text-secondary uppercase">
              {t("tagline")}
            </span>
          </span>
        </Link>

        <div className="flex shrink-0 items-center gap-space-sm lg:gap-space-lg">
          <nav className="hidden items-center gap-space-md sm:flex">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={cn(
                  "min-h-10 items-center py-2 font-label-lg text-label-lg transition-colors",
                  isActive(item.href)
                    ? "font-semibold text-primary-container"
                    : "text-secondary hover:text-on-surface",
                )}
              >
                {t(item.key)}
              </Link>
            ))}
            <a
              href="#"
              className="min-h-10 items-center py-2 font-label-lg text-label-lg text-secondary transition-colors hover:text-on-surface"
            >
              {t("safetyTrust")}
            </a>
          </nav>

          <LocaleSwitch locale={locale} onSwitch={switchLocale} />

          <a
            href="#"
            className="hidden font-label-lg text-label-lg text-secondary transition-colors hover:text-primary-container lg:inline"
          >
            {t("helpCenter")}
          </a>

          <div className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-container sm:flex">
            <Icon name="person" className="text-[18px] text-white" />
          </div>

          <button
            type="button"
            aria-label={t("toggleMenu")}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-outline-variant bg-surface-low text-secondary transition-colors hover:text-on-surface sm:hidden"
          >
            <Icon name={menuOpen ? "close" : "menu"} className="text-[22px]" />
          </button>
        </div>
      </div>

      {menuOpen ? (
        <div className="border-t border-outline-variant bg-background px-margin-mobile py-space-sm sm:hidden">
          <nav className="flex flex-col">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={cn(
                  "border-b border-outline-variant py-3 font-label-lg text-label-lg",
                  isActive(item.href) ? "text-primary-container" : "text-secondary",
                )}
              >
                {t(item.key)}
              </Link>
            ))}
            <a
              href="#"
              onClick={() => setMenuOpen(false)}
              className="border-b border-outline-variant py-3 font-label-lg text-label-lg text-secondary"
            >
              {t("safetyTrust")}
            </a>
            <a
              href="#"
              onClick={() => setMenuOpen(false)}
              className="py-3 font-label-lg text-label-lg text-secondary"
            >
              {t("helpCenter")}
            </a>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
