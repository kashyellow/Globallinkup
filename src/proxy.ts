import createMiddleware from "next-intl/middleware";
import { routing } from "./lib/i18n/routing";

/**
 * Next.js 16 renamed `middleware` to `proxy`. This negotiates the locale and
 * handles the `/` → `/en` (or persisted locale) redirect.
 */
export default createMiddleware(routing);

export const config = {
  // Match all pathnames except for API routes, Next internals, and files with
  // an extension (e.g. `favicon.ico`).
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
