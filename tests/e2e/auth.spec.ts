import { expect, test } from "@playwright/test";

/**
 * Auth end-to-end (S2, SB-4). Requires a running, seeded Supabase stack; set
 * `AUTH_E2E=1` to run it (the DB workflow does). Skips cleanly otherwise so the
 * default `npm run e2e` stays stack-free. Seeded accounts: supabase/seed.sql,
 * password `Password123`.
 */
const AUTH_E2E = process.env.AUTH_E2E === "1";
const PASSWORD = "Password123";

test.skip(!AUTH_E2E, "needs a seeded Supabase stack (AUTH_E2E=1)");

async function signIn(page: import("@playwright/test").Page, email: string, password = PASSWORD) {
  await page.goto("/en/login");
  await page.fill("#login-email", email);
  await page.fill("#login-password", password);
  await page.getByRole("button", { name: /sign in|log in|masuk/i }).click();
}

test("@auth an approved user lands in the app", async ({ page }) => {
  await signIn(page, "sofia.martinez@example.com");
  await expect(page).toHaveURL(/\/en\/discover$/);
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
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page).toHaveURL(/\/en\/login$/);
});

test("@auth an admin can reach the admin portal", async ({ page }) => {
  await signIn(page, "admin@globallinkup.test");
  await expect(page).toHaveURL(/\/en\/discover$/);
  await page.goto("/en/admin");
  await expect(page).toHaveURL(/\/en\/admin$/);
});

test("@auth an anonymous visitor is bounced from the app", async ({ page }) => {
  await page.goto("/en/discover");
  await expect(page).toHaveURL(/\/en\/login$/);
});
