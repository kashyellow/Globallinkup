# Delete Profile Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A member can delete their own account from the profile page, immediately and permanently.

**Architecture:** A Server Action removes the member's storage folders, deletes the auth user with the service role (database rows cascade), writes an id-only audit row and signs out. A "Danger zone" card on `ProfileView` opens the existing `ConfirmDialog`, extended with a slot for the typed `DELETE` confirmation.

**Tech Stack:** Next.js App Router (read `node_modules/next/dist/docs/` before touching routes), Supabase (Auth admin API, Storage), next-intl, Zod, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-13-delete-profile-design.md`

**Branch:** start from the merged `origin/main`: `git fetch && git checkout -b feat/delete-profile origin/main`. The untracked spec and this plan carry over; commit them with Task 1.

## Global Constraints

- npm only. Commands: `npm run typecheck`, `npm run lint`, `npm test`, `npm run e2e`.
- Conventional Commits, scopes from `auth, persona, admin, db, i18n, ui, docs`. Never `--no-verify`. **No `Co-Authored-By` trailer** (the owner is the sole committer).
- No hardcoded English in components: keys in `src/messages/en.json` and `src/messages/es.json`.
- React Compiler on: no hand-written `useMemo`/`useCallback`/`React.memo`.
- Server Actions must not call `getLocale()` or `requireApprovedUser`; use `getCurrentUser` / `getCurrentProfile`.
- The confirmation word is exactly `DELETE` (case-sensitive) in both locales.
- Audit rows carry ids only: no email, no name (ADR 0003).
- Suspended members and admins can never delete, enforced on the server.

## Review Focus

1. Wrong confirmation (`"delete"`, `" DELETE "`, `""`) must be refused with nothing deleted. Pinned in Task 2.
2. Suspended member calling the action directly must be refused with nothing deleted. Pinned in Task 2.
3. A second call after the account is gone (double click, second tab) must return a result, not throw. Pinned in Task 2.
4. A folder holding more than one page of files (list returns 100 at a time) must be removed completely. Pinned in Task 2.
5. `deleteUser` failing must leave the session signed in, write no audit row, and show an error in the dialog. Pinned in Tasks 2 and 3.

---

### Task 1: Typed-confirmation slot on `ConfirmDialog`

**Files:**

- Modify: `src/components/ui/confirm-dialog.tsx`
- Create: `src/components/ui/confirm-dialog.test.tsx`
- Add the spec and plan files to this commit.

**Interfaces:**

- Produces: two new optional props on `ConfirmDialog`: `children?: ReactNode`, rendered between the body paragraph and the buttons, and `confirmDisabled?: boolean` (default `false`), which disables the confirm button in addition to `pending`.

- [ ] **Step 1: Write failing tests** in `confirm-dialog.test.tsx` (see `audit-list.test.tsx` for the test setup): `renders children inside the dialog` (a labelled input is found); `disables the confirm button while confirmDisabled` (button `disabled`, `onConfirm` not called on click); `enables it when confirmDisabled is false` (click calls `onConfirm` once).
- [ ] **Step 2:** `npx vitest run src/components/ui/confirm-dialog.test.tsx` → Expected: FAIL (children not rendered / button not disabled).
- [ ] **Step 3:** Add the two props to `confirm-dialog.tsx`. Pass `confirmDisabled || pending` to the confirm button's `disabled`.
- [ ] **Step 4:** Same command → Expected: PASS. Run `npm test` → all pass.
- [ ] **Step 5: Commit** `feat(ui): let ConfirmDialog hold a typed confirmation` (include `docs/superpowers/`).

---

### Task 2: `deleteOwnAccountAction`

**Files:**

- Create: `src/features/profile/actions.ts`
- Create: `src/features/profile/actions.test.ts`

**Interfaces:**

- Consumes: `getCurrentUser`, `getCurrentProfile` (`@/lib/auth`), `createAdminClient` (`@/lib/supabase/admin`), `signOutAction` (`@/features/auth/actions`).
- Produces: `type DeleteAccountError = "forbidden" | "invalid" | "unknown"` and `deleteOwnAccountAction(input: unknown): Promise<{ ok: true; redirectTo: string } | { ok: false; error: DeleteAccountError }>`. `"use server"` file.

Behaviour, in this order:

1. Zod: `z.object({ confirm: z.literal("DELETE") })`; failure → `{ ok:false, error:"invalid" }`.
2. No user or no profile, `role === "admin"`, or `approval_status === "suspended"` → `{ ok:false, error:"forbidden" }` (no exceptions thrown).
3. For each bucket in `["avatars", "post-images"]`: loop `storage.from(bucket).list(userId, { limit: 100 })`, remove `${userId}/${name}` for the page, stop when a page is empty. Errors are logged (`console.error`, no ids beyond the bucket name) and do not stop the deletion.
4. `admin.auth.admin.deleteUser(userId)`; error → `{ ok:false, error:"unknown" }`, and steps 5–6 do not run.
5. Insert into `audit_events` with the service role: `{ action: "member.deleted", target_type: "profile", target_id: userId }` (actor and metadata default). A failure is logged and ignored.
6. `await signOutAction()`, then return `{ ok:true, redirectTo:"/" }`.

- [ ] **Step 1: Write failing tests** in `actions.test.ts`, mocking as in `src/features/admin/invite-actions.test.ts` (`server-only`, `@/lib/auth`, `@/lib/supabase/admin` with recording fakes for `storage`, `auth.admin.deleteUser`, `from("audit_events").insert`; mock `@/features/auth/actions`). Tests, each asserting what was and was not called:
  - `refuses a wrong confirmation` for `"delete"`, `" DELETE "`, `""`, and a missing field → `invalid`, `deleteUser` not called.
  - `refuses a suspended member` → `forbidden`, `deleteUser` and storage not called.
  - `refuses an admin` → `forbidden`.
  - `returns forbidden, not an exception, when the account is already gone` (`getCurrentUser` → `null`).
  - `removes every page of files` (fake `list` returns 100 names, then 20, then `[]`; `remove` receives all 120 paths, namespaced `<userId>/<name>`, across the two buckets' calls).
  - `deletes the user, writes an id-only audit row and signs out` → `{ ok:true, redirectTo:"/" }`; the audit insert payload equals `{ action:"member.deleted", target_type:"profile", target_id:<id> }`.
  - `keeps the session and writes no audit row when deleteUser fails` → `unknown`; `signOutAction` and the audit insert not called.
  - `still deletes when storage cleanup fails`.
- [ ] **Step 2:** `npx vitest run src/features/profile/actions.test.ts` → Expected: FAIL (module missing).
- [ ] **Step 3:** Implement `actions.ts` per the behaviour above.
- [ ] **Step 4:** Same command → Expected: PASS (all). Then `npm run typecheck && npm run lint`.
- [ ] **Step 5: Commit** `feat(profile): let members delete their own account`.

---

### Task 3: Danger zone card and dialog on the profile page

**Files:**

- Create: `src/features/profile/components/delete-profile-card.tsx`
- Modify: `src/features/profile/components/profile-view.tsx`
- Modify: `src/components/ui/icon-names.ts` (add `delete_forever` if the card uses it; `icon-names.test.ts` fails otherwise)
- Modify: `src/messages/en.json`, `src/messages/es.json` (`Profile.delete.*`)

**Interfaces:**

- Consumes: `deleteOwnAccountAction`, `DeleteAccountError` (Task 2); `ConfirmDialog` with `children` and `confirmDisabled` (Task 1); `usePendingAction` from `@/features/shared/use-pending-action`; `useRouter` from `@/lib/i18n/navigation`.
- Produces: `DeleteProfileCard()` (no props).

UI: a card with the warning text and a danger-styled "Delete profile" button. Clicking opens `ConfirmDialog` (`tone="danger"`) whose child is a labelled text input ("Type DELETE to confirm"). `confirmDisabled` is `typed !== "DELETE"`. On confirm, call the action through `usePendingAction().run`; on `ok` do `router.replace(result.redirectTo)`; on error keep the dialog open and show `Profile.delete.errors.<error>` in an `InlineAlert` inside the dialog. Closing the dialog clears the typed text and the error. Render the card in `ProfileView` below the two-column grid, only when `profile.role !== "admin"`.

Copy (EN; write natural ES): section title "Danger zone"; body "Delete your profile and everything tied to it: your persona, photo, posts, comments and connections. This cannot be undone."; button "Delete profile"; dialog title "Delete your profile forever?"; dialog body "You will be signed out and your account removed immediately. You can register again later."; input label "Type DELETE to confirm"; confirm "Delete forever"; working "Deleting…"; errors `forbidden` "This account cannot be deleted.", `invalid` "Type DELETE exactly to confirm.", `unknown` "Something went wrong. Please try again."

- [ ] **Step 1:** Write the component, wire it into `ProfileView`, add the copy and the icon.
- [ ] **Step 2:** `npm run typecheck && npm run lint && npm test` → Expected: all pass (this includes the icon-subset test and any message-parity test).
- [ ] **Step 3:** Manual check with `npm run dev` and `npm run db:start`: sign in as `sofia.martinez@example.com`, open `/en/profile`, confirm the card shows, the confirm button stays disabled until `DELETE` is typed exactly, and Cancel clears the field. Do not delete a seeded member. Check `/es/profile` shows Spanish copy.
- [ ] **Step 4: Commit** `feat(profile): add the delete profile button`.

---

### Task 4: End-to-end test and docs

**Files:**

- Create: `tests/e2e/delete-profile.spec.ts`
- Modify: `docs/PRD.md` (OQ-11 row and §7.6), `docs/CONTEXT.md`

**Interfaces:**

- Consumes: the registration and persona steps from `tests/e2e/auth.spec.ts` ("@auth onboarding creates a persona for a new account"), its admin approval steps ("an admin reviews a dossier and approves a pending persona"), and the `AUTH_E2E` gating, Supabase env loading and Auth-API cleanup helper pattern from `tests/e2e/invite.spec.ts`.

- [ ] **Step 1: Write the test** `a member deletes their profile and can no longer sign in` (gated on `AUTH_E2E`): register a fresh member with the persona form, approve them as the admin, sign in as the member, open `/en/profile`, click "Delete profile", assert the confirm button is disabled, type `delete` and assert it is still disabled, type `DELETE`, confirm, and expect to land on `/en`. Then `POST /auth/v1/token?grant_type=password` for the member's credentials and expect it to fail (not `ok`). In a `finally`, remove the user through the Auth admin API if it still exists, so the shared database keeps its seeded Discover count.
- [ ] **Step 2:** `npm run db:reset && AUTH_E2E=1 npx playwright test tests/e2e/delete-profile.spec.ts` → Expected: PASS. Then run the full suite on a fresh reset: `AUTH_E2E=1 npm run e2e` → Expected: all pass.
- [ ] **Step 3:** Docs: in `PRD.md` mark OQ-11's account-deletion part as done (self-service delete, with a link to the spec) and add one FR line under the profile requirements; in `CONTEXT.md` add one bullet in "Deviations" describing immediate, permanent self-deletion, the suspended and admin exclusions, and the `member.deleted` audit row.
- [ ] **Step 4:** `npm run format:check` (ignore `.superpowers/`) → Expected: no warnings in changed files.
- [ ] **Step 5: Commit** `test(profile): cover self-service account deletion` and `docs(docs): record self-service account deletion` as two commits.
