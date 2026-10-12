"use client";

import type { CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import type { ActiveConnection } from "../data";

const EASE = "ease-[cubic-bezier(0.32,0.72,0,1)]";

export function ContactVault({ connection }: { connection: ActiveConnection }) {
  const t = useTranslations("Connections.active");

  return (
    <div
      className="space-y-space-sm rounded-2xl border border-success-border bg-success-surface/40 p-space-md"
      style={{ "--bezel-core-bg": "var(--color-success-surface)" } as CSSProperties}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-success-text">
          <Icon name="lock_open" className="text-base" />
          <span className="font-label-lg text-label-lg font-semibold">{t("vaultTitle")}</span>
        </div>
        <span className="font-label-md text-label-md text-success-text">{t("vaultStatus")}</span>
      </div>

      <div className="space-y-space-xs pt-1">
        {/* WhatsApp / Telegram */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-outline-variant bg-surface-low px-space-sm py-2">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-on-surface">
            <Icon name="chat" className="text-base text-success-text" />
            <span className="font-label-md text-label-md font-semibold">
              {connection.whatsappDisplay}
            </span>
            <span className="font-label-md text-label-md text-secondary">
              {t(connection.whatsappLabel)}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <CopyButton value={connection.whatsappRaw} />
            <a
              href={`https://wa.me/${connection.whatsappRaw.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-1 rounded-full border border-success-border bg-success-surface px-3 py-2 font-label-md text-label-md text-success-text transition-colors duration-300 hover:bg-success-container focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <span>{t("open")}</span>
              <Icon name="arrow_outward" className="text-xs" />
            </a>
          </div>
        </div>

        {/* Instagram + Email */}
        <div className="grid grid-cols-1 gap-space-xs sm:grid-cols-2">
          <div className="flex items-center justify-between gap-2 rounded-2xl border border-outline-variant bg-surface-low px-space-sm py-1.5">
            <div className="flex min-w-0 items-center gap-1.5 text-on-surface">
              <Icon name="photo_camera" className="shrink-0 text-base text-primary" />
              <span className="truncate font-label-md text-label-md">{connection.instagram}</span>
            </div>
            <a
              href={connection.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-secondary transition-colors duration-300 hover:bg-surface-variant hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              aria-label={t("openInstagram")}
            >
              <Icon name="open_in_new" className="text-sm" />
            </a>
          </div>

          <div className="flex items-center justify-between gap-2 rounded-2xl border border-outline-variant bg-surface-low px-space-sm py-1.5">
            <div className="flex min-w-0 items-center gap-1.5 text-on-surface">
              <Icon name="mail" className="shrink-0 text-base text-secondary" />
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
        aria-label={copied ? t("copied") : t("copy")}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-secondary transition-colors duration-300 hover:bg-surface-variant hover:text-on-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
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
      className={cn(
        "inline-flex min-h-11 items-center rounded-full px-3 font-label-md text-label-md text-secondary",
        "hover:bg-surface-variant hover:text-on-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        "transition-colors duration-300",
        EASE,
      )}
    >
      {copied ? t("copied") : t("copy")}
    </button>
  );
}
