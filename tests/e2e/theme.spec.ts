import { expect, test } from "@playwright/test";

/**
 * Theme modes (ADR 0006). The palette is applied by an inline script before
 * first paint, so these assertions read `<html data-theme>` rather than pixels.
 */
test("theme toggle persists across reloads and offers system", async ({ page }) => {
  await page.goto("/en");

  const group = page.getByRole("group", { name: /theme|tema/i });
  await expect(group).toBeVisible();

  const html = page.locator("html");
  const dark = group.getByRole("button", { name: /^dark$|^oscuro$/i });
  const light = group.getByRole("button", { name: /^light$|^claro$/i });
  const system = group.getByRole("button", { name: /^system|^sistema/i });

  await dark.click();
  await expect(html).toHaveAttribute("data-theme", "dark");
  await expect(dark).toHaveAttribute("aria-pressed", "true");

  await page.reload();
  await expect(html).toHaveAttribute("data-theme", "dark");
  await expect(dark).toHaveAttribute("aria-pressed", "true");

  await light.click();
  await expect(html).toHaveAttribute("data-theme", "light");

  // Chromium defaults to a light colour scheme, so `system` resolves to light.
  await system.click();
  await expect(html).toHaveAttribute("data-theme-mode", "system");
  await expect(html).toHaveAttribute("data-theme", "light");
});
