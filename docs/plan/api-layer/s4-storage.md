# S4 — Storage (buckets, uploads, avatar persistence)

Give images a real home in Supabase Storage: bucket + RLS, one validated
upload path, and persist the persona avatar so the photo picker stops ending
at the browser edge.

Back to [README](./README.md). Depends on **S3** — the buckets, the RLS and the
upload Server Action were **brought forward as S3.0** (SC-1 in
[s3-pillars.md](./s3-pillars.md)), so the pillars could require real images.
This slice closes the last gap: the uploaded path reaches `profiles.avatar_url`
and every read site resolves it.

- **Status:** ✅ complete 2026-10-19 — commit `4d72c2e`
  (`feat: persist avatars, wire pending-connection pill, rework admin product
form`).
- **Goal:** upload → storage path → row → signed read, end to end, with RLS as
  the backstop at every step.
- **Gate:** per slice — `db:reset` + `db:test` + `format:check`/`lint`/
  `typecheck`/`test`/`build`/`e2e` (+ `@auth` where relevant) green.

## 1. Decisions (locked)

| ID    | Question                                              | Choice                                                                                                                                                                              |
| ----- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SD4-1 | Public buckets or private?                            | **Private.** Reads go through short-lived signed URLs generated server-side, so RLS still decides who sees what (follows A6 — never widen at the storage layer).                    |
| SD4-2 | Path convention                                       | `<user-id>/<uuid>.<ext>` — the first folder is the authorization unit; policies authorise writes by folder, the extension is sanitised (`buildStoragePath`).                        |
| SD4-3 | Bucket set                                            | Exactly three: `avatars`, `post-images`, `product-images`. No files/messages bucket (no chat).                                                                                      |
| SD4-4 | Who may write what                                    | `avatars` — owner only, **while pending too** (the photo is needed during onboarding); `post-images` — approved users; `product-images` — **admin only** (the catalog is official). |
| SD4-5 | Limits                                                | `avatars` 5 MB, `post-images`/`product-images` 10 MB; MIME `image/png\|jpeg\|webp`; signed-URL TTL 1 h.                                                                             |
| SD4-6 | The form has a photo picker, but nothing persisted it | `save_persona` gains `p_avatar_url` (15-arg signature, old 14-arg overload **dropped**, not shadowed — otherwise PostgREST sees two candidates and every call is ambiguous).        |
| SD4-7 | Editing without re-picking a photo                    | `save_persona` keeps the stored path when the argument is omitted (`coalesce`), so the client sends no path instead of re-uploading.                                                |
| SD4-8 | Trust the client's path?                              | Never. Three layers: Zod regex (`avatarInvalid`), action prefix check (`avatarPath.startsWith(<uid>/)`), and the RPC re-checks the folder (fail closed).                            |
| SD4-9 | Replace / delete objects?                             | **Deferred.** Replacing an avatar or deleting a post/product leaves the old object in the bucket (orphan). No delete-on-replace yet — accepts some bucket growth for now.           |

## 2. What landed

| File                                                         | What                                                                             |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| `supabase/migrations/20261019120000_s3_storage.sql`          | 3 private buckets + size/MIME limits + storage RLS policies                      |
| `supabase/migrations/20261019130000_s4_avatar.sql`           | `save_persona` persists `p_avatar_url` (+ folder backstop)                       |
| `supabase/migrations/20261019140000_product_form_rework.sql` | Drops `category` / `availability` (dead schema after UI rework)                  |
| `src/lib/storage.ts`                                         | `server-only` helpers: bucket consts, `buildStoragePath`, `createSignedImageUrl` |
| `src/features/media/actions.ts`                              | `uploadImageAction` — the single validated upload path                           |
| `src/lib/validation/persona.ts`                              | `avatarPath` Zod schema (must look like `<uid>/<uuid>.<ext>`)                    |
| `supabase/tests/rls.test.sql`                                | pgTAP tests 38–40 (storage fail-closed, avatar persist/keep, stolen path)        |

## 3. Buckets + RLS

All buckets are private (`public = false`). Policies live on `storage.objects`
and use `storage.foldername(name)` to scope writes to the caller's folder:

| Bucket           | Select (read)   | Insert (write)                    | Update | Delete       |
| ---------------- | --------------- | --------------------------------- | ------ | ------------ |
| `avatars`        | `is_approved()` | owner folder (even while pending) | owner  | owner        |
| `post-images`    | `is_approved()` | `is_approved()` + owner folder    | —      | owner folder |
| `product-images` | `is_approved()` | `is_admin()`                      | —      | `is_admin()` |

- No update policy on `post-images`/`product-images` → objects are immutable;
  a new version means a new file.
- Anon has no policy at all → fail closed (pgTAP test 38 asserts
  `anon` sees no storage objects).
- Folder scoping is what binds a policy to a user without nameable columns.

## 4. Upload Server Action — `src/features/media/actions.ts`

One action, `"use server"`, nothing bypasses it:

1. `getCurrentUser()` → no session → `{ ok: false, error: "unauthenticated" }`.
2. Zod on the bucket (`z.enum(IMAGE_BUCKETS)`) and the file must be a `File`.
3. Size `0 < size ≤ 10 MB` (`"size"`) and MIME in the allow-list (`"type"`).
4. **Mirror the RLS** so the UI gets a clear error instead of a Supabase noise:
   non-avatar buckets require `approval_status = approved`; `product-images`
   additionally requires `role = admin`.
5. `buildStoragePath(user.id, file.name)` → upload with `upsert: false`.
6. Returns `{ ok: true, path }`; every failure maps to a short reason string.

Call sites: the persona photo picker (`create-persona-view.tsx`), the post
composer (`post-composer.tsx`) and the admin marketplace tab
(`marketplace-tab.tsx`). None writes storage directly.

## 5. Avatar persistence (S4 proper)

Chain, one check per layer:

```
file → uploadImageAction → path "<uid>/<uuid>.<ext>"
     → persona form → Zod avatarPath regex
     → createPersonaAction → must start with `${user.id}/`
     → save_persona RPC → RFC re-checks the folder (fail closed)
     → profiles.avatar_url
```

`save_persona` changes:

- Old 14-argument overload **dropped** (`drop function` before `create or
replace`) — keeping both would make PostgREST ambiguous.
- `p_avatar_url` passes through `nullif(…, '')`; `''` means "no change" is
  handled client-side by omitting the field — the RPC itself treats a present
  path as authoritative and falls back to the stored one only when omitted.
- Path outside the caller's folder → exception `22023` (pgTAP test 40).

Reads sign the path (`createSignedImageUrl`) so discover, own profile,
connections, admin, the feed and the create-persona page resolve the stored
object; `startsWith("http")` passthrough keeps any external URL working.

## 6. Same-commit extras (2026-10-19)

- **Pending-connection pill** — `getPendingRequestCount(viewerId)` (count of
  inbound `requested` rows) feeds a badge on the navbar and the bottom tab bar
  via `(app)/layout.tsx`.
- **Product form rework** — the admin form now collects what a buyer needs to
  reach the seller (name, price, origin, phone); `marketplace_products`
  dropped `category` + `availability` and the `product_availability` enum
  rather than keeping dead schema. Image upload persists through the same
  S3.0 action into `marketplace_product_images`.

## 7. Tests & gate

| Layer | Evidence                                                                                                                     |
| ----- | ---------------------------------------------------------------------------------------------------------------------------- |
| pgTAP | 38: anon sees no storage objects · 39: `save_persona` persists + keeps avatar · 40: rejects a path outside the caller folder |
| Unit  | 25/25 (mappers, Zod schemas, env/utils)                                                                                      |
| Type  | `typecheck` green                                                                                                            |
| e2e   | unchanged from S3 (auth specs still `@auth`, need a running stack)                                                           |

## 8. Known follow-ups

- **No delete-on-replace** (SD4-9): replacing an avatar — or replacing /
  deleting a post or product image — orphans object(s) in the bucket; post
  soft-delete never touches storage. A cleanup sweep (or delete-then-upload)
  is deliberately deferred.
- **Thin pgTAP coverage of the bucket policies**: only the anon fail-closed
  case is tested directly; owner-folder insert, immutable objects and the
  admin rule are untested.
- **Size mismatch nit**: `MAX_IMAGE_BYTES` is 10 MB but the `avatars` bucket
  allows 5 MB — an oversized avatar reaches the bucket limit and surfaces as
  the generic `"unknown"` error instead of `"size"`.
- **Seeded rows have no objects**: `seed.sql` points at `avatars/seed/…` /
  `post-images/seed/…` paths that do not exist in the buckets, so seed renders
  the neutral placeholder until files are uploaded.
- **Navbar account chip is still mock** (`CURRENT_USER` from
  `@/lib/brand`); it does not resolve the signed avatar — the signed viewer
  avatar is wired on the posts composer, not the nav.
