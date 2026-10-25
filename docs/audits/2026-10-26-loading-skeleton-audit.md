# Loading & Skeleton Audit

- **Status:** implemented
- **Date:** 2026-10-26
- **Scope:** Route loading states, skeletons, async action indicators, and
  navigation pending states.
- **Not in scope:** data model changes, report rate limiting (already handled),
  new features, and visual redesign beyond loading feedback.

---

## 1. Baseline

Already present and working:

- `loading.tsx` exists for the main app shell, Discover, Connections, Posts,
  Post detail, Marketplace, Profile, Persona detail, Admin, Auth, and Public
  routes.
- `error.tsx`, `not-found.tsx`, and the global `RefreshProvider` top progress bar.
- Auth forms, create/edit persona, post composer, comments, Connect, and most
  admin actions already have spinner / disabled / `aria-busy` states.
- `MediaImage` provides image shimmer and an error fallback.
- `LinkPending` is used by the desktop navbar and bottom navigation.
- Discover and Marketplace search show a spinner while fetching.

The gaps below are about consistency and a few missing boundaries, not a broken
loading system.

---

## 2. P1 — user-visible gaps

### 2.1 `/profile/edit` has no route-specific skeleton

**Evidence**

- `src/app/[locale]/(app)/profile/edit/page.tsx` exists.
- `src/app/[locale]/(app)/profile/edit/loading.tsx` does not exist.
- The parent `profile/loading.tsx` uses `DossierSkeleton`, whose shape is a
  dossier/archive, not the edit form.

**Impact**

The edit route can show a misleading dossier skeleton while the form loads.

**Implementation plan**

- Add `src/app/[locale]/(app)/profile/edit/loading.tsx`.
- Use a form-shaped skeleton:
  - avatar/crop panel,
  - name/headline,
  - country/city/date of birth,
  - short bio,
  - interests,
  - language rows,
  - contact vault,
  - submit action.
- Reuse `PageSkeleton` + `Skeleton` and keep the same horizontal rhythm as the
  form.

**Acceptance**

- Opening `/profile/edit` on a slow connection shows form-shaped placeholders,
  not dossier/archive blocks.
- No layout shift when the real form arrives.

---

### 2.2 `/create-persona` inherits the generic auth skeleton

**Evidence**

- `src/app/[locale]/(auth)/loading.tsx` renders a short auth-card skeleton.
- `create-persona` is a long multi-section persona form.

**Impact**

The step-2 transition looks like another login card rather than the persona
form.

**Implementation plan**

- Add `src/app/[locale]/(auth)/create-persona/loading.tsx`.
- Mirror the form sections:
  - photo block,
  - identity/location,
  - headline,
  - languages,
  - interests,
  - short bio,
  - contact vault,
  - footer actions.

**Acceptance**

- Navigating from step 1 to step 2 shows a persona-form skeleton.
- Login/register/forgot/reset keep the existing auth-card skeleton.

---

### 2.3 `ReportDialog` has no spinner or `aria-busy`

**Evidence**

- `src/features/reports/components/report-dialog.tsx`
- `current.state === "sending"` only changes the submit label.
- The dialog/form does not expose a busy state.

**Impact**

A report submission can feel unresponsive, especially on a cold server action.
Screen readers are not told the dialog is working.

**Implementation plan**

- Import `Spinner`.
- Add `aria-busy` to the form or dialog while sending.
- Disable reason radios and details textarea while sending.
- Keep the inline error / success state.
- Add a test assertion for the pending label/spinner where practical.

**Acceptance**

- Clicking Submit visibly enters a pending state.
- Inputs cannot be changed mid-submit.
- Success and error states remain accessible.

---

### 2.4 `AdminSearchForm` navigates without pending feedback

**Evidence**

- `src/features/admin/components/admin-search-form.tsx`
- Calls `router.push()` directly from a plain form submit.
- No `useTransition`, no disabled state, no spinner.

**Impact**

On a slow server, Search/Clear appears to do nothing until the route updates.

**Implementation plan**

- Wrap navigation in `useTransition`.
- Disable the submit and clear buttons while pending.
- Show a small `Spinner` in the submit button.
- Keep the current query and focus stable.
- Preserve `extra` params such as moderation target.

**Acceptance**

- Search and Clear show a pending state.
- Duplicate submissions are prevented.
- URL filter/page semantics remain unchanged.

---

### 2.5 Admin links do not use `LinkPending`

**Evidence**

- `src/features/admin/components/admin-tabs.tsx`
- `src/features/admin/components/admin-status-links.tsx`
- `src/features/admin/components/admin-pagination.tsx`

These are route navigations, unlike the admin search form, but none include
`LinkPending`.

**Impact**

Admin tab/status/page navigation has no immediate feedback until the route
boundary renders.

**Implementation plan**

- Add `relative` to each link class where needed.
- Render `<LinkPending />` inside each `Link`, matching the navbar and bottom nav.
- Do not add pending overlays to destructive action buttons.

**Acceptance**

- Admin tabs, status filters, and pagination show a subtle pending overlay.
- Active state and accessible current-page/link attributes are unchanged.

---

## 3. P2 — skeleton consistency

### 3.1 Discover and Connections loading use plain divs

**Evidence**

- `src/app/[locale]/(app)/discover/loading.tsx` uses a raw `div` with
  `bg-surface-container-highest/70`.
- `src/app/[locale]/(app)/connections/loading.tsx` does the same for the header
  strip.

**Impact**

These blocks do not shimmer, unlike the rest of the app.

**Implementation plan**

- Replace those blocks with `Skeleton` from `@/components/ui/skeleton`.
- Keep existing sizes and spacing.

**Acceptance**

- Discover search strip and Connections header strip shimmer consistently.

---

### 3.2 `AdminSkeleton` does not match the new admin layout

**Evidence**

- `src/components/ui/skeleton.tsx` → `AdminSkeleton`.
- Current skeleton has three pills and generic rows.
- Current admin has a header, five tabs, dashboard cards, filter toolbars, and
  different row shapes per route.

**Impact**

Admin loading looks unrelated to the page that arrives; filters/tabs may jump.

**Implementation plan**

Update `AdminSkeleton` or add per-route skeletons:

- dashboard: four metric cards + secondary stats,
- users: search/status toolbar + user cards,
- marketplace: toolbar + product rows,
- moderation: toolbar + report cards,
- interests: search/status tabs + dense rows.

Prefer per-route `loading.tsx` if the shapes diverge enough; otherwise update the
shared `AdminSkeleton` to the new header/toolbar geometry.

**Acceptance**

- Admin loading preserves header/tab/toolbar dimensions.
- No visible jump when data arrives.

---

### 3.3 `DossierSkeleton` still reflects the old archive layout

**Evidence**

- `src/components/ui/skeleton.tsx` → `DossierSkeleton`.
- Profile archive is now a dispatch card grid and Mutual Circles card grid.

**Impact**

The profile loading shape no longer matches the final archive.

**Implementation plan**

- Keep dossier identity/bio/locker blocks.
- Replace the old archive block with:
  - tab rail,
  - two-column dispatch card grid,
  - optional circle-card grid.

**Acceptance**

- Profile loading resembles the current dossier and archive.

---

### 3.4 Raw `<img>` elements bypass shimmer

**Evidence**

Signed-URL images rendered with raw `<img>`:

- `src/features/admin/components/users-tab.tsx` — user avatar
- `src/features/admin/components/marketplace-tab.tsx` — product thumbnail
- `src/features/profile/components/dossier-header.tsx` — profile portrait
- `src/features/shared/connect-dialog.tsx` — target avatar
- `src/features/persona/components/create-persona-view.tsx` — avatar preview
- `src/features/auth/components/register-view.tsx` — marketing/illustrative image

**Impact**

Signed-image loads have no shimmer or unified error fallback.

**Implementation plan**

- Use `MediaImage` for images backed by signed URLs.
- Keep raw `<img>` for local `blob:` previews where loading is effectively
  instant.
- Preserve existing sizes/aspect ratios and object-fit behavior.

**Acceptance**

- Admin rows, dossier portrait, and Connect dialog show shimmer while loading.
- Failed signed URLs fall back consistently.

---

### 3.5 Load-more uses spinners, not skeleton cards

**Evidence**

- Posts, Discover, and Marketplace load-more paths use `Spinner`.
- Post and Marketplace cards are tall, so a spinner leaves a large empty gap.

**Impact**

Not broken, but less polished than the initial skeleton.

**Implementation plan**

- Optional: add 1–2 skeleton cards during load-more for Posts and Marketplace.
- Keep the spinner for Discover’s shorter card grid.
- Do not add fake loading to client-side Profile/Connections load-more; those
  batches are already in memory.

**Acceptance**

- Load-more feels continuous without making the page jump.

---

## 4. P3 — low-priority polish

- `BackLink` (`src/components/layout/back-link.tsx`) has no pending state; browser
  history is usually immediate. Leave unless QA shows a delay.
- Public site-header/footer links have no `LinkPending`; route skeletons cover
  them. Add only if public navigation feels slow.
- `AvatarCropDialog` has no shimmer while the selected image decodes; add a
  background skeleton overlay if needed.
- `BentoGridSkeleton` has an outdated name but already renders the uniform
  marketplace grid; rename only if touching the file.
- `SkeletonText` exists but is underused; use it in admin/comment skeletons where
  it reduces duplication.

---

## 5. Action feedback inventory

### Already good

- Login, forgot password, reset password: submit spinner + disabled state.
- Create/edit persona: submit spinner, `aria-busy`, field errors.
- Post composer: upload/save stages + spinner.
- Comments: pending spinner + disabled composer.
- Connect dialog: spinner + inline error + close-on-success only.
- Like: optimistic state + `aria-busy` + screen-reader error.
- Post/comment delete: confirm dialog with pending state.
- Admin user review, product create/edit/trash/restore, interest review, report
  resolution: per-action pending state and spinner.
- Profile logout: spinner.
- Locale switch: transition pending state.

### Needs work

- Report dialog: spinner + `aria-busy`.
- Admin search form: transition pending state.
- Admin tabs/status/pagination: `LinkPending`.
- Back link: optional pending state.

---

## 6. Test plan

Add or extend tests for:

1. `/profile/edit` renders a form-shaped loading state instead of a dossier
   skeleton.
2. `/create-persona` renders a persona-form skeleton.
3. `ReportDialog` blocks inputs and shows a pending state while sending.
4. `AdminSearchForm` disables Submit/Clear while pending.
5. Admin tabs/status/pagination show `LinkPending` and keep `aria-current`.
6. Discover and Connections loading strips use `Skeleton`.
7. Raw signed images use `MediaImage` and retain fallback behavior.
8. Visual QA at 375, 640, 768, 1024, and 1280 px:
   - no layout jump when skeletons swap to content,
   - no horizontal overflow,
   - reduced-motion makes shimmer static.

Manual slow-network check:

- throttle to Slow 3G,
- open Discover, Posts, Marketplace, Connections, Profile, Admin, and Profile
  edit,
- verify a visible loading state on every transition,
- verify buttons disable and recover on success/error.

---

## 7. Suggested implementation order

1. Add `profile/edit/loading.tsx` and `create-persona/loading.tsx`.
2. Update `AdminSkeleton`, `DossierSkeleton`, and Discover/Connections skeletons.
3. Add `LinkPending` to admin tabs/status/pagination.
4. Add `useTransition` pending feedback to `AdminSearchForm`.
5. Add spinner/`aria-busy` to `ReportDialog`.
6. Replace raw signed-URL `<img>` with `MediaImage`.
7. Optional load-more skeleton cards for Posts/Marketplace.
8. Run format, lint, typecheck, unit, auth e2e, password-recovery e2e, public
   e2e, pgTAP, and build.

---

## 8. Definition of done

- Every route transition shows either a route skeleton or an inline pending
  indicator within one frame.
- No mutation button can be submitted twice while in flight.
- Skeletons preserve the final layout’s height and width closely enough to avoid
  visible jumps.
- Signed-URL images have shimmer and fallback handling.
- The report dialog, admin search, and admin navigation have explicit pending
  states.
- Reduced-motion users get static placeholders rather than animation.
