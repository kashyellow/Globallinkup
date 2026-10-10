import { defineRouting } from "next-intl/routing";

/**
 * Locale-based routing config. Both languages are first-class (PRD §8.3):
 * `/en/...` and `/es/...`, with English as the fallback locale.
 */
export const routing = defineRouting({
  locales: ["en", "es"],
  defaultLocale: "en",
  localePrefix: "always",
});

export type Locale = (typeof routing.locales)[number];
