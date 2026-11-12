# Admin "Invite user" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the owner and members-desk sub-admins invite a member by email (name, optional photo, language); the invitee sets a password, completes the prefilled persona form, and lands approved.

**Architecture:** A new `member_invites` table stages the invitee's name/photo/locale against the `auth.users` row that `auth.admin.inviteUserByEmail` creates. No `profiles` row exists until the persona is submitted (same as normal signup), so unfinished invitees never reach the Users tab. `save_persona` auto-approves a caller with an open invite. The email link uses a `token_hash` template pointed at a new `/[locale]/auth/confirm` route (`verifyOtp`), then `/accept-invite` (password + terms), then the existing `/create-persona`.

**Tech Stack:** Next.js App Router (read `node_modules/next/dist/docs/` before touching routes), Supabase (Auth admin API, Postgres RLS, Storage, pgTAP), next-intl, Zod, Vitest, Playwright + local Mailpit.

**Spec:** agreed in-session 2026-11-12 (grill rounds 1–3), reproduced here:

1. Tab `/admin/invite` "Invite user", gated on `members.review`.
2. Form: email, full name, optional photo (crop via `AvatarCropDialog`), language EN/ES. Zod-validated.
3. Send via `auth.admin.inviteUserByEmail`, `redirectTo=/{locale}/auth/confirm`. Auth user created at invite; name/photo staged (photo at `avatars/{newUserId}/…`); invite audited.
4. Existing member email → error. Pending invite email → error with "use Resend" hint.
5. Bilingual `supabase/templates/invite.html` wired in `config.toml`; link `{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=invite`; `/[locale]/auth/confirm` calls `verifyOtp`. Dead link → "Invitation expired, ask your admin" + login link.
6. After click: step 1 set password + accept terms (email locked); step 2 existing `CreatePersonaView` prefilled (name/photo editable; avatar still required). Submit → **auto-approved**, inviter audited. Abandon after step 1 → login routes back to persona.
7. Pending list: "Sent" → Resend (re-call `inviteUserByEmail`); "Link opened, setup unfinished" → Resend disabled + Forgot-password hint. Revoke deletes account, only before persona submit. Unfinished invitees excluded from Users tab.
8. No notification to inviter.
9. Ship with default SMTP: tab shows notice on send failure; `CONTEXT.md` lists invites as SMTP-blocked.
10. Docs: new ADR, `CONTEXT.md`, PRD admin section.
11. Tests: pgTAP RLS for the invites table; Vitest for action validation + permission; Playwright happy path via Mailpit.
12. All copy in `en.json` + `es.json`.

**Plan-level decisions (flag to reviewer):**

- Spec point 3 said "profile stored as pending". Plan stages name/photo in `member_invites` instead and keeps profile creation in `save_persona`. Same visible behaviour; satisfies point 7's Users-tab exclusion with zero query changes.
- Spec assumed a 24 h link. Project `otp_expiry` is `3600` (1 h). Task 6 raises it to `86400`; this also lengthens password-recovery links. Must match in the cloud dashboard.

## Global Constraints

- npm only. Commands: `npm run typecheck`, `npm run lint`, `npm test`, `npm run db:reset`, `npm run db:test`, `npm run db:types`, `npm run e2e`.
- Conventional Commits, scopes from `auth, admin, db, i18n, docs`. Never `--no-verify`. End messages with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- No hardcoded English in components: keys in `src/messages/en.json` and `src/messages/es.json`.
- React Compiler on: no hand-written `useMemo`/`useCallback`/`React.memo`.
- Zod at every boundary (actions, route handler query params).
- Audit metadata is ids and state only, never email/name (ADR 0003).
- Server Actions must not call `getLocale()`; locale travels in the payload.
- Photo limits: types `ALLOWED_IMAGE_TYPES` (`image/png|jpeg|webp`), size `BUCKET_MAX_BYTES.avatars` (5 MB), path `buildStoragePath(userId, name)` from `src/lib/storage.ts`.
- Password rule: reuse `passwordSchema` from `src/lib/validation/auth.ts`.

## Review Focus

1. Email typed with spaces/capitals (`Ana@X.com`) must match an existing member or pending invite → normalise `trim().toLowerCase()` before every lookup. Pinned in Task 2 schema test.
2. Invite link opened in a browser still signed in as the admin → `verifyOtp` replaces the session and the accept page acts as the invitee. Pinned by Task 7 e2e (same browser context).
3. Double submit of the same email → second call returns `alreadyInvited`, `inviteUserByEmail` not called again. Pinned in Task 2.
4. Bad photo (wrong type or > 5 MB) → `photoInvalid` before any auth user is created (no orphan). Pinned in Task 2.
5. SMTP failure on send → `sendFailed`, no `member_invites` row, no orphaned auth user. Pinned in Task 2.

---

### Task 1: `member_invites` table + auto-approve in `save_persona`

**Files:**

- Create: `supabase/migrations/20261112120000_member_invites.sql`
- Create: `supabase/tests/member_invites.test.sql`
- Modify: `src/types/database.ts` (regenerated)

**Interfaces:**

- Produces table `public.member_invites`:
  `user_id uuid pk references auth.users(id) on delete cascade`, `email text not null unique` (lowercase, same format check as `admin_invites`), `display_name text not null check (char_length(btrim(display_name)) between 2 and 60)`, `avatar_path text null check (avatar_path is null or split_part(avatar_path,'/',1) = user_id::text)`, `locale text not null check (locale in ('en','es'))`, `invited_by uuid references public.profiles(id) on delete set null`, `created_at timestamptz not null default now()`, `last_sent_at timestamptz not null default now()`, `opened_at timestamptz`, `accepted_at timestamptz`.
- RLS: `select` to `authenticated` using `has_capability('members.review') or user_id = (select auth.uid())`. No insert/update/delete grant to `authenticated`/`anon`; `service_role` all.
- `save_persona` (same signature): in the `if not found` insert branch, when an open invite exists for `v_uid` (`accepted_at is null`), insert with `approval_status = 'approved'`, set that invite's `accepted_at = now()`, and insert one `audit_events` row: `actor_id = invited_by`, `actor_role = null`, `action = 'member.invite_accepted'`, `target_type = 'profile'`, `target_id = v_uid`. Copy the current body from `20261030120000_remove_interests.sql` and use `create or replace`.

- [ ] **Step 1: Write failing pgTAP tests** in `supabase/tests/member_invites.test.sql`, following `admin_rbac.test.sql` setup style:
  - members-desk admin `select count(*)` sees 2 seeded invites;
  - sub-admin without `members.review` sees 0;
  - invitee A sees only own row (1);
  - ordinary approved member sees 0;
  - `authenticated` insert into `member_invites` throws `42501`;
  - insert with `avatar_path = '<other-uuid>/x.jpg'` (as service role) throws `23514`;
  - invitee A calls `save_persona(...)` → returns `'approved'`; A's invite `accepted_at is not null`; one `audit_events` row with `action = 'member.invite_accepted'` and `target_id = A`;
  - non-invited new user calls `save_persona(...)` → returns `'pending'`.
- [ ] **Step 2:** `npm run db:test` → FAIL (relation `member_invites` does not exist).
- [ ] **Step 3:** Write the migration per Interfaces.
- [ ] **Step 4:** `npm run db:reset && npm run db:test` → all PASS.
- [ ] **Step 5:** `npm run db:types` then Prettier; `npm run typecheck` → PASS.
- [ ] **Step 6: Commit** `feat(db): add member invites and auto-approve invited personas`

---

### Task 2: Invite schema, admin guard, invite actions

**Files:**

- Create: `src/lib/origin.ts` — move `getRequestOrigin()` out of `src/features/auth/actions.ts` unchanged (a `"use server"` file must not export non-action helpers); update its callers.
- Create: `src/lib/validation/invite.ts`, `src/lib/validation/invite.test.ts`
- Create: `src/features/admin/guard.ts` (`import "server-only"`)
- Modify: `src/features/admin/team-actions.ts` — replace `requireAdminsManager()` with `requireAdminCapability("admins.manage")`.
- Create: `src/features/admin/invite-actions.ts`, `src/features/admin/invite-actions.test.ts`

**Interfaces:**

- `getRequestOrigin(): Promise<string>` in `src/lib/origin.ts`.
- `inviteMemberSchema = z.object({ email, fullName, locale: z.enum(["en","es"]) })`; `email` is `z.string().trim().toLowerCase().pipe(z.email())`, `fullName` is `z.string().trim().min(2).max(60)`. Export `type InviteMemberInput`.
- `requireAdminCapability(capability: AdminCapability): Promise<{ user, profile, supabase } | null>` — body is today's `requireAdminsManager` with the capability parameterised.
- `type InviteError = "forbidden" | "invalid" | "photoInvalid" | "emailInUse" | "alreadyInvited" | "sendFailed" | "notResendable" | "notRevocable" | "unknown"`
- `type InviteState = { ok: boolean; error?: InviteError }`
- `inviteMemberAction(_prev: InviteState, formData: FormData): Promise<InviteState>` — fields `email`, `fullName`, `locale`, optional `photo` (File). Order: guard `members.review` → parse → validate photo → reject if `member_invites` has this email with `accepted_at is null` (`alreadyInvited`) → `createAdminClient().auth.admin.inviteUserByEmail(email, { redirectTo: \`${origin}/${locale}/auth/confirm\`, data: { locale } })`(error with code`email_exists`/status 422 → `emailInUse`; any other error → `sendFailed`) → upload photo to `avatars`at`buildStoragePath(userId, photo.name)`→ insert`member_invites`row (on failure:`deleteUser(userId)`, remove uploaded photo, return `unknown`) → `recordAudit({ action: "member.invite", targetType: "profile", targetId: userId })`→`revalidatePath("/admin/invite")`.
- `resendInviteAction(_prev: InviteState, formData: FormData): Promise<InviteState>` — `userId` (uuidSchema). `notResendable` when invite missing, `opened_at` or `accepted_at` set. Re-call `inviteUserByEmail` with stored email/locale; update `last_sent_at`; audit `member.invite_resend`.
- `revokeInviteAction(_prev: InviteState, formData: FormData): Promise<InviteState>` — `userId`. `notRevocable` when invite missing, `accepted_at` set, or a `profiles` row exists for `userId`. Remove avatar object (if any), `auth.admin.deleteUser(userId)` (cascades the invite row), audit `member.invite_revoke`.

- [ ] **Step 1: Write failing schema tests** (`invite.test.ts`):
  - `" Ana@Example.COM "` parses to `"ana@example.com"`;
  - `fullName: " A "` fails; `"Ana"` passes; 61 chars fails;
  - `locale: "fr"` fails.
- [ ] **Step 2: Write failing action tests** (`invite-actions.test.ts`). `vi.mock` `server-only`, `next/cache`, `@/lib/auth`, `@/lib/supabase/server` (`rpc("my_capabilities")`), `@/lib/supabase/admin` (fake `auth.admin.inviteUserByEmail`/`deleteUser`, `from()`, `storage.from()`), `@/lib/audit`, `@/lib/origin`. Assertions:
  - caller lacks `members.review` → `{ ok:false, error:"forbidden" }`, `inviteUserByEmail` not called;
  - invalid email → `invalid`;
  - photo `text/plain` or 6 MB png → `photoInvalid`, `inviteUserByEmail` not called;
  - open invite exists for email → `alreadyInvited`, `inviteUserByEmail` not called;
  - `inviteUserByEmail` returns `{ code: "email_exists" }` → `emailInUse`;
  - `inviteUserByEmail` returns status 500 → `sendFailed`, no `member_invites` insert;
  - happy path → `{ ok:true }`, `redirectTo` is `http://localhost:3000/es/auth/confirm` for `locale:"es"`, insert payload `email` is lowercase, `recordAudit` called with `action:"member.invite"` and no email in metadata;
  - resend with `opened_at` set → `notResendable`;
  - revoke with `accepted_at` set → `notRevocable`, `deleteUser` not called.
- [ ] **Step 3:** `npm test -- invite` → FAIL (modules missing).
- [ ] **Step 4:** Implement per Interfaces.
- [ ] **Step 5:** `npm test -- invite && npm run typecheck && npm run lint` → PASS. Run the full `npm test` to confirm the `team-actions` guard swap broke nothing.
- [ ] **Step 6: Commit** `feat(admin): add member invite actions`

---

### Task 3: Confirm route + accept-invite step

**Files:**

- Create: `src/app/[locale]/auth/confirm/route.ts`
- Modify: `src/lib/validation/auth.ts` — add `acceptInviteSchema`
- Modify: `src/features/auth/actions.ts` — add `acceptInviteAction`
- Create: `src/app/[locale]/(auth)/accept-invite/page.tsx`
- Create: `src/features/auth/components/accept-invite-view.tsx`
- Modify: `src/messages/en.json`, `src/messages/es.json` — `Auth.acceptInvite.*`

**Interfaces:**

- `GET /[locale]/auth/confirm?token_hash&type=invite` — validate with Zod (`type` literal `"invite"`). `supabase.auth.verifyOtp({ type: "invite", token_hash })` with the SSR client. Success → admin client sets `member_invites.opened_at = coalesce(opened_at, now())` for the user → redirect `/{locale}/accept-invite`. Any failure → `/{locale}/accept-invite?error=expired`. Pattern: `auth/callback/route.ts`.
- `acceptInviteSchema = z.object({ password: passwordSchema, confirm: z.string(), acceptedTerms: z.literal(true) })` with the same `password === confirm` refine as `signUpSchema`.
- `acceptInviteAction(input: unknown): Promise<AuthResult>` — needs a user and an own `member_invites` row with `accepted_at is null`, else `{ ok:false, error:"invalid" }`. `supabase.auth.updateUser({ password })` (error → `mapAuthError`). Success → `{ ok:true, redirectTo:"/create-persona" }`.
- Page logic: `?error=expired`, or no user, or no open invite for the user → expired state: `InlineAlert` "This invitation has expired or was already used. Ask the admin who invited you for a new one." plus a link to `/login`. User already has a profile → `redirect(postAuthPath(profile))`. Otherwise render `AcceptInviteView` with `email` read-only, password + confirm (reuse `passwordChecks`), terms checkbox (same copy/links as register step 1).

- [ ] **Step 1: Write failing schema test** in `src/lib/validation/auth.test.ts` (create it if missing): mismatched confirm fails; `acceptedTerms:false` fails; `"Abcdefg1"` + match + true passes.
- [ ] **Step 2:** `npm test -- validation/auth` → FAIL.
- [ ] **Step 3:** Implement the schema, action, route, page, view and EN/ES copy.
- [ ] **Step 4:** `npm test && npm run typecheck && npm run lint` → PASS. Manual: `/en/accept-invite?error=expired` renders the expired state in EN and `/es/...` in ES.
- [ ] **Step 5: Commit** `feat(auth): add invite confirmation and password step`

---

### Task 4: Prefill persona from the invite

**Files:**

- Modify: `src/features/persona/initial.ts`
- Modify: `src/features/persona/actions.ts`

**Interfaces:**

- `loadPersonaInitial()`: when there is no profile, read own `member_invites` row (RLS `select display_name, avatar_path`). If one exists, return a `PersonaInitial` with `fullName = display_name`, `avatarUrl` = signed URL (`createSignedImageUrl(supabase, "avatars", avatar_path)`), `hasStoredAvatar = Boolean(avatar_path)`, and every other field empty (`""`, `[]`, empty channels). If none, return `undefined` (unchanged).
- `savePersonaAction`: when `avatarPath` is empty and the profile has no avatar, fall back to own invite's `avatar_path` (it already starts with `${user.id}/`). Only then return `avatarRequired`. The RPC already returns `'approved'`, so `redirectTo` becomes `/profile` with no other change.
- Check that a non-`undefined` `initial` does not switch `CreatePersonaView` into resubmit/edit behaviour in create mode (e.g. "rejected" banners). If it does, gate on `mode`.

- [ ] **Step 1:** Implement both changes.
- [ ] **Step 2:** `npm run typecheck && npm test` → PASS. End-to-end proof is in Task 7.
- [ ] **Step 3: Commit** `feat(persona): prefill persona from member invite`

---

### Task 5: Invite tab UI

**Files:**

- Modify: `src/features/admin/components/admin-tabs.tsx` — add `{ href: "/admin/invite", key: "invite", icon: "person_add", requires: "members.review" }` after `users`.
- Modify: `src/components/ui/icon.tsx` — add `person_add` to `ICON_NAMES` (missing today).
- Modify: `src/features/admin/queries.ts` — add `getPendingInvites()`.
- Create: `src/app/[locale]/(app)/admin/invite/page.tsx`
- Create: `src/features/admin/components/invite-tab.tsx`
- Modify: `src/messages/en.json`, `src/messages/es.json` — `Admin.tabs.invite` ("Invite user" / "Invitar usuario"), `Admin.tabs.inviteShort`, `Admin.invite.*`.

**Interfaces:**

- `getPendingInvites(): Promise<PendingInvite[]>`, where `type PendingInvite = { userId: string; email: string; displayName: string; locale: "en" | "es"; createdAt: string; lastSentAt: string; openedAt: string | null }`. Rows with `accepted_at is null`, ordered by `created_at desc`, using the RLS client.
- Page: `notFound()` unless `getAdminCapabilities()` includes `members.review` (same pattern as `admin/users/page.tsx`). `generateMetadata` uses `Admin.invite.title`.
- `AdminInviteTab({ invites }: { invites: PendingInvite[] })`:
  - Form wired to `useActionState(inviteMemberAction, { ok:false })`: email, full name, language select (EN/ES), photo picker using `AvatarCropDialog` (its `onConfirm(file)` sets the `photo` file input via `DataTransfer`).
  - Resets the form on `ok`.
  - Maps each `InviteError` to an `InlineAlert` message. `sendFailed` copy: "The invitation email could not be sent. Email delivery may not be configured yet; contact the site owner."
  - List below. Status chip "Sent" when `openedAt` is null, else "Link opened, setup unfinished".
  - Resend form/button is disabled when opened, with hint "They can finish by using Forgot password on the login page."
  - Revoke goes through `ConfirmDialog`.
- Header uses `AdminPageHeader`. Copy every visual/spacing pattern from `team-view.tsx`.

- [ ] **Step 1:** Implement. `npm run typecheck && npm run lint && npm test` → PASS.
- [ ] **Step 2:** Manual (`npm run dev`, `npm run db:start`): sign in as `admin@globallinkup.test` and confirm the tab is visible. Send an invite and confirm it is listed, and that the email appears in Mailpit `http://127.0.0.1:54524`. Re-send the same email → "already invited" alert. Revoke → row gone.
- [ ] **Step 3: Commit** `feat(admin): add invite user tab`

---

### Task 6: Invite email template + link expiry

**Files:**

- Create: `supabase/templates/invite.html`
- Modify: `supabase/config.toml`

**Interfaces:**

- `config.toml`: uncomment `[auth.email.template.invite]` with `subject = "You're invited to GlobalLinkup · Invitación a GlobalLinkup"` and `content_path = "./supabase/templates/invite.html"`. Set `[auth.email] otp_expiry = 86400`.
- Template: one HTML email, English block then Spanish block. A single CTA link (repeated once per language) with href exactly `{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=invite`. Mention the 24 h expiry. Plain inline styles, no external assets.

- [ ] **Step 1:** Write both. `npm run db:stop && npm run db:start` (config reload).
- [ ] **Step 2:** Send an invite from the tab. In Mailpit, confirm the subject, both languages, and that the link starts with `http://localhost:3000/en/auth/confirm?token_hash=`. Clicking it lands on `/en/accept-invite` with the email shown.
- [ ] **Step 3: Commit** `feat(auth): add bilingual invite email template`

---

### Task 7: Playwright invite journey

**Files:**

- Create: `tests/e2e/invite.spec.ts`

**Interfaces:**

- Consumes the Mailpit polling pattern from `tests/e2e/password-recovery.spec.ts` (`MAILPIT_URL`, `AUTH_E2E` gate) and the `signIn`/`uploadAvatar`/persona-fill steps from `tests/e2e/auth.spec.ts`. Move shared helpers to `tests/e2e/helpers.ts` only if copying would exceed ~20 lines.

- [ ] **Step 1: Write the tests** (skipped unless `AUTH_E2E=1`):
  - `admin invites a member who finishes setup and lands approved`:
    1. Sign in as `admin@globallinkup.test` and go to `/en/admin/invite`.
    2. Fill `invitee+${Date.now()}@example.com`, name `Invited Person`, upload an avatar, pick EN, and submit.
    3. Expect the row with status "Sent".
    4. Poll Mailpit and extract `/auth\/confirm\?token_hash=[^\s"<]+/`.
    5. In the **same page** (still the admin session), `goto` the link and expect URL `/en/accept-invite` with the invitee's email visible.
    6. Set password `Invite123`, confirm it, tick terms, and submit. Expect `/en/create-persona` with the name field `Invited Person`.
    7. Fill the remaining required fields and submit. Expect URL `/en/profile`.
    8. Sign out, then sign in with the new password. Expect a post-auth URL that is not `/verify`.
  - `expired invite link shows the expired state`: `goto /en/auth/confirm?token_hash=bogus&type=invite` → expect `/en/accept-invite?error=expired` and the expired heading/text.
- [ ] **Step 2:** `npm run db:reset && AUTH_E2E=1 npm run e2e -- invite` → PASS.
- [ ] **Step 3:** `AUTH_E2E=1 npm run e2e` (full suite) → PASS.
- [ ] **Step 4: Commit** `test(admin): cover the member invite journey`

---

### Task 8: Docs

**Files:**

- Create: `docs/adr/0010-member-invites.md`
- Modify: `docs/adr/README.md` (index row), `docs/CONTEXT.md`, `docs/PRD.md`

**Content decisions:**

- ADR 0010 covers:
  - invited accounts exist in `auth.users` before the persona, an exception to "signup deferred to persona submit";
  - staging in `member_invites`;
  - auto-approval on persona submit;
  - the `members.review` gate;
  - Resend/Revoke rules;
  - `otp_expiry` raised to 24 h, which also affects recovery links;
  - the `token_hash` template;
  - why there is no copy link (owner chose Supabase email only).
- `CONTEXT.md`:
  - in Deviations, add one bullet on the invite exception, linking ADR 0010;
  - in "Known operational gaps → Outbound email", add that member invites also need custom SMTP, and that the cloud dashboard needs the `invite.html` template pasted and OTP expiry set to 86400.
- `PRD.md` admin section: add the Invite user requirement (spec points 1–9 condensed). Update line 78 ("No sub-admin…"), which is already stale per ADR 0002, only if it contradicts the new text.

- [ ] **Step 1:** Write. `npm run format:check` → PASS.
- [ ] **Step 2: Commit** `docs(docs): record member invite decision`
