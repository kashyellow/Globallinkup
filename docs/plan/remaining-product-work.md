# GlobalLinkup — Remaining Product Work

- **Status:** planned
- **Created:** 2026-10-25
- **Scope:** Posts, Marketplace, Connections, Admin, Profile, Discover, and the
  remaining password-recovery / post-onboarding QA.
- **Source of truth:** `docs/PROJECT.md` → `docs/PRD.md` → `docs/CONTEXT.md`.
  This plan records implementation decisions for the work that comes after the
  existing auth, persona, and discover slices.

> This plan adds two features that were not in the original MVP wording:
> threaded comments on posts and an admin moderation-reason audit trail. Comments
> are **not chat/DMs**: no inbox, no realtime, no notifications, no user-to-user
> messaging. Record both as deviations in `docs/CONTEXT.md` when implemented.

---

## 1. Current state

| Area           | What exists                                                                     | What is missing / wrong                                                                                                                                                      |
| -------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Posts          | DB-backed feed, likes, soft delete, single image, comment translation keys      | Composer always takes space; filters/pagination client-side; share points to `/posts`; one image; no detail route; no comment table; author name not clickable               |
| Marketplace    | DB-backed published products, admin CRUD, first image only, right-side drawer   | Single-image admin/public; client-side search/sort/pagination; hard delete; card not fully clickable; modal not centered; general CTA is a bare mailto                       |
| Connections    | DB-backed active/received/sent, contact vault, archived placeholder             | Region filter hardcoded LatAm/Europe/Recent; no country derivation; no pagination; Archived Dialogues is fake; few seeded cards                                              |
| Admin          | One route loading all data; user review; reports; product CRUD; interest review | No dossier modal before review; no reject/suspend reason; hard delete; no status filters; interest query excludes rejected; pagination missing; header/filter placement weak |
| Profile        | DB-backed own dossier and `/persona/[id]`; Share Dossier copies `/persona/:id`  | Bio not locale-aware; owner viewing their shared dossier sees Connect/Report to self; no native-share fallback                                                               |
| Discover       | Server-side search/regions and load-more; DB-backed                             | Ordered by `display_name`, not random                                                                                                                                        |
| Password reset | Server actions, callback route, reset pages, Inbucket available locally         | No end-to-end email-link test                                                                                                                                                |

---

## 2. Locked recommendations

| Decision               | Choice                                                                        | Reason                                                                                  |
| ---------------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Posts composer         | FAB on mobile + “New post” toolbar button on desktop, both open one dialog    | FAB is natural on mobile; a desktop FAB is easy to miss and can collide with the footer |
| Posts filters          | Move to a feed toolbar above the cards                                        | The editorial header should not carry three interactive pills                           |
| “Dispatch”             | Keep as prose flavor only; functional labels say Post/Posts                   | Dispatch is just the design word for a post; it is not a separate model                 |
| Comments               | One-level replies, soft delete, no realtime/notifications                     | Covers “comments for comments” without becoming chat                                    |
| Post share             | `/posts/[id]` page; native share with clipboard fallback                      | A shared post needs its own context, comments, and metadata                             |
| Marketplace pagination | Server-side load-more, page size 9                                            | Same interaction as Discover; keeps search/sort correct across all rows                 |
| Marketplace cards      | Uniform 1/2/3 grid; whole card opens detail                                   | Matches Discover and removes ambiguous nested hit targets                               |
| Marketplace detail     | Centered dialog on `sm+`; bottom sheet on mobile; multi-image carousel        | Required by the brief and consistent with existing dialogs                              |
| Marketplace delete     | Soft delete → Trash; restore supported                                        | Admin should not lose a product irreversibly by accident                                |
| Product states         | `draft`, `live`, `unpublished`, `trashed`                                     | Distinguishes “never published” from “taken down”                                       |
| Artisan inquiries      | Concierge inquiry dialog with Email + WhatsApp                                | The current mailto is mislabeled and fragile on devices without a mail client           |
| Marketplace contact    | `platform_settings` is the source; env is fallback                            | Admin edits remain authoritative; env is easy to find                                   |
| Connections region     | Searchable multi-select of countries present in the user’s active connections | Matches Discover and only offers useful choices                                         |
| Archived Dialogues     | Remove the tab                                                                | It is a placeholder, not chat; no backing table or product definition                   |
| Admin structure        | Separate routes per tab + shared layout                                       | Gives independent loading, URLs, back/refresh, and fewer over-fetches                   |
| Admin pagination       | Numbered URL pagination (`?page=`)                                            | Admins need stable position and deep links; this is not a feed                          |
| Profile share          | Reuse `/persona/[id]`; no new page                                            | It is already the dossier page; only the self-view and share fallback need work         |
| Public sharing         | Keep approved-account requirement                                             | Anonymous profile reading is a separate privacy/RLS decision                            |
| Discover order         | Seeded deterministic shuffle                                                  | Random feel without duplicate/missing rows across load-more                             |
| Password reset QA      | Full E2E through local Inbucket                                               | The old test only checked page rendering                                                |

---

## 3. Non-goals / guardrails

- No chat, DMs, inbox, threads-as-messages, realtime, or chat notifications.
- No comments on comments beyond one reply level.
- No public anonymous post/persona sharing.
- No user-created marketplace listings, carts, checkout, payments, shipping, or
  seller accounts.
- No sub-admin/moderator roles.
- No stories, reels, live video, or advanced media editing.
- No notification system for likes/comments/connections.
- Do not weaken RLS to make UI work.
- Do not put user-facing English directly in components; use `next-intl`.

---

## 4. Phase 0 — Database, seeds, RLS

### 4.1 Migrations

Suggested migration slices (rename as needed):

1. `post_images`
2. `post_comments`
3. `marketplace_lifecycle`
4. `profile_moderation_events`
5. `posts_feed_view`
6. `discover_random`

#### `post_images`

```text
post_images
- id uuid pk
- post_id uuid -> posts(id) on delete cascade
- storage_path text not null
- sort integer not null default 0
- created_at timestamptz not null default now()
```

- Unique `(post_id, sort)`.
- Index `(post_id, sort)`.
- Backfill one row per existing `posts.image_path`.
- Keep `posts.image_path` as the **cover** used by feed cards; the gallery reads
  `post_images` in `sort` order.
- Limit in action + UI: 6 images, 10 MB each, PNG/JPEG/WebP.
- RLS:
  - select: approved users when the parent post is visible; author; admin.
  - insert: post author only.
  - delete/update: post author or admin.

#### `post_comments`

```text
post_comments
- id uuid pk
- post_id uuid -> posts(id) on delete cascade
- author_id uuid -> profiles(id) on delete cascade
- parent_id uuid -> post_comments(id) on delete cascade (nullable)
- body text not null
- deleted_at timestamptz
- created_at timestamptz not null default now()
- updated_at timestamptz not null default now()
```

- One-level replies: parent must be a root comment on the same post. Reject a
  reply to a reply with a trigger or in the Server Action + DB check.
- Length: 1–1000 characters.
- Soft delete: set `deleted_at`; keep the row so replies stay attached.
- Index `(post_id, created_at)`, `(parent_id)`.
- RLS:
  - select: approved users when the parent post is visible; post author; admin.
  - insert: `author_id = auth.uid()`, approved, visible post, valid parent.
  - update: author may soft-delete own row only; admin may moderate.
- No comment likes, mentions, or notifications.

#### `marketplace_products` lifecycle

Add:

```text
published_at timestamptz
deleted_at   timestamptz
catalog_status generated always as (
  case
    when deleted_at is not null then 'trashed'
    when is_published then 'live'
    when published_at is not null then 'unpublished'
    else 'draft'
  end
) stored
```

- Index `(catalog_status, created_at desc)`.
- Public read: `deleted_at is null and is_published`.
- Admin read: all rows.
- Soft delete: `deleted_at = now()`.
- Unpublish: `is_published = false`, keep `published_at`.
- Publish: `is_published = true`, set `published_at = coalesce(published_at, now())`.
- Restore: `deleted_at = null`.
- Backfill: live rows get `published_at = created_at`; false rows stay null.

#### `profile_moderation_events`

```text
profile_moderation_events
- id uuid pk
- profile_id uuid -> profiles(id) on delete cascade
- admin_id uuid -> profiles(id) on delete set null
- decision approval_status not null
- reason text
- created_at timestamptz not null default now()
```

- Reject/suspend require a reason (minimum 10, maximum 500 characters).
- Approve reason optional.
- RLS: admin insert/select; profile owner select own events.
- Show the latest reason on `/verify` for rejected/suspended users.

#### `posts_feed` view

Create a `security_invoker` view joining visible posts with the approved author
columns needed by server-side filters:

- post id, author id, cover path, caption, created_at
- author display name, country code, city, avatar path
- comment count (non-deleted)
- moderation status

Purpose: server-side `connectionsOnly` and `Spain & LatAm` filters with correct
counts and pagination. RLS remains in charge through the underlying tables.

#### Discover random RPC

Create a seeded shuffle function or view:

```text
order by md5(p.id::text || p_seed), p.id
```

- The client keeps one seed per search/filter session.
- New search/filter = new seed.
- Load-more reuses the seed, so no duplicates or skipped rows.
- Do not use `order by random()` per page request.

### 4.2 Seeds

Expand `supabase/seed.sql`:

- 12+ approved personas so Discover load-more is visible.
- 8–10 posts, including one post with 3 images.
- Comments and at least one reply thread.
- 6–8 accepted connections for Sofia, each with contact details.
- Marketplace products in live, draft, unpublished, and trashed states.
- Reports in open, resolved, and dismissed states, targeting users and posts.
- Interest catalog rows in pending, approved, and rejected states.
- Fix marketplace `contact_information` so it contains a seller phone, not an
  email.

### 4.3 Environment

Add to `.env.example` (and local `.env.local`):

```env
NEXT_PUBLIC_MARKETPLACE_EMAIL=concierge@globallinkup.com
NEXT_PUBLIC_MARKETPLACE_WHATSAPP=+34 612 345 678
NEXT_PUBLIC_MARKETPLACE_WHATSAPP_LINK=https://wa.me/34612345678
```

`getMarketplaceContact()` must:

1. read `platform_settings.marketplace.contact`,
2. fall back to the public env values for missing fields,
3. return empty strings only when both are absent.

### 4.4 Verification

- `npm run db:reset`
- `npm run db:types`
- `npm run db:test`
- Add pgTAP tests for every new table/policy before UI work.

---

## 5. Phase 1 — Posts

### 5.1 Feed data

- [ ] Add `POSTS_PAGE_SIZE = 5`.
- [ ] Add `loadFeedPageAction` with Zod:
  - `filter: "all" | "connectionsOnly" | "spainLatam"`
  - `offset`, `limit`
- [ ] Query `posts_feed` with server-side filter + count.
- [ ] Initial page server-rendered; load-more appends.
- [ ] Reset offset on filter change.
- [ ] Ignore stale responses, like `DiscoverWorkspace`.
- [ ] Remove the old mock `POSTS` array from `posts/data.ts`; keep only filter
      constants.

### 5.2 Composer

- [ ] Remove `PostComposer` from the feed flow.
- [ ] Add a mobile FAB above the bottom nav.
- [ ] Add a desktop “New post” button in the feed toolbar.
- [ ] Both open the same composer dialog.
- [ ] Multi-image selection (max 6), previews, remove, reorder.
- [ ] Upload with progress/stage labels; Zod at the action boundary.
- [ ] After publish: close, reset to `All`, scroll to top, refresh feed.

### 5.3 Feed toolbar

- [ ] Move the three filters out of the header.
- [ ] Render them as a single segmented row above the cards.
- [ ] Show the active count and total from the server.
- [ ] Mobile: horizontal scroll; desktop: one row.
- [ ] Rename functional labels from Dispatch to Post.

### 5.4 Card

- [ ] Author name + avatar link to `/persona/[id]`; own post links to `/profile`.
- [ ] Multi-image carousel with dots, prev/next, keyboard arrows, touch swipe.
- [ ] Share uses native share or clipboard and links to `/posts/[id]`.
- [ ] Community guidelines text becomes a real link to `/standards`.
- [ ] Show 1–2 newest comments + “View all N comments”.
- [ ] Keep connect/accept; verify with an E2E test.
- [ ] Add load-more spinner/skeleton; preserve the existing card skeleton.

### 5.5 Post detail

- [ ] Add `src/app/[locale]/(app)/posts/[id]/page.tsx`.
- [ ] Add `loading.tsx` with a post/detail skeleton.
- [ ] Fetch post, author, images, likes, viewer like state, connection state.
- [ ] Render full carousel, caption, actions, report, comments.
- [ ] Metadata title from the caption.
- [ ] `notFound()` for removed/invisible posts.
- [ ] Back link falls back to `/posts`.

### 5.6 Comments

- [ ] Add comment query/action modules.
- [ ] Root composer + one-level reply composer.
- [ ] Soft delete own comment.
- [ ] Comment list with load-more.
- [ ] Empty/error/loading states.
- [ ] Show “Replying to …” context.
- [ ] No notification, mention, or realtime behavior.

### 5.7 i18n

Add EN/ES keys for:

- new post dialog, multi-image labels, carousel controls
- post detail, share success/failure, comments/replies
- comment deletion, empty states, load-more
- “Post(s)” replacement labels

### 5.8 Tests

- Unit: filter mapping, comment reply guard, feed page merge.
- E2E: create multi-image post, carousel, share link, comment/reply, delete
  comment, connect from a post, author link, filters + load-more.

---

## 6. Phase 2 — Marketplace

### 6.1 Public data

- [ ] Replace `getPublishedProducts()` with a paginated query:
  - search across name/description/origin
  - sort featured/newest/price low/high
  - offset + limit
  - total count
- [ ] Add `loadMarketplacePageAction` with Zod.
- [ ] Public query excludes trashed and unpublished rows.
- [ ] Page size 9.

### 6.2 Catalog UI

- [ ] Replace the asymmetric bento with a uniform grid:
  - 1 column mobile
  - 2 columns `sm`
  - 3 columns `xl`
- [ ] Remove the featured-card treatment.
- [ ] Put search + sort in one toolbar above the grid.
- [ ] Replace page numbers with load-more.
- [ ] Add skeletons for initial/load-more.

### 6.3 Card interaction

- [ ] Make the whole card the single activation target.
- [ ] Remove nested interactive buttons; “View Details” becomes a visual label.
- [ ] Add keyboard activation and a clear accessible name.
- [ ] Keep image, origin badge, name, description, price.

### 6.4 Detail dialog

- [ ] Replace `ProductDrawer` with a centered dialog on `sm+`.
- [ ] Mobile: bottom sheet / full-height.
- [ ] Multi-image carousel with dots + arrows.
- [ ] Click image opens a lightbox.
- [ ] Keep contact, trust, and order information.
- [ ] Optional: reflect the open product in `?product=<id>` for deep links.
- [ ] Focus trap, Escape, backdrop close, body scroll lock.

### 6.5 Contact / inquiry

- [ ] `getMarketplaceContact()` DB-first, env fallback.
- [ ] Replace banner mailto with a concierge inquiry dialog.
- [ ] Show Email and WhatsApp actions with a prefilled product/context message.
- [ ] Keep per-product seller phone if present; do not put an email in a `tel:` link.

### 6.6 Tests

- Unit: search/sort parameter mapping, contact fallback.
- E2E: search/sort/load-more, whole-card open, centered modal on desktop,
  multi-image, inquiry dialog, unpublished/trashed products hidden.

---

## 7. Phase 3 — Connections, Discover, Profile

### 7.1 Connections region filter

- [ ] Generalize the Discover `RegionFilter` to accept an options list.
- [ ] Derive options from the user’s active connections only:
  - unique `country_code`
  - localized country names
- [ ] Searchable multi-select with checkmarks; empty = all.
- [ ] Remove the hardcoded LatAm/Europe/Recent filter.
- [ ] Clear a selected country if it disappears after disconnect.
- [ ] Use the same component in Discover and Connections.

### 7.2 Connections layout

- [ ] Remove the `archived` tab and related translations.
- [ ] Add load-more for active cards, page size 8.
- [ ] Client-side because the connection set is already loaded and small.
- [ ] Keep search client-side.
- [ ] Show empty state when filters return nothing.
- [ ] Seed accepted connections + contact details.

### 7.3 Discover random

- [ ] Add a per-session seed in `DiscoverWorkspace`.
- [ ] Generate a new seed on new search/filter/clear.
- [ ] Reuse the seed for load-more.
- [ ] Use the seeded RPC/view from Phase 0.
- [ ] Update tests to assert sets/counts, not name order.

### 7.4 Profile share

- [ ] Keep Share Dossier copying `/persona/:id`.
- [ ] Add native share with clipboard fallback.
- [ ] Use the active locale when building the URL.
- [ ] Pass `isSelf` to the persona detail view.
- [ ] Owner view: show Edit Profile instead of Connect/Report.
- [ ] Other viewers: no edit/logout/share controls.
- [ ] Make bio locale-aware (`bio_es` for `es`, `bio_en` for `en`).
- [ ] Add E2E for share, owner view, and recipient view.

### 7.5 Tests

- Unit: country-option derivation, seeded order stability, bio locale.
- E2E: region filter only shows connected countries, load-more, archived tab
  absent, Discover random with no duplicates, profile share/self-view.

---

## 8. Phase 4 — Admin

### 8.1 Structure

Replace the single `/admin` view with:

```text
/admin                 -> dashboard / metrics + quick links
/admin/users           -> users & personas
/admin/marketplace     -> catalog
/admin/moderation      -> reports
/admin/interests       -> interest catalog
```

- [ ] Add `admin/layout.tsx` with an admin guard and shared shell.
- [ ] Tabs are links, not local state.
- [ ] Compact header: title + role badge.
- [ ] Move metrics from the sub-bar into dashboard cards.
- [ ] Each route has its own `loading.tsx`.
- [ ] Each route fetches only its data.

### 8.2 Filters and pagination

- [ ] Put search/status filters in a per-tab toolbar.
- [ ] Keep filter + page state in the URL:
  - `?q=`
  - `?status=`
  - `?page=`
- [ ] Numbered pagination, 10–12 rows per page.
- [ ] Preserve filters when changing page.
- [ ] Add empty states for filtered and unfiltered results.

### 8.3 Users

- [ ] Status filters: Pending / Approved / Rejected / Suspended / All.
- [ ] Server-side search.
- [ ] “Review dossier” opens a centered modal / mobile sheet.
- [ ] Show:
  - avatar, name, age, location, headline, bio
  - languages, interests
  - contact details (admin-only)
  - submitted date, status
  - latest moderation reason + history
- [ ] Approve / Reject / Suspend from the modal.
- [ ] Reject/suspend require a reason before submit.
- [ ] Approve may include an optional note.
- [ ] Refresh the list after a decision.

### 8.4 Marketplace admin

- [ ] Move the create/edit form into a “New product” modal.
- [ ] Multi-image upload, preview, remove, reorder.
- [ ] Draft may save without an image; publish requires one.
- [ ] Explicit Save draft / Publish actions.
- [ ] “Instant catalog release” defaults to false if the checkbox remains.
- [ ] Status filters: All / Live / Draft / Unpublished / Trash.
- [ ] Soft delete to Trash; restore from Trash.
- [ ] Unpublished chip uses a distinct amber/neutral tone.
- [ ] Pagination in the catalog tab.

### 8.5 Moderation

- [ ] Seed open/resolved/dismissed reports.
- [ ] Status + target filters.
- [ ] Show post thumbnail / author / reporter / reason.
- [ ] Remove post, resolve, dismiss.
- [ ] Optional resolution note (if added, store it).
- [ ] Pagination.

### 8.6 Interests

- [ ] Fetch all statuses, including rejected.
- [ ] Replace the card grid with a dense list/table.
- [ ] Tabs: All / Pending / Published / Rejected.
- [ ] Search + pagination.
- [ ] Approve / Reject / Unpublish.
- [ ] Keep creator and created date visible.
- [ ] Pending queue is the default view when it has rows.

### 8.7 Tests

- Unit: status filter mapping, pagination URL builder, reason validation.
- E2E: review dossier, reject/suspend reason, product draft/live/unpublished/
  trash, restore, interest status filters, reports, admin pagination.

---

## 9. Phase 5 — QA and regression

### 9.1 Password recovery

- [ ] Request reset for a seeded account.
- [ ] Read the email from local Inbucket (`http://127.0.0.1:54524`).
- [ ] Extract the recovery link.
- [ ] Open the callback link and set a new password.
- [ ] Sign in with the new password.
- [ ] Verify the old password fails.
- [ ] Verify an invalid/expired link shows the invalid state.
- [ ] Reset the DB after the destructive test.

### 9.2 Post-onboarding flows

- [ ] Profile edit save and refresh.
- [ ] Share dossier and open it as the owner and as another approved user.
- [ ] Create a post with 1 and 3 images.
- [ ] Comment and reply.
- [ ] Marketplace admin create/edit/publish/unpublish/trash/restore.
- [ ] Product inquiry dialog.
- [ ] Connection accept/decline/disconnect and region filter.
- [ ] Admin persona review and reason display.
- [ ] Admin product status filters.
- [ ] Discover load-more with random order.

### 9.3 Visual QA

At 375, 640, 768, 1024, 1280, and 1440 px:

- [ ] FAB does not overlap the bottom nav.
- [ ] Post carousel controls are reachable and visible.
- [ ] Marketplace dialog is centered on desktop and a sheet on mobile.
- [ ] Marketplace card has one activation target.
- [ ] Admin tabs/filters do not wrap awkwardly.
- [ ] Bottom nav still hides at `lg`.
- [ ] No horizontal overflow.

### 9.4 Quality gates

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
npm run db:reset
npm run db:types
npm run db:test
npm run build
PLAYWRIGHT_BASE_URL=http://localhost:3009 npm run e2e
```

Reset the DB after any authenticated E2E run that mutates state.

---

## 10. Suggested commit order

Use small Conventional Commits; one phase may be several commits.

```text
feat(db): add post images, comments, and product lifecycle
feat(posts): add multi-image feed, detail route, and comments
feat(marketplace): paginate the catalog and add centered product detail
feat(connect): filter regions from real connections and add load more
feat(admin): split the workstation into routes and add review dossiers
feat(persona): seed random discovery and polish dossier sharing
test(auth): cover the full password-reset flow
```

Allowed scopes: `db`, `posts`, `marketplace`, `connect`, `admin`, `persona`,
`auth`, `ui`, `i18n`, `config`, `deps`, `docs`, `ci`.

---

## 11. Open decisions (defaults already chosen)

- [x] Comments: one-level replies, no notifications.
- [x] Share links: approved account required.
- [x] Archived Dialogues: remove.
- [x] Admin: separate routes + numbered URL pagination.
- [x] Posts composer: FAB mobile + toolbar button desktop.
- [x] Product states: draft / live / unpublished / trashed, soft delete.
- [x] Functional label: Post(s), not Dispatch.

If any default changes, update this file before implementation.

---

## 12. Progress log

- [x] Phase 0 — DB, seeds, RLS
- [x] Phase 1 — Posts
- [ ] Phase 2 — Marketplace
- [ ] Phase 3 — Connections, Discover, Profile
- [ ] Phase 4 — Admin
- [ ] Phase 5 — QA and regression
