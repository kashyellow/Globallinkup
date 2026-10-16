# S2 — Auth wired end-to-end

Put the real Supabase Auth behind the existing screens and add approval gating.

Back to [README](./README.md). Depends on **S1** — including the audit fixes in
`20261016120000_s1_fixes.sql` (the profile privilege guard, the connection state
machine, `profile_private` / `profile_age()`, and the extra columns). The persona
write path depends on that final shape.

- **Status:** ✅ complete 2026-10-16 — auth wired end-to-end, `@auth` e2e green.

- **Goal:** register / login / logout / password reset work against Supabase; the
  approval state drives what a signed-in user can reach.
- **Gate:** e2e covers the flows; access gating is enforced server-side + RLS.

## 1. Decisions (locked)

| ID   | Question                                                                                                                             | Options                                                                                                                                                         | Status      |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| SA-1 | Admin review (**approve / reject / suspend**, FR-9.1) appears here only as an "optional" e2e line, and `(app)/admin` is still a mock | (a) include a minimal `reviewPersonaAction` in S2 so the approval gate is testable end-to-end; (b) defer to S3 and let S2 rely on the seed for an approved user | locked      |
| SA-2 | `verify-view.tsx` models three states (`pending`, `approved`, `action`) and lumps `rejected` into "action"                           | Include distinct **rejected** (edit + resubmit, FR-2.5) and **suspended** (FR-2.6 / OQ-14) states in S2, or later?                                              | locked      |
| SA-3 | Auth e2e needs a running, seeded stack, but `playwright.config.ts` boots only `npm run dev` and CI provisions no Supabase            | (a) require `db:start` + `db:reset` and skip auth specs when the stack is down; (b) keep e2e stack-free and cover auth in unit + pgTAP only                     | locked      |
| SA-4 | Repeatable local accounts for the auth e2e (admin / pending / approved / reset)                                                      | depends on the S1 seed credentials (§4 of S1)                                                                                                                   | locked      |
| SB-1 | **Resubmit (FR-2.5)** is blocked by the profile privilege guard — a non-admin cannot change `approval_status` / `submitted_at`       | (a) service-role in the action; (b) a `security definer` RPC; (c) broaden the guard so the owner may go `rejected → pending` (and refresh `submitted_at`) only  | locked: (c) |
| SB-2 | The persona form has no date-of-birth input, so `profile_age()` would be null and the discover cards lose the age they render        | (a) add an optional DOB field to the persona form now; (b) defer to S3 and show a blank age                                                                     | locked: (a) |
| SB-3 | The form collects one bio, but the schema has `bio_en` + `bio_es`                                                                    | (a) write to the column for the active locale (fall back on read); (b) always `bio_en`; (c) write both                                                          | locked: (a) |
| SB-4 | Auth e2e needs a seeded stack, and `.github/workflows/db.yml` now boots Supabase in CI                                               | (a) tag the auth specs `@auth`, skip when the stack is down, run them in the DB workflow; (b) keep them local-only                                              | locked: (a) |

Locked choices recorded in
[`api-layer-decisions.md`](./api-layer-decisions.md) §4c.

## 2. Server actions — `src/features/auth/actions.ts`

`"use server"`, Zod at each boundary (mirroring the UI's password rules):

| Action                       | Supabase call                                       | On success                                       |
| ---------------------------- | --------------------------------------------------- | ------------------------------------------------ |
| `signUpAction`               | `auth.signUp`                                       | `/create-persona`                                |
| `signInAction`               | `auth.signInWithPassword`                           | approved → `/discover`; else `/verify`           |
| `signOutAction`              | `auth.signOut`                                      | `/login`                                         |
| `requestPasswordResetAction` | `auth.resetPasswordForEmail(email, { redirectTo })` | always `/forgot-password/sent` (no email in URL) |
| `updatePasswordAction`       | `auth.updateUser({ password })`                     | `/login`                                         |

- **`signInWithPassword` does not return the profile.** After sign-in, read
  `profiles` (status + role) with an RLS-scoped client to choose the destination:
  no profile → `/create-persona`; `approved` → `/discover`; anything else →
  `/verify`.
- **`signOutAction` call sites:** the profile logout button
  (`src/features/profile/components/dossier-header.tsx`, `logout()`) and the
  navbar account control — both inert today; wire them in this slice.
- Zod schemas live in `src/lib/validation/` (currently an empty `.gitkeep`), not
  inline, so they can be unit-tested and reused by the forms.

## 3. Recovery callback

`src/app/[locale]/auth/callback/route.ts` — `exchangeCodeForSession`, then
redirect to the locale-prefixed `/reset-password`. `redirectTo` is built with the
active locale so the email link lands in EN or ES. (Route Handlers under
`[locale]` are allowed; the proxy still refreshes first.)

Gotchas to handle explicitly:

- Call `resetPasswordForEmail` through the **SSR server client** so the PKCE code
  verifier lands in a cookie; the callback needs that cookie for
  `exchangeCodeForSession`. A non-SSR client silently breaks the exchange.
- `redirectTo` must come from `getLocale()` (`next-intl/server`) inside the
  action — server actions receive no locale param.
- `src/proxy.ts`'s `matcher` excludes `api` but **not** `auth/callback`, so
  next-intl still runs on the callback path. Verify that is safe (it is
  locale-prefixed, so `/[locale]/auth/callback` should pass through unchanged).
- The "invalid / expired link" state in `reset-password-view.tsx` is a dev toggle
  today. Make it real by passing a `hasRecoverySession` prop from the page (or by
  having the callback redirect with a flag) instead of internal state.

## 4. Gating (PRD §7.5)

Server-only DAL helper `src/lib/auth.ts` (**to be created**):

- `requireApprovedUser()` → `getUser()`; no session → `/{locale}/login`; no
  profile → `/{locale}/create-persona`; `approval_status !== approved` →
  `/{locale}/verify`. Returns `{ user, profile }`.
- `requireAdmin()` → additionally requires `role = admin` (used by `/admin`).

Wired into `src/app/[locale]/(app)/layout.tsx` (and the admin page). The **proxy
stays optimistic only** — its cookie check is a fast hint; this helper + RLS are
authoritative.

Two non-negotiables the original draft missed:

- **The DAL must degrade like the proxy, not throw.** S0 deliberately made
  `src/lib/supabase/proxy.ts` non-fatal when Supabase is unconfigured or
  unreachable, so `build` / CI / e2e still pass without a stack. If
  `requireApprovedUser()` calls `getPublicEnv()` unguarded, every `(app)` route
  returns 500 in exactly those environments. Catch it and treat "no Supabase" as
  "no session → redirect to login" (fail-closed).
- **Dedupe `getUser()` with `React.cache`.** Both `(app)/layout.tsx` and the page
  call the DAL, which would otherwise hit Auth twice per request.

## 5. Wire the views

- `register-view` → `signUpAction` (banner + loading already exist).
- `login-view` → `signInAction`; **remove** the hardcoded demo credentials
  (`sofia.martinez@example.com` / `CuratedTrust2024`).
- `forgot-password-view` → `requestPasswordResetAction` (drop the `TODO(auth)`).
- `reset-password-view` → `updatePasswordAction`; the "invalid link" state shows
  when there is no recovery session (see §3).
- `verify-view` → driven by the real `approval_status`, not the dev preview
  toggle (keep the toggle dev-only). This needs the state work in **SA-2** plus a
  resubmit path (see §6).
- `create-persona-view` marks the photo as `required`, but the avatar upload is
  deferred to **S4**. Relax that copy/validation now; `createPersonaAction` must
  accept `avatar_url = null`.
- Add an **optional date-of-birth** input (**SB-2**) so `profile_private` /
  `profile_age()` can feed the age the cards render.
- The single bio field writes to the **active locale's** column (**SB-3**):
  `bio_en` for EN, `bio_es` for ES; the other stays null until a dual-bio editor
  lands. Reads fall back to whichever column is populated (S3).

## 6. Close the loop

A minimal `createPersonaAction` requires a session (an anonymous POST must not
create a row) and writes three rows in one Server Action:

- `profiles` — `display_name`, `country_code`, `city`, `origin_flavor`,
  `languages`, `interests`, bio (locale column, SB-3), `approval_status =
pending`, `submitted_at`. (`headline` / `neighborhood` / `badge` stay null —
  the form does not collect them yet.)
- `profile_private` — `date_of_birth` (SB-2, optional).
- `contact_details` — `instagram` + `other.chat` (SD-5).

Avatar upload defers to **S4** (`avatar_url = null`).

- **Resubmit (FR-2.5), SB-1(c):** broaden `protect_profile_privileges` in a small
  S2 migration so the owner may move `rejected → pending` and set a fresh
  `submitted_at` (every other status/role change stays admin-only). Then
  `resubmitPersonaAction` is a plain RLS-client update — an update, not a create.
- **`reviewPersonaAction` (SA-1)** runs as the **RLS client** — the
  `profiles_update_admin` policy plus the guard's admin bypass cover
  approve/reject/suspend; no service-role needed.

> **SA-1 locked:** include the minimal `reviewPersonaAction` (approve / reject /
> suspend) in S2, so the approval gate is testable end-to-end instead of
> dead-ending at `/verify` for every non-seeded user. **SA-2 locked:** ship the
> distinct **rejected** (edit + resubmit) and **suspended** states too.

## 7. Tests

- e2e (`@auth`, SB-4(a)): approved → app; pending → `/verify`; rejected → help
  screen with a resubmit link; suspended → notice; wrong password → banner;
  anonymous → bounced from the app; admin → portal. The specs skip when the
  stack is down (`AUTH_E2E=1`), and `.github/workflows/db.yml` runs them after
  `db:reset` so CI covers the flow.
- Unit: the Zod schemas in `src/lib/validation/` (`*.test.ts`, beside the
  existing `src/lib/env.test.ts`).
- RLS: the pgTAP suite already exists (`npm run db:test`, from S1) and covers the
  auth-adjacent rules; extend it for any new S2 policy.

## 8. Open decisions

- **Email confirmation** — already **disabled** locally
  (`enable_confirmations = false`), so `signUp` returns a session immediately.
  Confirm this stays the S2 behaviour and is deferred to the cloud cutover.
- **"Remember device"** — map to cookie `maxAge` (persistent session) or drop?
- **Rate limiting** (FR-1.8) — rely on Supabase's built-in `[auth.rate_limit]`
  for now (already present in `config.toml`)?
- Everything in **§1 (SA-1…SA-4, SB-1…SB-4)** is locked — see
  [`api-layer-decisions.md`](./api-layer-decisions.md) §4/§4c.

## 9. Outcome (2026-10-16)

- **Auth wired:** Zod schemas in `src/lib/validation/{auth,persona}.ts`; five auth
  Server Actions in `src/features/auth/actions.ts`; the recovery route handler
  `src/app/[locale]/auth/callback/route.ts`; and the DAL `src/lib/auth.ts`
  (`requireApprovedUser` / `requireAdmin`) enforced in `(app)/layout.tsx` and the
  admin page. Views are wired and the demo credentials are gone.
- **Persona write:** one `savePersonaAction` covers onboarding **and** the rejected
  resubmit; it writes `profiles` + `profile_private` + `contact_details`, with the
  single bio going to the active locale's column (SB-3).
- **Reviews:** `reviewPersonaAction` (RLS client) exists, but the **admin UI
  wiring is deferred to S3** — the approval path is exercised by pgTAP and the
  seeded `@auth` logins rather than an admin click for now.
- **DB:** `20261016130000_s2_resubmit_guard.sql` broadens the privilege guard
  (SB-1c); the seed gains rejected/suspended accounts **and** the `auth.users`
  token columns GoTrue needs (they defaulted to NULL and broke password sign-in).
- **Tests:** Zod unit tests; `@auth` e2e (7 specs, `AUTH_E2E=1`); pgTAP 34/34.
- **Audit fixes (S2):** the persona write now goes through the atomic
  `save_persona` RPC; locale travels in the action payload (never `getLocale()`
  in an action); the reset origin comes from `NEXT_PUBLIC_SITE_URL`; and `/verify`
  shows the real persona — see [`s2-audit-fixes.md`](./s2-audit-fixes.md).
- **Deferred:** "remember device", rate-limit tuning, and the cloud cutover.
