import { expect, test } from "@playwright/test";

test("forgot-password page renders in English", async ({ page }) => {
  await page.goto("/en/forgot-password");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Forgot your password?");
});

test("forgot-password page renders in Spanish", async ({ page }) => {
  await page.goto("/es/forgot-password");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("¿Olvidaste tu contraseña?");
});

test("submitting a valid email reaches the sent confirmation", async ({ page }) => {
  await page.goto("/en/forgot-password");
  await page.getByLabel(/Email Address/).fill("sofia.martinez@example.com");
  await page.getByRole("button", { name: /Send Reset Link/ }).click();
  await expect(page).toHaveURL(/\/en\/forgot-password\/sent$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Check your email");
});

test("the login view links to the forgot-password page", async ({ page }) => {
  await page.goto("/en/login");
  await page.getByRole("link", { name: "Forgot password?" }).click();
  await expect(page).toHaveURL(/\/en\/forgot-password$/);
});
