# ADR 0001 — Post and comment lifecycle

- **Status:** accepted — implemented 2026-10-28 (data model, UI, purge, appeals, notifications); the audit trail is ADR 0003
- **Date:** 2026-10-27
- **Related:** [round 1, item 4](../feedback/2026-10-27-client-review.md),
  [ADR 0004](./0004-notifications.md), [ADR 0003](./0003-audit-log-and-pii.md)

## Context

Today `posts` has a single binary `moderation_status public.moderation_status`
(`'visible' | 'removed'`) plus `removed_by` / `removed_at`
(`supabase/migrations/20261016000000_initial_schema.sql`). There is no
`archived_at` and no `deleted_at` on posts.

Consequences of that shape:

- `deletePostAction` (`src/features/posts/actions.ts`) is the author's delete and
  only sets `moderation_status='removed'`.
- `protect_post_moderation()` (`20261016120000_s1_fixes.sql`) explicitly **forbids
  the author from moving a post back**, so an accidental delete is permanent for
  them and invisible to everyone including the author's own archive.
- There is no archive concept: a member who wants to stop showing a post but keep
  it has no option other than delete.
- `posts_feed` and `posts_select_visible` both key off `moderation_status`, so any
  new state must be threaded through the view and the policy together.

Comments are different: `post_comments.deleted_at` already exists, deletion is
admin-only (`src/features/posts/comment-actions.ts`), and the row is kept as a
tombstone so the thread stays readable. `post_comments.body` is
`text not null` with `check (char_length(btrim(body)) between 1 and 1000)`, so the
content cannot simply be blanked today.

Media is the largest gap. `post_images_select_approved`
(`20261019120000_s3_storage.sql`) is:

```sql
using (bucket_id = 'post-images' and public.is_approved())
```

Any approved member can download **any** object in the bucket if they know the
path — including images of removed posts. Hiding the picture in the UI is not a
control.

## Decision

### One state column per post

Replace `moderation_status` with `state public.post_state`
(`'visible' | 'archived' | 'removed'`). Author deletion is a hard delete, so a
`deleted` state is deliberately absent: a state that nobody can see is just a
slower delete.

| Transition                        | Actor                    | Effect                                                               |
| --------------------------------- | ------------------------ | -------------------------------------------------------------------- |
| `visible → archived`              | author                   | Hidden from feed, kept in the profile's **Archived** tab             |
| `archived → visible`              | author                   | Restore, no time limit                                               |
| `visible / archived → (row gone)` | author                   | **Hard delete** after a strong confirmation                          |
| `visible / archived → removed`    | admin (reason required)  | Hidden everywhere for members, shown in the author's **Removed** tab |
| `removed → visible / archived`    | admin, ≤ 14 days         | Undo, restores the previous state                                    |
| `removed → (row gone)`            | purge job, after 14 days | Row, comments, likes, images, and storage objects deleted            |

Columns added to `posts`:

- `archived_at timestamptz`, `archived_by uuid`
- `removed_reason text` (required when `state = 'removed'`)
- `previous_state public.post_state` (target of an admin restore)
- `purge_after timestamptz` (set to `now() + 14 days` on removal)

`removed_by` / `removed_at` stay. `moderation_status` is dropped after backfill.

### Deletion is explicit and irreversible

The author's delete opens a modal that says the post and its images are
permanently deleted and cannot be restored, and asks for confirmation. The Server
Action then:

1. deletes the objects from `post-images` (service role or the owner's session),
2. deletes the row (cascades images, comments, likes),
3. writes an audit event `post.deleted` with ids only.

If step 1 fails, the action aborts and reports an error; the purge job's orphan
sweep deletes objects whose `post_images` row no longer exists.

### Admin removal is soft, reasoned, and appealable

Removal requires a reason (Zod: 10–500 chars). The author receives a
notification, sees the reason and "permanently deleted in N days" in the Removed
tab, and may file **one** appeal inside the window. The admin answers once and
either restores the post or upholds the removal. This is a bounded moderation
exchange, deliberately not a chat thread (see ADR 0004).

New table `post_appeals`:

- `id`, `post_id`, `author_id`, `message text` (≤ 500), `created_at`
- `status appeal_status` (`'open' | 'accepted' | 'declined'`)
- `admin_id`, `admin_note text` (≤ 500), `resolved_at`
- Unique partial index: one `open` appeal per post.

### Comment purge keeps the tombstone

`post_comments` gains `purged_at timestamptz`; `body` becomes nullable and the
length check becomes `body is null or char_length(btrim(body)) between 1 and
1000`. After 14 days the job sets `body = null, purged_at = now()`.

The row is **never** deleted while its post exists: `parent_id` is
`on delete cascade`, so deleting a parent would silently delete every reply.
The UI already renders a deleted comment as a placeholder, so nothing changes
visually.

### Media follows the post state

Replace the storage policy so reads require the owning post to be visible, or the
caller to be the author:

```sql
using (
  bucket_id = 'post-images'
  and exists (
    select 1
    from public.post_images pi
    join public.posts p on p.id = pi.post_id
    where pi.storage_path = storage.objects.name
      and (p.state = 'visible' or p.author_id = (select auth.uid()))
  )
)
```

Add `create index post_images_storage_path_idx on public.post_images (storage_path)`.
Archived and removed posts stay private to their author; an admin restoring a
post does not need to read its files, only the row.

### Purge runs daily

A single Vercel Cron (`0 3 * * *`) hits `/api/cron/purge` with a
`CRON_SECRET` header. One run:

1. deletes `removed` posts past `purge_after` (objects, then rows),
2. blanks comment bodies past 14 days,
3. sweeps orphaned storage objects,
4. purges notifications and audit rows past their retention,
5. writes one audit event per purge batch (`system.purge`).

Vercel Hobby allows 100 cron jobs per project but only **once per day** with
per-hour scheduling precision, which is fine for a 14-day window.

The hour is a server concern, not a user-facing one: a removed post is invisible
the moment the admin removes it, and the timer only decides when the bytes are
deleted. `03:00 UTC` is chosen for low global load; no per-user timezone logic
exists.

There is **no** in-app "purge now" button — permanent deletion should not be one
click away. Demos and tests use the same code path from the CLI:
`npm run purge -- --dry-run` and `npm run purge -- --now` (service role, local and
staging only).

## Consequences

- The author loses "undo" for deletion. That is the point: the archive exists for
  "hide, keep" and delete means delete. The confirmation must be impossible to
  trigger accidentally (destructive button, no autofocus).
- Four states exist in the UI (Active, Archived, Removed, plus the moderation
  desk), so `posts_feed`, `posts_select_visible`, and the profile archive query
  all need the new column at once.
- Signed URLs already minted keep working for up to one hour
  (`SIGNED_URL_TTL_SECONDS = 3600`). Accepted residual risk; do not raise the TTL.
- Purge touches Storage, so it cannot be a pure `pg_cron` job.
- Hard delete removes content that an audit row still references by id. Audit
  keeps ids, never content, so the record stays meaningful (what happened, to
  which id, when) without resurrecting the content.

## Alternatives considered

- **Soft delete hidden from everyone for N days** (the first draft): rejected
  because it behaves like a slower archive and keeps PII longer for no user
  benefit.
- **Archive as a boolean** instead of a state: rejected because `archived` and
  `removed` have different actors, reasons, and purge rules; two booleans would
  allow contradictory combinations.
- **Hard delete for admin removal**: rejected — the client wants the poster told
  why, with a chance to appeal.
- **`pg_cron` only**: rejected because it cannot delete Storage objects.
- **30-day retention**: rejected; the client chose 14.

## Follow-ups

- Migration: `post_state` enum, columns, backfill, drop `moderation_status`,
  update `posts_feed`, `posts_select_visible`, `protect_post_moderation`.
- Migration: `post_appeals`, `post_images(storage_path)` index, storage policy,
  `post_comments.body` nullable + `purged_at`.
- Server actions: `archivePostAction`, `deletePostAction` (hard), admin
  `removePostAction` / `restorePostAction`, `submitAppealAction`,
  `resolveAppealAction`.
- pgTAP: author cannot see removed posts; author cannot restore an admin removal;
  member cannot read images of a non-visible post; purge job is idempotent.
- UI: profile tabs, confirmation modal, removed card with reason and countdown,
  appeal form, admin appeals desk.
