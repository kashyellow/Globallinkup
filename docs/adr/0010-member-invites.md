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
   `src/app/[locale]/auth/confirm/route.ts` calls `verifyOtp`, marks the invite
   opened and sends the invitee to `/accept-invite`. A bad or used token shows
   the expired-invitation state.
5. **Onboarding.** `/accept-invite` sets the password and checks the terms
   (`acceptInviteAction`), then `/create-persona` opens prefilled with the
   admin's name and photo, both editable.
6. **Approval.** `save_persona` approves a caller with an open invite on the
   first submit, sets `accepted_at`, and writes a `member.invite_accepted` audit
   row with the inviter as actor.
7. **Resend / revoke.** Resend re-calls `inviteUserByEmail` and is only possible
   before the link is opened (afterwards Supabase treats the email as confirmed;
   the invitee uses Forgot password). Revoke deletes the auth user and photo,
   and only before the persona is submitted. Both are audited by id only.
8. **Link lifetime.** `[auth.email] otp_expiry` is raised from 1 h to 24 h. This
   also lengthens password-recovery links.

## Consequences

- An invited person skips the review queue: the inviting admin vouches for them.
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
