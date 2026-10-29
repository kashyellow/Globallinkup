import { expect, test } from "@playwright/test";

/** The header keeps one cycling language button (EN → ES → EN). */
test("the language button cycles and survives a reload", async ({ page }) => {
  await page.goto("/en");

  const button = page.getByRole("button", { name: /language:|idioma:/i });
  await expect(button).toBeVisible();
  await expect(button).toContainText("EN");

  await button.click();
  await expect(page).toHaveURL(/\/es(\/|$)/);
  await expect(page.getByRole("button", { name: /language:|idioma:/i })).toContainText("ES");

  await page.reload();
  await expect(page).toHaveURL(/\/es(\/|$)/);
  await expect(page.getByRole("button", { name: /language:|idioma:/i })).toContainText("ES");
});
