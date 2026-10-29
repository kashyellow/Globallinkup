import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { AcceptInviteForm } from "./accept-invite-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "AcceptInvite" });
  return { title: t("title") };
}

export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token_hash?: string }>;
}) {
  const { token_hash: tokenHash } = await searchParams;
  const t = await getTranslations("AcceptInvite");

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-space-md px-margin-mobile py-block md:px-margin">
      <h1 className="font-headline-lg text-headline-lg font-semibold text-on-surface">
        {t("title")}
      </h1>
      <p className="font-body-md text-body-md text-secondary">{t("body")}</p>
      {tokenHash ? (
        <AcceptInviteForm tokenHash={tokenHash} />
      ) : (
        <p className="rounded-2xl border border-danger-border bg-danger-surface p-space-md font-body-sm text-body-sm text-danger-text">
          {t("expired")}
        </p>
      )}
    </main>
  );
}
