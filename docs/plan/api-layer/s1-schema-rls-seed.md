# S1 — Schema, RLS & seed

The database enforces the whole model **before any UI wiring**. Nothing
user-visible changes.

Back to [README](./README.md). Depends on **S0 ✅**. **Status:** ✅ complete
2026-10-16 — schema, RLS and seed landed on `dev`.

- **Goal:** every table, constraint, RLS policy and seed row exists.
- **Gate:** `npm run db:reset` clean + `npm run db:test` (pgTAP) green, then
  `db:types` regenerates and `format:check` / `lint` / `typecheck` / `build`
  stay green.

## 1. DTO ↔ schema decisions (locked)

The UI is already built and displays or collects fields the PRD §6.1 schema has
no home for. These are **not** mechanical row→DTO mappings: either the column is
created here, or the UI changes. This slice is where the columns are born, so
**every row is locked** — see `api-layer-decisions.md` §4 for the final choices.

| ID    | Field / UI surface                                                                                                        | Seen in                                                                               | Options                                                                                                                     | Status |
| ----- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------ |
| SD-1  | `age` — rendered on every persona, connection and profile card; **collected nowhere** (the persona form has no age field) | `persona/data.ts`, `connect/data.ts`, `profile/data.ts`                               | (a) `profiles.date_of_birth` + derive age; (b) `profiles.age` int; (c) drop age from the UI (relates to the OQ-11 age gate) | locked |
| SD-2  | `languages[{code, level}]`                                                                                                | `persona/data.ts`, `connect/data.ts`; the language chips in `create-persona-view.tsx` | (a) `profiles.languages jsonb`; (b) a `profile_languages` join table; (c) drop from the UI                                  | locked |
| SD-3  | Bilingual bio (`PROFILE_BIO.en` + `.es` rendered side by side) vs the single 160-char bio the form collects               | `profile/data.ts`, `create-persona-view.tsx`                                          | (a) single `profiles.bio`; (b) `bio_en` / `bio_es`                                                                          | locked |
| SD-4  | "Origin flavour" / anchor field                                                                                           | `create-persona-view.tsx` (`name="origin-flavor"`)                                    | (a) add `profiles.origin_flavor`; (b) drop the field                                                                        | locked |
| SD-5  | Contact vault collects Instagram + a chat handle                                                                          | `create-persona-view.tsx` (`name="instagram"`, `name="chat"`)                         | (a) map chat → `contact_details.whatsapp`; (b) keep only a generic `other jsonb`; (c) both                                  | locked |
| SD-6  | `posts.notes` + `hasComment` (comment counts)                                                                             | `posts/data.ts`                                                                       | (a) drop both (comments are out of scope — no chat); (b) keep as always-empty dead UI                                       | locked |
| SD-7  | `posts.badgeIcon`, `posts.roleText`, `posts.state`, the `PostAuthorId` author union                                       | `posts/data.ts`                                                                       | (a) viewer-derived / format-only, no columns; (b) columns                                                                   | locked |
| SD-8  | Profile dossier chrome: `dossierId`, `TRUST_SCORE`, `PROFILE_METRICS`                                                     | `profile/data.ts`                                                                     | (a) mock-only, not persisted; (b) a table                                                                                   | locked |
| SD-9  | `connections` display extras: `neighborhood`, `region`, `badge`, `connectedSince`, `tags`                                 | `connect/data.ts`                                                                     | (a) derive/format from existing rows; (b) columns                                                                           | locked |
| SD-10 | Marketplace `category` ("controlled list", undefined) + `availability` values                                             | `marketplace/data.ts`, PRD OQ-8                                                       | (a) `text` + check constraint; (b) enum. Freeze the value list either way                                                   | locked |
| SD-11 | `price: number` in USD dollars vs `price_cents` + `currency`                                                              | `marketplace/data.ts`, PRD OQ-9                                                       | (a) single configured currency (`price_cents` + fixed `currency`); (b) multi-currency                                       | locked |
| SD-12 | Admin **Settings** (FR-9.5) has no table anywhere in the plan                                                             | PRD §5.9                                                                              | (a) add `platform_settings`; (b) explicitly defer FR-9.5                                                                    | locked |

> **S3 revision (2026-10-19):** `20261017120000_s3_contact_channels.sql` (from
> the UI update) supersedes two rows above — **SD-4 is reversed** (the anchor
> field and `profiles.origin_flavor` are dropped) and **SD-5 is widened** to
> separate channels: `contact_details.whatsapp` + `instagram` +
> `other {telegram,facebook,tiktok,x}`, with **at least one channel required**
> (Zod + RPC, fail closed). See `api-layer-decisions.md` §4d.

## 2. Config corrections (applied)

- **Password policy (CFG-1, done).** `supabase/config.toml` now ships
  `minimum_password_length = 8` + `password_requirements =
"lower_upper_letters_digits"`, so the API rejects a weaker password than the
  register/reset UI allows.
- **`enable_confirmations = false`** (CFG-2) is set locally — admin approval is
  the single gate. Closed **for local**; re-decide at the cloud cutover.

## 3. Migration — `supabase/migrations/20261016000000_initial_schema.sql`

- **Enums** (PRD §6.1): `approval_status` (`pending|approved|rejected|suspended`),
  `app_role` (`user|admin`), `connection_status` (`requested|accepted|declined`),
  `moderation_status` (`visible|removed`), product `availability`, report
  `target_type` / `status`.
- **Tables** exactly as PRD §6.1:
  - `profiles` — 1:1 `auth.users`, PK = `auth.users.id` (ON DELETE CASCADE);
    `display_name`, `country_code`, `city`, `neighborhood`, `avatar_url`,
    `bio_en`, `bio_es`, `origin_flavor`, `date_of_birth`, `languages jsonb`,
    `interests text[]`, `badge`, `approval_status`, `role`, `submitted_at`,
    `reviewed_at`, `reviewed_by`, timestamps (the SD-1…SD-9 choices).
  - `contact_details` — separate 1:1 (so RLS can gate it), PK = `profile_id`.
  - `connections` — `requester_id`, `recipient_id`, `status`.
  - `posts` — `author_id`, `image_path`, `caption`, `moderation_status`,
    `removed_by`, `removed_at`.
  - `post_likes` — PK `(post_id, user_id)`.
  - `marketplace_products` — `price_cents` + `currency`, `category`,
    `availability`, `contact_information`, `is_published`, `created_by`.
  - `marketplace_product_images` — `product_id`, `storage_path`, `sort`.
  - `reports` — `reporter_id`, `target_type`, nullable `target_user_id` /
    `target_post_id`, `reason`, `details`, `status`, resolver audit.
- **Constraints:**
  - `connections`: `requester_id <> recipient_id`; unique unordered pair via an
    index on `(least(requester_id, recipient_id), greatest(...))`.
  - `reports`: exactly one of `target_user_id` / `target_post_id` is non-null,
    matching `target_type`.
  - `updated_at` trigger on every table.
  - **Foreign keys + delete behaviour** (missing from the original draft):
    `profiles.reviewed_by → profiles.id`; `posts.author_id` / `posts.removed_by →
profiles.id`; `connections.requester_id` / `recipient_id → profiles.id`;
    `post_likes.post_id → posts.id`, `post_likes.user_id → profiles.id`;
    `marketplace_products.created_by → profiles.id`;
    `marketplace_product_images.product_id → marketplace_products.id`;
    `reports.reporter_id` / `target_user_id` / `resolved_by → profiles.id`,
    `reports.target_post_id → posts.id`. Choose CASCADE vs SET NULL vs RESTRICT
    deliberately — deleting a `profile` cascades to its `contact_details`,
    `post_likes` and `posts`, but a `posts` removal via moderation is a soft
    `moderation_status` flip, not a delete.
- **RLS helper functions** (PRD §7.2) — `security definer`, `stable`, pinned
  `search_path`, `set search_path = ''`: `is_admin()`, `is_approved()`,
  `are_connected(a uuid, b uuid)`.
  - `is_approved()` needs no admin special-case: an admin's profile is `approved`
    by definition (PRD §3.2), so the seed/migration must mark the bootstrap admin
    approved. `is_admin()` therefore implies `is_approved()`.
- **RLS enabled on every table** + policies per the PRD §7.3 matrix. Hard rules:
  `contact_details` readable only by owner / an accepted connection / admin;
  feed readable only by approved users; marketplace writes admin-only; reports
  readable by reporter / admin.
  - A **pending / rejected / suspended** user must still `select` their **own**
    `profiles` row (the `/verify` page reads `approval_status`) — keep "own
    record" readable regardless of status.
  - **Decline → re-request (OQ-2 / FR-5.6) is an `UPDATE` of the existing row**,
    never a new insert: the unique unordered-pair index forbids the insert path.
    Likewise disconnect (OQ-3) sets `status = declined`. The state machine lives
    in the Server Action (S2/S3), not in a permissive `INSERT` policy.
- **No signup trigger.** Per PRD §7.5 ("session, no profile → onboarding"), the
  `profiles` row is created on persona submit (S2/S3), not at `signUp` — so
  "no profile" keeps meaning "still onboarding".
- **Storage buckets defer to S4** (`avatars`, `post-images`, `product-images`).

## 4. Seed — `supabase/seed.sql` (LOCAL DEV ONLY)

Runs on `db reset` / `db seed` only (never `db push`). Marked loudly.

- A demo **admin** (`admin@globallinkup.test`) and a set of pre-confirmed local
  accounts sharing the password `Password123` (bcrypt via `pgcrypto`), so no
  email is needed. Deterministic UUIDs let the pgTAP suite target them.
- Profiles mirroring today's mock personas (Sofia / Mateo / Camila / Lucas /
  Elena), a few posts + likes, marketplace products, and one accepted
  connection — so S3 can flip fixtures to real rows without inventing data.
- **The §1 decisions change the seed too.** If `age` / `languages` / bilingual bio
  survive, they must be seeded; if a field is dropped from the UI, the mock
  fixtures must be trimmed in the same change or the mapping tests will drift.
- Seed enough state for S2 e2e (SA-4): an admin, a **pending** user, an
  **approved** user, and one account for the reset flow — all pre-confirmed so no
  email is needed.

## 5. RLS tests — `supabase/tests/` (`supabase test db`, pgTAP)

- anon cannot read `contact_details`;
- a `pending` user cannot read the feed;
- `contact_details` visible only to owner + accepted connection + admin;
- non-admin cannot insert/update `marketplace_products`;
- duplicate/ordered pair rejected by the connections constraint;
- a reporter cannot read another user's reports;
- a pending user cannot self-approve (privilege guard trigger);
- an approved user can edit own public fields and stays approved.

## 6. Resolved decisions

- **RLS tests:** pgTAP via `npm run db:test` (`supabase test db`) — 32 assertions
  in `supabase/tests/rls.test.sql`, all green.
- **Seed accounts:** `admin@globallinkup.test` + pending/approved/reset users,
  all pre-confirmed, password `Password123`.
- Everything in **§1 (SD-1…SD-12)** and **§2 (CFG-1/CFG-2)** is locked — see
  [`api-layer-decisions.md`](./api-layer-decisions.md) §4.
