import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import * as rootParams from "next/root-params";
import { notFound } from "next/navigation";
import { routing } from "./routing";

/**
 * Resolves the active locale (from `next/root-params`, available in Next 16.3+)
 * and loads the matching message catalog. This also makes the app eligible for
 * static rendering without `setRequestLocale`.
 */
export default getRequestConfig(async ({ locale }) => {
  let resolvedLocale = locale;

  if (!resolvedLocale) {
    const paramValue = await rootParams.locale();
    if (hasLocale(routing.locales, paramValue)) {
      resolvedLocale = paramValue;
    } else {
      notFound();
    }
  }

  return {
    locale: resolvedLocale,
    messages: (await import(`../../messages/${resolvedLocale}.json`)).default,
    formats: {
      dateTime: {
        short: { day: "numeric", month: "short", year: "numeric" },
        monthYear: { month: "short", year: "numeric" },
        dayMonth: { day: "numeric", month: "long" },
      },
      number: {
        currency: { style: "currency", currency: "USD" },
      },
    },
  };
});
