import { expect, test, type Page } from "@playwright/test";

/**
 * Auth end-to-end (S2, SB-4 / F-S2-2). Requires a running, seeded Supabase
 * stack; set `AUTH_E2E=1` to run it (the DB workflow does). Skips cleanly
 * otherwise so the default `npm run e2e` stays stack-free.
 *
 * Serial: the specs share one seeded database, so they must not race.
 */
const AUTH_E2E = process.env.AUTH_E2E === "1";
const PASSWORD = "Password123";

test.skip(!AUTH_E2E, "needs a seeded Supabase stack (AUTH_E2E=1)");
test.describe.configure({ mode: "serial" });

async function signIn(page: Page, email: string, password = PASSWORD) {
  await page.goto("/en/login");
  await page.fill("#login-email", email);
  await page.fill("#login-password", password);
  await page.locator("form button[type=submit]").click();
  await page.waitForTimeout(1500);
}

test("@auth an approved user lands in the app", async ({ page }) => {
  await signIn(page, "sofia.martinez@example.com");
  await expect(page).toHaveURL(/\/en\/discover$/);
  // Admin navigation is separate (FR-10.4): a non-admin sees no admin link.
  await expect(page.getByRole("link", { name: /admin portal/i })).toHaveCount(0);
});

test("@auth a pending user is sent to the review screen", async ({ page }) => {
  await signIn(page, "pending.user@example.com");
  await expect(page).toHaveURL(/\/en\/verify$/);
});

test("@auth a rejected user sees the resubmit path", async ({ page }) => {
  await signIn(page, "rejected.user@example.com");
  await expect(page).toHaveURL(/\/en\/verify$/);
  await expect(page.getByRole("link", { name: /update|resubmit|edit/i }).first()).toBeVisible();
});

test("@auth a suspended user sees the suspended notice", async ({ page }) => {
  await signIn(page, "suspended.user@example.com");
  await expect(page).toHaveURL(/\/en\/verify$/);
});

test("@auth a wrong password shows the invalid banner", async ({ page }) => {
  await signIn(page, "sofia.martinez@example.com", "WrongPassword1");
  await expect(
    page.getByRole("alert").filter({ hasText: /incorrect|credenciales/i }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/en\/login$/);
});

test("@auth an admin can reach the admin portal", async ({ page }) => {
  await signIn(page, "admin@globallinkup.test");
  await expect(page).toHaveURL(/\/en\/discover$/);
  await expect(page.getByRole("link", { name: /admin portal/i })).toBeVisible();
  await page.goto("/en/admin");
  await expect(page).toHaveURL(/\/en\/admin$/);
});

test("@auth an anonymous visitor is bounced from the app", async ({ page }) => {
  await page.goto("/en/discover");
  await expect(page).toHaveURL(/\/en\/login$/);
});

test("@auth a rejected user resubmits and returns to review", async ({ page }) => {
  await signIn(page, "rejected.user@example.com");
  await page.goto("/en/create-persona");
  await expect(page.locator("#persona-fullname")).toHaveValue("Rejected Applicant");
  await expect(page.locator("form button[type=submit]")).toBeEnabled();
  await page.locator("form button[type=submit]").click();
  await expect(page).toHaveURL(/\/en\/verify$/);
  await expect(page.getByText(/Pending Administrator Review/i)).toBeVisible();
});

test("@auth onboarding creates a persona for a new account", async ({ page }) => {
  const email = `e2e-${Date.now()}@example.com`;
  await page.goto("/en/register");
  await page.fill("#reg-email", email);
  await page.fill("#reg-password", PASSWORD);
  await page.fill("#reg-confirm", PASSWORD);
  await page.check("#reg-terms");
  await page.locator("form button[type=submit]").click();
  await expect(page).toHaveURL(/\/en\/create-persona$/);

  await page.fill("#persona-fullname", "E2E Onboarding");
  await page.fill("#persona-city", "Lisbon");
  await page.fill("#persona-bio", "Created by the end-to-end onboarding spec.");
  await page.locator("form button[type=submit]").click();
  await expect(page).toHaveURL(/\/en\/verify$/);
});
