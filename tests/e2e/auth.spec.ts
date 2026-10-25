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

// A valid 1×1 transparent PNG. The upload action checks MIME type and size,
// not dimensions, so this is enough to exercise the required-photo flow.
const AVATAR_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2nK0AAAAASUVORK5CYII=",
  "base64",
);

test.skip(!AUTH_E2E, "needs a seeded Supabase stack (AUTH_E2E=1)");
test.describe.configure({ mode: "serial" });

async function uploadAvatar(page: Page) {
  // Wait for client hydration so the file input's React onChange is attached.
  await page.waitForTimeout(750);
  await page.locator('input[type="file"]').first().setInputFiles({
    name: "avatar.png",
    mimeType: "image/png",
    buffer: AVATAR_PNG,
  });
  await expect(page.locator('img[alt*="portrait" i]')).toBeVisible();
}

async function addInterest(page: Page, value: string) {
  await page.locator("#persona-interests input").click();
  await page.locator(`#persona-interests [cmdk-item][data-value="${value}"]`).click();
}

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

test("@auth a pending session can switch accounts from the login page", async ({ page }) => {
  await signIn(page, "pending.user@example.com");
  await expect(page).toHaveURL(/\/en\/verify$/);

  // The parked session must not trap /login: the form stays reachable.
  await page.goto("/en/login");
  await expect(page).toHaveURL(/\/en\/login$/);
  await expect(page.getByText(/already signed in/i)).toBeVisible();

  await page.getByRole("button", { name: /sign out/i }).click();
  await expect(page.getByText(/already signed in/i)).toHaveCount(0);

  // Another account can now sign in from the same browser.
  await page.fill("#login-email", "admin@globallinkup.test");
  await page.fill("#login-password", PASSWORD);
  await page.locator("form button[type=submit]").click();
  await expect(page).toHaveURL(/\/en\/discover$/);
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
  // Rejected users have no stored avatar, so resubmitting requires a new one.
  await uploadAvatar(page);
  await expect(page.locator("form button[type=submit]")).toBeEnabled();
  await page.locator("form button[type=submit]").click();
  await expect(page).toHaveURL(/\/en\/verify$/);
  await expect(page.getByText(/Pending Administrator Review/i)).toBeVisible();
});

test("@auth discover shows real personas and viewer connect state", async ({ page }) => {
  await signIn(page, "sofia.martinez@example.com");
  await expect(page).toHaveURL(/\/en\/discover$/);

  // The header count comes from the rows, not a hardcoded marketing number.
  await expect(page.getByText(/^\d+ Active Personas Abroad$/).first()).toBeVisible();
  await expect(page.getByText(/Showing 10 of 12/i)).toBeVisible();

  const search = page.getByRole("searchbox", { name: /search by name/i });

  // Random order is fine; use search to assert the viewer-specific states.
  await search.fill("Camila");
  await expect(page.getByRole("heading", { name: /Camila Osorio/ })).toBeVisible();
  await expect(page.getByText(/^Connected$/i).first()).toBeVisible();

  await search.fill("Mateo");
  await expect(page.getByRole("heading", { name: /Mateo Silva/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /^accept$/i })).toBeVisible();

  await search.fill("Lucas");
  await expect(page.getByRole("heading", { name: /Lucas Varela/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /^connect$/i })).toBeVisible();
});

test("@auth discover search and region filters run server-side", async ({ page }) => {
  await signIn(page, "sofia.martinez@example.com");
  await expect(page).toHaveURL(/\/en\/discover$/);
  await expect(page.getByRole("banner").getByText("People & Culture")).toBeVisible();

  const search = page.getByRole("searchbox", { name: /search by name/i });
  await search.fill("Madrid");
  await expect(page.getByText(/Showing 1 of 1/i)).toBeVisible();
  await expect(page.getByRole("heading", { name: /Elena Ramos/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Camila Osorio/ })).toHaveCount(0);

  await page.getByRole("button", { name: /clear filters/i }).click();
  await expect(page.getByText(/Showing 10 of 12/i)).toBeVisible();

  await page.getByRole("button", { name: /^regions$/i }).click();
  await page.getByRole("option", { name: /spain/i }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByText(/Showing 2 of 2/i)).toBeVisible();
  await expect(page.getByRole("heading", { name: /Elena Ramos/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Carla Rossi/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Camila Osorio/ })).toHaveCount(0);
});

test("@auth guidelines return to the previous app page", async ({ page }) => {
  await signIn(page, "sofia.martinez@example.com");
  await expect(page).toHaveURL(/\/en\/discover$/);

  await page
    .getByRole("main")
    .getByRole("link", { name: /guidelines/i })
    .click();
  await expect(page).toHaveURL(/\/en\/standards$/);
  await page.getByRole("button", { name: /^back$/i }).click();
  await expect(page).toHaveURL(/\/en\/discover$/);
});

test("@auth app nav moves the profile into the burger below lg", async ({ page }) => {
  await signIn(page, "sofia.martinez@example.com");
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto("/en/discover");

  const header = page.getByRole("banner");
  const topProfile = header.locator('a[href="/en/profile"]').first();
  await expect(topProfile).toBeHidden();
  await expect(page.locator('nav[aria-label="Primary navigation"]').last()).toBeVisible();

  await header.getByRole("button", { name: /toggle navigation menu/i }).click();
  await expect(header.locator('a[href="/en/profile"]').last()).toBeVisible();

  await page.setViewportSize({ width: 1024, height: 900 });
  await expect(topProfile).toBeVisible();
  await expect(header.getByRole("button", { name: /toggle navigation menu/i })).toBeHidden();
  await expect(page.locator('nav[aria-label="Primary navigation"]').last()).toBeHidden();
});

test("@auth connections show accepted contact and pending requests", async ({ page }) => {
  await signIn(page, "sofia.martinez@example.com");
  await page.goto("/en/connections");
  await page.waitForTimeout(2500);

  // Active tab: the seed has nine accepted connections, so load the second batch.
  await page.getByRole("button", { name: /load more connections/i }).click();

  // Active tab: Camila is an accepted connection, so her channel is unlocked.
  await expect(page.getByText(/Camila Osorio/)).toBeVisible();
  await expect(page.getByText(/\+57 312 849 2011/)).toBeVisible();

  // All six persona channels render on Camila's card; the ones she left empty
  // say so, and the card no longer carries a verification badge.
  const camila = page.locator("article", { hasText: "Camila Osorio" });
  await expect(camila.getByText(/not shared/i)).toHaveCount(4);
  await expect(camila.getByText("Telegram")).toBeVisible();
  await expect(page.getByText(/verified ambassador/i)).toHaveCount(0);

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
  await page.getByRole("button", { name: /new post/i }).click();
  await expect(page.getByRole("dialog", { name: /share a post/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /^publish$/i })).toBeVisible();
  await page.getByRole("button", { name: /cancel/i }).click();
});

test("@auth creates a post with multiple images", async ({ page }) => {
  await signIn(page, "sofia.martinez@example.com");
  await page.goto("/en/posts");
  await page.waitForTimeout(1500);

  await page.getByRole("button", { name: /new post/i }).click();
  const dialog = page.getByRole("dialog", { name: /share a post/i });
  await expect(dialog).toBeVisible();

  await dialog.locator('input[type="file"]').setInputFiles([
    { name: "one.png", mimeType: "image/png", buffer: AVATAR_PNG },
    { name: "two.png", mimeType: "image/png", buffer: AVATAR_PNG },
    { name: "three.png", mimeType: "image/png", buffer: AVATAR_PNG },
  ]);
  await dialog.locator("textarea").fill("E2E multi-image dispatch");
  await dialog.getByRole("button", { name: /^publish$/i }).click();

  await expect(page.getByText("E2E multi-image dispatch")).toBeVisible({
    timeout: 20_000,
  });
});

test("@auth comments and replies on a post", async ({ page }) => {
  await signIn(page, "sofia.martinez@example.com");
  await page.goto("/en/posts/a0000000-0000-0000-0000-000000000004");
  await page.waitForTimeout(1200);

  const composer = page.getByPlaceholder(/write a comment/i);
  await composer.fill("E2E root comment");
  await page.getByRole("button", { name: /post comment/i }).click();
  await expect(page.getByText("E2E root comment")).toBeVisible();
  // Wait for the composer to clear before starting a reply; the visible text
  // above can still be the textarea value for one render.
  await expect(composer).toHaveValue("");

  await page
    .getByRole("button", { name: /^reply$/i })
    .first()
    .click();
  await expect(page.getByText(/Replying to/i)).toBeVisible();
  const replyBox = page.getByPlaceholder(/reply to/i);
  await replyBox.fill("E2E reply comment");
  const postReply = page.getByRole("button", { name: /post reply/i });
  await expect(postReply).toBeVisible();
  await postReply.click();
  await expect(page.getByText("E2E reply comment")).toBeVisible();
});

test("@auth the feed loads more and filters server-side", async ({ page }) => {
  await signIn(page, "sofia.martinez@example.com");
  await page.goto("/en/posts");
  await page.waitForTimeout(1500);

  await expect(page.getByRole("button", { name: /load more posts/i })).toBeVisible();
  await page.getByRole("button", { name: /load more posts/i }).click();
  await expect(page.locator("article")).toHaveCount(10);

  await page.getByRole("button", { name: /connections only/i }).click();
  await expect(page.getByText(/^Showing 5 of /i)).toBeVisible();
});

test("@auth the marketplace paginates, filters, and opens details", async ({ page }) => {
  await signIn(page, "sofia.martinez@example.com");
  await page.goto("/en/marketplace");
  await page.waitForTimeout(2500);
  await expect(page.getByText(/Handmade Oaxacan Leather Travel Bag/)).toBeVisible();
  await expect(page.getByText(/Showing 9 of 10/i)).toBeVisible();

  await page.getByRole("button", { name: /load more pieces/i }).click();
  await expect(page.getByText(/Showing 10 of 10/i)).toBeVisible();

  const card = page.locator('[role="button"][aria-label*="Handmade Oaxacan"]');
  await card.click();
  const detail = page.getByRole("dialog", { name: /Handmade Oaxacan/i });
  await expect(detail).toBeVisible();
  await expect(detail.getByText(/Artisan Partner Direct/i)).toBeVisible();
  await detail.getByRole("button", { name: /close detail panel/i }).click();

  await page.getByRole("button", { name: /artisan partner inquiries/i }).click();
  await expect(page.getByRole("dialog", { name: /concierge/i })).toBeVisible();
  await page
    .getByRole("dialog", { name: /concierge/i })
    .getByRole("button", { name: /close/i })
    .click();

  const search = page.getByRole("searchbox", { name: /search products/i });
  await search.fill("espresso");
  await expect(page.getByText(/Showing 1 of 1/i)).toBeVisible();
  await expect(page.getByText(/Artisanal Ceramic Espresso Set/)).toBeVisible();
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

test("@auth an admin approves a pending cultural interest", async ({ page }) => {
  await signIn(page, "admin@globallinkup.test");
  await page.goto("/en/admin");
  await page.getByRole("button", { name: /interest catalog/i }).click();

  const card = page.locator("article", { hasText: "Bookbinding" });
  await expect(card).toBeVisible();
  await card.getByRole("button", { name: /^approve$/i }).click();
  await page.waitForTimeout(1500);
  await expect(card).toHaveCount(0);
  await expect(page.getByText(/Published suggestions/i)).toBeVisible();
});

test("@auth the profile shows the real dossier and unlocked channels", async ({ page }) => {
  await signIn(page, "sofia.martinez@example.com");
  await page.goto("/en/profile");
  await page.waitForTimeout(2500);
  await expect(page.getByRole("heading", { name: /Sofia Martinez/ })).toBeVisible();
  await expect(page.getByText(/\+34 612 849 201/)).toBeVisible();

  // Editing opens the persona form in edit mode, not the onboarding flow.
  await page.getByRole("link", { name: /edit profile/i }).click();
  await expect(page).toHaveURL(/\/en\/profile\/edit$/);
  await expect(page.getByRole("heading", { name: /edit your persona/i })).toBeVisible();
  await expect(page.locator("#persona-fullname")).toHaveValue("Sofia Martinez");
});

test("@auth a shared dossier has no owner actions for another member", async ({ page }) => {
  await signIn(page, "reset.user@example.com");
  await page.goto("/en/persona/22222222-2222-2222-2222-222222222222");
  await page.waitForTimeout(1200);

  await expect(page.getByRole("heading", { name: /Sofia Martinez/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /edit profile/i })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /log out/i })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /share/i })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /^connect$/i })).toBeVisible();

  // The owner sees the edit path instead of Connect/Report on the same page.
  await page.context().clearCookies();
  await signIn(page, "sofia.martinez@example.com");
  await page.goto("/en/persona/22222222-2222-2222-2222-222222222222");
  await page.waitForTimeout(1000);
  await expect(page.getByRole("link", { name: /edit profile/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /^connect$/i })).toHaveCount(0);
});

test("@auth step 1 stays editable until the persona is submitted", async ({ page }) => {
  const email = `draft-${Date.now()}@example.com`;
  await page.goto("/en/register");
  await page.fill("#reg-email", email);
  await page.fill("#reg-password", PASSWORD);
  await page.fill("#reg-confirm", PASSWORD);
  await page.check("#reg-terms");
  await page.locator("form button[type=submit]").click();
  await expect(page).toHaveURL(/\/en\/create-persona$/);

  // No auth account exists yet, so step 1 can still be opened and edited.
  await page.getByRole("link", { name: /back to step 1/i }).click();
  await expect(page).toHaveURL(/\/en\/register$/);
  await expect(page.locator("#reg-email")).toHaveValue(email);

  // Going home and choosing Join starts step 1 again instead of looping
  // through an orphan authenticated account.
  await page.goto("/en");
  await page.locator('header a[href="/en/register"]').click();
  await expect(page).toHaveURL(/\/en\/register$/);
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
  // Languages and interests no longer have defaults.
  await page.locator("#persona-language-ES").click();
  await addInterest(page, "architecture");
  await addInterest(page, "literature");
  await addInterest(page, "hikingNature");
  // The vault now requires at least one channel.
  await page.fill("#persona-whatsapp", "+351 900 000 000");
  await uploadAvatar(page);
  await page.locator("form button[type=submit]").click();
  // Step 2 now signs up, uploads and saves in sequence on a cold dev server.
  await expect(page).toHaveURL(/\/en\/verify$/, { timeout: 15_000 });
});
