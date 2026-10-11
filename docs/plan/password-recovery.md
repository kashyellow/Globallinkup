# Password recovery — Forgot / Sent / Reset (auth slice)

Implemented. Written against the UI-only state of the codebase (no Supabase, no
Zod, forms simulate with `setTimeout`).

- **Status:** implemented
- **Area:** `auth` · routes under `(public)`
- **Mockup:** `docs/ui/Forgot Password & Reset Confirmation.png` (covers Request + Sent)
- **PRD refs:** FR-1.4 (forgot password — email a reset link), FR-1.5 (reset via link), §7.5 (auth gating, still future)
- **Fixed:** the two dead `href="#"` links in `LoginView` (`login-view.tsx`)

## Why

The password-recovery flow was the **only mocked screen with no route**. `LoginView`
rendered a "Forgot password?" link and a "reset your password" link, both pointed at
`#`. PRD lists the flow as **M (MVP)**. This slice adds the missing screens so the
recovery path is complete and clickable.

## Decisions (locked)

| ID   | Decision                | Choice                                     | Notes                                                                                                                                                                                     |
| ---- | ----------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PR-1 | Set-new-password screen | **Design in house style now**              | No mockup exists; built `/reset-password` in the centered-card style; refine against a real mockup later.                                                                                 |
| PR-2 | Slice scope             | **UI-only, clear seam**                    | Submit simulates; the Supabase call is a `TODO(auth)` seam.                                                                                                                               |
| PR-3 | Routes                  | **`/forgot-password` + `/reset-password`** | Email link's `redirectTo` will point at `/reset-password`.                                                                                                                                |
| PR-4 | Request vs Sent         | **Two routes**                             | `/forgot-password` → `/forgot-password/sent`. Failure states live inline on the request form; the sent page is success-only. Refresh-safe + deep-linkable.                                |
| PR-6 | Email on the sent page  | **Not in the URL**                         | `?email=` leaks PII into server/CDN/proxy logs, browser history, and analytics. The sent page uses generic copy. If the address is ever shown, use `sessionStorage`, never a query param. |
| PR-5 | Copy style              | **Bilingual pairing per locale**           | `title` key + `titleAlt` in the other language ("Forgot your password?" + "/ ¿Olvidaste tu contraseña?"), matching `LoginView`/`RegisterView`.                                            |

## Routes & files

| Route                            | Page file                                                 | View component       |
| -------------------------------- | --------------------------------------------------------- | -------------------- |
| `/{locale}/forgot-password`      | `src/app/[locale]/(public)/forgot-password/page.tsx`      | `ForgotPasswordView` |
| `/{locale}/forgot-password/sent` | `src/app/[locale]/(public)/forgot-password/sent/page.tsx` | `ResetLinkSentView`  |
| `/{locale}/reset-password`       | `src/app/[locale]/(public)/reset-password/page.tsx`       | `ResetPasswordView`  |

All under the `(public)` group → they inherit `PublicHeader`/`PublicFooter` and the
`pt-20` fixed-header offset. Each `page.tsx` follows the existing pattern:
`generateMetadata` via `getTranslations({ locale, namespace })` returning `{ title }`.

Feature components (`"use client"`, `useTranslations`, `Icon`,
`Link` from `@/lib/i18n/navigation`, `cn`):

- `src/features/auth/components/forgot-password-view.tsx`
- `src/features/auth/components/reset-link-sent-view.tsx`
- `src/features/auth/components/reset-password-view.tsx`
- `src/features/auth/components/recovery-shell.tsx` — shared chrome: centered card
  (`max-w-2xl`), optional two-chip step tracker (`step={1|2}`), accent bar, eyebrow
  ("Account Recovery • Recuperación") + "256-Bit SSL Encrypted" badge, support
  footer, and the below-card trust row.

No change needed to `src/lib/i18n/routing.ts` — `localePrefix: "always"` with no
`pathnames` map, so `Link href="/forgot-password"` works as-is.

## Screens

### 1. `/forgot-password` — `ForgotPasswordView`

- Stepper chips (`step={1}`): "1. Request Link / Solicitar" (active), "2. Sent Confirmation / Confirmación".
- Heading `title` + `titleAlt`; bilingual body box (`bodyEn` + `bodyEs`).
- Email field (`emailLabel`, `emailRequired`, `emailPlaceholder`, `@` icon), helper below
  (`emailHelper`), inline error (`emailError`) on submit.
- Submit `Send Reset Link / Enviar Enlace →` with a loading spinner.
- `OR / O` divider + `← Return to Log In` → `/login`.
- **Behaviour:** client email validation (`/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/`); valid →
  simulated delay → `router.push("/forgot-password/sent")`. **No email in the URL.**
  Last line before the push is the `TODO(auth): resetPasswordForEmail` seam.

### 2. `/forgot-password/sent` — `ResetLinkSentView`

- Same shell, `step={2}`.
- `mark_email_read` emblem, heading + generic body ("We've sent a reset link to the
  address you entered…"), spam hint, inert `Request another link`, `← Back to Log In`.
- Purely static: no `useSearchParams`, no `Suspense` boundary.

### 3. `/reset-password` — `ResetPasswordView`

- Heading `title` + `titleAlt`; new password + confirm with show/hide, and the strength
  meter + rule chips reused from `RegisterView` (`rules` object, `strengthKey`, `Rule`).
- Confirm-mismatch inline error (`confirmError`).
- Submit `Update Password / Actualizar Contraseña`; success → simulated delay →
  `router.push("/login")`. Last line is the `TODO(auth): updateUser` seam.
- **Expired/invalid-link state:** `invalidTitle` + `invalidBody` + `Request a new link`
  → `/forgot-password`. A dev-only preview bar (`previewLabel`, `state_valid`,
  `state_invalid`) toggles between the form and the invalid state — same convention as
  the `LoginView`/`VerifyView` preview sandboxes. In production the state will derive
  from the callback token check (TODO at the seam).

## i18n

Added to **both** `src/messages/en.json` and `src/messages/es.json`:

- `Auth.forgotPassword.*` — step1, step2, eyebrow, sslBadge, title, titleAlt, bodyEn,
  bodyEs, emailLabel, emailRequired, emailPlaceholder, emailError, emailHelper, submit,
  submitting, or, returnToLogin, supportQuestion, supportDesk, supportNote, safetyGuide, norms
- `Auth.resetLinkSent.*` — title, titleAlt, body, spamHint, resend, backToLogin
- `Auth.resetPassword.*` — previewLabel, state_valid, state_invalid, title, titleAlt,
  subtitle, passwordLabel, passwordHint, passwordPlaceholder, togglePassword,
  strengthLabel/Weak/Medium/Strong, ruleLength/Case/Number, confirmLabel,
  confirmPlaceholder, toggleConfirm, confirmError, invalidTitle, invalidBody,
  requestNewLink, submit, submitting, backToLogin

Existing `Auth.login.forgotPassword` / `Auth.login.resetPassword` string keys stayed;
only their surrounding markup changed to `<Link href="/forgot-password">`.

## Backend seam (later slice — NOT in this one)

1. `ForgotPasswordView` submit → `supabase.auth.resetPasswordForEmail(email, { redirectTo: ${origin}/${locale}/reset-password })`.
2. `ResetPasswordView` submit → `supabase.auth.updateUser({ password })`.
3. Token handling: a route handler (`src/app/[locale]/auth/callback/route.ts`) to exchange
   the PKCE `code` for a session, then redirect to `/reset-password`. This is what makes
   the "invalid/expired link" state real.
4. Zod schemas at the boundary (add `zod` when the backend lands; not installed today).

## Tests

- **E2E** — `tests/e2e/password-recovery.spec.ts`:
  - `/en/forgot-password` and `/es/forgot-password` render the heading (both locales).
  - A valid email + submit navigates to `/en/forgot-password/sent`.
  - Login's "Forgot password?" link points at `/forgot-password`.
- **Quality gates passing:** `typecheck`, `lint`, `format:check`, `test`, `build`,
  `e2e` (password-recovery spec).

## Out of scope (not built here)

- Real email delivery / Supabase wiring (backend slice).
- The `/profile` and other inert buttons (backend-gated; separate work).
- Auth gating in `proxy.ts` (separate middleware slice).
- "Safety & Trust", "Help Center", "Policies", "Member Support Desk" destinations —
  left inert.

## Open items / risks

- **Reset screen has no mockup** — house design may need refinement once a real mockup
  arrives; low risk.
- **No PII in URLs.** The sent page is static (PR-6); the email never appears in a query
  param. If a future design needs to name the address, use `sessionStorage`, not the URL.
- **No route guard** today — `/reset-password` is directly reachable until auth gating
  lands; the invalid-link state becomes real only after the callback route exists.
