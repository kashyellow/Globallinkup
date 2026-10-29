# ADR 0006 — Light, dark, and system themes

- **Status:** accepted (implemented 2026-10-27)
- **Date:** 2026-10-27
- **Related:** [round 1, item 5](../feedback/2026-10-27-client-review.md)

## Context

The app ships a single light palette: `src/app/globals.css` defines `--color-*`
tokens, with `--color-background: #f7f1e6` and `--color-on-surface: #243b35`.
There is no `prefers-color-scheme` branch, no `.dark` class, and no theme provider
in `package.json`.

That light palette replaced the earlier warm-charcoal one in `baefd24`
("rebuild landing and adopt light mockup palette"). The palette immediately before
that commit (`baefd24^`, i.e. `3abf214` "restore the warm charcoal palette") is
the dark look the client prefers:

```css
--color-primary: #e86a5b;
--color-background: #0b0a09;
--color-surface-low: #181715;
--color-on-surface: #f6f3ee;
```

The client asked for a switch between the two and suggested a "system" option.

## Decision

Three modes — `light`, `dark`, `system` — with `system` as the default.

- **Only colours come from the old commit.** Every non-colour token (spacing,
  radius, typography, shadows, layout) stays exactly as it is today. The dark
  block is a `[data-theme="dark"]` override of the `--color-*` variables; no
  component gets a `dark:` variant.
- Dark values are copied from `git show baefd24^:src/app/globals.css`; where a
  token did not exist back then (added later, e.g. admin/danger surfaces), derive
  it by keeping the same relationship to its neighbours and verify contrast.
- `color-scheme: light dark` on `:root` and the matching value per theme so native
  controls (scrollbars, form fields, date pickers) follow the mode.
- `<meta name="theme-color">` is updated per mode.

### Persistence without a flash

- Choice stored in a `theme` cookie (`light | dark | system`, 1 year, `SameSite=Lax`).
- The root layout reads the cookie server-side and renders
  `<html data-theme="…">`; when the cookie says `system`, an inline script sets the
  attribute from `prefers-color-scheme` **before** first paint, and keeps listening
  for OS changes.
- No `next-themes` dependency: the whole feature is one cookie read plus one small
  inline script, which keeps the bundle and the hydration story simple.

### Toggle

- **One compact cycling button** in both headers, visible at every breakpoint:
  system → light → dark → system. It replaced three separate buttons because the
  group crowded the mobile navbar; the icon reflects the current mode and the
  label announces the next one.
- Toggling writes the cookie and sets `data-theme` immediately (no reload).
- The pre-paint resolver ships via `next/script` with `strategy="beforeInteractive"`;
  a raw `<script>` in a React component never runs on the client (React 19 warns).

## Consequences

- ~90 colour tokens need dark values. The contrast of text, borders, error, and
  admin badges must be checked in both palettes before merge; the light palette's
  `--color-danger-*` and `--color-admin-*` values do not exist in the old commit.
- Images, illustrations, and the email/OG metadata keep their current treatment;
  OG images stay light, which is acceptable.
- Tests: a Playwright check that toggling persists after reload, and that
  `system` follows `emulateMedia({ colorScheme })`.
- The localStorage-free approach means the choice is per browser session cookie
  jar, which is what we want for a shared device.

## Alternatives considered

- **Dark only (revert the palette)**: rejected — the client asked for a switch, and
  the light palette is already tuned for the current layouts.
- **`next-themes`**: rejected — one more dependency for a cookie read and an inline
  script; it also defaults to `localStorage`, which flashes before hydration unless
  configured carefully.
- **Pure CSS `light-dark()` with no toggle**: rejected — no manual override, and
  browser support for the function is uneven for our palette structure.
- **`dark:` variants per component**: rejected — it multiplies maintenance and
  breaks the "one token layer" design.

## Follow-ups

- `src/app/globals.css`: `[data-theme="dark"]` colour block + `color-scheme`.
- Root layout: cookie read, `data-theme` attribute, inline `system` resolver,
  `theme-color` meta.
- Toggle component + i18n keys + navbar/menu slot.
- Contrast audit (manual + Playwright screenshot of key pages in both modes).
- Playwright: persistence and `system` behaviour.
