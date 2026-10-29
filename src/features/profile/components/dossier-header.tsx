"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { DefaultAvatar } from "@/components/ui/default-avatar";
import { Reveal } from "@/components/ui/reveal";
import { Icon } from "@/components/ui/icon";
import { MediaImage } from "@/components/ui/media-image";
import { Spinner } from "@/components/ui/spinner";
import { signOutAction } from "@/features/auth/actions";
import { getPathname, Link, useRouter } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";
import type { OwnProfile } from "../queries";

const EASE = "ease-[cubic-bezier(0.32,0.72,0,1)]";

const CONTROL = cn(
  "inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-md border border-outline-variant bg-transparent px-3 font-label-md text-label-md whitespace-nowrap text-on-surface",
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

export function DossierHeader({
  profile,
  canShare = true,
  canEdit = true,
}: {
  profile: OwnProfile;
  canShare?: boolean;
  canEdit?: boolean;
}) {
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
      if (navigator.share) {
        await navigator.share({ title: profile.name, url });
      } else {
        await navigator.clipboard.writeText(url);
      }
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

  // Phones: three equal buttons on one row (labels only); from sm, icon + label.
  const actions = (
    <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">
      {canShare ? (
        <button type="button" onClick={share} className={CONTROL}>
          <Icon
            name={copied ? "check" : "share"}
            className={cn(
              "text-base max-sm:hidden!",
              copied ? "text-success-text" : "text-text-muted",
            )}
          />
          <span>{copied ? t("actions.shared") : t("actions.share")}</span>
        </button>
      ) : null}
      {canEdit ? (
        <Link href="/profile/edit" className={CONTROL_PRIMARY}>
          <Icon name="edit_square" className="text-base max-sm:hidden!" />
          <span>{t("actions.edit")}</span>
        </Link>
      ) : null}
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
          <Icon name="logout" className="text-base max-sm:hidden!" />
        )}
        <span>{loggingOut ? tCommon("processing") : t("actions.logout")}</span>
      </button>
    </div>
  );

  return (
    <section className="relative w-full">
      <div className="mx-auto max-w-[1240px] px-margin-mobile pt-block-mobile md:px-margin md:pt-block">
        {/*
         * Identity as one row at every width: the portrait beside the name, the
         * facts and the actions, so nothing on the first screen is left empty.
         */}
        <Reveal delay={60}>
          <div className="flex items-start gap-space-md md:gap-space-xl">
            <div className="group w-24 shrink-0 overflow-hidden rounded-xl border border-outline-variant bg-surface-low sm:w-32 md:w-44 lg:w-52">
              <div className="aspect-[4/5] w-full">
                {profile.avatar ? (
                  <MediaImage
                    alt={profile.name}
                    src={profile.avatar}
                    wrapperClassName="h-full w-full"
                    className="transition-transform duration-700 group-hover:scale-105 motion-reduce:transform-none"
                  />
                ) : (
                  <DefaultAvatar className="h-full w-full" />
                )}
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="font-title text-title-mobile font-bold text-balance text-on-surface md:text-headline-lg">
                {profile.name}{" "}
                {profile.age > 0 ? (
                  <span className="font-normal text-on-surface-variant">{profile.age}</span>
                ) : null}
              </h1>

              {profile.headline ? (
                <p className="mt-1 font-body-md text-body-md text-on-surface-variant md:font-body-lg md:text-body-lg">
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

              {/* The record: two counts read as one line, not a numbered ledger. */}
              <dl className="mt-space-sm flex flex-wrap gap-x-space-lg gap-y-1">
                {metrics.map((metric) => (
                  <div key={metric.id} className="flex items-baseline gap-1.5">
                    <dt className="font-body-sm text-body-sm text-on-surface-variant">
                      {t(`metrics.${metric.id}`)}
                    </dt>
                    <dd className="order-first font-headline-sm text-headline-sm font-semibold text-on-surface tabular-nums">
                      {metric.value}
                    </dd>
                  </div>
                ))}
              </dl>

              {/* Beside the identity from sm up; under the portrait row on a phone. */}
              <div className="mt-space-md hidden sm:block">{actions}</div>
            </div>
          </div>
          <div className="mt-space-md sm:hidden">{actions}</div>
        </Reveal>
      </div>
    </section>
  );
}
