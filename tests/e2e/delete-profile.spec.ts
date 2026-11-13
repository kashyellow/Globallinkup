import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

/**
 * Self-service account deletion. Needs the seeded Supabase stack (`AUTH_E2E=1`).
 * The member is created, approved and deleted inside the test, and removed again
 * in `finally` if anything failed, so the shared database keeps its seed counts.
 */
const AUTH_E2E = process.env.AUTH_E2E === "1";
const PASSWORD = "Password123";
const NAME = "Doomed Member";

// A valid 1×1 PNG: the upload checks type and size, not dimensions.
const AVATAR_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2nK0AAAAASUVORK5CYII=",
  "base64",
);

try {
  process.loadEnvFile(".env.local"); // Supabase keys for the checks below
} catch {
  // CI exports them instead.
}
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

test.skip(!AUTH_E2E, "needs a seeded Supabase stack (AUTH_E2E=1)");

async function signIn(page: Page, email: string) {
  await page.goto("/en/login");
  await page.fill("#login-email", email);
  await page.fill("#login-password", PASSWORD);
  await page.locator("form button[type=submit]").click();
  await page.waitForURL(/\/(admin|discover|verify|create-persona)/, { timeout: 20_000 });
}

async function removeUser(request: APIRequestContext, email: string) {
  const headers = { apikey: SERVICE_KEY!, Authorization: `Bearer ${SERVICE_KEY}` };
  const list = await request.get(`${SUPABASE_URL}/auth/v1/admin/users?per_page=1000`, { headers });
  const { users } = (await list.json()) as { users: { id: string; email: string }[] };
  const id = users.find((user) => user.email === email)?.id;
  if (id) await request.delete(`${SUPABASE_URL}/auth/v1/admin/users/${id}`, { headers });
}

test("a member deletes their profile and can no longer sign in", async ({ page, request }) => {
  const email = `doomed-${Date.now()}@example.com`;

  try {
    // Register with a persona: the account starts pending.
    await page.goto("/en/register");
    await page.fill("#reg-email", email);
    await page.fill("#reg-password", PASSWORD);
    await page.fill("#reg-confirm", PASSWORD);
    await page.check("#reg-terms");
    await page.locator("form button[type=submit]").click();
    await expect(page).toHaveURL(/\/en\/create-persona$/);
    await page.fill("#persona-fullname", NAME);
    await page.fill("#persona-city", "Lisbon");
    await page.fill("#persona-bio", "Created to be deleted.");
    await page.locator("#persona-language-ES").click();
    await page.fill("#persona-whatsapp", "+351 900 000 002");
    await page.waitForTimeout(750); // hydration: the file input's onChange
    await page.locator('input[type="file"]').first().setInputFiles({
      name: "avatar.png",
      mimeType: "image/png",
      buffer: AVATAR_PNG,
    });
    const crop = page.getByRole("dialog", { name: /fit your portrait/i });
    if (await crop.isVisible().catch(() => false)) {
      await crop.getByRole("button", { name: /use this crop/i }).click();
    }
    await page.locator("form button[type=submit]").click();
    await expect(page).toHaveURL(/\/en\/verify$/, { timeout: 15_000 });

    // An admin approves them so the profile page opens.
    await page.context().clearCookies();
    await signIn(page, "admin@globallinkup.test");
    await page.goto("/en/admin/users?status=pending");
    await page.waitForTimeout(1500);
    const card = page.locator("article", { hasText: NAME });
    await card.getByRole("button", { name: /approve/i }).click();
    await expect(card).toHaveCount(0, { timeout: 10_000 });

    // The member deletes their profile.
    await page.context().clearCookies();
    await signIn(page, email);
    await page.goto("/en/profile");
    await page.waitForTimeout(750);
    await page.getByRole("button", { name: "Delete profile" }).click();
    const confirm = page.getByRole("button", { name: "Delete forever" });
    await expect(confirm).toBeDisabled();
    await page.getByLabel("Type DELETE to confirm").fill("delete");
    await expect(confirm).toBeDisabled();
    await page.getByLabel("Type DELETE to confirm").fill("DELETE");
    await confirm.click();
    await expect(page).toHaveURL(/\/en\/?$/, { timeout: 15_000 });

    // The login is gone.
    const login = await request.post(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      headers: { apikey: ANON_KEY! },
      data: { email, password: PASSWORD },
    });
    expect(login.ok()).toBe(false);
  } finally {
    await removeUser(request, email);
  }
});
