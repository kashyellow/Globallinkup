import { expect, test } from "@playwright/test";

/**
 * Theme modes (ADR 0006). One cycling control: system → light → dark → system.
 * The palette is applied by an inline script before first paint, so these
 * assertions read `<html data-theme>` rather than pixels.
 */
test("the theme button cycles and persists", async ({ page }) => {
  await page.goto("/en");

  const html = page.locator("html");
  const button = page.getByRole("button", { name: /switch theme|cambiar tema/i });
  await expect(button).toBeVisible();
  await expect(html).toHaveAttribute("data-theme-mode", "system");

  await button.click();
  await expect(html).toHaveAttribute("data-theme-mode", "light");
  await expect(html).toHaveAttribute("data-theme", "light");

  await page.reload();
  await expect(html).toHaveAttribute("data-theme", "light");

  await button.click();
  await expect(html).toHaveAttribute("data-theme", "dark");

  await button.click();
  await expect(html).toHaveAttribute("data-theme-mode", "system");
  // Chromium defaults to a light colour scheme, so `system` resolves to light.
  await expect(html).toHaveAttribute("data-theme", "light");
});
