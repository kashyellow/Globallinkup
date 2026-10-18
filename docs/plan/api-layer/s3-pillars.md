# S3 — Pillar wiring (real data)

Flip the mock-driven pillars to Supabase, one slice at a time, behind the
existing UI. Depends on **S2 ✅** and the UI update + `s3_contact_channels`
migration (2026-10-19).

- **Status:** in progress — S3.0 done, S3a/S3b partially landed
- **Goal:** every pillar reads real rows; writes go through Server Actions with
  Zod + RLS; nothing mock-driven remains except demo fixtures kept for tests.
- **Gate:** per slice — `db:reset` + `db:test` + `format:check`/`lint`/
  `typecheck`/`test`/`build`/`e2e` (+ `@auth` where relevant) green.

## The seam (from README §5)

Per feature: `types.ts` (DTOs), `queries.ts` (`server-only` reads → DTO),
`mappers.ts` (row → DTO), `actions.ts` (`"use server"` writes, Zod-validated).
Pages become Server Components that fetch and pass props to the existing client
views. `data.ts` stays as dev fixtures until each function is flipped.

## Slices

| Slice | What                                                               | Status                                         | Depends on    |
| ----- | ------------------------------------------------------------------ | ---------------------------------------------- | ------------- |
| S3.0  | **Storage bring-forward** (avatars/post/product buckets + URLs)    | ✅ complete 2026-10-19                         | —             |
| S3a   | Persona/Discover + own Profile (people core)                       | 🟡 discover done; own profile next             | S3.0          |
| S3b   | Connect (request with a note → `intro`, accept/decline/disconnect) | 🟡 actions + send wired; connections page next | S3a           |
| S3c   | Posts (feed, create, soft delete, like)                            | planned                                        | S3.0, S3b     |
| S3d   | Marketplace (reads + admin product CRUD)                           | planned                                        | S3.0          |
| S3e   | Admin (users review, reports/moderation, dashboard counts)         | planned                                        | S3b, S3c, S3d |

Land one slice green before the next.

## Decisions

| ID    | Question                                                   | Choice                                                                                                                                |
| ----- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| SC-1  | Images: S3 needs real avatars/post/product images          | **Bring S4 storage forward as S3.0**: create the 3 buckets + RLS, a signed/public URL helper, and one upload Server Action.           |
| SC-2  | Posts require an image (PRD FR-6.2) but upload lands in S4 | S3.0 unblocks it, so S3c can require an image. No image-less posts.                                                                   |
| SC-3  | DTO ids vs DB uuid                                         | Mappers pass the real uuid as `string`; links/params use the uuid. No slug table.                                                     |
| SC-4  | Discover filters (`region`, `query`)                       | `query` → `display_name/city` ilike; `region` → `country_code` sets (`spain`, `mexico`, `colombia`, `unitedStates`).                  |
| SC-5  | Contact vault exposure                                     | The page fetches `contact_details` under the RLS client: rows return only for owner/accepted/admin. Absent → render the locked state. |
| SC-6  | Post time DTO (`{kind:"hoursAgo"}`)                        | Mapper computes from `created_at`; the view keeps its existing renderer.                                                              |
| SC-7  | Post `roleText`/`badgeIcon`/`state`                        | `state` and like state are viewer-derived; `roleText` = city; `badgeIcon` dropped (already format-only).                              |
| SC-8  | Admin `flagged`/`inquiries`/incidents                      | Derive from `reports`; no new columns (matches decisions §4b).                                                                        |
| SC-9  | `origin_flavor` column is dead                             | **Drop it** in an S3 migration; the UI and RPC already removed it.                                                                    |
| SC-10 | Marketplace image upload UI exists but is not persisted    | Wire it through the S3.0 upload action + `marketplace_product_images`.                                                                |

## S3.0 — Storage (bring S4 forward)

- Migration: buckets `avatars`, `post-images`, `product-images` with MIME/size
  limits + RLS (owner write; approved read; product-images admin write).
- `src/lib/storage.ts` (server): upload + public/signed URL helpers.
- `uploadImageAction` (auth required, Zod on type/size).
- Product/post image rows point at `storage_path`; mappers resolve URLs.

## S3a — Persona/Discover + own Profile

- `persona/queries.ts`: `getDiscoverPersonas({ query, region, page })`,
  `getPersonaDossier(id)`.
- `persona/mappers.ts`: row → `Persona` DTO (age via `profile_age()`, location
  from city/country, avatar URL, languages, interests, viewer connect state).
- Discover page becomes an RSC; `DiscoverView` takes `personas` as a prop.
- Own profile page: real identity, bio, languages, interests, contact vault
  (owner view; masked handles otherwise).
- **Viewer state** (`none | requested | connected`) computed from `connections`
  between viewer and each persona.

## S3b — Connect

- `connect/actions.ts` (Zod + RLS backstop):
  - `sendConnectRequestAction({ recipientId, note })` → insert, `intro = note`;
  - `acceptConnectionAction`, `declineConnectionAction`;
  - `reRequestAction` (declined → requested, requester only);
  - `disconnectAction` (accepted → declined).
- Wire `connect-dialog`'s `onSend(note)` and the connections page.
- Contact details become visible only after `accepted` (RLS already enforces).
- Notes: the transition guard rejects illegal moves; actions map its error.

## S3c — Posts

- `posts/actions.ts`: `createPostAction` (image + caption, approved only),
  `deletePostAction` (soft, author), `toggleLikeAction`.
- `posts/queries.ts`: feed with author, likes count, viewer liked; pagination.
- Wire `PostsView`/`PostCard` to props; images from storage.

## S3d — Marketplace

- `marketplace/queries.ts`: published products + images (approved); admin sees
  drafts.
- `marketplace/actions.ts` (admin): create/update/publish/delete product,
  attach images.
- Wire the marketplace view + admin marketplace tab (the upload UI already
  exists; persist via S3.0).

## S3e — Admin

- Users tab: real pending/approved/rejected/suspended profiles +
  `reviewPersonaAction` (already exists) with optimistic refresh.
- Moderation tab: `reports` list + resolve/dismiss + remove post.
- Dashboard counts: pending profiles, open reports, published products.
- **No service-role** — `/admin` is gated by `requireAdmin` + RLS admin policies.

## Mapping rules (settle in S3a)

| Fixture shape                | DB                                                   |
| ---------------------------- | ---------------------------------------------------- |
| `id: "sofia"`                | `uuid` (string)                                      |
| `age: 27`                    | `profile_age(id)`                                    |
| `location: "Barcelona, ES"`  | `city` + `country_code`                              |
| CDN image URLs               | storage path → public/signed URL (S3.0)              |
| `price: 120`                 | `price_cents / 100` + `currency`                     |
| `interests: ["photography"]` | `interests text[]` (UI keys; aligned in the S3 seed) |
| `time: {kind:"hoursAgo"}`    | derived from `created_at`                            |

## Tests

- pgTAP: extend for storage policies + any new write path.
- Unit: mappers (row → DTO) and action Zod schemas.
- e2e: discover renders real personas; request/accept unlocks contact; post
  create + like; admin approve; marketplace read. Use `AUTH_E2E=1` where a
  stack is needed.

## Open questions

- SC-1 confirms storage comes forward; if the team prefers to keep S4 separate,
  S3a/c/d show placeholders and images stay broken until S4.
- Real-time like counts (realtime) vs optimistic-only — recommend optimistic.
