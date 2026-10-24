import type { CookieOptions } from "@supabase/ssr";

/** Non-sensitive preference cookie: "1" = 30-day session, "0" = session-only. */
export const REMEMBER_COOKIE = "gl-remember";
export const REMEMBER_MAX_AGE = 60 * 60 * 24 * 30;

export function readRemember(value: string | undefined): boolean | undefined {
  if (value === "1") return true;
  if (value === "0") return false;
  return undefined;
}

/**
 * Applies the remember-me choice to Supabase auth cookies.
 *
 * `undefined` leaves the Supabase defaults alone (existing sessions). `true`
 * makes the cookies persistent for 30 days; `false` strips expiry so they become
 * session cookies. Proxy refreshes read the same preference cookie, otherwise a
 * refresh would silently make a session-only login persistent again.
 */
export function applyRemember(
  options: CookieOptions,
  remember: boolean | undefined,
): CookieOptions {
  if (remember === undefined) return options;

  if (remember) {
    const rest = { ...options };
    delete rest.expires;
    return { ...rest, maxAge: REMEMBER_MAX_AGE };
  }

  const rest = { ...options };
  delete rest.maxAge;
  delete rest.expires;
  return rest;
}
