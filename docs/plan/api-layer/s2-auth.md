# S2 — Auth wired end-to-end

Put the real Supabase Auth behind the existing screens and add approval gating.

Back to [README](./README.md). Depends on **S1**.

- **Goal:** register / login / logout / password reset work against Supabase; the
  approval state drives what a signed-in user can reach.
- **Gate:** e2e covers the flows; access gating is enforced server-side + RLS.

## 1. Server actions — `src/features/auth/actions.ts`

`"use server"`, Zod at each boundary (mirroring the UI's password rules):

| Action                       | Supabase call                                       | On success                                       |
| ---------------------------- | --------------------------------------------------- | ------------------------------------------------ |
| `signUpAction`               | `auth.signUp`                                       | `/create-persona`                                |
| `signInAction`               | `auth.signInWithPassword`                           | approved → `/discover`; else `/verify`           |
| `signOutAction`              | `auth.signOut`                                      | `/login`                                         |
| `requestPasswordResetAction` | `auth.resetPasswordForEmail(email, { redirectTo })` | always `/forgot-password/sent` (no email in URL) |
| `updatePasswordAction`       | `auth.updateUser({ password })`                     | `/login`                                         |

## 2. Recovery callback

`src/app/[locale]/auth/callback/route.ts` — `exchangeCodeForSession`, then
redirect to the locale-prefixed `/reset-password`. `redirectTo` is built with the
active locale so the email link lands in EN or ES. (Route Handlers under
`[locale]` are allowed; the proxy still refreshes first.)

## 3. Gating (PRD §7.5)

Server-only DAL helper `src/lib/auth.ts`:

- `requireApprovedUser()` → `getUser()`; no session → `/{locale}/login`; no
  profile → `/{locale}/create-persona`; `approval_status !== approved` →
  `/{locale}/verify`. Returns `{ user, profile }`.
- `requireAdmin()` → additionally requires `role = admin` (used by `/admin`).

Wired into `(app)/layout.tsx` (and the admin page). The **proxy stays optimistic
only** — its cookie check is a fast hint; this helper + RLS are authoritative.

## 4. Wire the views

- `register-view` → `signUpAction` (banner + loading already exist).
- `login-view` → `signInAction`; **remove** the hardcoded demo credentials
  (`sofia.martinez@example.com` / `CuratedTrust2024`).
- `forgot-password-view` → `requestPasswordResetAction` (drop the `TODO(auth)`).
- `reset-password-view` → `updatePasswordAction`; the "invalid link" state shows
  when there is no recovery session.
- `verify-view` → driven by the real `approval_status`, not the dev preview
  toggle (keep the toggle dev-only).

## 5. Close the loop

A minimal `createPersonaAction` writes the `profiles` row with
`approval_status = pending` + `submitted_at` (name, country, city, bio,
interests). Avatar upload defers to **S4**.

> Decision: include this here, or open **S3** with it? Without it, S2 dead-ends at
> `/verify` (recommended: include it).

## 6. Tests

- e2e: pending user → `/verify`; wrong password → banner; approved user → app;
  (optional) admin approves a pending user.
- Unit: the Zod schemas.

## 7. Open decisions

- **Email confirmation** — keep it **disabled** locally (OQ-1 default: admin
  approval is the only gate) so `signUp` returns a session immediately?
- **"Remember device"** — map to cookie `maxAge` (persistent session) or drop?
- **Rate limiting** (FR-1.8) — rely on Supabase's built-in `[auth.rate_limit]`
  for now?
