"use client";

import type { CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ChannelIcon } from "@/components/ui/channel-icon";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import type { ContactChannel } from "../queries";

const EASE = "ease-[cubic-bezier(0.32,0.72,0,1)]";

/** Persona-form order; every channel renders even when the member left it empty. */
const CHANNEL_ORDER: ContactChannel["key"][] = [
  "whatsapp",
  "telegram",
  "instagram",
  "facebook",
  "tiktok",
  "x",
];

function channelHref(channel: ContactChannel): string | null {
  const handle = channel.value.replace(/^@/, "");
  switch (channel.key) {
    case "whatsapp":
      return `https://wa.me/${channel.value.replace(/\D/g, "")}`;
    case "telegram":
      return `https://t.me/${handle}`;
    case "instagram":
      return `https://instagram.com/${handle}`;
    case "facebook":
      return `https://facebook.com/${handle}`;
    case "tiktok":
      return `https://tiktok.com/@${handle}`;
    case "x":
      return `https://x.com/${handle}`;
    default:
      return null;
  }
}

export function ContactVault({ channels }: { channels: ContactChannel[] }) {
  const t = useTranslations("Connections.active");
  const byKey = new Map(channels.map((channel) => [channel.key, channel.value]));

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

      <div className="grid grid-cols-1 gap-space-xs pt-1 sm:grid-cols-2">
        {CHANNEL_ORDER.map((key) => {
          const value = byKey.get(key) ?? "";
          const href = value ? channelHref({ key, value }) : null;

          return (
            <div
              key={key}
              className={cn(
                "flex items-center justify-between gap-2 rounded-2xl border px-space-sm py-1.5",
                value
                  ? "border-outline-variant bg-surface-low"
                  : "border-dashed border-outline-variant bg-surface-low/50",
              )}
            >
              <div className="flex min-w-0 items-center gap-2 text-on-surface">
                <ChannelIcon
                  channel={key}
                  className={cn("text-base", value ? "text-primary" : "text-secondary")}
                />
                <div className="min-w-0">
                  <span
                    className={cn(
                      "block truncate font-label-md text-label-md",
                      !value && "text-secondary",
                    )}
                  >
                    {value || t("vaultNotShared")}
                  </span>
                  <span className="block truncate font-label-md text-label-md text-secondary">
                    {t(`channels.${key}`)}
                  </span>
                </div>
              </div>
              {value ? (
                <div className="flex shrink-0 items-center gap-1">
                  <CopyButton value={value} variant="icon" />
                  {href ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={t("open")}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-secondary transition-colors duration-300 hover:bg-surface-variant hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    >
                      <Icon name="open_in_new" className="text-sm" />
                    </a>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}
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
