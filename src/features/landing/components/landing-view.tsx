"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import { Link } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";

const SOFIA =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAATlSmkEIUqeeL2L5XxBOU6w03gzVzBw2Uzhhca7DwdYW4hDZd4o2AHMBhf1TzL67D6LizWd-FlfVA5rzm36kc_qs9lanO29UHXGB-OSFZtqfLJCv-9QAADdrJu-b1MpnO7Bk7BE5yKrjUuUxCafSczIqtPSB73rF_OXuT5UwFZcwTK2wqBodkDNA66r01n5t9K7H5kFx9Lg8ZtrZYW1pwWrb9focCtsu1qILGbUffIAcWXP7LwBQmuw";
const MATEO =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDCFU0bL3A4oN2RIhdhoh597neSOAaZanYDHGukKQQLL1pogb0WZQvIBnAL7VG-JkX4V_uielRcybtUGDICgzKEBNwzLJUdPRZiCO_y2UWD3VJ7DE_vQHfjlx_PWcC-M_SfWaJmGieyTxg19eSasOsK2hnkOobrTdmSNIkLD2MIru6Spq8TVE_JW1KFJ2f1rVhrqRyXxButlKah7ZzdXzIfOcLsBaO-wAGp_8Pl6feAfos4si-SGYBmaw";
const LUCAS =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBwRO6qS2H7Ygs_AB7LOW0X_-8bG8zoDFVd3Kr8BOo9wYbfRdIdx43ETLR4DgawMoUjPqrypGduFEhVxWHd_4mhFIxc1g3DwguD5OBU5iNfZerfuDGDBOfNApgWx9e5nHu0c6RboKKI_txR8mLVg40ZjJAHiLJHP3EgUJFkwz6-FLsOJLvH8Aq4YN9NEa6X6bVGkxUAL8sLvLC2ruXWmGDU3L3tAByKveE4NY5r4xFLrnTNIVvAqHuu6w";
const BAG =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBVwaZeMZBD75GrApQLCtDSLGJ5dqRB5YjrptEJL_5GtteEz5PSrHzQBAoM-JETyYjHIn4FUt7V2CoJ4ql80SwVllTOoCrNkz-Q08L4lFxS2Zcukm-mWfXAGU4m5LD4iiLlmXzRTaGxkPZx68fsdMAbYz97713s0rdJ1IGMTLaLDu7FNtkyXvC5D3SdXsT-Kl0VfLbW23oqbP_jFT_dkFUrSeEasghPwGvHRhexWonOhqS7Z8fcmEm-CQ";
const STUDIO =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDPMukyKSkNklwKos0zIPmrhussBbhIqH_DAe6FwMA840zx1UFDYjAozcSdotXytnwNMuS_QuhFYeBxvEsN8W_6w-mW5WquDMRQSHeiq5_AgLbtm5eRf3pSfR6BvrXAhe2X7EY5lkY1dhOFg5s3JdcnRgDUY1ysC-cbn-BFTNdZslFJEFPzUFwjdMbyNuXSy_-BY8hxhCPpgrmLQi3eOpjokx3tQhQ8Jq7bDUHb3_JoAU-BW_jDCaTVQw";

const STEPS = [
  { n: 1, icon: "badge" },
  { n: 2, icon: "send" },
  { n: 3, icon: "thumbs_up_down" },
  { n: 4, icon: "key" },
] as const;

const PILLARS = [
  { n: 1, icon: "person_pin", href: "/discover", anchor: "discover-personas" },
  { n: 2, icon: "photo_library", href: "/posts", anchor: "editorial-feed" },
  { n: 3, icon: "storefront", href: "/marketplace", anchor: "artisan-goods" },
] as const;

export function LandingView() {
  const t = useTranslations("Landing");
  const [lockerOpen, setLockerOpen] = useState(false);

  return (
    <>
      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section
        id="hero"
        className="relative mx-auto w-full max-w-[1240px] px-margin-mobile pt-space-lg pb-space-xl md:px-margin md:pt-space-xl"
      >
        <div className="grid grid-cols-1 items-center gap-space-lg lg:grid-cols-12 lg:gap-space-xl">
          <div className="flex flex-col items-start space-y-space-md md:space-y-space-lg lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#2E2B27] bg-[#23201D] px-3 py-1.5 font-label-caps text-label-caps tracking-wider text-[#E0D9CF] uppercase">
              <span className="h-2 w-2 rounded-full bg-[#E86A5B]" />
              <span>{t("hero.badge")}</span>
            </div>

            <div className="space-y-2">
              <h1 className="font-headline-xl text-headline-xl-mobile leading-tight font-bold tracking-tight text-[#F5F2EB] md:text-headline-xl">
                {t("hero.titleLine1")}
                <br className="hidden sm:inline" />
                {t("hero.titleLine2")}
              </h1>
              <p className="font-headline-sm text-headline-sm font-medium text-[#C4BEB5] italic">
                {t("hero.titleAlt")}
              </p>
            </div>

            <p className="max-w-xl font-body-lg text-body-lg text-[#C4BEB5]">{t("hero.body")}</p>

            <div className="flex w-full flex-wrap items-center gap-space-md pt-space-xs sm:w-auto">
              <Link
                href="/register"
                className="inline-flex h-12 items-center justify-center rounded-xl bg-[#E86A5B] px-7 font-label-lg text-label-lg text-white shadow-md transition-all hover:bg-[#d4584a]"
              >
                {t("hero.join")}
                <Icon name="north_east" className="ml-2 text-[20px]" />
              </Link>
              <Link
                href="/discover"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-[#2E2B27] bg-[#1E1C19] px-6 font-label-lg text-label-lg text-[#F5F2EB] shadow-sm transition-all hover:border-[#3E3A34] hover:bg-[#282622]"
              >
                {t("hero.explore")}
                <Icon name="explore" className="ml-2 text-[20px]" />
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-x-space-md gap-y-2 pt-space-md font-label-md text-label-md text-[#9E988F]">
              {(["personas", "consent", "spam"] as const).map((key, index) => (
                <div key={key} className="flex items-center gap-1.5">
                  {index > 0 ? (
                    <span className="mr-2 hidden text-[#3E3A34] sm:inline">•</span>
                  ) : null}
                  <Icon
                    name={
                      key === "personas"
                        ? "verified_user"
                        : key === "consent"
                          ? "lock_reset"
                          : "format_image_left"
                    }
                    className="text-[18px] text-[#38a36f]"
                  />
                  <span>{t(`hero.trust.${key}`)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Hero persona card */}
          <div className="relative mt-space-md lg:col-span-5 lg:mt-0">
            <div className="absolute -top-6 -left-6 -z-10 h-full w-full -rotate-2 rounded-2xl border border-[#2E2B27] bg-[#201D1A]" />
            <div className="w-full overflow-hidden rounded-2xl border border-[#2E2B27] bg-[#1D1B19] shadow-2xl">
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#23211E]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt={t("hero.cardAlt")} className="h-full w-full object-cover" src={SOFIA} />
                <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-full border border-[#2E2B27] bg-[#121110]/85 px-3 py-1 font-label-md text-label-md text-[#F5F2EB] shadow-md backdrop-blur-md">
                  <Icon name="location_on" className="text-[16px] text-[#E86A5B]" />
                  <span>{t("hero.city")}</span>
                </div>
                <div className="absolute right-4 bottom-4 inline-flex items-center gap-1 rounded-full bg-[#38a36f] px-3 py-1 font-label-caps text-label-caps font-semibold tracking-wider text-white uppercase shadow-md">
                  <Icon name="verified" className="text-[14px]" />
                  <span>{t("hero.verified")}</span>
                </div>
              </div>

              <div className="space-y-space-md bg-[#1D1B19] p-space-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-headline-sm text-headline-sm font-bold text-[#F5F2EB]">
                      {t("hero.name")}
                    </h3>
                    <p className="font-body-sm text-body-sm text-[#9E988F]">{t("hero.role")}</p>
                  </div>
                  <div className="flex items-center gap-1 rounded-full border border-[#244A32] bg-[#16291E] px-2.5 py-1 font-label-caps text-label-caps text-[#38a36f]">
                    <Icon name="language" className="text-[14px]" />
                    <span>{t("hero.languages")}</span>
                  </div>
                </div>

                <p className="line-clamp-2 font-body-sm text-body-sm text-[#C4BEB5]">
                  {t("hero.bio")}
                </p>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {(["architecture", "photography", "ceramics"] as const).map((key) => (
                    <span
                      key={key}
                      className="rounded border border-[#322F2A] bg-[#282622] px-2.5 py-1 font-label-md text-label-md text-[#C4BEB5]"
                    >
                      {t(`hero.interests.${key}`)}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between rounded-xl border border-[#282622] bg-[#161513] p-3 pt-space-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#38a36f]" />
                    <span className="font-label-md text-label-md text-[#F5F2EB]">
                      {t("hero.ready")}
                    </span>
                  </div>
                  <Link
                    href="/register"
                    className="inline-flex items-center justify-center rounded-lg bg-[#E86A5B] px-4 py-1.5 font-label-lg text-label-lg text-white shadow-sm transition-colors hover:bg-[#d4584a]"
                  >
                    {t("hero.requestConnect")}
                  </Link>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-5 -left-5 hidden max-w-xs items-center gap-3 rounded-xl border border-[#2E2B27] bg-[#1A1917] p-3 shadow-xl sm:flex">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#2C2723] text-[#E86A5B]">
                <Icon name="encrypted" className="text-[20px]" />
              </div>
              <div>
                <div className="font-label-md text-label-md font-semibold text-[#F5F2EB]">
                  {t("hero.floatTitle")}
                </div>
                <div className="font-body-sm text-body-sm text-[#9E988F]">
                  {t("hero.floatBody")}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS (4-step privacy protocol) ───────────────────────── */}
      <section
        id="how-it-works"
        className="w-full border-y border-[#282622] bg-[#181715] py-space-xl"
      >
        <div className="mx-auto max-w-[1240px] space-y-space-xl px-margin-mobile md:px-margin">
          <div className="max-w-2xl space-y-space-xs">
            <div className="inline-flex items-center gap-2 rounded border border-[#322E29] bg-[#25221F] px-3 py-1 font-label-caps text-label-caps tracking-wider text-[#E0D9CF] uppercase">
              {t("protocol.badge")}
            </div>
            <h2 className="font-headline-lg text-headline-lg-mobile font-bold tracking-tight text-[#F5F2EB] md:text-headline-lg">
              {t("protocol.title")}
            </h2>
            <p className="font-body-lg text-body-lg text-[#C4BEB5]">{t("protocol.body")}</p>
          </div>

          <div className="grid grid-cols-1 gap-space-md md:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step) => (
              <div
                key={step.n}
                className="flex flex-col justify-between space-y-space-md rounded-2xl border border-[#282622] bg-[#121110] p-space-lg"
              >
                <div className="space-y-space-sm">
                  <div className="font-label-caps text-label-caps font-bold tracking-widest text-[#E86A5B] uppercase">
                    {t(`protocol.step${step.n}Label`)}
                  </div>
                  <h3 className="font-headline-sm text-headline-sm font-semibold text-[#F5F2EB]">
                    {t(`protocol.step${step.n}Title`)}
                  </h3>
                  <p className="font-body-sm text-body-sm leading-relaxed text-[#C4BEB5]">
                    {t(`protocol.step${step.n}Body`)}
                  </p>
                </div>
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border shadow-sm",
                    step.n === 4
                      ? "border-[#244A32] bg-[#182B20] text-[#38a36f]"
                      : "border-[#2E2B27] bg-[#201E1B] text-[#E86A5B]",
                  )}
                >
                  <Icon name={step.icon} className="text-[22px]" />
                </div>
              </div>
            ))}
          </div>

          {/* Locked / unlocked demo */}
          {/* Interactive locker demo — the target of the nav's "Privacy Protocol" link. */}
          <div
            id="privacy-protocol"
            className="w-full rounded-2xl border border-[#282622] bg-[#131210] p-space-lg md:p-space-xl"
          >
            <div className="mb-space-lg flex flex-col justify-between gap-space-md md:flex-row md:items-center">
              <div>
                <h3 className="font-headline-sm text-headline-sm font-bold text-[#F5F2EB]">
                  {t("demo.title")}
                </h3>
                <p className="font-body-sm text-body-sm text-[#9E988F]">{t("demo.body")}</p>
              </div>
              <div className="inline-flex self-start rounded-xl border border-[#2E2B27] bg-[#1A1917] p-1 shadow-sm md:self-auto">
                <button
                  type="button"
                  onClick={() => setLockerOpen(false)}
                  aria-pressed={!lockerOpen}
                  className={cn(
                    "rounded-lg px-4 py-2 font-label-md text-label-md transition-all",
                    !lockerOpen ? "bg-[#E86A5B] text-white" : "text-[#9E988F] hover:text-[#F5F2EB]",
                  )}
                >
                  {t("demo.lockedTab")}
                </button>
                <button
                  type="button"
                  onClick={() => setLockerOpen(true)}
                  aria-pressed={lockerOpen}
                  className={cn(
                    "rounded-lg px-4 py-2 font-label-md text-label-md transition-all",
                    lockerOpen ? "bg-[#E86A5B] text-white" : "text-[#9E988F] hover:text-[#F5F2EB]",
                  )}
                >
                  {t("demo.unlockedTab")}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 items-center gap-space-lg lg:grid-cols-12">
              {/* Mini profile */}
              <div className="space-y-space-sm rounded-xl border border-[#282622] bg-[#1C1A18] p-space-md shadow-sm lg:col-span-5">
                <div className="flex items-center gap-space-md">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full border border-[#2E2B27]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      alt={t("demo.miniAlt")}
                      className="h-full w-full object-cover"
                      src={SOFIA}
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-headline-sm text-headline-sm font-bold text-[#F5F2EB]">
                        {t("demo.miniName")}
                      </h4>
                      <Icon name="verified" className="text-[18px] text-[#38a36f]" />
                    </div>
                    <div className="font-body-sm text-body-sm text-[#9E988F]">
                      {t("demo.miniMeta")}
                    </div>
                  </div>
                </div>
                <p className="pt-2 font-body-sm text-body-sm text-[#C4BEB5]">
                  {t("demo.statusLabel")}{" "}
                  <span className="font-semibold text-[#E86A5B]">
                    {lockerOpen ? t("demo.statusUnlocked") : t("demo.statusLocked")}
                  </span>
                </p>
              </div>

              {/* Locker */}
              <div className="rounded-xl border border-[#282622] bg-[#1C1A18] p-space-lg shadow-sm lg:col-span-7">
                {lockerOpen ? (
                  <div className="space-y-space-md">
                    <div className="flex items-center justify-between border-b border-[#282622] pb-space-sm">
                      <div className="flex items-center gap-2">
                        <Icon name="lock_open" className="text-[20px] text-[#38a36f]" />
                        <span className="font-label-lg text-label-lg font-bold text-[#F5F2EB]">
                          {t("demo.unlockedTitle")}
                        </span>
                      </div>
                      <span className="rounded border border-[#244A32] bg-[#182B20] px-2.5 py-0.5 font-label-caps text-label-caps font-semibold text-[#38a36f] uppercase">
                        {t("demo.active")}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between rounded-lg border border-[#282622] bg-[#131210] p-3">
                        <div className="flex items-center gap-3">
                          <Icon name="photo_camera" className="text-[20px] text-[#E86A5B]" />
                          <span className="font-body-sm text-body-sm font-semibold text-[#F5F2EB]">
                            {t("demo.igUnlocked")}
                          </span>
                        </div>
                        <a
                          href="#"
                          className="rounded border border-[#36322C] bg-[#25221F] px-3 py-1 font-label-md text-label-md text-[#E86A5B] shadow-sm transition-colors hover:bg-[#2F2B26]"
                        >
                          {t("demo.openProfile")}
                        </a>
                      </div>
                      <div className="flex items-center justify-between rounded-lg border border-[#282622] bg-[#131210] p-3">
                        <div className="flex items-center gap-3">
                          <Icon name="chat" className="text-[20px] text-[#38a36f]" />
                          <span className="font-body-sm text-body-sm font-semibold text-[#F5F2EB]">
                            {t("demo.tgUnlocked")}
                          </span>
                        </div>
                        <a
                          href="#"
                          className="rounded border border-[#36322C] bg-[#25221F] px-3 py-1 font-label-md text-label-md text-[#38a36f] shadow-sm transition-colors hover:bg-[#2F2B26]"
                        >
                          {t("demo.startChat")}
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 rounded-lg border border-[#1E3B2C] bg-[#15271D] p-3 font-body-sm text-body-sm text-[#A8D5BA]">
                      <Icon
                        name="verified"
                        className="mt-0.5 shrink-0 text-[18px] text-[#38a36f]"
                      />
                      <span>{t("demo.unlockedNote")}</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-space-md">
                    <div className="flex items-center justify-between border-b border-[#282622] pb-space-sm">
                      <div className="flex items-center gap-2">
                        <Icon name="lock" className="text-[20px] text-[#9E988F]" />
                        <span className="font-label-lg text-label-lg font-bold text-[#F5F2EB]">
                          {t("demo.lockedTitle")}
                        </span>
                      </div>
                      <span className="rounded border border-[#34302A] bg-[#282622] px-2.5 py-0.5 font-label-caps text-label-caps text-[#9E988F] uppercase">
                        {t("demo.encrypted")}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {(["ig", "phone"] as const).map((row) => (
                        <div
                          key={row}
                          className="flex items-center justify-between rounded-lg border border-[#282622] bg-[#131210] p-3"
                        >
                          <div className="flex items-center gap-3">
                            <Icon
                              name={row === "ig" ? "photo_camera" : "chat"}
                              className="text-[20px] text-[#9E988F]"
                            />
                            <span className="font-body-sm text-body-sm font-medium text-[#7A746B] blur-[3px] select-none">
                              {t(`demo.masked.${row}`)}
                            </span>
                          </div>
                          <span className="font-label-caps text-label-caps font-semibold text-[#7A746B] uppercase">
                            {t("demo.locked")}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-start gap-2 rounded-lg border border-[#342C27] bg-[#241F1C] p-3 font-body-sm text-body-sm text-[#C4BEB5]">
                      <Icon name="info" className="mt-0.5 shrink-0 text-[18px] text-[#E86A5B]" />
                      <span>{t("demo.lockedNote")}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── THREE PILLARS ────────────────────────────────────────────────── */}
      <section
        id="pillars"
        className="mx-auto w-full max-w-[1240px] px-margin-mobile py-space-xl md:px-margin"
      >
        <div className="space-y-space-xl">
          <div className="mx-auto max-w-2xl space-y-space-xs text-center">
            <span className="font-label-caps text-label-caps font-bold tracking-widest text-[#E86A5B] uppercase">
              {t("pillars.badge")}
            </span>
            <h2 className="font-headline-lg text-headline-lg-mobile font-bold text-[#F5F2EB] md:text-headline-lg">
              {t("pillars.title")}
            </h2>
            <p className="font-body-md text-body-md text-[#C4BEB5]">{t("pillars.body")}</p>
          </div>

          <div className="grid grid-cols-1 gap-space-lg md:grid-cols-3">
            {PILLARS.map((pillar) => (
              <div
                key={pillar.n}
                id={pillar.anchor}
                className="flex flex-col justify-between space-y-space-md rounded-2xl border border-[#282622] bg-[#1A1917] p-space-lg shadow-sm"
              >
                <div className="space-y-space-md">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#362E28] bg-[#28231F] text-[#E86A5B]">
                    <Icon name={pillar.icon} className="text-[28px]" />
                  </div>
                  <div className="space-y-1">
                    <span className="font-label-caps text-label-caps text-[#9E988F] uppercase">
                      {t(`pillars.pillar${pillar.n}Label`)}
                    </span>
                    <h3 className="font-headline-sm text-headline-sm font-bold text-[#F5F2EB]">
                      {t(`pillars.pillar${pillar.n}Title`)}
                    </h3>
                  </div>
                  <p className="font-body-md text-body-md text-[#C4BEB5]">
                    {t(`pillars.pillar${pillar.n}Body`)}
                  </p>
                </div>
                <div className="pt-space-md">
                  <Link
                    href={pillar.href}
                    className="inline-flex min-h-10 items-center py-2 font-label-lg text-label-lg text-[#E86A5B] hover:underline"
                  >
                    {t(`pillars.pillar${pillar.n}Cta`)}
                    <Icon name="arrow_forward" className="ml-1 text-[18px]" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMMUNITY SNAPSHOT ───────────────────────────────────────────── */}
      <section id="community" className="w-full border-y border-[#282622] bg-[#181715] py-space-xl">
        <div className="mx-auto max-w-[1240px] space-y-space-xl px-margin-mobile md:px-margin">
          <div className="flex flex-col justify-between gap-space-md md:flex-row md:items-end">
            <div className="max-w-xl space-y-space-xs">
              <span className="font-label-caps text-label-caps font-bold tracking-widest text-[#E86A5B] uppercase">
                {t("snapshot.badge")}
              </span>
              <h2 className="font-headline-lg text-headline-lg-mobile font-bold text-[#F5F2EB] md:text-headline-lg">
                {t("snapshot.title")}
              </h2>
              <p className="font-body-md text-body-md text-[#C4BEB5]">{t("snapshot.body")}</p>
            </div>
            <Link
              href="/discover"
              className="inline-flex items-center gap-2 rounded-xl border border-[#2E2B27] bg-[#201E1B] px-4 py-2 font-label-lg text-label-lg text-[#F5F2EB] transition-colors hover:bg-[#282622]"
            >
              {t("snapshot.viewAll")}
              <Icon name="arrow_forward" className="text-[18px]" />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-space-lg md:grid-cols-12">
            {/* Mateo */}
            <SnapshotCard
              image={MATEO}
              imageAlt={t("snapshot.mateoAlt")}
              location={t("snapshot.mateoCity")}
              verifiedLabel={t("snapshot.verified")}
              name={t("snapshot.mateoName")}
              languages="ES / EN"
              quote={t("snapshot.mateoQuote")}
              tags={[t("snapshot.mateoTag1"), t("snapshot.mateoTag2")]}
              ctaLabel={t("snapshot.requestConnect")}
              ctaHref="/register"
            />

            {/* Lucas */}
            <SnapshotCard
              image={LUCAS}
              imageAlt={t("snapshot.lucasAlt")}
              location={t("snapshot.lucasCity")}
              verifiedLabel={t("snapshot.verified")}
              name={t("snapshot.lucasName")}
              languages="ES / EN"
              quote={t("snapshot.lucasQuote")}
              tags={[t("snapshot.lucasTag1"), t("snapshot.lucasTag2")]}
              ctaLabel={t("snapshot.requestConnect")}
              ctaHref="/register"
            />

            {/* Marketplace item */}
            <div className="flex flex-col justify-between overflow-hidden rounded-2xl border border-[#282622] bg-[#121110] shadow-sm md:col-span-4">
              <div>
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#23211E]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt={t("snapshot.bagAlt")}
                    className="h-full w-full object-cover"
                    src={BAG}
                  />
                  <div className="absolute top-3 left-3 rounded-full border border-[#244A32] bg-[#182B20] px-2.5 py-1 font-label-caps text-label-caps font-semibold tracking-wider text-[#38a36f] uppercase">
                    {t("snapshot.adminCurated")}
                  </div>
                  <div className="absolute top-3 right-3 rounded-full border border-[#282622] bg-[#121110]/85 px-2.5 py-1 font-label-md text-label-md font-bold text-[#F5F2EB] backdrop-blur-md">
                    {t("snapshot.bagPrice")}
                  </div>
                </div>
                <div className="space-y-space-xs p-space-md">
                  <span className="font-label-caps text-label-caps font-bold text-[#E86A5B] uppercase">
                    {t("snapshot.bagOrigin")}
                  </span>
                  <h4 className="font-headline-sm text-headline-sm font-bold text-[#F5F2EB]">
                    {t("snapshot.bagName")}
                  </h4>
                  <p className="line-clamp-2 font-body-sm text-body-sm text-[#C4BEB5]">
                    {t("snapshot.bagBody")}
                  </p>
                </div>
              </div>
              <div className="p-space-md pt-0">
                <Link
                  href="/marketplace"
                  className="block w-full rounded-lg border border-[#2E2B27] bg-[#201E1B] py-2 text-center font-label-md text-label-md text-[#F5F2EB] transition-colors hover:bg-[#282622]"
                >
                  {t("snapshot.viewProvenance")}
                </Link>
              </div>
            </div>
          </div>

          {/* Sample post banner */}
          <div className="rounded-2xl border border-[#282622] bg-[#121110] p-space-lg shadow-sm">
            <div className="grid grid-cols-1 items-center gap-space-lg lg:grid-cols-12">
              <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-[#23211E] lg:col-span-5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt={t("snapshot.postAlt")}
                  className="h-full w-full object-cover"
                  src={STUDIO}
                />
                <div className="absolute bottom-3 left-3 rounded-full border border-[#282622] bg-[#121110]/85 px-3 py-1 font-label-md text-label-md text-[#F5F2EB] backdrop-blur-md">
                  {t("snapshot.postTag")}
                </div>
              </div>

              <div className="space-y-space-sm lg:col-span-7">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#34302A] bg-[#2A2622] font-label-md text-label-md font-bold text-[#E86A5B]">
                    CL
                  </div>
                  <div>
                    <span className="font-label-md text-label-md font-semibold text-[#F5F2EB]">
                      {t("snapshot.postAuthor")}
                    </span>
                    <span className="font-body-sm text-body-sm text-[#9E988F]">
                      {" "}
                      · {t("snapshot.postTime")}
                    </span>
                  </div>
                </div>
                <h3 className="font-headline-sm text-headline-sm font-bold text-[#F5F2EB]">
                  {t("snapshot.postTitle")}
                </h3>
                <p className="font-body-md text-body-md text-[#C4BEB5]">{t("snapshot.postBody")}</p>
                <p className="font-body-sm text-body-sm text-[#9E988F] italic">
                  {t("snapshot.postBodyAlt")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-[1240px] px-margin-mobile py-space-xl md:px-margin">
        <div className="relative w-full space-y-space-md overflow-hidden rounded-3xl border border-[#2E2B27] bg-[#1A1816] p-space-lg text-center shadow-xl md:p-space-xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#322E29] bg-[#221F1C] px-3 py-1 font-label-caps text-label-caps tracking-wider text-[#F5F2EB] uppercase shadow-sm">
            <span className="h-2 w-2 rounded-full bg-[#38a36f]" />
            <span>{t("cta.badge")}</span>
          </div>

          <div className="mx-auto max-w-2xl space-y-2">
            <h2 className="font-headline-xl text-headline-xl-mobile font-bold tracking-tight text-[#F5F2EB] md:text-headline-xl">
              {t("cta.title")}
            </h2>
            <p className="font-headline-sm text-headline-sm font-medium text-[#C4BEB5] italic">
              {t("cta.titleAlt")}
            </p>
          </div>

          <p className="mx-auto max-w-xl font-body-lg text-body-lg text-[#C4BEB5]">
            {t("cta.body")}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-space-md pt-space-xs">
            <Link
              href="/register"
              className="inline-flex h-12 items-center justify-center rounded-xl bg-[#E86A5B] px-8 font-label-lg text-label-lg text-white shadow-md transition-all hover:bg-[#d4584a]"
            >
              {t("cta.join")}
              <Icon name="north_east" className="ml-2 text-[20px]" />
            </Link>
            <Link
              href="/discover"
              className="inline-flex h-12 items-center justify-center rounded-xl border border-[#2E2B27] bg-[#201E1B] px-7 font-label-lg text-label-lg text-[#F5F2EB] shadow-sm transition-all hover:bg-[#282622]"
            >
              {t("cta.explore")}
              <Icon name="group" className="ml-2 text-[20px]" />
            </Link>
          </div>

          <p className="pt-space-sm font-label-caps text-label-caps tracking-widest text-[#9E988F] uppercase">
            {t("cta.assurance")}
          </p>
        </div>
      </section>
    </>
  );
}

function SnapshotCard({
  image,
  imageAlt,
  location,
  verifiedLabel,
  name,
  languages,
  quote,
  tags,
  ctaLabel,
  ctaHref,
}: {
  image: string;
  imageAlt: string;
  location: string;
  verifiedLabel: string;
  name: string;
  languages: string;
  quote: string;
  tags: string[];
  ctaLabel: string;
  ctaHref: string;
}) {
  return (
    <div className="flex flex-col justify-between overflow-hidden rounded-2xl border border-[#282622] bg-[#121110] shadow-sm md:col-span-4">
      <div>
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#23211E]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt={imageAlt} className="h-full w-full object-cover" src={image} loading="lazy" />
          <div className="absolute top-3 left-3 rounded-full border border-[#282622] bg-[#121110]/85 px-2.5 py-1 font-label-md text-label-md text-[#F5F2EB] backdrop-blur-md">
            {location}
          </div>
          <div className="absolute top-3 right-3 rounded bg-[#38a36f] px-2 py-0.5 font-label-caps text-label-caps font-semibold text-white uppercase">
            {verifiedLabel}
          </div>
        </div>
        <div className="space-y-space-xs p-space-md">
          <div className="flex items-center justify-between">
            <h4 className="font-headline-sm text-headline-sm font-bold text-[#F5F2EB]">{name}</h4>
            <span className="font-label-caps text-label-caps text-[#9E988F]">{languages}</span>
          </div>
          <p className="line-clamp-2 font-body-sm text-body-sm text-[#C4BEB5]">{quote}</p>
          <div className="flex flex-wrap gap-1 pt-1">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded border border-[#2C2925] bg-[#201E1B] px-2 py-0.5 font-label-md text-label-md text-[#C4BEB5]"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="p-space-md pt-0">
        <Link
          href={ctaHref}
          className="block w-full rounded-lg border border-[#2E2B27] bg-[#201E1B] py-2 text-center font-label-md text-label-md text-[#F5F2EB] transition-colors hover:bg-[#282622]"
        >
          {ctaLabel}
        </Link>
      </div>
    </div>
  );
}
