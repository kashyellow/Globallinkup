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

const AUTH_E2E = process.env.AUTH_E2E === "1";
const MAILPIT_URL = process.env.MAILPIT_URL ?? "http://127.0.0.1:54524";

test("full password reset signs in with the new password", async ({ page, request }) => {
  test.skip(!AUTH_E2E, "needs the seeded Supabase stack (AUTH_E2E=1)");

  const email = "reset.user@example.com";
  const startedAt = Date.now() - 2_000;

  await page.goto("/en/forgot-password");
  await page.getByLabel(/Email Address/).fill(email);
  await page.getByRole("button", { name: /Send Reset Link/ }).click();
  await expect(page).toHaveURL(/\/en\/forgot-password\/sent$/);

  let messageId: string | undefined;
  for (let attempt = 0; attempt < 30 && !messageId; attempt += 1) {
    const list = await request.get(`${MAILPIT_URL}/api/v1/messages`);
    const payload = (await list.json()) as {
      messages: { ID: string; To: { Address: string }[]; Created: string }[];
    };
    messageId = payload.messages.find(
      (message) =>
        message.To.some((recipient) => recipient.Address === email) &&
        new Date(message.Created).getTime() >= startedAt,
    )?.ID;
    if (!messageId) await page.waitForTimeout(500);
  }

  expect(messageId, "a recovery email should arrive in Mailpit").toBeTruthy();
  const detail = await request.get(`${MAILPIT_URL}/api/v1/message/${messageId}`);
  const message = (await detail.json()) as { Text: string };
  const link = message.Text.match(/https?:\/\/[^\s)]+\/verify\?[^\s)]+/)?.[0];
  expect(link, "the email should contain a recovery link").toBeTruthy();

  await page.goto(link!);
  await expect(page).toHaveURL(/\/en\/reset-password$/);
  await page.fill("#reset-password", "NewPassword123");
  await page.fill("#reset-confirm", "NewPassword123");
  await page.getByRole("button", { name: /Update Password/i }).click();
  await expect(page).toHaveURL(/\/en\/login$/);

  await page.fill("#login-email", email);
  await page.fill("#login-password", "NewPassword123");
  await page.locator("form button[type=submit]").click();
  await expect(page).toHaveURL(/\/en\/discover$/, { timeout: 15_000 });
});
