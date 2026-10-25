# GlobalLinkup — CONTEXT

Compact, always-on project context for agents. This file is injected into every
session via `opencode.json`. For full requirements read `docs/PRD.md`; for the
original brief read `docs/PROJECT.md`.

## What this is

GlobalLinkup is a bilingual (EN/ES) people-discovery web app. Users create a
**Persona**, discover others, share **Posts**, send **Connect** requests, and
reveal protected contact info only after a mutual connection is accepted. It also
has an official, Admin-managed **Marketplace**. No chat, no DMs, no user-to-user
selling.

## Source of truth (in priority order)

1. `docs/PROJECT.md` — the original handover brief.
2. `docs/PRD.md` — concrete requirements, decisions, open questions.
3. `docs/CONTEXT.md` (this file) — always-on summary + deviations.
4. `AGENTS.md` — working rules and commands.

Read `docs/PRD.md` and `docs/PROJECT.md` before any non-trivial planning or
implementation. Where this summary and the PRD disagree, the PRD wins.

## Stack (locked)

- **Next.js 16** (App Router) + **React 19** + **TypeScript (strict)**.
- **Tailwind CSS v4** + CSS-variable design tokens.
- **Supabase** — Postgres, Auth, Storage, RLS.
- **Vercel** for deployment; **npm** for packages (not pnpm).
- **React Compiler is ON** (`reactCompiler: true`). Write plain React; do not add
  `useMemo`/`useCallback`/`React.memo` unless a specific case needs it. Compiler
  lint rules are active through `eslint-config-next`.
- Runtime pinned in `mise.toml`: Node `24.21.0`, Supabase CLI `2.119.0`,
  Vercel CLI `62.2.0`.

## Scripts & quality gates

- `npm run dev|build|start|lint` — Next/ESLint.
- `npm run format|format:check` — Prettier (+ Tailwind class sorting).
- `npm run typecheck` — `tsc --noEmit`.
- `npm test` / `npm run test:watch` — Vitest + Testing Library (jsdom).
- `npm run e2e` — Playwright (Chromium).
- `npm run db:*` — local Supabase
  (`start|stop|status|reset|diff|push|test|types`). `db:test` runs the RLS
  suite (pgTAP, `supabase/tests/`). This project runs on the **545xx** port block
  (see `docs/plan/api-layer/README.md` §2);
  `.env.local` is created from `supabase status -o env`.
- Hooks: `pre-commit` → lint-staged (ESLint `--fix` + Prettier); `commit-msg` →
  commitlint. CI (`.github/workflows/ci.yml`) runs commitlint on PRs plus
  format:check, lint, typecheck, test, build, and e2e. `.github/workflows/db.yml`
  runs the RLS pgTAP suite (`supabase test db`) when `supabase/**` changes.
- Commits follow Conventional Commits, enforced by commitlint. See
  `docs/COMMITS.md`.

## Layout

- `src/app/` — routes (locale-prefixed `[locale]`; `app/api/` for route handlers).
- `src/features/{auth,persona,posts,connect,marketplace,admin}/` — feature code.
- `src/components/{ui,layout}/`, `src/lib/{supabase,i18n,validation}/`,
  `src/messages/`, `src/styles/`, `src/types/`.
- `supabase/` — config, migrations, seed, RLS tests.
- `docs/` — PRD, handover, SPEC/CONTEXT/CONSTRAINTS, `adr/`.
- `tests/e2e/` — Playwright. `public/` stays at the repo root.

## Roles & states

- Roles: `USER` | `ADMIN` only.
- Account states: `PENDING` → `APPROVED` / `REJECTED` / `SUSPENDED`.
  Only `APPROVED` users get platform access. `ADMIN` is always approved.
- Auth email is private; contact info lives in a separate `contact_details` table
  gated by RLS on an accepted connection.
- Custom cultural interests stay in `profiles.interests text[]`. New labels are
  registered in `interest_catalog` as `pending` (max 3 new per member per 24h)
  and only become suggestions after admin approval. Rejecting a pending label
  removes it from the creator's profile; unpublishing an approved label keeps
  existing profiles intact.

## Non-negotiable rules

- **Never trust the frontend.** Enforce permissions in the DB (RLS) and/or
  server-side. Fail closed; a missing policy denies access.
- Protected contact info must be gated by RLS, not by hiding UI.
- Writes that are privileged or multi-step go through Server Actions / Route
  Handlers, with Zod validation at every boundary.
- All UI text via translation keys (`next-intl`, EN/ES). No hardcoded English.
- Follow the Rules of React (the compiler enforces them).

## Deviations from PRD v0.1

These are confirmed and supersede the PRD where it disagrees:

- Package manager is **npm**, not pnpm.
- Foundational docs live under `docs/` (not the repo root).
- Runtime pinned to the versions above (`src/` layout adopted per PRD §9.1).
- **Signup is deferred to persona submit.** Step 1 (`/register`) keeps the
  email/password in an in-memory client draft; the Supabase Auth user is created
  only when step 2 is submitted, so abandoning persona setup leaves no
  half-registered account. Email confirmation must stay disabled (PRD OQ-1);
  a full page refresh at step 2 intentionally returns to step 1.
- **Posts support up to six images** and one level of threaded comments. Comments
  are post engagement, not chat: no inbox, realtime delivery, mentions, or
  comment notifications.
- **Marketplace products have a lifecycle** (`draft`, `live`, `unpublished`,
  `trashed`). Delete is a soft delete so an admin can restore a piece from Trash.
- **Admin reject/suspend decisions require a reason** stored in
  `profile_moderation_events`; the member can read their latest reason.
- **Discover order is a seeded shuffle**, stable across load-more for one search
  session and reshuffled on a new search.

## Out of scope (do not build without asking)

Chat/DMs · groups/forums · stories/reels/live/video · user marketplace listings ·
seller/vendor accounts · carts/checkout/payments/shipping · AI matchmaking ·
following/followers · sub-admin/moderator roles.
