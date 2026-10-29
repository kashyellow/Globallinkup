# Client review — round 1 (2026-10-27)

- **Status:** accepted, planned
- **Created:** 2026-10-27
- **Scope:** Discover countries, marketplace explainer, post/comment deletion and
  moderation, theme modes, granular admin roles, audit trail, PII boundaries.
- **Source of truth:** `docs/PROJECT.md` → `docs/PRD.md` → `docs/CONTEXT.md`.
  This file records the decisions that follow the first client review of the
  light-palette build.

> This round adds features that were explicitly **out of scope** until now:
> granular admin roles (sub-admins) and an in-app notifications inbox. Both are
> confirmed by the client below and are recorded as deviations in
> `docs/CONTEXT.md`. Notifications are moderation notices, **not chat**: no
> threads, no realtime, no user-to-user messaging.

---

## 1. What the client asked, and what the code actually does

| #   | Client question (essence)                                                          | Reality before this round                                                                                                                                                                                                                 | Decision                                                                                                                                                                                                                                                                                                                  |
| --- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | "personal was missing the _l_"                                                     | The product term is **Persona** (`docs/PRD.md` glossary); the UI has no "Personal" label for it                                                                                                                                           | Keep **Persona**. No copy change                                                                                                                                                                                                                                                                                          |
| 2   | "will different countries automatically show once we have users from the country?" | No. `PLATFORM_COUNTRIES` is a hardcoded 9-country list (`src/lib/persona/countries.ts`) used by the persona form, the discover filter, and Zod. Countries outside it cannot register                                                      | Open the platform to **all ISO-3166 countries**; derive the discover filter from countries that actually have approved members → [ADR 0007](../adr/0007-global-countries.md)                                                                                                                                              |
| 3   | "marketplace doesn't show how to add merchandise"                                  | Creation is admin-only in the admin portal (by design). The public page already has a "How GlobalLinkup Curated Commerce Works" block plus an "Artisan Partner Inquiries" CTA, but it never says listings are curated                     | Keep creation in the admin portal only. Rewrite the explainer so it states the model explicitly and points at the partner-inquiry CTA                                                                                                                                                                                     |
| 4   | "is that delete button for everyone?"                                              | In the feed and post detail the button is **admin-only** (`canDelete={viewer.isAdmin}`). Authors delete from `/profile` → activity archive, which currently just sets `moderation_status='removed'` and can never be undone by the author | New lifecycle: `archived` (author, permanent, revertible) → author delete is a **hard delete** after a strong confirmation; admin removal is a **soft, 14-day** state with a required reason, an appeal path, and a notification → [ADR 0001](../adr/0001-content-lifecycle.md), [ADR 0004](../adr/0004-notifications.md) |
| 5   | "the black background looked better; can we switch?"                               | There is one light theme (cream `#f7f1e6`) and no toggle. The warm-charcoal palette lives in `baefd24^`                                                                                                                                   | Add `light / dark / system`, dark colours taken **only** from `baefd24^`; default `system` → [ADR 0006](../adr/0006-theme-modes.md)                                                                                                                                                                                       |
| 6   | "I wanted a sub-admin limited to marketplace + user approval"                      | Roles are `user` / `admin` only; `is_admin()` appears in 23 policies                                                                                                                                                                      | Granular RBAC: roles are capability sets, managed by the first admin from the UI → [ADR 0002](../adr/0002-granular-admin-rbac.md)                                                                                                                                                                                         |

Two additional requirements came with the answers:

- **Audit + logging** for everything admins do, with PII protection → [ADR 0003](../adr/0003-audit-log-and-pii.md).
- **Contact details are PII** and must not be readable by admins at all → [ADR 0005](../adr/0005-pii-access-boundaries.md).

---

## 2. Content lifecycle (posts)

```
visible ──archive──► archived ──restore──► visible
   │
   ├──delete (author)──► gone (hard delete, permanent)
   │
   └──remove (admin, reason)──► removed ──restore ≤14d──► visible
                                   │
                                   └──14 days──► purged (row + storage)
```

| State      | Set by                  | Feed | Profile tab                  | Reversible            | Auto-purge |
| ---------- | ----------------------- | ---- | ---------------------------- | --------------------- | ---------- |
| `visible`  | —                       | yes  | Active                       | —                     | —          |
| `archived` | author                  | no   | Archived                     | yes, anytime          | no         |
| `removed`  | admin (reason required) | no   | Removed + reason + countdown | admin only, ≤ 14 days | 14 days    |
| _(gone)_   | author hard delete      | no   | —                            | no                    | immediate  |

Rules:

- **Author delete is immediate and irreversible.** The confirmation modal states
  that the post and its images are permanently deleted. Storage objects are
  deleted before the row; a failure is logged and retried by the purge job's
  orphan sweep.
- **Admin removal is soft for 14 days.** It requires a reason, records
  `removed_by`/`removed_at`, notifies the author, and shows the reason and a
  countdown in the author's _Removed_ tab.
- **Appeals are bounded, not chat.** One appeal per removal: the author may send
  one message (≤ 500 chars) inside the 14-day window; the admin answers once and
  either restores the post or upholds the removal with a final note. Both steps
  are audited and notified.
- **Comments**: deletion stays admin-only. A deleted comment keeps its row as a
  tombstone (thread integrity: `parent_id` is `on delete cascade`), its body is
  purged after 14 days (`body = null`, `purged_at`), and the row disappears only
  when its post is purged.
- **Media access** is part of the lifecycle: today any approved member can read
  any object in the `post-images` bucket, so the storage policy must be gated on
  the post state. Signed URLs already minted stay valid for their TTL (1 hour);
  that residual window is accepted and documented.

---

## 3. Granular admin roles

Roles are capability sets, not a second enum:

| Capability           | Marketplace desk | Users desk | Moderation | Interests | Reports | Settings | Admins | Audit |
| -------------------- | ---------------- | ---------- | ---------- | --------- | ------- | -------- | ------ | ----- |
| `members.review`     |                  | ✅         |            |           |         |          |        |       |
| `posts.moderate`     |                  |            | ✅         |           |         |          |        |       |
| `comments.moderate`  |                  |            | ✅         |           |         |          |        |       |
| `interests.review`   |                  |            |            | ✅        |         |          |        |       |
| `reports.manage`     |                  |            |            |           | ✅      |          |        |       |
| `marketplace.manage` | ✅               |            |            |           |         |          |        |       |
| `admins.manage`      |                  |            |            |           |         |          | ✅     |       |
| `settings.manage`    |                  |            |            |           |         | ✅       |        |       |
| `audit.read`         |                  |            |            |           |         |          |        | ✅    |

- The first admin (`owner`) is created by `npm run admin:bootstrap`. From then on
  the owner manages accounts and roles in the UI.
- A role can be edited; the `owner` role is protected and cannot be emptied.
- The last owner cannot be demoted or deactivated.
- Each admin account has its own email and password.
- Sub-admins never see member contact details (see ADR 0005).

---

## 4. Audit, notifications, PII

- `audit_events` is append-only and stores **ids, actions, reasons, and
  whitelisted metadata only** — never emails, names, contact channels, birthdays,
  captions, comment bodies, image paths, IPs, or user agents.
- Notifications are DB-backed in-app messages with a deep link to the target;
  no FCM, no realtime, no chat.
- Contact details (`contact_details`) stay PII: readable by the owner and by a
  member whose connection request the owner **accepted**. The admin read policy
  is dropped and the admin dossier stops showing contact channels.
- Date of birth (`profile_private`) follows the same rule; admins only ever see
  the derived age.

---

## 5. Phases

| Phase | Content                                                                                                 | ADRs             |
| ----- | ------------------------------------------------------------------------------------------------------- | ---------------- |
| 1     | Global countries + data-driven discover filter; theme modes; marketplace explainer                      | 0006, 0007       |
| 2     | Content lifecycle, storage RLS fix, purge cron, notifications inbox, appeals, contact-details hardening | 0001, 0004, 0005 |
| 3     | Granular RBAC, admin account management, capability-aware RLS and UI                                    | 0002             |
| 4     | Audit log, audit UI, structured logging redaction, retention                                            | 0003             |

Estimated effort, single developer: phase 1 ≈ 2–3 days, phase 2 ≈ 8–11 days,
phase 3 ≈ 7–10 days, phase 4 ≈ 4–6 days.

### Acceptance criteria

**Phase 1**

- [x] A member can register with any ISO-3166 country.
- [x] The discover region filter only offers countries that have approved members.
- [x] Theme follows `system` by default; the switch persists across reloads with
      no flash of the wrong palette (`tests/e2e/theme.spec.ts`).
- [ ] Both palettes pass a contrast check (manual pass still pending).
- [x] The marketplace explainer states that listings are curated and links to the
      partner-inquiry CTA.

**Phase 2**

- [x] Author can archive and restore; archived posts are absent from the feed.
- [ ] Author hard delete removes the row and its storage objects; the audit entry
      keeps only ids.
- [x] Admin removal requires a reason; the author sees the reason, a 14-day
      countdown, and can file one appeal.
- [ ] Admin can restore during the window; after 14 days the post is purged.
- [x] Deleted comment bodies are purged at 14 days and threads stay readable.
- [ ] Any approved member requesting a soft-deleted post image gets nothing
      (storage RLS), while the author still can.
- [x] Notifications deep-link to their target and are readable only by the
      recipient.
- [x] An admin can no longer read `contact_details` or `profile_private`
      (pgTAP proves it).

**Phase 3**

- [x] Owner can create an admin/sub-admin, assign a role, and edit capabilities.
- [x] Creating an account returns a one-time invite link; opening it lands on
      `/accept-invite`, where the person sets their own password and gets the
      assigned role without the persona funnel.
- [x] The invite link is never written to logs or the audit table.
- [ ] A sub-admin with `marketplace.manage` reaches the marketplace desk and gets
      403 on every other desk, by URL and by RLS.
- [ ] The last owner cannot be demoted or deactivated.
- [ ] Every role/account change is audited.

**Phase 4**

- [x] The audited admin actions write one row each; denied attempts are not
      recorded yet.
- [ ] A test fails if a banned PII key appears in an audit payload or log line.
- [ ] Audit rows older than 12 months are purged on the same schedule as content.
- [ ] Only `audit.read` can read the audit view.

---

## 6. Decisions on the open questions

All four are closed as of 2026-10-27.

| #   | Question                                                                                           | Decision                                                                                                                                                                                                                                                                           |
| --- | -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Admin accounts: email invite (requires SMTP/Resend now) or generated password shown once?          | **Invite link generated server-side** — `auth.admin.generateLink({ type: "invite" })` — and shared by the owner out-of-band; `/accept-invite` sets the password. No SMTP or new dependency. `inviteUserByEmail` becomes the flow once a custom SMTP with a verified domain exists. |
| 2   | Notifications: are the 7 moderation/decision types enough, or should connection events notify too? | The **seven types are final** for this round; connection events are not included.                                                                                                                                                                                                  |
| 3   | Date of birth: confirm admins lose access to the raw value (only age is shown)?                    | **Yes.** Drop `profile_private_select_admin`; admins only ever see `profile_age()`.                                                                                                                                                                                                |
| 4   | Purge schedule: `03:00 UTC` daily, and does an admin need a "purge now" button for demos?          | **Daily at 03:00 UTC**, with no in-app button (permanent deletion should not be one click away). Demos and tests use `npm run purge -- --dry-run` / `--now`.                                                                                                                       |

The invite link is a credential: single use, short-lived, never logged, never
audited, and shown only once.

### Operational gap: outbound email

Not part of the six items, but it blocks launch: the cloud project still uses
Supabase's default SMTP, which **only delivers to addresses in the Supabase
organisation** and caps at **2 messages per hour**. `forgot-password` therefore
does not reach real members today. Configuring Resend (or another provider) with a
verified sending domain is a required production task. It is dashboard
configuration, not a package — and the admin invite flow above deliberately does
not depend on it.

---

## 7. Related documents

- [ADR 0001 — Content lifecycle](../adr/0001-content-lifecycle.md)
- [ADR 0002 — Granular admin RBAC](../adr/0002-granular-admin-rbac.md)
- [ADR 0003 — Audit log and PII](../adr/0003-audit-log-and-pii.md)
- [ADR 0004 — Notifications](../adr/0004-notifications.md)
- [ADR 0005 — PII access boundaries](../adr/0005-pii-access-boundaries.md)
- [ADR 0006 — Theme modes](../adr/0006-theme-modes.md)
- [ADR 0007 — Global countries](../adr/0007-global-countries.md)
