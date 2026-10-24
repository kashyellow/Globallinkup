import { expect, test } from "@playwright/test";

test("root redirects to the default locale", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/en\/?$/);
});

test("landing page renders in English", async ({ page }) => {
  await page.goto("/en");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Connect beyond");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("borders.");
});

test("landing page renders in Spanish", async ({ page }) => {
  await page.goto("/es");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Conecta más allá de las");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("fronteras.");
});

test("landing header keeps a single copy of each auth action", async ({ page }) => {
  const header = page.locator("header");

  for (const width of [640, 768]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/en");
    await expect(header.getByRole("link", { name: "Sign In" })).toBeVisible();
    await expect(header.getByRole("link", { name: /join/i })).toHaveCount(1);

    await header.getByRole("button", { name: /toggle navigation menu/i }).click();
    await expect(header.getByRole("link", { name: "Sign In" })).toHaveCount(1);
    await expect(header.getByRole("link", { name: /join/i })).toHaveCount(1);
  }

  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto("/en");
  await expect(header.getByRole("link", { name: "Sign In" })).toHaveCount(0);
  await expect(header.getByRole("link", { name: /join/i })).toHaveCount(1);
  await header.getByRole("button", { name: /toggle navigation menu/i }).click();
  await expect(header.getByRole("link", { name: "Sign In" })).toHaveCount(1);
  await expect(header.getByRole("link", { name: /join/i })).toHaveCount(1);

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/en");
  await expect(header.getByRole("button", { name: /toggle navigation menu/i })).toBeHidden();
  await expect(header.getByRole("link", { name: "Sign In" })).toHaveCount(1);
  await expect(header.getByRole("link", { name: /join/i })).toHaveCount(1);
});
