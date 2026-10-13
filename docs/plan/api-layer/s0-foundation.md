# S0 — Foundation ✅ (2026-10-13)

Config, Supabase clients, env, proxy wiring and generated types. Nothing
domain-specific: no tables, no RLS, no auth UI.

Back to [README](./README.md).

## Starting point (verified before the slice)

- Supabase CLI resolved via `mise` (`2.119.0`); **no `supabase/config.toml`** →
  `supabase init` never run. Stack not running (`supabase status` failed).
- No `.env.local` / `.env.example`.
- `src/lib/supabase/` empty (`.gitkeep`); `supabase/migrations/` empty;
  `supabase/seed.sql` a placeholder; `supabase/tests/` empty; no `src/app/api/`.
- UI **100% mock-driven**: every feature imports `src/features/<f>/data.ts` at
  module scope; almost every view is `"use client"`.
- Sibling local projects: `GIS-Platform` → **544xx**, `GTL_Backend` → defaults
  **543xx**.

## Checklist

1. `supabase init` → `config.toml`; apply `project_id = "globallinkup"` + the
   545xx port block ([README §2](./README.md#2-project-id--port-allocation)) +
   `[auth] site_url` / `additional_redirect_urls`.
2. Install `@supabase/supabase-js`, `@supabase/ssr`, `zod`, `server-only`.
3. `src/lib/env.ts` — public, lazy Zod; `src/lib/env.server.ts` — server-only.
4. Clients: `src/lib/supabase/{client,server,proxy,admin}.ts`.
5. Compose `updateSession` into `src/proxy.ts` **after** next-intl.
6. `.env.example` (tracked) + `.env.local` (gitignored) from
   `supabase status -o env`, plus `ADMIN_EMAIL`.
7. package.json `db:*` scripts ([README §3](./README.md#3-packagejson-scripts)).
8. `db:types` → `src/types/database.ts`.
9. Smoke: a server-side client constructs and `auth.getUser()` → `null`.

## Outcome

- `supabase/config.toml` pinned to `project_id = "globallinkup"` and the 545xx
  block; `site_url = http://localhost:3000`,
  `additional_redirect_urls = ["http://localhost:3000/**"]`.
- `src/lib/env.ts` (public, lazy Zod) + `src/lib/env.server.ts` (server-only).
- Clients: `client` / `server` / `proxy` (`updateSession`) / `admin`.
- `src/proxy.ts` — Supabase session refresh composed after next-intl, carrying
  refreshed cookies + no-cache headers; **non-fatal** when Supabase is
  unconfigured/unreachable (renders logged-out, fail-closed) so `build`/`e2e` in
  CI work without a stack.
- `.env.example` (tracked) + `.env.local` (gitignored); `db:*` scripts;
  `src/types/database.ts` generated.

## Gate — passed

- Stack up on **54521** (12 containers); `db:status` good.
- `format:check` · `typecheck` · `lint` · `test` (7/7) · `build` · `e2e` (7/7).
- Smoke: GoTrue `/health` 200; anon `getUser()` → `null` (`Auth session
missing!`); service-role `listUsers()` → 0 users, no error.

## Gotchas carried forward

- Next 16 `cookies()` is **async** (`await cookies()` inside `createServerClient`).
- The proxy refreshes the session **and** lets next-intl redirect — refreshed
  auth cookies must be copied onto the i18n response.
- `getPublicEnv` stays strict for real data access; only the proxy degrades.
