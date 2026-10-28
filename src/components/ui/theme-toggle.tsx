"use client";

import { useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";

import { Icon } from "@/components/ui/icon";
import {
  applyThemeMode,
  getThemeModeSnapshot,
  getThemeServerSnapshot,
  subscribeThemeMode,
  type ThemeMode,
} from "@/lib/theme";
import { cn } from "@/lib/utils";

/** One compact control instead of three buttons: system → light → dark → system. */
const CYCLE: readonly ThemeMode[] = ["system", "light", "dark"] as const;

const ICONS: Record<ThemeMode, string> = {
  system: "brightness_auto",
  light: "light_mode",
  dark: "dark_mode",
};

export function ThemeToggle({ className }: { className?: string }) {
  const t = useTranslations("Theme");
  const mode = useSyncExternalStore(
    subscribeThemeMode,
    getThemeModeSnapshot,
    getThemeServerSnapshot,
  );

  // `null` on the server so the first client render matches the server HTML.
  const current: ThemeMode = mode ?? "system";
  const next = CYCLE[(CYCLE.indexOf(current) + 1) % CYCLE.length];

  return (
    <button
      type="button"
      onClick={() => applyThemeMode(next)}
      aria-label={t("switchTo", { mode: t(next) })}
      title={`${t(current)} → ${t(next)}`}
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-full text-secondary transition-colors duration-200 hover:bg-surface-container hover:text-on-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        className,
      )}
    >
      <Icon name={ICONS[current]} className="text-[19px]" />
    </button>
  );
}
