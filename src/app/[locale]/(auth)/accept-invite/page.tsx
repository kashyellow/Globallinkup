import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

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
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ locale }, { error }] = await Promise.all([params, searchParams]);
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
