import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

/**
 * Member invites (ADR 0010). Needs the seeded Supabase stack and its Mailpit
 * inbox (`AUTH_E2E=1`): the admin invites, the invite email is read from
 * Mailpit, and the invitee finishes setup in the same browser the admin used.
 */
const AUTH_E2E = process.env.AUTH_E2E === "1";
const MAILPIT_URL = process.env.MAILPIT_URL ?? "http://127.0.0.1:54524";
const ADMIN_EMAIL = "admin@globallinkup.test";
const ADMIN_PASSWORD = "Password123";
const INVITEE_PASSWORD = "Invite123";

// A valid 1×1 PNG: the upload checks type and size, not dimensions.
const AVATAR_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2nK0AAAAASUVORK5CYII=",
  "base64",
);

test.skip(!AUTH_E2E, "needs a seeded Supabase stack (AUTH_E2E=1)");
test.describe.configure({ mode: "serial" });

async function signIn(page: Page, email: string, password: string) {
  await page.goto("/en/login");
  await page.fill("#login-email", email);
  await page.fill("#login-password", password);
  await page.locator("form button[type=submit]").click();
  await page.waitForURL(/\/(admin|discover|verify|create-persona)/, { timeout: 20_000 });
}

async function inviteLink(request: APIRequestContext, page: Page, email: string) {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const list = await request.get(`${MAILPIT_URL}/api/v1/messages`);
    const payload = (await list.json()) as {
      messages: { ID: string; To: { Address: string }[] }[];
    };
    const id = payload.messages.find((message) =>
      message.To.some((recipient) => recipient.Address === email),
    )?.ID;
    if (id) {
      const detail = await request.get(`${MAILPIT_URL}/api/v1/message/${id}`);
      const message = (await detail.json()) as { Text?: string; HTML?: string };
      const body = `${message.Text ?? ""} ${message.HTML ?? ""}`.replace(/&amp;/g, "&");
      return body.match(/https?:\/\/[^\s"'<>]+\/auth\/confirm\?token_hash=[^\s"'<>]+/)?.[0];
    }
    await page.waitForTimeout(500);
  }
  return undefined;
}

test("admin invites a member who finishes setup and lands approved", async ({ page, request }) => {
  const email = `invitee-${Date.now()}@example.com`;

  await signIn(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  await page.goto("/en/admin/invite");
  await page.waitForTimeout(750); // hydration: the photo input's onChange
  await page.locator('input[name="photoPicker"]').setInputFiles({
    name: "avatar.png",
    mimeType: "image/png",
    buffer: AVATAR_PNG,
  });
  const crop = page.getByRole("dialog", { name: /fit your portrait/i });
  await crop.getByRole("button", { name: /use this crop/i }).click();
  await expect(page.getByAltText("Selected profile photo")).toBeVisible();

  await page.fill('input[name="email"]', email);
  await page.fill('input[name="fullName"]', "Invited Person");
  await page.selectOption('select[name="locale"]', "en");
  await page.getByRole("button", { name: "Send invitation" }).click();
  await expect(page.getByText("Invitation sent.")).toBeVisible({ timeout: 15_000 });
  const row = page.getByRole("listitem").filter({ hasText: email });
  await expect(row.getByText("Sent", { exact: true })).toBeVisible();

  // The same address again points at Resend instead of a second account.
  await page.fill('input[name="email"]', email.toUpperCase());
  await page.fill('input[name="fullName"]', "Invited Person");
  await page.getByRole("button", { name: "Send invitation" }).click();
  await expect(page.getByText(/already has a pending invitation/)).toBeVisible();

  const link = await inviteLink(request, page, email);
  expect(link, "the invite email should reach Mailpit with a confirm link").toBeTruthy();

  // Still signed in as the admin: the link must switch to the invitee.
  await page.goto(link!);
  await expect(page).toHaveURL(/\/en\/accept-invite$/);
  await expect(page.locator("#invite-email")).toHaveValue(email);
  await page.fill("#reset-password", INVITEE_PASSWORD);
  await page.fill("#reset-confirm", INVITEE_PASSWORD);
  await page.check("#invite-terms");
  await page.locator("form button[type=submit]").click();

  await expect(page).toHaveURL(/\/en\/create-persona$/, { timeout: 15_000 });
  await expect(page.locator("#persona-fullname")).toHaveValue("Invited Person");
  await page.fill("#persona-city", "Lisbon");
  await page.fill("#persona-bio", "Joined through an admin invitation.");
  await page.locator("#persona-language-ES").click();
  await page.fill("#persona-whatsapp", "+351 900 000 001");
  await page.locator("form button[type=submit]").click();
  await expect(page).toHaveURL(/\/en\/profile$/, { timeout: 20_000 });

  // The new password works on its own and the account is approved.
  await page.context().clearCookies();
  await signIn(page, email, INVITEE_PASSWORD);
  await expect(page).toHaveURL(/\/en\/discover$/);
});

test("an expired invite link shows the expired state", async ({ page }) => {
  await page.goto("/en/auth/confirm?token_hash=bogus&type=invite");
  await expect(page).toHaveURL(/\/en\/accept-invite\?error=expired$/);
  await expect(page.getByText("This invitation has expired or was already used")).toBeVisible();
});
