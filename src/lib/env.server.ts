import "server-only";

import { z } from "zod";

/**
 * Server-only configuration. The `server-only` import makes any accidental
 * import from a client component a build error.
 *
 * Lazy like `getPublicEnv` so builds without a `.env.local` still typecheck.
 */
const serverEnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  /** PRD D6 — the account promoted to `admin` by the seed migration. */
  ADMIN_EMAIL: z.email().optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cachedServerEnv: ServerEnv | undefined;

export function getServerEnv(): ServerEnv {
  if (cachedServerEnv) {
    return cachedServerEnv;
  }

  const parsed = serverEnvSchema.safeParse({
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
  });

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("\n");

    throw new Error(
      `Missing or invalid server-only environment variables:\n${details}\n` +
        "Copy .env.example to .env.local and fill in the values (see docs/plan/api-layer/README.md §4).",
    );
  }

  cachedServerEnv = parsed.data;
  return cachedServerEnv;
}
