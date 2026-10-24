"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { DefaultAvatar } from "@/components/ui/default-avatar";
import { Reveal } from "@/components/ui/reveal";
import { Icon } from "@/components/ui/icon";
import { Spinner } from "@/components/ui/spinner";
import { signOutAction } from "@/features/auth/actions";
import { getPathname, Link, useRouter } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";
import type { OwnProfile } from "../queries";
import { SectionHead } from "./section-head";

const EASE = "ease-[cubic-bezier(0.32,0.72,0,1)]";

const CONTROL = cn(
  "inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-md border border-outline-variant bg-transparent px-3 font-label-md text-label-md whitespace-nowrap text-on-surface",
  "transition-[background-color,border-color,color,transform] duration-300",
  EASE,
  "hover:border-outline-hover hover:bg-surface-low focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px active:scale-[0.98]",
);

const CONTROL_PRIMARY = cn(
  CONTROL,
  "border-primary bg-primary text-on-primary hover:border-primary-hover hover:bg-primary-hover",
);

const CONTROL_DANGER = cn(CONTROL, "text-secondary hover:border-danger/60 hover:text-danger");

function Sep() {
  return (
    <span aria-hidden className="text-outline-strong">
      /
    </span>
  );
}

export function DossierHeader({ profile }: { profile: OwnProfile }) {
  const t = useTranslations("Profile");
  const tCommon = useTranslations("Common");
  const locale = useLocale();
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function share() {
    try {
      // The private /profile route is not shareable — send the public dossier.
      const url = `${window.location.origin}${getPathname({
        href: `/persona/${profile.id}`,
        locale,
      })}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard access can be blocked (insecure context / denied permission).
    }
  }

  async function logout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      const result = await signOutAction();
      router.replace(result.redirectTo);
    } catch {
      setLoggingOut(false);
    }
  }

  const metrics = [
    { id: "connections", value: String(profile.metrics.connections), accent: false },
    { id: "dispatches", value: String(profile.metrics.dispatches), accent: false },
  ];

  return (
    <section className="relative w-full">
      <div className="mx-auto max-w-[1240px] px-margin-mobile pt-block-mobile md:px-margin md:pt-block">
        {/* Action bar */}
        <div className="flex flex-wrap items-center justify-end gap-y-space-sm border-y border-outline-variant py-space-sm">
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
            <button type="button" onClick={share} className={CONTROL}>
              <Icon
                name={copied ? "check" : "share"}
                className={cn("text-base", copied ? "text-success-text" : "text-text-muted")}
              />
              <span>{copied ? t("actions.shared") : t("actions.share")}</span>
            </button>
            <Link href="/profile/edit" className={CONTROL_PRIMARY}>
              <Icon name="edit_square" className="text-base" />
              <span>{t("actions.edit")}</span>
            </Link>
            <button
              type="button"
              onClick={() => void logout()}
              disabled={loggingOut}
              aria-busy={loggingOut || undefined}
              className={CONTROL_DANGER}
            >
              {loggingOut ? (
                <Spinner className="h-4 w-4 text-current" label={tCommon("processing")} />
              ) : (
                <Icon name="logout" className="text-base" />
              )}
              <span>{loggingOut ? tCommon("processing") : t("actions.logout")}</span>
            </button>
          </div>
        </div>

        {/* 01 — Identity */}
        <Reveal delay={60}>
          <div className="mt-space-lg">
            <SectionHead index="01" title={t("sections.identity")} />

            <div className="mt-space-md grid grid-cols-1 gap-space-lg lg:grid-cols-12 lg:items-end">
              <div className="lg:col-span-7">
                <h1 className="font-display-lg text-display-lg-mobile font-bold tracking-tight text-balance text-on-surface md:text-display-lg">
                  {profile.name}{" "}
                  {profile.age > 0 ? (
                    <span className="align-baseline font-headline-md text-headline-md font-normal text-text-muted">
                      {profile.age}
                    </span>
                  ) : null}
                </h1>

                {profile.headline ? (
                  <p className="mt-2 font-body-lg text-body-lg text-text-muted">
                    {profile.headline}
                  </p>
                ) : null}

                <p className="mt-space-sm flex flex-wrap items-center gap-x-2 gap-y-1 font-label-md text-label-md text-on-surface-variant">
                  <span className="flex items-center gap-1 text-on-surface">
                    <Icon name="location_on" className="text-base text-primary" />
                    {profile.location}
                  </span>
                  {profile.languages ? (
                    <>
                      <Sep />
                      <span>{profile.languages}</span>
                    </>
                  ) : null}
                  <Sep />
                  <span className="flex items-center gap-1.5 text-success-text">
                    <span className="h-1.5 w-1.5 rounded-full bg-success-text" />
                    {t("identity.mutualConsent")}
                  </span>
                </p>
              </div>

              <div className="lg:col-span-5">
                <div className="group relative mx-auto w-full max-w-[19rem] lg:mx-0 lg:ml-auto lg:max-w-none">
                  <div className="aspect-[4/5] w-full overflow-hidden border border-outline-variant bg-surface-low">
                    {profile.avatar ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          alt={profile.name}
                          src={profile.avatar}
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 motion-reduce:transform-none"
                        />
                      </>
                    ) : (
                      <DefaultAvatar className="h-full w-full" />
                    )}
                  </div>
                  <span className="absolute -bottom-4 left-4 inline-flex -rotate-6 items-center gap-1.5 border border-primary bg-surface-lowest px-2.5 py-1 font-label-md text-label-md font-bold tracking-[0.08em] text-primary uppercase transition-transform duration-500 hover:rotate-0 motion-reduce:transition-none">
                    <Icon name="verified" filled className="text-sm" />
                    {t("identity.mutual")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        {/* 02 — Ledger */}
        <Reveal delay={140}>
          <div className="mt-space-lg">
            <SectionHead index="02" title={t("sections.record")} />

            <dl className="grid grid-cols-2 sm:grid-cols-4">
              {metrics.map((metric, index) => (
                <div
                  key={metric.id}
                  className={cn(
                    "px-space-sm py-space-sm",
                    index % 2 === 1 && "border-l border-outline-variant",
                    index >= 2 && "border-t border-outline-variant sm:border-t-0",
                    index > 0 && "sm:border-l sm:border-outline-variant",
                  )}
                >
                  <span className="block font-label-caps text-label-caps text-primary tabular-nums">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <dt className="mt-1 font-label-md text-label-md text-text-muted">
                    {t(`metrics.${metric.id}`)}
                  </dt>
                  <dd
                    className={cn(
                      "mt-0.5 font-headline-md text-headline-md font-semibold tabular-nums",
                      metric.accent ? "text-success-text" : "text-on-surface",
                    )}
                  >
                    {metric.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
