import { z } from "zod";

/**
 * Public Supabase configuration — safe to import from anywhere, including
 * client components, because `NEXT_PUBLIC_*` values are inlined into the
 * browser bundle at build time.
 *
 * Validation is deliberately **lazy**: `next build` / CI can run without a
 * `.env.local` as long as no Supabase client is constructed. The first client
 * that is actually created fails loudly if the values are missing or malformed.
 */
const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;

let cachedPublicEnv: PublicEnv | undefined;

export function getPublicEnv(): PublicEnv {
  if (cachedPublicEnv) {
    return cachedPublicEnv;
  }

  const parsed = publicEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("\n");

    throw new Error(
      `Missing or invalid Supabase public environment variables:\n${details}\n` +
        "Copy .env.example to .env.local and fill in the values (see docs/plan/api-layer/README.md §4).",
    );
  }

  cachedPublicEnv = parsed.data;
  return cachedPublicEnv;
}
