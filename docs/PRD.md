# GlobalLinkup — Product Requirements Document

| Field | Value |
| --- | --- |
| **Product** | GlobalLinkup (formerly "Global Amor") |
| **Document** | Product Requirements Document (PRD) |
| **Version** | 0.2 — foundation updates |
| **Status** | Draft; pending stakeholder (client) review |
| **Date** | 2026-10-06 |
| **Source of truth** | `docs/PROJECT.md` (formerly `PROJECT_HANDOVER.md`) — this PRD must not contradict it; where it does, the handover wins until it is explicitly amended |
| **Platform** | Responsive web application |
| **Languages** | English, Spanish (both first-class) |

> This is a **living document**. It converts the handover into concrete, testable requirements, resolves the handover's ambiguities with explicit decisions, and parks genuinely open questions in §13 so a human can confirm them. Nothing in §13 is assumed to be final; each has a proposed default to unblock work.
>
> **Foundation deviations (v0.2):** the project uses **npm** (not pnpm, which v0.1 §9/§10.1 listed); foundational docs (`SPEC.md`, `CONTEXT.md`, `CONSTRAINTS.md`) live under `docs/`; and the runtime is pinned in `mise.toml` to Node `24.21.0`, Supabase CLI `2.119.0`, and Vercel CLI `62.2.0`. Where v0.1 disagrees with these, this note wins.

---

## 1. Product summary

GlobalLinkup is a simple bilingual international people-discovery platform. Users create a **Persona**, discover other people, share **Posts**, send **Connect** requests, and reveal protected social/contact information **only after a mutual connection is accepted**. It also includes an official, **Admin-managed Marketplace**.

### 1.1 North star

> Does this make it easier for a person to discover someone, understand their Persona, decide whether to connect, share a Post, or browse the Marketplace? If not, it probably does not belong in the MVP.

### 1.2 Core pillars

```
PERSONA   POSTS   CONNECT   MARKETPLACE
```

### 1.3 Authentication & roles

```
EMAIL + PASSWORD  →  ADMIN APPROVAL  →  USE PLATFORM
Roles: USER | ADMIN
```

### 1.4 Explicit non-goals

No chat. No community/groups. No user-to-user marketplace. No stories/reels/live. No complex social or matching features. See §12 for the full out-of-scope list.

---

## 2. Goals and non-goals

### 2.1 Goals

1. A warm, human, international, photography-driven consumer experience that feels production-ready.
2. A trustworthy **Persona → Connect → reveal contact** flow with privacy enforced server-side, never by hiding UI.
3. An intentionally small feature set that does each pillar well.
4. Proper EN/ES internationalization from day one (Spanish is not an afterthought).
5. Simple, robust authorization: only `USER` and `ADMIN` roles; enforcement in the database (RLS) with server-side checks.
6. A codebase a coding agent can navigate and extend in small, verifiable slices.

### 2.2 Non-goals (MVP)

- Chat, DMs, threads, real-time messaging, chat notifications.
- Community groups, forums, events, following/followers.
- Stories, Reels, live/video/voice, music, advanced photo editing.
- User marketplace listings, seller/vendor accounts, carts, checkout, payments, orders, shipping.
- AI matchmaking or a complex matching algorithm.
- Sub-admin/moderator/vendor roles.

---

## 3. Users and roles

### 3.1 Roles

| Role | Description |
| --- | --- |
| `USER` | Default. Can create a Persona, discover people, connect, post, browse Marketplace. Sees protected contact info only after mutual connection. |
| `ADMIN` | Everything a `USER` can do, plus the Admin area: user approval/management, post moderation, Marketplace management, reports. |

Only two roles exist. No sub-admin, moderator, vendor, or seller roles.

### 3.2 Account (approval) states

| State | Meaning | Platform access |
| --- | --- | --- |
| `PENDING` | Registered, Persona submitted, awaiting Admin review. | Auth only; sees a pending-approval notice. No feed/discovery/marketplace. |
| `APPROVED` | Approved by Admin. | Full platform access. |
| `REJECTED` | Not approved. | Auth only; sees a rejected notice. May edit Persona and resubmit → `PENDING`. |
| `SUSPENDED` | Previously approved, now restricted by Admin. | Auth only; sees a suspended notice. No platform access. |

`ADMIN` accounts are always `APPROVED`.

### 3.3 Separation of concerns (critical)

Authentication data and Persona data are deliberately separate:

```
Authentication (Supabase auth.users)
    email
    password / credentials
    (account status lives on the Persona/profile record)

Persona / profile
    name, country, city, avatar, bio, interests
    approval status, role

Protected contact details (separate table, RLS-gated)
    social/contact information
```

The email is an authentication identifier and is **not** public on the Persona.

---

## 4. Confirmed decisions

These were agreed during architecture review and are binding for the build unless amended.

| # | Decision | Choice |
| --- | --- | --- |
| D1 | Stack | Next.js (App Router) + TypeScript + Supabase (Postgres/Auth/Storage) on Vercel |
| D2 | Backend/API shape | **Hybrid**: RLS-scoped reads direct to Supabase; privileged/multi-step writes via Next.js Server Actions / Route Handlers; service-role only behind explicit admin checks; RLS as backstop everywhere |
| D3 | Engagement | **Real likes** (`post_likes` + RLS + live counts) |
| D4 | Navigation semantics | **Persona = discover other people**; **Profile = your own identity + account** |
| D5 | Persona editing | **Edit freely, no re-approval**; admins may still review/suspend. Extensible later. |
| D6 | Admin bootstrap | Seed/migration promotes the account matching `ADMIN_EMAIL` to `role = admin` |
| D7 | Local database | `supabase start` (Docker) via mise-managed Supabase CLI; move to cloud once stable |
| D8 | Design skills | `frontend-ui-engineering` primary; `design-taste-frontend` only on public/landing/auth surfaces; all other design skills disabled |
| D9 | Runtime pinning | mise pins Node + Supabase CLI + Vercel CLI; **npm** is the package manager (bundled with Node) (see §10.1) |
| D10 | Email confirmation | **Open** — see OQ-1 |

---

## 5. Functional requirements

Each requirement has an ID (`FR-x.y`) so tests and tickets can reference it. Priority: **M** = MVP, **S** = should, **C** = could/deferred.

### 5.1 Authentication (FR-1)

- **FR-1.1 (M)** Create account with Email, Password, Confirm Password.
- **FR-1.2 (M)** Log in with Email + Password. No Persona fields required at login.
- **FR-1.3 (M)** Log out.
- **FR-1.4 (M)** Forgot password (email a reset link).
- **FR-1.5 (M)** Password reset via link.
- **FR-1.6 (M)** Credentials are managed by Supabase Auth; we never store passwords ourselves.
- **FR-1.7 (M)** New accounts land in `PENDING` after Persona submission and cannot use platform features until approved.
- **FR-1.8 (S)** Rate limiting / abuse protection on auth endpoints.

### 5.2 Account creation & approval (FR-2)

- **FR-2.1 (M)** Two-step onboarding: (1) auth account, (2) Persona creation.
- **FR-2.2 (M)** Persona fields: name, country, city, profile image (avatar), bio, interests, protected social/contact information.
- **FR-2.3 (M)** Submitting the Persona sets `approval_status = PENDING` and records `submitted_at`.
- **FR-2.4 (M)** An approved user's later Persona edits are saved immediately (no re-approval).
- **FR-2.5 (M)** A rejected user can edit the Persona and resubmit → `PENDING`.
- **FR-2.6 (M)** A suspended user cannot access platform features and sees a suspended notice.

### 5.3 Persona (own) — "Profile" (FR-3)

- **FR-3.1 (M)** View own Persona/account (Profile page).
- **FR-3.2 (M)** Edit name, country, city, avatar, bio, interests, and protected contact details.
- **FR-3.3 (M)** Contact details are entered separately and never appear publicly without a connection.
- **FR-3.4 (C)** Persona photo gallery (multiple photos). Deferred — see OQ-7.
- **FR-3.5 (M)** Log out, and access password/account settings from here.

### 5.4 Discovery — "Persona" (FR-4)

- **FR-4.1 (M)** Browse approved Personas in a discovery view.
- **FR-4.2 (M)** Search/filter by name, country, city, and interest. Exact filter set in OQ-6.
- **FR-4.3 (M)** Persona detail view showing public Persona fields and the current Connect state.
- **FR-4.4 (M)** Only `APPROVED` personas are discoverable.
- **FR-4.5 (M)** Protected contact info is **not** returned by the API until a connection is accepted (enforced by RLS, not UI).

### 5.5 Connect (FR-5)

Connect is **not** messaging. There is no private chat.

- **FR-5.1 (M)** Send a Connect request from a Persona.
- **FR-5.2 (M)** Recipient sees incoming requests and can **Accept** or **Decline**.
- **FR-5.3 (M)** Mutual acceptance establishes a connection.
- **FR-5.4 (M)** Only after acceptance does protected contact info become visible to both parties.
- **FR-5.5 (M)** UI states derived per viewer: `NONE` (Connect), `REQUESTED` (Request Sent), `RECEIVED` (Accept/Decline), `ACCEPTED` (Connected), `DECLINED`.
- **FR-5.6 (M)** After a decline, the sender returns to `Connect` (re-request behavior in OQ-2).
- **FR-5.7 (S)** Withdraw/disconnect an accepted connection (re-hides contact info; see OQ-3).
- **FR-5.8 (M)** Duplicate/pending requests between the same pair are prevented (unique unordered pair).
- **FR-5.9 (S)** A request-count badge in navigation (no push/chat notifications; see OQ-4).

Stored connection status is `requested | accepted | declined`; `NONE`/`RECEIVED`/`REQUESTED` are viewer-perspective states, not stored values.

### 5.6 Posts (FR-6)

- **FR-6.1 (M)** A vertical, photography-dominant feed showing author, image, caption, date, and like count.
- **FR-6.2 (M)** Create a Post: upload image + caption + publish.
- **FR-6.3 (M)** Like / unlike a Post; counts are live.
- **FR-6.4 (M)** Posts visible to all `APPROVED` users (see OQ-5).
- **FR-6.5 (M)** Author can delete own Post (soft removal).
- **FR-6.6 (C)** Author can edit caption.
- **FR-6.7 (M)** Admin can review and remove posts; removed posts disappear from the feed.
- **FR-6.8 (M)** No stories, reels, live video, music, or advanced editing.

### 5.7 Marketplace (FR-7)

- **FR-7.1 (M)** Only `ADMIN` can create, edit, delete, publish/unpublish products.
- **FR-7.2 (M)** Product fields: name, price, category, description, image(s), availability, contact information.
- **FR-7.3 (M)** Users can browse, search, and filter products.
- **FR-7.4 (M)** Product detail view.
- **FR-7.5 (M)** Users contact the platform using the provided contact info; no transactions.
- **FR-7.6 (M)** Multiple product images supported.
- **FR-7.7 (M)** No cart, checkout, payment, orders, shipping, or seller accounts.
- **FR-7.8 (C)** Availability values and currency policy — see OQ-8, OQ-9.

### 5.8 Reports & moderation (FR-8)

- **FR-8.1 (M)** Users can report a Post and/or a Persona (final scope OQ-10).
- **FR-8.2 (M)** Admin reviews reports and resolves/dismisses them, optionally taking moderation action.
- **FR-8.3 (M)** Users cannot read or manipulate other users' reports.
- **FR-8.4 (M)** Removing a reported post is an available moderation action.

### 5.9 Admin area (FR-9)

Navigation: **Dashboard · Users · Posts · Marketplace · Reports · Settings**.

- **FR-9.1 (M)** Users: view, review pending accounts, approve, reject, suspend; review Personas.
- **FR-9.2 (M)** Posts: review, remove inappropriate posts, handle reported posts.
- **FR-9.3 (M)** Marketplace: create/edit/delete products, upload images, set price, category, availability, contact info.
- **FR-9.4 (M)** Reports: review, resolve, take moderation action.
- **FR-9.5 (M)** Settings (minimal; e.g. platform/marketplace contact defaults).
- **FR-9.6 (M)** Only `ADMIN` can access Admin operations, enforced server-side/DB-side.
- **FR-9.7 (M)** Dashboard: small summary (counts of pending users, open reports, etc.). Not an enterprise dashboard.

### 5.10 Navigation (FR-10)

- **FR-10.1 (M)** Desktop: `GlobalLinkup · Persona · Posts · Marketplace · EN|ES · Profile`.
- **FR-10.2 (M)** Mobile: approximately four destinations — `Persona · Posts · Marketplace · Profile`; Connect actions live inside Persona/Profile.
- **FR-10.3 (M)** No navigation entries for features that do not exist.
- **FR-10.4 (M)** Admin navigation is separate from the main user navigation.

### 5.11 Internationalization (FR-11)

- **FR-11.1 (M)** English and Spanish, both first-class from the start.
- **FR-11.2 (M)** `EN | ES` language selector.
- **FR-11.3 (M)** All UI text via translation keys; no hardcoded English in components.
- **FR-11.4 (M)** Locale-aware routing (see §8.3) and locale-aware formatting (dates, numbers, prices).
- **FR-11.5 (M)** Key namespaces mirror the product: `common.*`, `auth.*`, `persona.*`, `posts.*`, `connect.*`, `marketplace.*`, `admin.*`, `errors.*`, `validation.*`.

---

## 6. Data model

The handover's conceptual schema (§30) is improved here. All tables use RLS (see §7).

### 6.1 Tables

**`profiles`** (1:1 with `auth.users`)

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` PK | = `auth.users.id` |
| `display_name` | `text` | required |
| `country_code` | `text` | ISO 3166-1 alpha-2 |
| `city` | `text` | |
| `avatar_url` | `text` | storage path/URL |
| `bio` | `text` | |
| `interests` | `text[]` | from seeded controlled tags (+ optional free text) |
| `approval_status` | enum | `pending \| approved \| rejected \| suspended` |
| `role` | enum | `user \| admin`, default `user` |
| `submitted_at` | `timestamptz` | |
| `reviewed_at` | `timestamptz` | |
| `reviewed_by` | `uuid` | → `profiles.id` |
| `created_at`, `updated_at` | `timestamptz` | |

**`contact_details`** (1:1, protected)

| Column | Type | Notes |
| --- | --- | --- |
| `profile_id` | `uuid` PK | → `profiles.id` |
| `whatsapp` | `text` | |
| `instagram` | `text` | |
| `email` | `text` | public contact, distinct from auth email |
| `other` | `jsonb` | arbitrary social links |
| `updated_at` | `timestamptz` | |

> Contact data lives in a **separate table** so RLS can gate it on an accepted connection. Placing it on `profiles` (as §30 suggests) cannot satisfy §31's "do not simply hide it with CSS".

**`connections`**

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` PK | |
| `requester_id` | `uuid` | → `profiles.id` |
| `recipient_id` | `uuid` | → `profiles.id` |
| `status` | enum | `requested \| accepted \| declined` |
| `created_at`, `updated_at` | `timestamptz` | |

Constraints: `requester_id <> recipient_id`; unique unordered pair (unique index on `least(requester_id,recipient_id), greatest(...))`.

**`posts`**

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` PK | |
| `author_id` | `uuid` | → `profiles.id` |
| `image_path` | `text` | storage path |
| `caption` | `text` | |
| `moderation_status` | enum | `visible \| removed` |
| `removed_by`, `removed_at` | `uuid`, `timestamptz` | moderation audit |
| `created_at`, `updated_at` | `timestamptz` | |

**`post_likes`**

| Column | Type | Notes |
| --- | --- | --- |
| `post_id` | `uuid` | → `posts.id` |
| `user_id` | `uuid` | → `profiles.id` |
| `created_at` | `timestamptz` | |

PK `(post_id, user_id)`.

**`marketplace_products`**

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` PK | |
| `name` | `text` | |
| `price_cents` | `integer` | store integer minor units |
| `currency` | `text` | ISO 4217 (policy in OQ-9) |
| `category` | `text`/enum | controlled list |
| `description` | `text` | |
| `availability` | enum | `in_stock \| out_of_stock \| made_to_order` (OQ-8) |
| `contact_information` | `text` | platform contact |
| `is_published` | `boolean` | default false |
| `created_by` | `uuid` | → `profiles.id` |
| `created_at`, `updated_at` | `timestamptz` | |

**`marketplace_product_images`**

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` PK | |
| `product_id` | `uuid` | → `marketplace_products.id` |
| `storage_path` | `text` | |
| `sort` | `integer` | display order |

**`reports`**

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` PK | |
| `reporter_id` | `uuid` | → `profiles.id` |
| `target_type` | enum | `user \| post` |
| `target_user_id` | `uuid` | nullable → `profiles.id` |
| `target_post_id` | `uuid` | nullable → `posts.id` |
| `reason` | `text` | |
| `details` | `text` | |
| `status` | enum | `open \| resolved \| dismissed` |
| `resolved_by`, `resolved_at` | `uuid`, `timestamptz` | |
| `created_at` | `timestamptz` | |

Check constraint: exactly one of `target_user_id` / `target_post_id` is non-null, matching `target_type`.

### 6.2 Relationships

```
auth.users 1─1 profiles 1─1 contact_details
profiles 1─* posts 1─* post_likes
profiles *─* connections (requester/recipient)
profiles 1─* reports
marketplace_products 1─* marketplace_product_images
```

### 6.3 Storage buckets

| Bucket | Read | Write |
| --- | --- | --- |
| `avatars` | public/approved read | owner only |
| `post-images` | approved read | owner only |
| `product-images` | approved read | admin only |

Enforce MIME type and size limits; validate on upload.

---

## 7. Security & authorization

Security is a first-class requirement because the product stores personal information.

### 7.1 Principles

- **Never trust the frontend.** All permissions enforced in the database (RLS) and/or server-side.
- **RLS on every table**, including tables that appear harmless.
- **Fail closed.** A missing policy denies access.
- **Service-role** is used only for admin/bootstrap flows, behind an explicit server-side admin check.

### 7.2 RLS helper functions

`security definer`, `stable`, with a pinned `search_path`:

- `public.is_admin()` → current user has an approved `admin` profile.
- `public.is_approved()` → current user has an `approved` profile.
- `public.are_connected(a uuid, b uuid)` → an `accepted` connection exists between `a` and `b` (either direction).

Helpers avoid recursive RLS evaluation and keep policies readable.

### 7.3 Per-table enforcement (summary)

| Table | Read | Write |
| --- | --- | --- |
| `profiles` | approved users (public fields); own record; admin | owner (own public fields); admin (status/role) |
| `contact_details` | owner, accepted connections, admin | owner; admin |
| `connections` | the two parties; admin | the two parties (state machine); admin |
| `posts` | approved users, visible only | author; admin (moderate) |
| `post_likes` | approved users | owner (own like) |
| `marketplace_products` | approved users (published); admin (all) | admin only |
| `marketplace_product_images` | approved users (published); admin | admin only |
| `reports` | reporter (own), admin | reporter (create own); admin (resolve) |

### 7.4 Backend shape (hybrid — D2)

| Operation | Path |
| --- | --- |
| Feed / discovery / marketplace / persona reads | direct Supabase read (RLS-scoped) |
| Persona + contact writes | Server Action (Zod validate → authorize → mutate) |
| Connect request / accept / decline | Server Action (state machine + unique constraint) |
| Post create / delete / like | Server Action |
| Report create / admin resolve | Server Action |
| Admin user approval, product CRUD | Server Action with `is_admin` check |
| Bootstrap/admin seed | script with service-role (dev) |

Rationale: server-side writes allow rate limiting, auditing, transactions, and keep privileged operations out of public RLS write policies — while RLS still guards every read and acts as a backstop.

### 7.5 Auth gating (middleware)

```
no session            → auth pages
session, no profile   → Persona onboarding
approval_status != approved → /pending notice (or rejected/suspended)
approved              → application
role = admin          → /admin available
```

The same rules are re-checked by RLS server-side.

### 7.6 Compliance (open — see OQ-11)

Age gate, Terms of Service, Privacy Policy, data export/deletion, and GDPR/CCPA posture are **not** currently specified. Flagged for stakeholder decision.

---

## 8. UX, design, and i18n requirements

### 8.1 Design direction

Warm, human, international, social, trustworthy, simple, modern, photography-driven. It should feel like a real consumer product.

### 8.2 Design system

**Colors** (from handover §24):

| Token | Value |
| --- | --- |
| Primary — Warm Coral | `#E86A5B` |
| Text — Warm Charcoal | `#292725` |
| Background — Warm Cream | `#F8F6F2` |
| Surface — White | `#FFFFFF` |
| Soft accent | `#F4DED8` |
| Secondary text | `#716D68` |
| Border | `#E5E0D9` |
| Success | `#2E9B68` |

Deep navy is **not** a primary brand color.

**Typography:** Manrope preferred (Inter fallback). Clear, modern, friendly, highly readable; hierarchy via type, not decoration.

**Anti-patterns to avoid:** purple AI gradients, blue/purple SaaS aesthetics, deep-navy dashboards, glassmorphism, neon, excessive gradients/shadows/floating containers, huge rounded cards, generic AI illustrations, futuristic UI, giant hearts, "find your soulmate" clichés, everything-is-a-pill, excessive decoration.

### 8.3 Internationalization

- Locale-prefixed routes: `/en/...` and `/es/...` (library: `next-intl`), with locale detection and persistence.
- Typed translation keys; namespace per §5.11.
- Spanish copy is authored alongside English; machine drafts are reviewed by a human before launch.

### 8.4 Responsive requirements

Must work at **1440, 1280, 1024, 768, 390, 375, 360** px. Mobile is an intentional interaction design, not a scaled desktop.

### 8.5 Accessibility baseline

Keyboard navigation, visible focus states, proper form labels, accessible buttons, sufficient color contrast, meaningful alt text, touch-friendly targets, semantic HTML, screen-reader-friendly form errors. Accessibility is not sacrificed for visual effects.

---

## 9. Technology & architecture

- **Framework:** Next.js (App Router), React, TypeScript (strict).
- **Backend:** Supabase — Postgres, Auth, Storage, RLS.
- **Server operations:** Next.js Route Handlers / Server Actions (the "bit of API" is native to the framework; no separate service).
- **Styling:** Tailwind CSS + CSS-variable design tokens derived from §8.2; Manrope self-hosted via `next/font`.
- **Components:** small hand-tuned accessible primitives (Radix UI for behavior) — avoid a generic look.
- **Validation:** Zod at every boundary (form input, server action, DB constraints).
- **Types:** generate `database.ts` from the local schema (`supabase gen types`).
- **Testing:** Vitest + Testing Library (unit/component); Supabase-local RLS tests (security); Playwright (e2e + browser verification).
- **Quality gates:** ESLint (flat) + Prettier + husky + lint-staged + commitlint (Conventional Commits).
- **CI (later):** GitHub Actions — typecheck, lint, unit, RLS, build.
- **Deployment:** Vercel (app) + Supabase (data). Env via Vercel; migrations via the repo.
- **Secrets:** `.env.local` gitignored; `.env.example` tracked; never commit secrets.

### 9.1 Proposed repository layout

```
globallinkup/
  docs/{PRD.md, PROJECT.md, SPEC.md, CONTEXT.md, CONSTRAINTS.md, adr/}
  mise.toml  package.json  package-lock.json  tsconfig.json  next.config.ts
  eslint.config.mjs  prettier.config.mjs  .env.example  .gitignore
  AGENTS.md  opencode.json
  supabase/{config.toml, migrations/, seed.sql, tests/}
  src/
    app/[locale]/…            # routes by locale
    app/api/…                 # route handlers where needed
    features/{auth,persona,posts,connect,marketplace,admin}/
    components/{ui,layout}/
    lib/{supabase,i18n,validation}/
    messages/{en,es}.json
    types/database.ts
    styles/tokens.css
  tests/e2e/
  public/
```

---

## 10. Environment & tooling

### 10.1 mise

Project `mise.toml` pins exact versions (already installed locally):

```toml
[tools]
node = "24.21.0"
supabase = "2.119.0"
vercel = { version = "62.2.0", allow_builds = ["esbuild"], trust_policy_excludes = ["undici"] }
```

`npm` (currently 11.19.0) is the package manager and ships with Node, so it is not pinned separately. If mise is unavailable, the same scripts work with any Node ≥ 24 + npm.

### 10.2 Skills strategy

A hierarchy prevents conflicts (handover §39–40):

1. `docs/PROJECT.md` + `docs/PRD.md` + `docs/SPEC.md` + `docs/CONTEXT.md` + `docs/CONSTRAINTS.md` + root `AGENTS.md` — **always override**.
2. Planning: `spec-driven-development`, `planning-and-task-breakdown`, `domain-modeling`, `doubt-driven-development`.
3. Engineering: `incremental-implementation`, **one** TDD skill, **one** review skill, `security-and-hardening`, `api-and-interface-design`, `git-workflow-and-versioning`, `documentation-and-adrs`.
4. UI: **`frontend-ui-engineering`** primary; `design-taste-frontend` only for public/landing/auth surfaces.
5. Productivity: `research`, `retro`, `handoff`.

Known overlaps to resolve by choosing one (do not enable both):

- TDD: `tdd` vs `test-driven-development`.
- Review: `code-review` vs `code-review-and-quality`.
- Design: enable only the two named in (4); all `high-end-visual-design`, `minimalist-ui`, `gpt-taste`, `industrial-brutalist-ui`, `stitch-design-taste`, `imagegen-*`, `redesign-existing-projects` stay off unless requested.

Note: `design-taste-frontend` explicitly excludes multi-step product UI; that is why it is scoped to public/landing/auth only. Some skills are `disable-model-invocation` (user-invoked), e.g. `to-spec`, `to-tickets`, `setup-matt-pocock-skills`. `browser-testing-with-devtools` requires a chrome-devtools MCP server that is not currently configured; Playwright is the fallback for browser verification.

### 10.3 Definition of Done (per feature)

A feature is complete when: UX works; responsive behavior works; loading states exist; error states exist; authorization is correct; database rules are correct; tests exist where appropriate; TypeScript passes; build passes; relevant browser behavior is verified; no obvious accessibility regression exists.

---

## 11. Delivery plan

Work proceeds in small vertical slices: **spec → test → implement → verify → commit**. No feature pillar is built before the foundation is verified.

### Phase 0 — Specification & decisions (this document)

- PRD (this file), then `docs/SPEC.md` + capability map, `docs/CONTEXT.md` glossary, `docs/CONSTRAINTS.md`, root `AGENTS.md`, and ADRs in `docs/adr/` (stack, i18n, RLS, hybrid API).
- Configure the repo for the engineering skills (`setup-matt-pocock-skills`).
- Resolve §13 open questions.

### Phase 1 — Foundation

1. `git init` (when approved); `mise.toml`; `.gitignore`; `.env.example`.
2. Scaffold Next.js + TS strict + App Router + Tailwind.
3. `supabase init` + local stack (Docker).
4. Tooling: ESLint, Prettier, husky, lint-staged, commitlint; scripts `dev/build/lint/typecheck/test/e2e`.
5. Design tokens + Manrope + base layout + accessible primitives.
6. i18n scaffold (next-intl, EN/ES, `EN|ES` switch).
7. Supabase browser/server/middleware clients + typed DB.
8. Auth flows + session middleware + approval gating.
9. Initial migration: `profiles`, `contact_details`, enums, RLS helpers + policies, `ADMIN_EMAIL` seed.
10. Baseline verification: build/typecheck/lint/unit + Playwright smoke; write `AGENTS.md`; record ADRs.
11. **Stop for foundation sign-off.**

### Phase 2 — Account & approval

Persona creation form; pending/rejected/suspended notices; Admin users list + approve/reject/suspend; password reset polish.

### Phase 3 — Persona

Discovery list; search/filter; Persona detail; Connect request/accept/decline; RLS-gated contact reveal.

### Phase 4 — Posts

Feed; create; likes; author delete; Admin post moderation.

### Phase 5 — Marketplace

Listing; search/filter; detail; Admin product CRUD + image upload.

### Phase 6 — QA / production

Security review; responsive + accessibility testing; browser testing; performance; deploy.

---

## 12. Out of scope

Explicitly not to be implemented unless the client changes requirements:

```
Chat · Direct messaging · Community groups · Forums · Stories · Reels
Live streaming · Video calls · Voice calls · User marketplace listings
Seller accounts · Vendor dashboards · Shopping cart · Checkout
Payment processing · Shipping · Complex matching · AI matchmaking
Following/followers · Events · Groups · Advanced creator tools
```

If any agent believes an out-of-scope feature is needed, it must ask before proceeding.

---

## 13. Open questions (for stakeholder review)

Each has a proposed default to keep the build moving. The stakeholder (your friend) should confirm or override.

| ID | Question | Proposed default | Impact |
| --- | --- | --- | --- |
| **OQ-1** | Is Supabase **email confirmation** required, given admin approval already gates access? | Disable email confirmation; admin approval is the single gate | Auth UX, onboarding |
| **OQ-2** | After a connection is **declined**, can the requester send a new request? | Yes — reset the row to `requested` | Connect UX, constraints |
| **OQ-3** | Can an **accepted connection** be withdrawn/disconnected later? | Yes — status → `declined`; contact access re-hides | Connect UX, RLS |
| **OQ-4** | Are there **notifications** for incoming Connect requests? | No push/chat; only a request-count badge in nav | Scope, infra |
| **OQ-5** | Are Posts visible to all approved users, or only connections? | All approved users (discovery feed) | Feed RLS |
| **OQ-6** | Which **discovery filters** are required? | Name, country, city, interest | Search UX, indexes |
| **OQ-7** | Persona **photo gallery** in MVP, or single avatar? | Single avatar; gallery deferred | Schema, storage |
| **OQ-8** | Marketplace **availability** values? | `in_stock`, `out_of_stock`, `made_to_order` | Product schema |
| **OQ-9** | Marketplace **currency** policy (multi-country)? | Store `price_cents` + `currency`; single configured currency, locale-formatted | Product schema |
| **OQ-10** | Report scope: posts only, users only, or both? | Both posts and users | Reports schema/UI |
| **OQ-11** | Compliance: age gate, ToS, Privacy Policy, account deletion (GDPR/CCPA)? | Add age gate + policies + delete-account before launch | Legal, auth, schema |
| **OQ-12** | Interests: controlled tags, free text, or both? | Seeded tags + optional free text | Discovery filters |
| **OQ-13** | Can authors **edit** posts (caption) or only delete? | Delete only (soft), no edit | Posts UX |
| **OQ-14** | What can a **suspended** user still see? | Login to a suspended notice only | Auth gating |
| **OQ-15** | Where should language preference live (cookie, path, profile)? | Path-based `/en` `/es` with persistence | i18n |

---

## 14. Glossary

| Term | Meaning |
| --- | --- |
| **Persona** | A user's public identity on GlobalLinkup. Also the discovery destination ("Persona" = browse others). |
| **Profile** | The user's own Persona + account area. |
| **Connect** | A mutual-approval request mechanism that unlocks protected contact info. Not messaging. |
| **Connection** | An accepted Connect relationship between two users. |
| **Protected contact info** | Social/contact details readable only by the owner and accepted connections. |
| **Marketplace** | Official, Admin-managed product catalog. Not user-to-user. |
| **Post** | An image + caption shared to the feed. |
| **Approval** | Admin review that moves an account from `PENDING` to `APPROVED`/`REJECTED`. |

---

## 15. Appendix — traceability to the handover

| Handover § | Covered in PRD |
| --- | --- |
| §4 Authentication | FR-1 |
| §5–7 Account creation / approval / login | FR-2, §3.3 |
| §8–9 Persona & contact privacy | FR-3, FR-4, §6, §7 |
| §10 Connect | FR-5 |
| §11 No chat | §1.4, §12 |
| §12–14 Posts | FR-6 |
| §15–16 Marketplace | FR-7 |
| §17–19 Admin | FR-9 |
| §20–21 Navigation | FR-10 |
| §22 i18n | FR-11, §8.3 |
| §23–28 Design / a11y | §8 |
| §29 Technical direction | §9 |
| §30 Data model | §6 |
| §31 Security | §7 |
| §32 Out of scope | §12 |
| §33 MVP priority | §11 |
| §34–42 Agent workflow / DoD | §10.3, §11 |
| §43 First implementation task | §11 Phase 1 |

---

*End of PRD v0.1 — awaiting review. Until this directory is under version control, revisions will be saved as `PRD.v<n>.md` duplicates.*
