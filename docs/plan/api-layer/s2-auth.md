# S2 — Auth wired end-to-end

Put the real Supabase Auth behind the existing screens and add approval gating.

Back to [README](./README.md). Depends on **S1** (and its §1 decisions — the
persona write path depends on the final `profiles` shape).

- **Goal:** register / login / logout / password reset work against Supabase; the
  approval state drives what a signed-in user can reach.
- **Gate:** e2e covers the flows; access gating is enforced server-side + RLS.

## 1. Decisions (locked)

| ID   | Question                                                                                                                             | Options                                                                                                                                                         | Status |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| SA-1 | Admin review (**approve / reject / suspend**, FR-9.1) appears here only as an "optional" e2e line, and `(app)/admin` is still a mock | (a) include a minimal `reviewPersonaAction` in S2 so the approval gate is testable end-to-end; (b) defer to S3 and let S2 rely on the seed for an approved user | locked |
| SA-2 | `verify-view.tsx` models three states (`pending`, `approved`, `action`) and lumps `rejected` into "action"                           | Include distinct **rejected** (edit + resubmit, FR-2.5) and **suspended** (FR-2.6 / OQ-14) states in S2, or later?                                              | locked |
| SA-3 | Auth e2e needs a running, seeded stack, but `playwright.config.ts` boots only `npm run dev` and CI provisions no Supabase            | (a) require `db:start` + `db:reset` and skip auth specs when the stack is down; (b) keep e2e stack-free and cover auth in unit + pgTAP only                     | locked |
| SA-4 | Repeatable local accounts for the auth e2e (admin / pending / approved / reset)                                                      | depends on the S1 seed credentials (§4 of S1)                                                                                                                   | locked |

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
- **`signOutAction` has no call site yet.** Today's `/profile` logout button and
  the navbar's account control are inert; name the real target in this slice.
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

## 6. Close the loop

A minimal `createPersonaAction` writes the `profiles` row with
`approval_status = pending` + `submitted_at` (name, country, city, bio,
interests). Avatar upload defers to **S4**.

- **Resubmit (FR-2.5)** needs a second path: a `rejected` user edits and
  resubmits → back to `pending` + new `submitted_at`. The create action always
  writes `pending`, so resubmit is an update, not a create — decide whether it
  shares the action or gets its own.
- `contact_details` (Instagram / chat from the vault) is written alongside the
  profile, per the **SD-5** decision in S1.
- `createPersonaAction` must require a session (an anonymous POST must not create
  a row).

> **SA-1 locked:** include the minimal `reviewPersonaAction` (approve / reject /
> suspend) in S2, so the approval gate is testable end-to-end instead of
> dead-ending at `/verify` for every non-seeded user. **SA-2 locked:** ship the
> distinct **rejected** (edit + resubmit) and **suspended** states too.

## 7. Tests

- e2e: pending user → `/verify`; wrong password → banner; approved user → app;
  (optional) admin approves a pending user. **Blocked by SA-3** — the suite needs
  a seeded stack or must skip when it is down.
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
- Everything in **§1 (SA-1…SA-4)** is locked — see
  [`api-layer-decisions.md`](./api-layer-decisions.md) §4.
