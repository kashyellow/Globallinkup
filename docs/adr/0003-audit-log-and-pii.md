# ADR 0003 — Audit log and PII-safe logging

- **Status:** accepted (partial) — table, `record_audit()`, retention and admin-action wiring landed 2026-10-28; the audit viewer (`/admin/audit`, `audit.read`) and the structured logger with `redact()` landed 2026-10-28
- **Date:** 2026-10-27
- **Related:** [round 1, closing note](../feedback/2026-10-27-client-review.md),
  [ADR 0002](./0002-granular-admin-rbac.md), [ADR 0005](./0005-pii-access-boundaries.md)

## Context

Today the only durable record of an admin decision is
`profile_moderation_events` (persona approve/reject/suspend with a reason).
Everything else — post removal, comment removal, product lifecycle changes,
interest approvals, settings edits — leaves no trace beyond the row it mutated.
Application logs are whatever `console.*` happens to print.

This is a social product: rows contain names, cities, bios, contact channels, and
photos. An audit trail that copies payloads would become a second, longer-lived
copy of that PII. The requirement is therefore two-sided: record **what admins
did**, and record **as little personal data as possible**.

## Decision

### `audit_events` is append-only and id-only

```sql
create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  occurred_at timestamptz not null default now(),
  actor_id uuid references public.profiles (id) on delete set null,
  actor_role text,              -- slug snapshot, survives role edits
  action text not null,         -- validated against the catalogue below
  target_type text,             -- 'profile' | 'post' | 'comment' | 'product' | ...
  target_id uuid,
  reason text,                  -- moderation reason, when the action needs one
  metadata jsonb not null default '{}'::jsonb,
  request_id text
);
```

Rules:

- **No personal data columns.** No email, display name, city, bio, contact
  channel, date of birth, caption, comment body, image path, IP, or user agent.
- `metadata` is whitelisted per action (see the catalogue). Anything not listed is
  dropped by `record_audit()`.
- `actor_id` is `on delete set null`, so deleting an account does not erase the
  history of what was done.
- Writes only through `public.record_audit(...)` (`security definer`, validates
  `action` and the metadata keys). `revoke insert, update, delete on
public.audit_events from anon, authenticated;` — no client can forge or edit an
  entry.
- Reads gated by `audit.read` (ADR 0002). No policy for update/delete exists at
  all; retention deletes run as the service role.

### Action catalogue

| Action                                                                                                                                          | target   | metadata whitelist                 |
| ----------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ---------------------------------- |
| `admin.created`                                                                                                                                 | profile  | `role_slug`                        |
| `admin.role_changed`                                                                                                                            | profile  | `from_slug`, `to_slug`             |
| `admin.deactivated`                                                                                                                             | profile  | `role_slug`                        |
| `member.approved` / `member.rejected` / `member.suspended`                                                                                      | profile  | `reason`                           |
| `post.archived` / `post.unarchived`                                                                                                             | post     | —                                  |
| `post.removed` / `post.restored`                                                                                                                | post     | `reason`, `from_state`, `to_state` |
| `post.deleted` (author hard delete)                                                                                                             | post     | —                                  |
| `post.purged`                                                                                                                                   | post     | `age_days`                         |
| `appeal.opened` / `appeal.accepted` / `appeal.declined`                                                                                         | post     | —                                  |
| `comment.removed` / `comment.restored` / `comment.purged`                                                                                       | comment  | `reason`                           |
| `interest.approved` / `interest.rejected`                                                                                                       | interest | —                                  |
| `product.created` / `product.updated` / `product.published` / `product.unpublished` / `product.trashed` / `product.restored` / `product.purged` | product  | `from_state`, `to_state`           |
| `report.resolved`                                                                                                                               | report   | `outcome`                          |
| `settings.updated`                                                                                                                              | —        | `keys` (names only, never values)  |
| `role.created` / `role.updated` / `role.deleted`                                                                                                | role     | `capabilities`                     |
| `auth.denied`                                                                                                                                   | —        | `capability`, `route`              |
| `system.purge`                                                                                                                                  | —        | `rows`, `objects`                  |

`auth.denied` is deliberate: knowing that someone repeatedly tried a desk they
cannot access is security signal, and it stores no content.

**Implementation note (2026-10-29).** Emitted rows use
`metadata: { before, after }` snapshots. Each snapshot is a flat object of ids,
states, timestamps, prices and capability names — never names, emails, captions,
comment bodies or contact channels. The audit viewer aligns both snapshots on the
same keys, highlights the values that differ, and still shows the full event
envelope as JSON. Legacy rows that stored `from_state`/`to_state` are normalised
by the viewer.

### Retention

12 months. The daily purge job deletes older rows in batches and writes one
`system.purge` event summarising the run.

### Application logging

- One helper (`src/lib/log.ts`) with `logInfo` / `logWarn` / `logError`, emitting
  structured JSON: `requestId`, `actorId`, `action`, `outcome` (`ok | denied |
failed`), `durationMs`, `errorCode`.
- A `redact()` guard removes banned keys before serialising:
  `email`, `password`, `token`, `authorization`, `apikey`, `phone`, `whatsapp`,
  `telegram`, `instagram`, `facebook`, `tiktok`, `date_of_birth`, `body`,
  `caption`.
- Never log request bodies or Supabase error `details` verbatim; log `code` and a
  short message.
- A unit test feeds a payload containing every banned key through the logger and
  fails if any value survives.

## Consequences

- Investigating "who removed this post and why" becomes a query instead of a
  search through Vercel logs.
- The audit table grows slowly (ids and short strings), so 12 months is cheap.
- Admin actions now have two writes (the mutation and the audit row). Where a
  mutation can succeed and the audit write fail, the action fails closed: audit
  first when the action is reversible, or wrap both in one RPC when it is not.
- The `auth.denied` event can be noisy if a desk is opened by URL often; cap it to
  one row per actor+capability+hour.
- Structured logs change the shape of what appears in Vercel; existing ad-hoc
  `console.log` calls should be migrated as they are touched.

## Alternatives considered

- **Supabase's own logs**: rejected — they know HTTP status codes, not "admin X
  removed post Y because Z", and retention is short.
- **Snapshot the full row into the audit entry**: rejected — that duplicates PII
  into a second store with a longer retention.
- **Store reasons only in `profile_moderation_events`**: rejected — post/comment
  and marketplace actions need the same trail.
- **Hash chain / tamper-evident log**: deferred; the append-only grants already
  stop application-level forgery, and the threat model does not yet include a
  compromised service key.

## Follow-ups

- Migration: `audit_events`, `record_audit()`, grants, `audit.read` policy.
- Wire every admin Server Action and RPC to `record_audit()`.
- Audit viewer page (filter by action/actor/date), gated by `audit.read`.
- `src/lib/log.ts` + unit test for `redact()`.
- Extend the daily cron with the audit/notification retention step.
