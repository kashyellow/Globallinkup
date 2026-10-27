/**
 * Theme mode plumbing.
 *
 * The choice lives in a cookie so the server can render `<html data-theme>`
 * without a flash of the wrong palette. `system` is resolved on the client from
 * `prefers-color-scheme` by the inline script in the root layout.
 *
 * Only colour tokens change between modes; spacing, radii, typography and
 * shadows stay in the single `@theme` block (see ADR 0006).
 */
export const THEME_COOKIE = "theme";

export const THEME_MODES = ["light", "dark", "system"] as const;

export type ThemeMode = (typeof THEME_MODES)[number];

export const DEFAULT_THEME_MODE: ThemeMode = "system";

/** `theme-color` per resolved palette; kept in sync with `--color-background`. */
export const THEME_COLORS = {
  light: "#f7f1e6",
  dark: "#0b0a09",
} as const;

export function parseThemeMode(value: string | undefined | null): ThemeMode {
  return THEME_MODES.includes(value as ThemeMode) ? (value as ThemeMode) : DEFAULT_THEME_MODE;
}

function resolveTheme(mode: ThemeMode): "light" | "dark" {
  if (mode !== "system") return mode;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function paint(mode: ThemeMode): void {
  const resolved = resolveTheme(mode);
  const root = document.documentElement;
  root.dataset.theme = resolved;
  root.style.colorScheme = resolved;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", THEME_COLORS[resolved]);
}

/**
 * Inline script for `<head>`. Runs before first paint so `system` never flashes
 * the light palette on a dark device, and keeps listening while the mode is
 * `system`.
 */
export const THEME_INIT_SCRIPT = `(function(){var r=document.documentElement;function paint(){var m=r.dataset.themeMode||"system";var t=m==="system"?(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):m;r.dataset.theme=t;r.style.colorScheme=t;var e=document.querySelector('meta[name="theme-color"]');if(e)e.setAttribute("content",t==="dark"?"${THEME_COLORS.dark}":"${THEME_COLORS.light}");}paint();var q=window.matchMedia("(prefers-color-scheme: dark)");if(q.addEventListener)q.addEventListener("change",function(){if((r.dataset.themeMode||"system")==="system")paint();});})();`;

const listeners = new Set<() => void>();

/** `useSyncExternalStore` plumbing for the toggle. */
export function subscribeThemeMode(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Client snapshot: what the server rendered, read from the DOM. */
export function getThemeModeSnapshot(): ThemeMode {
  return parseThemeMode(document.documentElement.dataset.themeMode);
}

/**
 * Server snapshot: unknown. The cookie is only known to the server, which
 * renders `data-theme-mode`; returning `null` keeps the first client render
 * identical to the server HTML, so the control never causes a hydration
 * mismatch. It lights up on the first store read after hydration.
 */
export function getThemeServerSnapshot(): null {
  return null;
}

/** Persist the choice and repaint immediately, without a reload. */
export function applyThemeMode(mode: ThemeMode): void {
  if (typeof document === "undefined") return;
  document.cookie = `${THEME_COOKIE}=${mode}; path=/; max-age=31536000; samesite=lax`;
  document.documentElement.dataset.themeMode = mode;
  paint(mode);
  for (const listener of listeners) listener();
}
