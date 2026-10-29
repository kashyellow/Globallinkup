"use server";

import { cookies, headers } from "next/headers";

import { postAuthPath } from "@/lib/auth";
import { getPublicEnv } from "@/lib/env";
import { RESET_REQUEST_COOKIE, RESET_REQUEST_MAX_AGE } from "@/lib/auth-cookies";
import { REMEMBER_COOKIE, REMEMBER_MAX_AGE } from "@/lib/supabase/cookies";
import { createClient } from "@/lib/supabase/server";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
} from "@/lib/validation/auth";

/**
 * Auth Server Actions (S2). Each validates with Zod at the boundary, then calls
 * Supabase through the SSR server client (so PKCE verifiers land in cookies).
 * They return a locale-less `redirectTo`; the client pushes it through the
 * locale-aware router. Failures return an error code the view maps to a banner.
 *
 * Note: never call next-intl's `getLocale()` here — locale is resolved from
 * `next/root-params`, which is not available inside a Server Action.
 */

export type AuthError =
  "invalid" | "emailInUse" | "weakPassword" | "rateLimited" | "confirmEmail" | "unknown";

export type AuthResult = { ok: true; redirectTo: string } | { ok: false; error: AuthError };

/** Supabase AuthError codes/statuses -> a small, view-facing enum. */
function mapAuthError(error: { code?: string; status?: number; message?: string }): AuthError {
  const code = error.code ?? "";
  const message = error.message?.toLowerCase() ?? "";

  // A rejected password must stay distinct from an outage: the login view shows
  // a different banner for `unknown`, so a network failure never blames the
  // credentials the member just typed.
  if (code === "invalid_credentials" || message.includes("invalid login credentials")) {
    return "invalid";
  }
  if (
    code === "user_already_exists" ||
    error.status === 422 ||
    message.includes("already registered")
  ) {
    return "emailInUse";
  }
  if (code === "weak_password" || message.includes("weak password")) return "weakPassword";
  if (
    code === "over_email_send_rate_limit" ||
    error.status === 429 ||
    message.includes("rate limit")
  ) {
    return "rateLimited";
  }
  return "unknown";
}

/**
 * The canonical origin for absolute links. Prefers the configured
 * `NEXT_PUBLIC_SITE_URL`; only falls back to request headers in local dev, so a
 * spoofed host cannot redirect a recovery link off-site (F-S2-10).
 */
async function getRequestOrigin() {
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

export async function signUpAction(input: unknown): Promise<AuthResult> {
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "unknown" };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error) return { ok: false, error: mapAuthError(error) };

  // Email confirmation is intentionally disabled (PRD OQ-1). If a deployment
  // turns it on, there is no session yet and the persona cannot be written.
  if (!data.session) return { ok: false, error: "confirmEmail" };

  return { ok: true, redirectTo: "/create-persona" };
}

export async function signInAction(input: unknown): Promise<AuthResult> {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  const supabase = await createClient({ remember: parsed.data.remember });

  let result: Awaited<ReturnType<typeof supabase.auth.signInWithPassword>>;
  try {
    result = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });
  } catch {
    // Unreachable Auth/network failure: keep it distinct from a bad password.
    return { ok: false, error: "unknown" };
  }

  const { data, error } = result;
  if (error) return { ok: false, error: mapAuthError(error) };
  if (!data.user) return { ok: false, error: "unknown" };

  // Keep the preference readable by the proxy so a refresh does not turn a
  // session-only login into a persistent one.
  const cookieStore = await cookies();
  cookieStore.set(REMEMBER_COOKIE, parsed.data.remember ? "1" : "0", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    ...(parsed.data.remember ? { maxAge: REMEMBER_MAX_AGE } : {}),
  });
  cookieStore.delete(RESET_REQUEST_COOKIE);

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("approval_status")
    .eq("id", data.user.id)
    .maybeSingle();

  if (profileError) {
    // A failed read is not "this account has no persona": sending the member to
    // /create-persona here is how a transient error looked like a lost profile.
    console.error("[auth] post-signin profile read failed", { code: profileError.code });
    return { ok: false, error: "unknown" };
  }

  return { ok: true, redirectTo: postAuthPath(profile) };
}

export async function signOutAction(): Promise<{ ok: true; redirectTo: string }> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const cookieStore = await cookies();
  cookieStore.delete(REMEMBER_COOKIE);
  cookieStore.delete(RESET_REQUEST_COOKIE);
  return { ok: true, redirectTo: "/login" };
}

export async function requestPasswordResetAction(
  input: unknown,
): Promise<{ ok: true; redirectTo: string }> {
  const parsed = forgotPasswordSchema.safeParse(input);

  // Always land on the confirmation step, even on error — never leak whether an
  // address exists, and never put it in the URL (PR-6).
  if (parsed.success) {
    try {
      const { email, locale } = parsed.data;
      const origin = await getRequestOrigin();
      const supabase = await createClient();
      await supabase.auth.resetPasswordForEmail(email, {
        // `next` is locale-less: the callback prefixes the active locale once.
        redirectTo: `${origin}/${locale}/auth/callback?next=/reset-password`,
      });
    } catch (error) {
      // A production deployment without a canonical origin is a configuration
      // bug, not a reason to silently pretend the email was sent.
      if (
        process.env.NODE_ENV === "production" &&
        error instanceof Error &&
        error.message.includes("NEXT_PUBLIC_SITE_URL")
      ) {
        throw error;
      }
      // Unconfigured Supabase (CI/e2e): fall through to the confirmation step.
    }
  }

  // Mark the confirmation step as reached. The page redirects direct/expired
  // visits back to the request form instead of showing a fake "email sent".
  const cookieStore = await cookies();
  cookieStore.set(RESET_REQUEST_COOKIE, "1", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: RESET_REQUEST_MAX_AGE,
  });

  return { ok: true, redirectTo: "/forgot-password/sent" };
}

export async function updatePasswordAction(input: unknown): Promise<AuthResult> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "weakPassword" };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { ok: false, error: mapAuthError(error) };

  // End the recovery session so the user signs in fresh with the new password.
  await supabase.auth.signOut();
  const cookieStore = await cookies();
  cookieStore.delete(RESET_REQUEST_COOKIE);
  return { ok: true, redirectTo: "/login" };
}
