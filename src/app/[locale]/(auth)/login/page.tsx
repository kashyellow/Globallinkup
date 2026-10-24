import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { LoginView } from "@/features/auth/components/login-view";
import { getCurrentProfile, getCurrentUser, postAuthPath } from "@/lib/auth";
import { redirect } from "@/lib/i18n/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Auth.login" });
  return { title: t("title") };
}

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    const profile = await getCurrentProfile();

    // Approved users and signed-in users without a persona already have a
    // destination. A pending/rejected/suspended account is parked on /verify,
    // so render the form anyway — otherwise its session traps the browser and
    // nobody can sign in with another account.
    if (!profile || profile.approval_status === "approved") {
      return redirect({ href: postAuthPath(profile), locale: await getLocale() });
    }

    return (
      <LoginView currentAccount={{ email: user.email ?? "", status: profile.approval_status }} />
    );
  }

  return <LoginView />;
}
