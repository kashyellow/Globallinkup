"use server";

import { headers } from "next/headers";
import { getLocale } from "next-intl/server";

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
 */

export type AuthError = "invalid" | "emailInUse" | "weakPassword" | "rateLimited" | "unknown";

export type AuthResult = { ok: true; redirectTo: string } | { ok: false; error: AuthError };

/** Supabase AuthError codes/statuses -> a small, view-facing enum. */
function mapAuthError(error: { code?: string; status?: number; message?: string }): AuthError {
  const code = error.code ?? "";
  const message = error.message?.toLowerCase() ?? "";

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

async function getRequestOrigin() {
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
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error) return { ok: false, error: mapAuthError(error) };

  return { ok: true, redirectTo: "/create-persona" };
}

export async function signInAction(input: unknown): Promise<AuthResult> {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error || !data.user) return { ok: false, error: "invalid" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("approval_status")
    .eq("id", data.user.id)
    .maybeSingle();

  if (!profile) return { ok: true, redirectTo: "/create-persona" };
  if (profile.approval_status !== "approved") return { ok: true, redirectTo: "/verify" };
  return { ok: true, redirectTo: "/discover" };
}

export async function signOutAction(): Promise<{ ok: true; redirectTo: string }> {
  const supabase = await createClient();
  await supabase.auth.signOut();
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
      const locale = await getLocale();
      const origin = await getRequestOrigin();
      const supabase = await createClient();
      await supabase.auth.resetPasswordForEmail(parsed.data.email, {
        redirectTo: `${origin}/${locale}/auth/callback?next=/${locale}/reset-password`,
      });
    } catch {
      // Unconfigured Supabase (CI/e2e): fall through to the confirmation step.
    }
  }

  return { ok: true, redirectTo: "/forgot-password/sent" };
}

export async function updatePasswordAction(input: unknown): Promise<AuthResult> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "weakPassword" };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { ok: false, error: mapAuthError(error) };

  return { ok: true, redirectTo: "/login" };
}
