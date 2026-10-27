"use client";

import { useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";

import { Icon } from "@/components/ui/icon";
import {
  applyThemeMode,
  getThemeModeSnapshot,
  getThemeServerSnapshot,
  subscribeThemeMode,
  THEME_MODES,
  type ThemeMode,
} from "@/lib/theme";
import { cn } from "@/lib/utils";

const ICONS: Record<ThemeMode, string> = {
  light: "light_mode",
  dark: "dark_mode",
  system: "brightness_auto",
};

/**
 * Three-state theme switch (light / dark / system).
 *
 * The active state is read after mount: the server cannot know what `system`
 * resolves to, and rendering a pressed button during SSR would mismatch
 * hydration. The palette itself is already correct before paint thanks to the
 * inline script in the root layout — only this control catches up.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const t = useTranslations("Theme");
  // `null` until the client snapshot is read, which keeps SSR and the first
  // client render identical (the palette itself is already correct).
  const mode = useSyncExternalStore(
    subscribeThemeMode,
    getThemeModeSnapshot,
    getThemeServerSnapshot,
  );

  function choose(next: ThemeMode) {
    applyThemeMode(next);
  }

  return (
    <div
      role="group"
      aria-label={t("label")}
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full border border-outline-variant bg-surface-container p-0.5",
        className,
      )}
    >
      {THEME_MODES.map((option) => {
        const active = mode === option;
        return (
          <button
            key={option}
            type="button"
            onClick={() => choose(option)}
            aria-pressed={active}
            aria-label={t(option)}
            title={t(option)}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
              active
                ? "bg-primary text-on-primary"
                : "text-secondary hover:bg-surface-container-high hover:text-on-surface",
            )}
          >
            <Icon name={ICONS[option]} className="text-[18px]" />
          </button>
        );
      })}
    </div>
  );
}
