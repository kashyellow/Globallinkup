# ADR 0010 — Admins invite members by email

- **Status:** accepted
- **Date:** 2026-11-12
- **Related:** [ADR 0002](./0002-granular-admin-rbac.md) (capabilities),
  [ADR 0003](./0003-audit-log-and-pii.md) (audit metadata)

## Context

Members join through `/register`: step 1 keeps the email and password in an
in-memory draft, and the Supabase Auth user is created only when the persona is
submitted (see `docs/CONTEXT.md`, "Signup is deferred to persona submit"). Every
new persona lands `pending` and waits for a members-desk admin.

The project owner wants admins to bring people in directly: the admin types the
person's email, full name and (optionally) a photo, the person gets an email,
picks their own password and completes the rest of the persona.

## Decision

1. **Tab.** `/admin/invite` ("Invite user"), gated on `members.review`: the
   owner and any sub-admin with the members desk.
2. **Send.** `inviteMemberAction` (`src/features/admin/invite-actions.ts`) calls
   `auth.admin.inviteUserByEmail` with `redirectTo = <origin>/<locale>/auth/confirm`.
   This is an **exception to deferred signup**: the `auth.users` row exists from
   the moment the invite is sent. Supabase sends the email; there is no
   copy-link fallback (owner's choice).
3. **Staging.** `public.member_invites` (migration `20261112120000`) holds the
   name, optional photo path (`avatars/<user_id>/…`), email language, inviter and
   the sent / opened / accepted timestamps. No `profiles` row is written before
   the persona, so unfinished invitees never appear in the Users tab. RLS: a
   members-desk admin reads every row, an invitee reads their own; writes use the
   service role only.
4. **Link.** `supabase/templates/invite.html` (bilingual EN + ES) links to
   `{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=invite`. The route
   `src/app/[locale]/auth/confirm/route.ts` only forwards a GET to a "Continue"
   page (mail scanners prefetch links and would burn the one-time token); the
   page POSTs back, the route calls `verifyOtp`, marks the invite opened, stores
   the new session's `session_id` as `verified_session_id`, and sends the
   invitee to `/accept-invite`. A bad or used token shows the expired state.
5. **Onboarding.** `/accept-invite` sets the password and checks the terms
   (`acceptInviteAction` stamps `terms_accepted_at`), then `/create-persona`
   opens prefilled with the admin's name and photo, both editable.
   `/create-persona` sends an invitee without `terms_accepted_at` back to
   `/accept-invite`.
6. **Approval.** `save_persona` approves on the first submit only when the
   caller's JWT `session_id` equals `verified_session_id` and the terms were
   accepted; it then writes a `member.invite_accepted` audit row with the
   inviter as actor. Any first persona closes the open invite (`accepted_at`).
   Reason: with email confirmations off, Supabase `/signup` with a pending
   invitee's address signs the caller in as that unconfirmed user, so "has an
   open invite" alone proves nothing. Only the link session proves the mailbox.
7. **Resend / revoke.** Resend re-calls `inviteUserByEmail` and is only possible
   before the link is opened (afterwards Supabase treats the email as confirmed;
   the invitee uses Forgot password). Revoke deletes the auth user and photo,
   and only before the persona is submitted. Both are audited by id only.
8. **Link lifetime.** `[auth.email] otp_expiry` is raised from 1 h to 24 h. This
   also lengthens password-recovery links.

## Consequences

- An invited person skips the review queue: the inviting admin vouches for them.
- Auto-approval is tied to the session that opened the link. An invitee who
  abandons after the password step and later logs in with the password (or
  uses Forgot password) finishes normally but lands in the review queue.
- A stranger who uses `/signup` with a pending invitee's email gets a session
  for that unconfirmed user; they cannot be auto-approved, and their persona
  goes to review where the admin sees it.
- Unfinished invitees are real auth users with no profile. They can only be seen
  and removed from the Invite tab.
- Invites depend on outbound email. Until custom SMTP is configured the cloud
  project delivers only to Supabase-organisation addresses, 2 per hour.
- The cloud project must get the same invite template and OTP expiry by hand
  (Auth → Email Templates → Invite user; Auth → Providers → Email).

## Alternatives considered

- **Profile row at invite time** with `pending` status: would surface empty
  personas in the Users tab and needed query changes. Rejected for the staging
  table.
- **`generateLink` plus our own email (Resend API) and a copy-link button:**
  works without Supabase SMTP, but the owner chose Supabase email only.
- **Inviting into the review queue:** rejected; the invite is the review.

## Follow-ups

- Configure custom SMTP before launch (see `docs/CONTEXT.md`, known gaps).
- Paste `supabase/templates/invite.html` into the cloud dashboard and set the
  email OTP expiry to 86400 seconds.
