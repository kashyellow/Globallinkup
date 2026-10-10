"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import type { ActiveConnection } from "../data";

export function ContactVault({ connection }: { connection: ActiveConnection }) {
  const t = useTranslations("Connections.active");

  return (
    <div className="space-y-space-sm rounded-xl border border-outline-variant bg-surface p-space-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-tertiary">
          <Icon name="lock_open" className="text-base" />
          <span className="font-label-caps text-label-caps font-bold tracking-wider uppercase">
            {t("vaultTitle")}
          </span>
        </div>
        <span className="font-label-caps text-label-caps text-secondary">{t("vaultStatus")}</span>
      </div>

      <div className="space-y-space-xs pt-1">
        {/* WhatsApp / Telegram */}
        <div className="flex items-center justify-between rounded-lg border border-outline-variant bg-surface-low px-space-sm py-2">
          <div className="flex items-center gap-space-xs text-on-surface">
            <Icon name="chat" className="text-base text-tertiary" />
            <span className="font-label-md text-label-md font-semibold">
              {connection.whatsappDisplay}
            </span>
            <span className="font-label-caps text-label-caps text-secondary">
              {t(connection.whatsappLabel)}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <CopyButton value={connection.whatsappRaw} />
            <a
              href={`https://wa.me/${connection.whatsappRaw.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 rounded border border-tertiary/30 bg-tertiary/15 px-2 py-1 font-label-caps text-label-caps text-tertiary transition-colors hover:bg-tertiary/30"
            >
              <span>{t("open")}</span>
              <Icon name="arrow_outward" className="text-xs" />
            </a>
          </div>
        </div>

        {/* Instagram + Email */}
        <div className="grid grid-cols-1 gap-space-xs sm:grid-cols-2">
          <div className="flex items-center justify-between rounded-lg border border-outline-variant bg-surface-low px-space-sm py-1.5">
            <div className="flex items-center gap-1 truncate text-on-surface">
              <Icon name="photo_camera" className="text-base text-primary-container" />
              <span className="truncate font-label-md text-label-md">{connection.instagram}</span>
            </div>
            <a
              href={connection.instagramUrl}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-secondary transition-colors hover:text-primary-container"
              aria-label={t("openInstagram")}
            >
              <Icon name="open_in_new" className="text-sm" />
            </a>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-outline-variant bg-surface-low px-space-sm py-1.5">
            <div className="flex items-center gap-1 truncate text-on-surface">
              <Icon name="mail" className="text-base text-secondary" />
              <span className="truncate font-label-md text-label-md">{connection.email}</span>
            </div>
            <CopyButton value={connection.email} variant="icon" />
          </div>
        </div>
      </div>
    </div>
  );
}

function CopyButton({ value, variant = "text" }: { value: string; variant?: "text" | "icon" }) {
  const t = useTranslations("Connections.active");
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Clipboard can be unavailable (e.g. insecure context); still acknowledge.
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={copy}
        title={copied ? t("copied") : t("copy")}
        className="flex h-10 w-10 items-center justify-center rounded-lg text-secondary transition-colors hover:text-on-surface"
      >
        <Icon name={copied ? "check" : "content_copy"} className="text-sm" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={copy}
      title={t("copyTitle")}
      className="min-h-10 px-2 font-label-caps text-label-caps text-secondary transition-colors hover:text-on-surface"
    >
      {copied ? t("copied") : t("copy")}
    </button>
  );
}
