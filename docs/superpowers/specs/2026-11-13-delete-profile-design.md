# Delete profile: design

Status: awaiting approval. Date: 2026-11-13.

## Intent

A member can delete their own account from the profile page, immediately and
permanently. This also closes PRD OQ-11 ("account deletion before launch").

## Goals

- A "Delete profile" button on `/profile`, behind a confirmation dialog where
  the member types `DELETE`.
- Deleting removes the login and everything tied to it, plus their uploaded
  files, then signs them out and sends them to the home page.

## Non-goals

- No grace period, restore, or data export (the owner chose immediate and
  permanent).
- No admin self-deletion; admins have no persona and are managed from the Team
  desk.
- No notification to other members; connections just disappear.

## Anti-goals

- A suspended member must never be able to delete their account, because their
  reports would be erased with it. Enforced on the server, not only by the UI.
- No personal data (email, name) in the audit log.

## Approaches

1. Delete immediately and permanently (**chosen by the owner**).
2. Hide for 30 days, then delete. Safer against mistakes, but needs a new
   status, a restore path and a cron step. Rejected: the typed confirmation
   already guards against misclicks.

## Design

- **Action:** `deleteOwnAccountAction({ confirm })` in
  `src/features/profile/actions.ts`, a Server Action.
  - Zod: `confirm` must equal `DELETE`.
  - Requires a signed-in member whose profile role is `user` and whose status
    is not `suspended`. Anything else returns `forbidden`.
  - Removes every object in the member's `<user-id>/` folder in the `avatars`
    and `post-images` buckets (all uploads use that folder via
    `buildStoragePath`). A storage failure is logged and does not stop the
    deletion, since the rows are what matter.
  - Deletes the auth user with the service-role client
    (`auth.admin.deleteUser`). Database rows cascade from it.
  - Writes one `member.deleted` row to `audit_events` through the service role:
    actor empty, `target_id` the old user id, no email or name.
  - Signs the session out and returns `{ ok: true, redirectTo: "/" }`.
- **UI:** a "Danger zone" card at the bottom of `ProfileView`
  (`src/features/profile/components/`), shown when `profile.role !== "admin"`.
  A new `DeleteProfileDialog` asks for the typed word, using the app's existing
  dialog helpers. Suspended members cannot reach the profile page (they see the
  suspended notice), so the UI needs no status check; the server check is the
  authority.
- **Copy:** all text in `en.json` and `es.json` under `Profile`.

## Tests

- Vitest for the action: wrong confirmation text, admin, suspended, signed out
  (all refused, nothing deleted); success deletes files, user and writes the
  audit row.
- Playwright: a member registers, deletes their profile, lands on the home
  page, and can no longer log in.

## Left to the builder

Dialog layout and wording, exact icon, and the audit row shape within the
existing table.

## Risks

- Reports filed against the member are removed with them (cascade). Accepted
  because suspended members are blocked from deleting.
- Irreversible; relies on the typed confirmation.
