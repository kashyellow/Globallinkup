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
  const crop = page.getByRole("dialog", { name: /fit your portrait/i });
  if (await crop.isVisible().catch(() => false)) {
    await crop.getByRole("button", { name: /use this crop/i }).click();
  }
  await expect(page.locator('img[alt*="portrait" i]')).toBeVisible();
}

// Sign-in finishes on one of the three post-auth destinations. Waiting for the
// navigation beats a fixed sleep: a cold dev server can take seconds to compile
// `/en/login` and the redirect, which is what made this suite flaky.
const POST_AUTH_URL = /\/(discover|verify|create-persona)$/;
const POST_AUTH_TIMEOUT = 20_000;

async function signIn(
  page: Page,
  email: string,
  password = PASSWORD,
  { expectRedirect = true }: { expectRedirect?: boolean } = {},
) {
  await page.goto("/en/login");
  await page.fill("#login-email", email);
  await page.fill("#login-password", password);
  await page.locator("form button[type=submit]").click();
  if (expectRedirect) {
    await page.waitForURL(POST_AUTH_URL, { timeout: POST_AUTH_TIMEOUT });
  }
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
  await signIn(page, "sofia.martinez@example.com", "WrongPassword1", {
    expectRedirect: false,
  });
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
  await expect(page.getByRole("heading", { name: /Control room overview/i })).toBeVisible();
  await page.getByRole("link", { name: /users & profiles/i }).click();
  await expect(page).toHaveURL(/\/en\/admin\/users$/);
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
  await expect(page.getByText(/^\d+ Active profiles abroad$/).first()).toBeVisible();
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
  const notShared = camila.getByText("Not shared", { exact: true });
  await expect(notShared).toHaveCount(4);
  await expect(camila.getByText("@camila.textiles")).toBeVisible();
  await expect(page.getByText(/verified ambassador/i)).toHaveCount(0);

  // Below sm the unshared rows collapse behind a toggle naming the count.
  await page.setViewportSize({ width: 375, height: 900 });
  await expect(notShared).toHaveCount(4);
  await expect(notShared.first()).toBeHidden();
  await camila.getByRole("button", { name: /show 4 not shared/i }).click();
  await expect(notShared.first()).toBeVisible();
  await camila.getByRole("button", { name: /show shared channels only/i }).click();
  await expect(notShared.first()).toBeHidden();
  await page.setViewportSize({ width: 1280, height: 720 });

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

test("@auth authors delete posts from the archive, not the feed", async ({ page }) => {
  await signIn(page, "sofia.martinez@example.com");
  await page.goto("/en/posts");
  await page.waitForTimeout(1200);
  await expect(page.getByRole("button", { name: /remove post/i })).toHaveCount(0);

  await page.goto("/en/profile");
  await page.waitForTimeout(1000);
  const deletePost = page.getByRole("button", { name: /delete post/i }).first();
  await expect(deletePost).toBeVisible();
  await deletePost.click();
  await expect(page.getByRole("alertdialog")).toBeVisible();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: /cancel/i })
    .click();
});

test("@auth an author archives and restores a post", async ({ page }) => {
  await signIn(page, "sofia.martinez@example.com");
  await page.goto("/en/profile");
  await page.waitForTimeout(1000);

  const archive = page.getByRole("button", { name: /^archive$/i }).first();
  await expect(archive).toBeVisible();
  await archive.click();

  // The card moves out of Active and into Archived.
  await page.getByRole("button", { name: /^archived/i }).click();
  const restore = page.getByRole("button", { name: /restore to feed/i }).first();
  await expect(restore).toBeVisible();
  await restore.click();

  await page.getByRole("button", { name: /^active/i }).click();
  await expect(page.getByRole("button", { name: /^archive$/i }).first()).toBeVisible();
});

test("@auth the audit and team desks render cleanly", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await signIn(page, "admin@globallinkup.test");
  await page.goto("/en/admin/audit");
  await expect(page.getByRole("heading", { name: /audit trail/i })).toBeVisible();

  await page.goto("/en/admin/team");
  await expect(page.getByRole("heading", { name: /team & roles/i })).toBeVisible();
  // Roles are collapsible cards now: open the first one before checking the matrix.
  await page.locator("summary").first().click();
  await expect(page.getByRole("checkbox").first()).toBeVisible();

  const relevant = errors.filter((error) =>
    /MISSING_MESSAGE|is not a function|use\(\)/.test(error),
  );
  expect(relevant).toEqual([]);
});

test("@auth the notifications inbox renders without React use() warnings", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await signIn(page, "sofia.martinez@example.com");
  await page.goto("/en/notifications");
  await expect(page.getByRole("heading", { name: /notifications/i })).toBeVisible();

  const useWarnings = errors.filter((error) => error.includes("use()"));
  expect(useWarnings).toEqual([]);
});

test("@auth admins can moderate posts and comments inline", async ({ page }) => {
  await signIn(page, "admin@globallinkup.test");
  await page.goto("/en/posts");
  await page.waitForTimeout(1200);
  await expect(page.getByRole("button", { name: /remove post/i }).first()).toBeVisible();

  await page.goto("/en/posts/a0000000-0000-0000-0000-000000000004");
  await page.waitForTimeout(800);
  await expect(page.getByRole("button", { name: /^delete$/i }).first()).toBeVisible();
});

test("@auth persona back returns to the originating post", async ({ page }) => {
  await signIn(page, "sofia.martinez@example.com");
  await page.goto("/en/posts/a0000000-0000-0000-0000-000000000004");
  await page.waitForTimeout(800);
  await page.getByRole("link", { name: "Valentina Gomez" }).first().click();
  await expect(page).toHaveURL(/\/en\/persona\//);
  await page
    .getByRole("button", { name: /^back$/i })
    .first()
    .click();
  await expect(page).toHaveURL(/\/en\/posts\/a0000000-0000-0000-0000-000000000004$/);
});

test("@auth sent request notes open as a readable letter", async ({ page }) => {
  await signIn(page, "sofia.martinez@example.com");
  await page.goto("/en/connections");
  await page.waitForTimeout(1000);
  await page.getByRole("button", { name: /sent requests/i }).click();
  await expect(page.getByText(/Reset Flow User/)).toBeVisible();
  await page.getByRole("button", { name: /read full note/i }).click();
  await expect(page.getByRole("dialog", { name: /Reset Flow User/ })).toBeVisible();
});

test("@auth connection cards open the member persona", async ({ page }) => {
  await signIn(page, "sofia.martinez@example.com");
  await page.goto("/en/connections");
  await page.waitForTimeout(1000);
  await page.locator('a[href^="/en/persona/"]').first().click();
  await expect(page).toHaveURL(/\/en\/persona\//);
});

test("@auth discover renders without react key warnings", async ({ page }) => {
  const warnings: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" && message.text().includes('unique "key"')) {
      warnings.push(message.text());
    }
  });
  await signIn(page, "sofia.martinez@example.com");
  await page.waitForTimeout(1000);
  expect(warnings).toEqual([]);
});

test("@auth profile edit saves a headline", async ({ page }) => {
  await signIn(page, "sofia.martinez@example.com");
  await page.goto("/en/profile/edit");
  await page.waitForTimeout(1000);
  await page.fill("#persona-headline", "Architect & Cultural Documentary Filmmaker");
  await page.getByRole("button", { name: /save changes/i }).click();
  await expect(page).toHaveURL(/\/en\/profile$/, { timeout: 15_000 });
  await expect(page.getByText("Architect & Cultural Documentary Filmmaker")).toBeVisible();
});

test("@auth profile photo opens the circular cropper", async ({ page }) => {
  await signIn(page, "sofia.martinez@example.com");
  await page.goto("/en/profile/edit");
  await page.waitForTimeout(1000);
  await page.locator('input[type="file"]').first().setInputFiles({
    name: "avatar.png",
    mimeType: "image/png",
    buffer: AVATAR_PNG,
  });
  const crop = page.getByRole("dialog", { name: /fit your portrait/i });
  await expect(crop).toBeVisible();
  await crop.getByRole("button", { name: /use this crop/i }).click();
  await expect(crop).toHaveCount(0);
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

  // The concierge channels come from the admin-editable setting: email opens the
  // Gmail composer, and the seeded phone drives the WhatsApp and call links.
  await expect(detail.getByRole("link", { name: /contact concierge/i })).toHaveAttribute(
    "href",
    /^https:\/\/mail\.google\.com\/mail\/\?.*to=concierge%40globallinkup\.com/,
  );
  await expect(detail.getByRole("link", { name: /^whatsapp$/i })).toHaveAttribute(
    "href",
    /^https:\/\/wa\.me\/34612345678\?text=/,
  );
  await expect(detail.getByRole("link", { name: "Call +34 612 345 678" })).toHaveAttribute(
    "href",
    "tel:+34612345678",
  );

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

test("@auth an admin edits a role and the desk updates without a reload", async ({ page }) => {
  await signIn(page, "admin@globallinkup.test");
  await page.goto("/en/admin/team");
  await page.waitForTimeout(1200);

  // Idempotent: on a rerun the role from the previous run already exists.
  const roleName = "E2E Desk";
  await page.getByPlaceholder(/role name/i).fill(roleName);
  await page.getByRole("button", { name: /create role/i }).click();

  const card = page.locator("details").filter({ hasText: roleName });
  await expect(card).toBeVisible({ timeout: 15_000 });

  const summary = card.locator("summary");
  const save = card.getByRole("button", { name: /^save$/i });
  async function openCard() {
    if (!(await card.evaluate((element) => (element as HTMLDetailsElement).open))) {
      await summary.click();
    }
  }

  // Each save must land on the summary without a page reload — the desk used to
  // keep stale server props until a manual refresh. Every step below waits for a
  // text change that only fresh server props can produce.
  await openCard();
  const checks = card.getByRole("checkbox");
  const total = await checks.count();
  let checked = false;
  for (let index = 0; index < total; index += 1) {
    if (await checks.nth(index).isChecked()) {
      checked = true;
      await checks.nth(index).uncheck();
    }
  }
  if (checked) {
    await save.click();
    await expect(summary).toContainText(/0 permissions/i, { timeout: 15_000 });
  }

  await openCard();
  await checks.first().check();
  await save.click();
  await expect(summary).toContainText(/1 permission/i, { timeout: 15_000 });

  // Leave it empty so the next run starts from the same state.
  await openCard();
  await checks.first().uncheck();
  await save.click();
  await expect(summary).toContainText(/0 permissions/i, { timeout: 15_000 });
});

test("@auth an admin reviews a dossier and approves a pending persona", async ({ page }) => {
  await signIn(page, "admin@globallinkup.test");
  await page.goto("/en/admin/users?status=pending");
  await page.waitForTimeout(1500);

  const card = page.locator("article", { hasText: "Pending Applicant" });
  await expect(card).toBeVisible();
  await card.getByRole("button", { name: /inspect dossier/i }).click();
  const dossier = page.getByRole("dialog");
  await expect(dossier).toBeVisible();
  await expect(dossier.getByText(/Photographer/i)).toBeVisible();
  await dossier.getByRole("button", { name: /close/i }).click();

  await card.getByRole("button", { name: /^reject$/i }).click();
  const reasonDialog = page.getByRole("alertdialog");
  await expect(reasonDialog).toBeVisible();
  await reasonDialog
    .getByLabel(/Reason/i)
    .fill("The portrait did not match the submitted persona.");
  await expect(reasonDialog.getByRole("button", { name: /^reject$/i })).toBeEnabled();
  await reasonDialog.getByRole("button", { name: /cancel/i }).click();

  await card.getByRole("button", { name: /approve/i }).click();
  await expect(card).toHaveCount(0, { timeout: 10_000 });

  await page.getByRole("link", { name: /^approved/i }).click();
  await expect(page.getByRole("heading", { name: /Pending Applicant/ })).toBeVisible();
});

test("@auth an admin previews a product with its gallery", async ({ page }) => {
  await signIn(page, "admin@globallinkup.test");
  await page.goto("/en/admin/marketplace");
  await page.waitForTimeout(1200);
  await page
    .getByRole("button", { name: /^preview$/i })
    .first()
    .click();
  const preview = page.getByRole("dialog");
  await expect(preview).toBeVisible();
  await expect(preview.getByRole("heading", { name: /Handmade Oaxacan/i })).toBeVisible();
  await preview
    .getByRole("button", { name: /close preview/i })
    .first()
    .click();
});

test("@auth an admin edits the marketplace concierge contact", async ({ page }) => {
  await signIn(page, "admin@globallinkup.test");
  await page.goto("/en/admin/marketplace");
  await page.waitForTimeout(1200);

  const panel = page
    .locator("section")
    .filter({ has: page.getByRole("heading", { name: /concierge contact/i }) });
  const phone = panel.getByLabel(/phone/i);
  await expect(phone).toHaveValue("+34 612 345 678");

  await phone.fill("+34 600 999 888");
  await panel.getByRole("button", { name: /save contact/i }).click();
  await expect(panel.getByText(/saved\. the marketplace/i)).toBeVisible({ timeout: 15_000 });

  // The save writes platform_settings, so a reload must read the new number.
  await page.reload();
  await expect(page.getByLabel(/phone/i)).toHaveValue("+34 600 999 888");

  // Restore the seed so the member-side catalog assertions stay stable.
  await page.getByLabel(/phone/i).fill("+34 612 345 678");
  await page.getByRole("button", { name: /save contact/i }).click();
  await expect(page.getByText(/saved\. the marketplace/i)).toBeVisible({ timeout: 15_000 });
});

test("@auth an admin creates, trashes, and restores a draft product", async ({ page }) => {
  await signIn(page, "admin@globallinkup.test");
  await page.goto("/en/admin/marketplace");
  await page.waitForTimeout(1200);

  await page.getByRole("button", { name: /new product/i }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByLabel(/Product Title/i).fill("E2E Draft Piece");
  await dialog.getByLabel(/Price/i).fill("18");
  await dialog.getByLabel(/Origin/i).fill("Barcelona, ES");
  await dialog.getByRole("button", { name: /save as draft/i }).click();
  // The dialog closes only after the Server Action succeeds; waiting for that
  // avoids racing the list refresh that renders the new row.
  await expect(dialog).toBeHidden({ timeout: 20_000 });

  const row = page.locator('[data-product-name="E2E Draft Piece"]');
  await expect(row).toBeVisible({ timeout: 15_000 });
  await expect(row.getByText("Draft", { exact: true })).toBeVisible();

  await row.getByRole("button", { name: /delete product/i }).click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: /move to trash/i })
    .click();
  await expect(row.getByText("Trash", { exact: true })).toBeVisible({ timeout: 10_000 });

  await row.getByRole("button", { name: /restore/i }).click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: /restore/i })
    .click();
  await expect(row.getByText("Draft", { exact: true })).toBeVisible({ timeout: 10_000 });
});

test("@auth the admin moderation desk shows seeded reports", async ({ page }) => {
  await signIn(page, "admin@globallinkup.test");
  await page.goto("/en/admin/moderation");
  await page.waitForTimeout(1000);
  await expect(page.locator("article").first()).toBeVisible();
  await expect(page.getByText(/Reported by/i).first()).toBeVisible();
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
  await expect(page.getByRole("heading", { name: /edit your personal profile/i })).toBeVisible();
  await expect(page.locator("#persona-fullname")).toHaveValue("Sofia Martinez");
});

test("@auth a shared dossier has no owner actions for another member", async ({ page }) => {
  await signIn(page, "lucas.varela@example.com");
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
  // Languages no longer have defaults.
  await page.locator("#persona-language-ES").click();
  // The vault now requires at least one channel.
  await page.fill("#persona-whatsapp", "+351 900 000 000");
  await uploadAvatar(page);
  await page.locator("form button[type=submit]").click();
  // Step 2 now signs up, uploads and saves in sequence on a cold dev server.
  await expect(page).toHaveURL(/\/en\/verify$/, { timeout: 15_000 });
});
