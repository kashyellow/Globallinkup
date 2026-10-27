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
- `npm run admin:bootstrap` — create or promote the `ADMIN_EMAIL` account to
  `admin` on a deployed project (`db push` never runs `seed.sql`, so the cloud has
  no admin). `--create` skips the persona funnel and makes the account in one
  step. Flags: `-- --create`, `-- --email=…`, `-- --display-name=…`,
  `-- --password=…`, `-- --dry-run`, `-- --allow-local`.
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
- `docs/` — PRD, handover, CONTEXT, `adr/` (decision records),
  `feedback/` (client review rounds), `plan/` (slice plans).
- `tests/e2e/` — Playwright. `public/` stays at the repo root.

## Roles & states

- Roles: `USER` | `ADMIN` only.
- Account states: `PENDING` → `APPROVED` / `REJECTED` / `SUSPENDED`.
  Only `APPROVED` users get platform access. `ADMIN` is always approved.
- Auth email is private; contact info lives in a separate `contact_details` table
  gated by RLS on an accepted connection. **Admins are not an exception**: the
  admin read policy is being removed so only the owner and an accepted connection
  can read those channels (ADR 0005).
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
  comment notifications. Comment deletion is admin-only; authors remove their
  own posts from the profile archive, not from the public feed.
- **Personas have an optional Headline** in addition to the short bio, and profile
  photos are cropped to a 1:1 circle-friendly image before upload. Post photos
  render fitted rather than cropped.
- **Marketplace products have a lifecycle** (`draft`, `live`, `unpublished`,
  `trashed`). Delete is a soft delete so an admin can restore a piece from Trash.
- **Admin reject/suspend decisions require a reason** stored in
  `profile_moderation_events`; the member can read their latest reason.
- **Admins are operators, not members.** `npm run admin:bootstrap -- --create`
  makes the account (Supabase Auth user + minimal `profiles` row) without the
  persona funnel. RLS keeps admin profiles out of Discover, dossiers,
  `profiles_public`, and the connection graph; admin posts stay on the feed
  (announcements) with the author masked behind the platform label.
- **Discover order is a seeded shuffle**, stable across load-more for one search
  session and reshuffled on a new search.

## Confirmed next work (client review, 2026-10-27)

Approved scope from the first client review. Details and acceptance criteria live
in `docs/feedback/2026-10-27-client-review.md`; each item has an ADR. Nothing here
is implemented yet unless the code says so.

- **Content lifecycle** (ADR 0001) — **data model and server actions
  implemented**: `post_state` (`visible | archived | removed`), the guard that
  keeps removal admin-only, hard delete for authors, admin remove/restore with a
  14-day deadline, and storage reads already gated on the owning post. Still
  pending: the profile tabs and dialogs, the purge job, and the appeal flow.
- **Notifications inbox** (ADR 0004): DB-backed notices with deep links. This is
  moderation feedback, **not chat**: no threads, realtime, or user-to-user
  messaging.
- **Granular admin roles** (ADR 0002): roles are capability sets
  (`members.review`, `posts.moderate`, `comments.moderate`, `interests.review`,
  `reports.manage`, `marketplace.manage`, `admins.manage`, `settings.manage`,
  `audit.read`). The first admin manages accounts and permissions in the UI, and
  hands out a one-time invite link so the person sets their own password (no SMTP
  needed).
- **Audit + PII-safe logging** (ADR 0003): append-only `audit_events` with ids,
  actions, reasons and whitelisted metadata only; 12-month retention; gated by
  `audit.read`.
- **No admin access to PII** (ADR 0005) — **implemented**: the admin policies
  on `contact_details` and `profile_private` are gone, and the dossier no longer
  renders contact channels.
- **Theme modes** (ADR 0006) — **implemented**: `light | dark | system`, default
  `system`, dark colours taken only from `baefd24^`; layout unaffected. Cookie +
  pre-paint script, toggle in both headers.
- **Global countries** (ADR 0007) — **implemented**: every ISO-3166 country can
  register (`Intl.DisplayNames` labels), and the discover region filter is derived
  from countries that actually have approved members (`discover_countries()`).

## Out of scope (do not build without asking)

Chat/DMs · groups/forums · stories/reels/live/video · user marketplace listings ·
seller/vendor accounts · carts/checkout/payments/shipping · AI matchmaking ·
following/followers.

Granular admin roles (sub-admins) were on this list; they are now in scope per
ADR 0002.

## Known operational gaps

- **Outbound email.** The cloud project still uses Supabase's default SMTP, which
  only delivers to addresses in the Supabase organisation and caps at 2 messages
  per hour. `forgot-password` therefore does not reach real members. Configuring
  Resend (or another provider) with a verified sending domain is a **pre-launch
  requirement**; it is dashboard configuration, not a package. Admin accounts use
  invite links shared by the owner, so they do not depend on SMTP.
