import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { Icon } from "@/components/ui/icon";
import { RecoveryShell } from "@/features/auth/components/recovery-shell";
import { ResetPasswordView } from "@/features/auth/components/reset-password-view";
import { getCurrentProfile, getCurrentUser, getServerClient, postAuthPath } from "@/lib/auth";
import { redirect } from "@/lib/i18n/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Auth.acceptInvite" });
  return { title: t("title") };
}

/** Invite step 1 (ADR 0010): choose a password, then the persona form. */
export default async function AcceptInvitePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string; token_hash?: string }>;
}) {
  const [{ locale }, { error, token_hash: tokenHash }] = await Promise.all([params, searchParams]);

  // Fresh from the email: one click to verify, so a link scanner's GET cannot.
  if (tokenHash) {
    const t = await getTranslations({ locale, namespace: "Auth.acceptInvite" });
    return (
      <RecoveryShell>
        <form
          method="post"
          action={`/${locale}/auth/confirm`}
          className="flex flex-col items-center gap-space-md py-space-xs text-center"
        >
          <h1 className="font-title text-title-mobile text-on-surface md:text-title">
            {t("continueTitle")}
          </h1>
          <p className="max-w-md font-body-md text-body-md text-secondary">{t("continueBody")}</p>
          <input type="hidden" name="token_hash" value={tokenHash} />
          <button
            type="submit"
            className="inline-flex h-12 items-center justify-center gap-space-xs rounded-full bg-primary px-space-lg font-label-lg text-label-lg font-semibold text-on-primary transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px"
          >
            {t("continue")}
            <Icon name="arrow_forward" className="text-lg" />
          </button>
        </form>
      </RecoveryShell>
    );
  }

  const user = await getCurrentUser();
  const profile = user ? await getCurrentProfile() : null;
  if (profile) redirect({ href: postAuthPath(profile), locale });

  const supabase = await getServerClient();
  const invite =
    user && supabase && error !== "expired"
      ? (
          await supabase
            .from("member_invites")
            .select("email")
            .eq("user_id", user.id)
            .is("accepted_at", null)
            .maybeSingle()
        ).data
      : null;

  return (
    <ResetPasswordView
      hasRecoverySession={Boolean(invite)}
      invite={{ email: invite?.email ?? "" }}
    />
  );
}
