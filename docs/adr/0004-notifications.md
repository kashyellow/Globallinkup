# ADR 0004 — In-app notifications

- **Status:** proposed
- **Date:** 2026-10-27
- **Related:** [round 1, item 4](../feedback/2026-10-27-client-review.md),
  [ADR 0001 (lifecycle)](./0001-content-lifecycle.md)

## Context

When an admin removes a post, the author currently has no way to learn that it
happened or why. The client asked for the poster to be told, and for the removal
to allow a bounded exchange with the admin.

The project has a hard rule that there is **no chat**: no inbox for conversations,
no realtime delivery, no user-to-user messaging (`docs/CONTEXT.md`, PRD). A
moderation notice is not chat, but the design has to stay on the right side of
that line.

There is also no push infrastructure: no service worker, no FCM project, no
device tokens.

## Decision

Notifications are **rows in Postgres**, rendered in the app, with a deep link to
the thing they are about.

### Schema

```sql
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  type notification_type not null,
  target_type text,             -- 'post' | 'comment' | 'profile' | 'interest' | 'connection'
  target_id uuid,
  reason text,                  -- moderation reason, shown in the list
  read_at timestamptz,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '90 days'
);
```

- RLS: `select`/`update` (read marker) only for `recipient_id = auth.uid()`.
  No insert/delete for clients; rows are created by Server Actions/RPCs.
- Index on `(recipient_id, created_at desc)` and a partial index for unread.
- Retention: 90 days, purged by the daily cron.

### Types

| Type                                                          | Created when                           | Deep link                                                                           |
| ------------------------------------------------------------- | -------------------------------------- | ----------------------------------------------------------------------------------- |
| `post.removed`                                                | Admin removes a post (reason included) | `/posts/<id>` (author's own view of the removed post, showing reason + appeal form) |
| `post.restored`                                               | Admin restores a post                  | `/posts/<id>`                                                                       |
| `appeal.declined`                                             | Admin declines an appeal               | `/posts/<id>`                                                                       |
| `comment.removed`                                             | Admin removes a comment                | `/posts/<post_id>`                                                                  |
| `persona.approved` / `persona.rejected` / `persona.suspended` | Member decision                        | `/profile` / `/verify`                                                              |
| `interest.approved` / `interest.rejected`                     | Custom interest decision               | `/profile/edit`                                                                     |

Connection events are **not** included in this round; they are an open question
for the client.

### Interaction model

- The bell shows unread count; `/notifications` lists them; clicking marks read
  and navigates to the deep link.
- **Appeals are bounded, not a thread.** A removed post's page (author only) shows
  the reason, the purge countdown, and one message box. The author submits one
  appeal; the admin replies once and either restores or upholds. After that the
  notice is final. Both directions produce a notification.
- No realtime. The bell refreshes on navigation; optional lightweight polling
  (60 s) is enough for a moderation notice and can be dropped without any data
  change.
- No email in this round: sending mail needs a real SMTP provider, which is still
  an open question (see ADR 0002). The schema has room to add `emailed_at` later.

### Presentation rules (PII)

- `reason` is written by an admin about the recipient's own content; it must not
  quote other members' data. The admin UI says so in the reason field helper text.
- No content bodies, no contact channels, no images in notification rows.

## Consequences

- The author learns _why_ content disappeared, which is the client's actual ask,
  without opening a chat product.
- A user who never opens the app will not see the notice (no push, no email). That
  is accepted for now and is the main reason email could be added later.
- The appeal flow gives admins a second decision point; the audit trail (ADR 0003)
  records both the removal and the appeal outcome.
- Two new UI surfaces: the bell/list and the removed-post view with the appeal
  form.

## Alternatives considered

- **FCM / web push**: rejected — needs a service worker, permission prompts, and a
  device-token store for a handful of moderation notices; it can be layered on
  later without changing the data model.
- **Email only**: rejected for now — no SMTP configured, and the notice should be
  visible where the content lived.
- **Realtime (Supabase channels)**: rejected — out of scope and unnecessary for
  notices that can wait for the next navigation.
- **A conversation thread with the admin**: rejected — that is chat, which the
  product forbids. One appeal, one answer.

## Follow-ups

- Migration: `notification_type` enum, `notifications` table, RLS, indexes.
- Helper `notify(recipient, type, target, reason)` used by actions/RPCs.
- UI: bell in the navbar, `/notifications`, unread badge, i18n EN/ES.
- Wire: `post.removed`, `post.restored`, `appeal.declined`, `comment.removed`,
  persona and interest decisions.
- Purge step for `expires_at < now()` in the daily cron.
