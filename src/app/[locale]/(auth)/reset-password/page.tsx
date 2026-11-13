import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Icon } from "@/components/ui/icon";
import { RecoveryShell } from "@/features/auth/components/recovery-shell";
import { ResetPasswordView } from "@/features/auth/components/reset-password-view";
import { getCurrentUser } from "@/lib/auth";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Auth.resetPassword" });
  return { title: t("title") };
}

export default async function ResetPasswordPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string; token_hash?: string }>;
}) {
  const [{ locale }, { error, token_hash: tokenHash }] = await Promise.all([params, searchParams]);

  // Fresh from the email: one click to verify, so a link scanner's GET cannot.
  if (tokenHash) {
    const t = await getTranslations({ locale, namespace: "Auth.resetPassword" });
    return (
      <RecoveryShell>
        <form
          method="post"
          action={`/${locale}/auth/callback`}
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
  const hasRecoverySession = Boolean(user) && error !== "invalid";

  return <ResetPasswordView hasRecoverySession={hasRecoverySession} />;
}
