# GlobalLinkup — API layer & backend wiring (plan)

Tracking doc for starting the backend against the existing mock-driven UI.
Written to survive handoff: what is decided, what exists, what to run, and the
order of work. Lives in the repo at `docs/plan/api-layer.md`.

- **Status:** **S0 complete** (2026-10-13). S1+ not started.
- **Scope now:** **S0 (foundation) only.** S1+ deferred to later sessions.
- **Depends on:** nothing — this is the first backend slice
- **Unblocks:** auth flow, every pillar's real data, cloud cutover

---

## 1. Decisions (locked)

| #   | Decision        | Choice                                                                                                                                                                                       |
| --- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | Consumer        | **Next app only** → Server-Component reads + Server Actions. No separate REST tier.                                                                                                          |
| A2  | Backend shape   | **Hybrid (PRD D2)**: RLS-scoped reads direct to Supabase; privileged/multi-step writes via Server Actions; service-role only behind an explicit admin check; RLS is the backstop everywhere. |
| A3  | Route Handlers  | Only where genuinely needed later: file uploads / signed URLs, webhooks. `app/api/v1/*` only if a second client ever appears.                                                                |
| A4  | Target          | **Local Supabase first** (`mise`-pinned CLI), **cloud later** via `supabase link` + `db push` + swapped env.                                                                                 |
| A5  | Package manager | **npm**.                                                                                                                                                                                     |
| A6  | Authorization   | Never trust the client. Enforce in RLS + server-side. Contact info RLS-gated on accepted connection, never UI-hidden.                                                                        |
| A7  | Slice scope     | Do **S0 (foundation) only** first; land it green before S1 (schema) / S2 (auth).                                                                                                             |

---

## 2. Current state (verified 2026-10-13)

- Supabase CLI resolves via `mise` (`2.119.0`; `2.120.0` available).
- **No `supabase/config.toml`** → `supabase init` has never been run (no
  `supabase/.gitignore` either).
- **Local stack not running** → `supabase status` fails: no
  `supabase_db_globallinkup` container. Docker is up (only unrelated
  `rowawi-*` containers).
- **No `.env.local` / `.env.example`.**
- `src/lib/supabase/` empty (`.gitkeep`); `supabase/migrations/` empty;
  `supabase/seed.sql` is a placeholder; `supabase/tests/` empty.
- No `src/app/api/` handlers.
- UI is **100% mock-driven**: each feature imports `src/features/<f>/data.ts`
  constants directly at module scope; almost every view is `"use client"`
  (only `discover-view.tsx` is a server component).
- Two sibling local Supabase projects exist on this machine:
  - `GIS-Platform` → **544xx** block.
  - `GTL_Backend` → config has **no port block** → CLI defaults **543xx**.

---

## 3. Project id & port allocation

`supabase init` derives `project_id` from the folder → `globallinkup`
(container names become `supabase_*_globallinkup`). Ports must be moved off the
defaults so all three stacks can coexist.

| Section                       | Key              | CLI default (GTL) | GIS-Platform | **globallinkup (use this)** |
| ----------------------------- | ---------------- | ----------------- | ------------ | --------------------------- |
| `[api]`                       | `port`           | 54321             | 54421        | **54521**                   |
| `[db]`                        | `port`           | 54322             | 54422        | **54522**                   |
| `[db]`                        | `shadow_port`    | 54320             | 54420        | **54520**                   |
| `[db.pooler]`                 | `port`           | 54329             | 54429        | **54529**                   |
| `[studio]`                    | `port`           | 54323             | 54423        | **54523**                   |
| `[local_smtp]` / `[inbucket]` | `port`           | 54324             | 54424        | **54524**                   |
| `[analytics]`                 | `port`           | 54327             | 54427        | **54527**                   |
| `[edge_runtime]`              | `inspector_port` | 8083              | 8183         | **8283**                    |

`config.toml` overrides to apply after `supabase init`:

```toml
project_id = "globallinkup"

[api]
port = 54521

[db]
port = 54522
shadow_port = 54520

[db.pooler]
port = 54529

[studio]
port = 54523

[local_smtp]          # `[inbucket]` on older CLI versions
port = 54524

[analytics]
port = 54527

[edge_runtime]
inspector_port = 8283

[auth]
site_url = "http://localhost:3000"
additional_redirect_urls = ["http://localhost:3000/**"]
```

Optional resource trims (safe, we use neither): set
`[edge_runtime] enabled = false` (no edge functions planned) and
`[analytics] enabled = false` (logs explorer only) — this also frees their ports.

---

## 4. package.json scripts

Run through `mise` so the pinned CLI is used even if the shell shim isn't on
PATH (`mise exec -- supabase …`) — or plain `supabase …` if mise is activated.

```jsonc
"db:start":  "supabase start",
"db:stop":   "supabase stop",
"db:status": "supabase status",
"db:reset":  "supabase db reset",          // re-apply migrations + seed
"db:diff":   "supabase db diff",
"db:push":   "supabase db push",           // cloud
"db:types":  "supabase gen types typescript --local > src/types/database.ts"
```

---

## 5. Environment

`.env.local` (gitignored) from `supabase status -o env`:

```
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54521
NEXT_PUBLIC_SUPABASE_ANON_KEY=<ANON_KEY>
SUPABASE_SERVICE_ROLE_KEY=<SERVICE_ROLE_KEY>   # server-only, never NEXT_PUBLIC_
```

`.env.example` (tracked, per PRD §9) with the same keys but placeholder values,
plus `ADMIN_EMAIL` for the D6 admin bootstrap.

---

## 6. Architecture: the seam

The mock imports are the thing that makes "wire it later" expensive, so build
the seam first.

```
src/lib/supabase/
  client.ts   # createBrowserClient — client components
  server.ts   # createServerClient — RSC / Server Actions / Route Handlers (cookies())
  proxy.ts    # updateSession() — called from src/proxy.ts (compose AFTER next-intl)
  admin.ts    # service-role client — server-only, guarded by an explicit admin check
src/lib/env.ts            # Zod-validated env split (public vs server-only)
src/types/database.ts     # `supabase gen types` output
```

Per feature:

```
src/features/<f>/
  types.ts     # domain DTOs the UI renders (extracted from data.ts)
  queries.ts   # "server-only" reads: getX(...) -> DTO[]
  actions.ts   # "use server" writes, Zod-validated
  mappers.ts   # row -> DTO
  data.ts      # KEEP as dev fixtures (mock adapter)
```

**Transition trick:** each `queries.ts`/`actions.ts` function _starts by
returning the existing `data.ts` fixtures_ with the same signature, and pages
pass data down as props:

```tsx
// page.tsx (server component)
const personas = await getDiscoverPersonas({ region, query });
return <DiscoverView personas={personas} />;
```

"Wiring" then = flipping one function at a time from fixture → Supabase, behind
an unchanged contract. No component rewrites, and a teammate can implement one
function while the UI stays green on fixtures.

---

## 7. Slices & gates

- **S0 — foundation (THIS SLICE).** Nothing domain-specific: no tables, no RLS,
  no auth UI. Checklist:
  1. `supabase init` → `config.toml`; apply the §3 `project_id` + 545xx port
     block + `[auth] site_url`/`additional_redirect_urls`. Commit `config.toml`
     (init also writes `supabase/.gitignore`).
  2. Install `@supabase/supabase-js` + `@supabase/ssr` (npm).
  3. `src/lib/env.ts` — Zod-validated, split public (`NEXT_PUBLIC_*`, safe in the
     browser bundle) vs server-only (`SUPABASE_SERVICE_ROLE_KEY`); fail fast with
     a clear message.
  4. Clients: `src/lib/supabase/client.ts`, `server.ts`, `proxy.ts`
     (`updateSession`), `admin.ts` (service-role, server-only).
  5. Compose `updateSession` into `src/proxy.ts` **after** next-intl; keep the
     existing `matcher`. See gotcha below.
  6. `.env.example` (tracked, placeholders) + `.env.local` (gitignored) from
     `supabase status -o env`, plus `ADMIN_EMAIL`.
  7. package.json `db:*` scripts (§4).
  8. `db:types` → `src/types/database.ts` (empty schema is fine pre-S1).
  9. Smoke check that a server-side Supabase client can be constructed and
     `auth.getUser()` returns `null` when there is no session.

  **Gate:** `npm run db:start` brings the stack up on **54521**; `db:status`
  shows the URLs; `format:check` · `typecheck` · `lint` · `test` · `build` ·
  `e2e` all pass; only `.env.example` is committed (no secrets).

  **Gotchas:** in Next 16 `cookies()` is **async** (`await cookies()` inside
  `createServerClient`); the proxy must run session refresh and still let
  next-intl redirect (copy the refreshed auth cookies onto the i18n response);
  proxy is optimistic only — real checks land in the DAL/RLS later.

- **S1 — schema.** _(deferred)_ enums, `profiles`, `contact_details`, RLS
  helpers (`is_admin` / `is_approved` / `are_connected`) + policies, `ADMIN_EMAIL`
  seed; seed dev fixtures mirroring current mock content.
  _Gate:_ `db:reset` clean + RLS tests in `supabase/tests/`.
- **S2 — auth vertical.** _(deferred)_ Register / login / logout / reset wired
  to Supabase Auth (the existing `TODO(auth)` comments) + approval gating.
  _Gate:_ e2e covers the flow; contact/status gating enforced server-side.
- **S3+ — per pillar.** _(deferred)_ discover/persona → connect → posts →
  marketplace → admin. Each: fixtures behind functions, then flip to Supabase,
  then RLS test.
- **S4 — storage.** _(deferred)_ Buckets (`avatars`, `post-images`,
  `product-images`) + upload Server Action; alt-text policy for user photos.

---

## 8. Risks / open decisions

- **Shape mismatch (decide DTOs in S0):** fixtures use string ids (`"sofia"`),
  `price: 120` (dollars), CDN image URLs, `imageAlt`, a
  `"sofia" | "mateo" | "elena"` author union. DB uses uuid, `price_cents` +
  `currency`, storage paths. Mappers must be mechanical.
- **Client components** import data at module scope — convert to props (RSC),
  not client-side fetching.
- **Next 16 proxy is optimistic only** (bundled docs): do authoritative checks
  in the DAL + RLS, not in `proxy.ts`. Keep the existing `matcher` (it already
  excludes `/api`).
- **Local JWT secret is the fixed demo value** → anon/service keys are the same
  across local projects; fine locally, differs in cloud.
- **Email confirmation** (OQ-1/D10) still open — affects the reset/confirm
  redirect flow.

---

## 9. Docs to update on implementation

- ✅ `docs/CONTEXT.md` — added the `db:*` scripts + 545xx port note.
- ⬜ `docs/adr/` — ADR for the RSC + Server Actions + RLS seam (D2 in practice).
- ✅ `AGENTS.md` — `db:*` commands.

---

## 10. Progress log

### S0 — foundation (2026-10-13) ✅

- `supabase init`; `config.toml` pinned to `project_id = "globallinkup"` and the
  **545xx** block (`api 54521`, `db 54522`, `shadow 54520`, `pooler 54529`,
  `studio 54523`, `smtp 54524`, `analytics 54527`, edge inspector `8283`);
  `site_url = http://localhost:3000`, `additional_redirect_urls =
["http://localhost:3000/**"]`.
- Deps: `@supabase/supabase-js`, `@supabase/ssr`, `zod`, `server-only`.
- `src/lib/env.ts` (public, lazy Zod) + `src/lib/env.server.ts` (server-only).
- Clients: `src/lib/supabase/{client,server,proxy,admin}.ts`.
- `src/proxy.ts` — composed Supabase session refresh **after** next-intl,
  carrying refreshed cookies + no-cache headers; **non-fatal** when Supabase is
  unconfigured/unreachable (renders logged-out, fail-closed).
- `.env.example` (tracked) + `.env.local` (gitignored, from
  `supabase status -o env`); `db:*` scripts in `package.json`.
- `src/types/database.ts` generated via `db:types`.
- **Gate passed:** stack up on 54521 (12 containers); `db:status` good;
  `format:check` · `typecheck` · `lint` · `test` (7/7) · `build` · `e2e` (7/7)
  all green. Smoke: GoTrue `/health` 200, anon `getUser()` → `null`
  (`Auth session missing!`), service-role `listUsers()` → 0 users, no error.

**Note for S1:** `getPublicEnv` stays strict for real data access; only the
proxy degrades gracefully. The data layer must fail loudly when unconfigured.
