"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { cn } from "@/lib/utils";

/**
 * Stand-in for the Privacy Policy link. The policy is not authored yet, so this
 * renders the literal `[INSERT PRIVACY POLICY LINK]` marker as a button that
 * reveals a short "not published yet" note instead of pointing nowhere.
 */
export function PrivacyPolicyLink() {
  const t = useTranslations("Legal.privacyPlaceholder");
  const [open, setOpen] = useState(false);

  return (
    <span className="relative inline-flex flex-col items-start">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className={cn(
          "inline font-semibold text-primary underline decoration-dotted underline-offset-2 transition-colors hover:text-primary-hover",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        )}
      >
        {t("label")}
      </button>
      {open ? (
        <span
          role="status"
          className="mt-1 block max-w-[42ch] rounded-xl border border-outline-variant bg-surface-container p-space-sm font-body-sm text-body-sm text-secondary"
        >
          {t("notice")}
        </span>
      ) : null}
    </span>
  );
}
