"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { Icon } from "@/components/ui/icon";
import { InlineAlert } from "@/components/ui/inline-alert";
import { Spinner } from "@/components/ui/spinner";
import { updateMarketplaceContactAction } from "@/features/admin/actions";
import { usePendingAction } from "@/features/shared/use-pending-action";
import type { MarketplaceContact } from "@/features/marketplace/queries";

const INPUT =
  "h-11 w-full rounded-full border border-outline-variant bg-surface-dim px-space-md font-body-sm text-body-sm text-on-surface transition-colors duration-300 placeholder:text-text-muted hover:border-outline focus:border-primary focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
const LABEL = "font-label-md text-label-md font-semibold text-on-surface";

/**
 * One concierge contact for the whole catalog: members ask about any piece
 * through it. The value lives in `platform_settings`, so editing it here is the
 * only supported path — nothing is hardcoded or read from the environment.
 */
export function MarketplaceContactPanel({ contact }: { contact: MarketplaceContact }) {
  const t = useTranslations("Admin.marketplace.contact");
  const tCommon = useTranslations("Common");
  const { isPending, run } = usePendingAction();
  const [email, setEmail] = useState(contact.email);
  const [phone, setPhone] = useState(contact.phone);
  const [status, setStatus] = useState<"idle" | "saved" | "invalid" | "failed">("idle");

  const pending = isPending("contact");
  const configured = email.trim().length > 0 || phone.trim().length > 0;

  async function submit() {
    setStatus("idle");
    await run("contact", async () => {
      try {
        const result = await updateMarketplaceContactAction({ email, phone });
        setStatus(result.ok ? "saved" : result.error === "invalid" ? "invalid" : "failed");
      } catch {
        setStatus("failed");
      }
    });
  }

  return (
    <section
      aria-labelledby="marketplace-contact-title"
      className="mt-space-md rounded-2xl border border-outline-variant bg-surface-low p-space-md md:mt-space-lg md:p-space-lg"
    >
      <div className="flex items-start gap-space-sm">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-admin-surface text-admin-text">
          <Icon name="support_agent" className="text-lg" />
        </span>
        <div className="min-w-0">
          <h2
            id="marketplace-contact-title"
            className="font-label-lg text-label-lg font-semibold text-on-surface"
          >
            {t("title")}
          </h2>
          <p className="font-body-sm text-body-sm text-secondary">{t("body")}</p>
        </div>
      </div>

      {!configured ? (
        <InlineAlert tone="warning" className="mt-space-sm">
          {t("notConfigured")}
        </InlineAlert>
      ) : null}

      <form
        className="mt-space-md flex flex-col gap-space-sm md:flex-row md:items-end"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <label className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className={LABEL}>{t("emailLabel")}</span>
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setStatus("idle");
            }}
            placeholder={t("emailPlaceholder")}
            className={INPUT}
          />
        </label>
        <label className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className={LABEL}>{t("phoneLabel")}</span>
          <input
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={phone}
            onChange={(event) => {
              setPhone(event.target.value);
              setStatus("idle");
            }}
            aria-describedby="marketplace-contact-phone-hint"
            placeholder={t("phonePlaceholder")}
            className={INPUT}
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-5 font-label-lg text-label-lg font-semibold text-on-primary transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px disabled:opacity-60"
        >
          {pending ? <Spinner className="h-4 w-4 text-current" label={tCommon("saving")} /> : null}
          {t("save")}
        </button>
      </form>

      <p
        id="marketplace-contact-phone-hint"
        className="mt-1.5 font-body-sm text-body-sm text-text-muted"
      >
        {t("phoneHint")}
      </p>

      {status === "saved" ? (
        <InlineAlert tone="success" className="mt-space-sm">
          {t("saved")}
        </InlineAlert>
      ) : null}
      {status === "invalid" ? (
        <InlineAlert className="mt-space-sm">{t("invalid")}</InlineAlert>
      ) : null}
      {status === "failed" ? (
        <InlineAlert className="mt-space-sm">{tCommon("actionError")}</InlineAlert>
      ) : null}
    </section>
  );
}
