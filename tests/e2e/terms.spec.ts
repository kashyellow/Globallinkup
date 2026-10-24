import { expect, test } from "@playwright/test";

test("the register terms link opens the Terms of Service", async ({ page }) => {
  await page.goto("/en/register");

  await page.getByRole("main").getByRole("link", { name: "Terms of Service" }).click();

  await expect(page).toHaveURL(/\/en\/terms$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Terms of Service");
  await expect(page.getByRole("heading", { name: "1. PURPOSE OF GlobalLinkup" })).toBeVisible();

  // The back link returns to the sign-up form, not the landing page.
  await page.getByRole("link", { name: "Back to registration" }).click();
  await expect(page).toHaveURL(/\/en\/register$/);
});

test("the Spanish Terms of Service renders in Spanish", async ({ page }) => {
  await page.goto("/es/terms");

  await expect(page.getByRole("heading", { level: 1 })).toContainText("Términos del Servicio");
  await expect(page.getByRole("heading", { name: "1. PROPÓSITO DE GlobalLinkup" })).toBeVisible();

  await page.getByRole("link", { name: "Volver al registro" }).click();
  await expect(page).toHaveURL(/\/es\/register$/);
});
