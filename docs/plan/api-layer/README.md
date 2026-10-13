# GlobalLinkup — API layer & backend wiring

Umbrella doc for building the backend against the existing mock-driven UI.
**One file per slice**; this README holds the shared decisions and plumbing.

- **Depends on:** nothing — this is the first backend work.
- **Unblocks:** the auth flow, every pillar's real data, cloud cutover.

## Slices

| Slice | What                                                                 | Status                 | Doc                                              |
| ----- | -------------------------------------------------------------------- | ---------------------- | ------------------------------------------------ |
| S0    | Foundation: config, clients, env, proxy, types                       | ✅ complete 2026-10-13 | [s0-foundation.md](./s0-foundation.md)           |
| S1    | Schema, RLS & seed                                                   | planned                | [s1-schema-rls-seed.md](./s1-schema-rls-seed.md) |
| S2    | Auth wired end-to-end                                                | planned                | [s2-auth.md](./s2-auth.md)                       |
| S3+   | Per pillar: discover/persona → connect → posts → marketplace → admin | deferred               | —                                                |
| S4    | Storage: buckets + upload Server Action                              | deferred               | —                                                |

Land one slice green before starting the next.

---

## 1. Decisions (locked)

| #   | Decision        | Choice                                                                                                                                                                                       |
| --- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | Consumer        | **Next app only** → Server-Component reads + Server Actions. No separate REST tier.                                                                                                          |
| A2  | Backend shape   | **Hybrid (PRD D2)**: RLS-scoped reads direct to Supabase; privileged/multi-step writes via Server Actions; service-role only behind an explicit admin check; RLS is the backstop everywhere. |
| A3  | Route Handlers  | Only where genuinely needed: auth callback, file uploads / signed URLs, webhooks. `app/api/v1/*` only if a second client ever appears.                                                       |
| A4  | Target          | **Local Supabase first** (`mise`-pinned CLI), **cloud later** via `supabase link` + `db push` + swapped env.                                                                                 |
| A5  | Package manager | **npm**.                                                                                                                                                                                     |
| A6  | Authorization   | Never trust the client. Enforce in RLS + server-side. Contact info RLS-gated on accepted connection, never UI-hidden.                                                                        |
| A7  | Delivery        | One slice at a time, landed green (all gates + RLS tests) before the next.                                                                                                                   |

---

## 2. Project id & port allocation

`supabase init` derives `project_id` from the folder → `globallinkup`
(containers are `supabase_*_globallinkup`). Ports are moved off the defaults so
all local Supabase projects on the machine can coexist.

| Section                       | Key              | CLI default (GTL) | GIS-Platform | **globallinkup (used)** |
| ----------------------------- | ---------------- | ----------------- | ------------ | ----------------------- |
| `[api]`                       | `port`           | 54321             | 54421        | **54521**               |
| `[db]`                        | `port`           | 54322             | 54422        | **54522**               |
| `[db]`                        | `shadow_port`    | 54320             | 54420        | **54520**               |
| `[db.pooler]`                 | `port`           | 54329             | 54429        | **54529**               |
| `[studio]`                    | `port`           | 54323             | 54423        | **54523**               |
| `[local_smtp]` / `[inbucket]` | `port`           | 54324             | 54424        | **54524**               |
| `[analytics]`                 | `port`           | 54327             | 54427        | **54527**               |
| `[edge_runtime]`              | `inspector_port` | 8083              | 8183         | **8283**                |

Optional resource trims (safe — we use neither): `[edge_runtime] enabled = false`
(no edge functions) and `[analytics] enabled = false` (logs explorer only).

---

## 3. package.json scripts

```jsonc
"db:start":  "supabase start",
"db:stop":   "supabase stop",
"db:status": "supabase status",            // add `-- -o env` for URL + keys
"db:reset":  "supabase db reset",          // re-apply migrations + seed
"db:diff":   "supabase db diff",
"db:push":   "supabase db push",           // cloud
"db:types":  "supabase gen types typescript --local > src/types/database.ts"
```

---

## 4. Environment

`.env.local` (gitignored) from `supabase status -o env`:

```
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54521
NEXT_PUBLIC_SUPABASE_ANON_KEY=<ANON_KEY>
SUPABASE_SERVICE_ROLE_KEY=<SERVICE_ROLE_KEY>   # server-only, never NEXT_PUBLIC_
```

`.env.example` (tracked, per PRD §9) mirrors this with blank values, plus
`ADMIN_EMAIL` for the D6 admin bootstrap.

---

## 5. Architecture: the seam

The module-scope mock imports are what make "wire it later" expensive, so the
seam exists before any data is flipped.

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

## 6. Risks / open decisions

- **Shape mismatch (settle DTOs in S3):** fixtures use string ids (`"sofia"`),
  `price: 120` (dollars), CDN image URLs, `imageAlt`, a
  `"sofia" | "mateo" | "elena"` author union. DB uses uuid, `price_cents` +
  `currency`, storage paths. Mappers must be mechanical.
- **Client components** import data at module scope — convert to props (RSC),
  not client-side fetching.
- **Next 16 proxy is optimistic only** (bundled docs): authoritative checks live
  in the DAL + RLS, not in `proxy.ts`. Keep the existing `matcher`.
- **`getPublicEnv` is strict** for real data access; only the proxy degrades
  gracefully when Supabase is unconfigured (so CI/`build`/`e2e` stay green).
- **Local JWT secret is the fixed demo value** → anon/service keys are the same
  across local projects; fine locally, differs in cloud.
- **Email confirmation** (OQ-1 / D10) still open — affects the reset/confirm
  redirect flow (see S2).

---

## 7. Docs to update

- ✅ `docs/CONTEXT.md` — `db:*` scripts + 545xx port note.
- ✅ `AGENTS.md` — `db:*` commands.
- ⬜ `docs/adr/` — ADR for the RSC + Server Actions + RLS seam (D2 in practice).
