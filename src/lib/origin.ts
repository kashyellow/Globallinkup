import "server-only";

import { headers } from "next/headers";

import { getPublicEnv } from "@/lib/env";

/**
 * The canonical origin for absolute links. Prefers the configured
 * `NEXT_PUBLIC_SITE_URL`; only falls back to request headers in local dev, so a
 * spoofed host cannot redirect a recovery or invite link off-site (F-S2-10).
 */
export async function getRequestOrigin() {
  const siteUrl = getPublicEnv().NEXT_PUBLIC_SITE_URL;
  if (siteUrl) return siteUrl.replace(/\/+$/, "");

  // A production deployment must configure the canonical origin; falling back
  // to a request header there would let a spoofed host poison reset links.
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "NEXT_PUBLIC_SITE_URL is required in production to build password-reset links.",
    );
  }

  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol =
    requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}
