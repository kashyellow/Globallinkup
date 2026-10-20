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

test("@auth discover shows real personas and viewer connect state", async ({ page }) => {
  await signIn(page, "sofia.martinez@example.com");
  await expect(page).toHaveURL(/\/en\/discover$/);

  // Real rows, sorted by name — page 1 is Camila, Elena, Lucas, Mateo.
  await expect(page.getByRole("heading", { name: /Camila Osorio/ })).toBeVisible();
  // Camila is an accepted connection in the seed; Mateo sent Sofia a request,
  // so the viewer must see the RECEIVED state (Accept), not "Request Sent".
  await expect(page.getByText(/^Connected$/i).first()).toBeVisible();
  await expect(page.getByRole("button", { name: /^accept$/i }).first()).toBeVisible();
  // Elena has no connection yet, so the card offers Connect.
  await expect(page.getByRole("button", { name: /^connect$/i }).first()).toBeVisible();
});

test("@auth connections show accepted contact and pending requests", async ({ page }) => {
  await signIn(page, "sofia.martinez@example.com");
  await page.goto("/en/connections");
  await page.waitForTimeout(2500);

  // Active tab: Camila is an accepted connection, so her channel is unlocked.
  await expect(page.getByText(/Camila Osorio/)).toBeVisible();
  await expect(page.getByText(/\+57 312 849 2011/)).toBeVisible();

  // Requests tab: Mateo's pending request with an Accept action.
  await page.getByRole("button", { name: /received requests/i }).click();
  await expect(page.getByText(/Mateo Silva/)).toBeVisible();
  await expect(page.getByRole("button", { name: /accept/i })).toBeVisible();
});

test("@auth the feed shows real posts and a composer", async ({ page }) => {
  await signIn(page, "sofia.martinez@example.com");
  await page.goto("/en/posts");
  await page.waitForTimeout(2500);

  // Seeded post caption proves the feed reads real rows.
  await expect(page.getByText(/Gothic Quarter, shot on expired Portra/)).toBeVisible();
  await expect(page.getByRole("button", { name: /publish/i })).toBeVisible();
});

test("@auth the marketplace lists real products", async ({ page }) => {
  await signIn(page, "sofia.martinez@example.com");
  await page.goto("/en/marketplace");
  await page.waitForTimeout(2500);
  await expect(page.getByText(/Handmade Oaxacan Leather Travel Bag/)).toBeVisible();
});

test("@auth an admin approves a pending persona", async ({ page }) => {
  await signIn(page, "admin@globallinkup.test");
  await page.goto("/en/admin");
  await page.waitForTimeout(2500);

  const card = page.locator("article", { hasText: "Pending Applicant" });
  await expect(card).toBeVisible();
  await card.getByRole("button", { name: /approve/i }).click();
  await page.waitForTimeout(1500);
  await expect(card.getByText(/Approved/).first()).toBeVisible();
});

test("@auth the profile shows the real dossier and unlocked channels", async ({ page }) => {
  await signIn(page, "sofia.martinez@example.com");
  await page.goto("/en/profile");
  await page.waitForTimeout(2500);
  await expect(page.getByRole("heading", { name: /Sofia Martinez/ })).toBeVisible();
  await expect(page.getByText(/\+34 612 849 201/)).toBeVisible();
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
  // The vault now requires at least one channel.
  await page.fill("#persona-whatsapp", "+351 900 000 000");
  await page.locator("form button[type=submit]").click();
  await expect(page).toHaveURL(/\/en\/verify$/);
});
