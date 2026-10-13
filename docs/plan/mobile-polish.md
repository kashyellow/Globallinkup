# Mobile polish — audit & open questions

Living note for the phone-width (browser, not PWA) pass. Written to be picked up
by anyone: what was found, what was fixed, how to re-run the checks, and the one
decision that is still open.

- **Status:** fixed round 3; one open question (§4)
- **Scope:** responsive behaviour at **360 / 375 / 390 / 768 px** (PRD §8.4) and
  touch targets (PRD §8.5). Browser only; PWA is out of scope for now.
- **Both locales:** everything below is verified for **EN and ES** — Spanish text
  is longer, so ES surfaces extra wrapping the English locale hides.

---

## 1. How to audit (re-runnable)

The dev server must be running (`npm run dev`). These are read-only probes; paste
into a shell from the repo root. They write nothing.

**A. Horizontal overflow** (page scrolls sideways) + offscreen elements:

```bash
node --input-type=module <<'EOF'
import pw from "@playwright/test";
const { chromium } = pw;
const BASE = "http://localhost:3000";
const ROUTES = ["/en","/en/login","/en/register","/en/verify","/en/create-persona",
  "/en/discover","/en/posts","/en/marketplace","/en/connections","/en/profile","/en/admin"];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 360, height: 800 }, reducedMotion: "reduce" });
for (const route of ROUTES) {
  await page.goto(BASE + route, { waitUntil: "load" });
  await page.waitForTimeout(200);
  const m = await page.evaluate(() => {
    const vw = innerWidth;
    const inScroller = (el) => { let p = el.parentElement; while (p && p !== document.body) { const s = getComputedStyle(p); if (s.overflowX === "auto" || s.overflowX === "scroll") return true; p = p.parentElement; } return false; };
    let off = 0; for (const el of document.querySelectorAll("body *")) { const r = el.getBoundingClientRect(); if (r.width && r.height && r.right > vw + 1 && !inScroller(el)) off++; }
    return { page: document.documentElement.scrollWidth - vw, off };
  });
  if (m.page > 0 || m.off > 1) console.log(`${route}  overflow=+${m.page} offscreen=${m.off}`);
}
await browser.close();
EOF
```

**B. Chips / labels that wrap to two lines** (icon glyphs excluded — Material
Symbols ligatures otherwise count as a second line):

```bash
node --input-type=module <<'EOF'
import pw from "@playwright/test";
const { chromium } = pw;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 360, height: 800 }, reducedMotion: "reduce" });
await page.goto("http://localhost:3000/en/discover", { waitUntil: "load" });
await page.waitForTimeout(300);
const m = await page.evaluate(() => {
  const isIcon = (n, root) => { let p = n.parentElement; while (p && p !== root) { if ((p.getAttribute("class")||"").includes("material-symbols-outlined")) return true; p = p.parentElement; } return false; };
  const lines = (el) => { const cs=getComputedStyle(el); const lh=parseFloat(cs.lineHeight)||16; const tol=Math.max(5,lh*0.5);
    const w=document.createTreeWalker(el,NodeFilter.SHOW_TEXT); const tops=[]; let n;
    while((n=w.nextNode())){ if(!n.nodeValue||!n.nodeValue.trim()||isIcon(n,el))continue; const r=document.createRange(); r.selectNodeContents(n); for(const x of r.getClientRects()) if(x.height>2&&x.width>0) tops.push(x.top); }
    tops.sort((a,b)=>a-b); let l=0,last=-1e9; for(const t of tops) if(t-last>tol){l++;last=t;} return l; };
  const out=[];
  for (const el of document.querySelectorAll("body *")) {
    const cls = el.getAttribute("class")||""; if(!/rounded-full|font-label/.test(cls)) continue;
    const r = el.getBoundingClientRect(); if(!r.width||r.height<20||r.height>80) continue;
    const t=(el.textContent||"").replace(/\s+/g," ").trim(); if(!t||t.length>46) continue;
    if (lines(el)>=2) out.push(`${Math.round(r.width)}x${Math.round(r.height)} "${t.slice(0,40)}"`);
  }
  return [...new Set(out)];
});
console.log(m.join("\n"));
await browser.close();
EOF
```

**C. Screenshots** — full-page at 360/390 for visual review:
`npx playwright screenshot --viewport-size=360,800 --full-page --wait-for-timeout=800 http://localhost:3000/en/discover /tmp/out.png`
(Add `reducedMotion` via a script if the landing page looks blank — the `Reveal`
on-scroll animation leaves sections at `opacity:0` until they intersect.)

---

## 2. Fixed (round 1–2)

| Area                | Problem                                                                                      | File                                                                  |
| ------------------- | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Landing overflow    | `+20px` sideways at 360/375 — locker-demo segmented control couldn't shrink below its labels | `landing-view.tsx`                                                    |
| Landing hero badge  | pill wrapped to 2 lines                                                                      | `landing-view.tsx` (tracking)                                         |
| Over-padded CTAs    | submit buttons wrapped into 72–96px slabs                                                    | `create-persona-view.tsx`, `persona-dossier.tsx`, `register-view.tsx` |
| Pagination          | collapsed into 3 stacked full-width rows on mobile; showed the _longer_ label below `sm`     | `ui/pagination.tsx`                                                   |
| Marketing header    | brand truncated to "Glob…" at 360                                                            | `layout/marketing-header.tsx`                                         |
| Public header       | tagline truncated                                                                            | `layout/public-header.tsx`                                            |
| Touch targets       | sub-44px controls across headers, footers, auth fields, admin pills                          | several                                                               |
| Form-first ordering | login & create-persona buried the form under promo panels                                    | `login-view.tsx`, `create-persona-view.tsx`                           |
| Admin marketplace   | 820px horizontal-scroll table → card list below `lg`                                         | `admin/marketplace-tab.tsx`                                           |

## 3. Fixed (round 3 — from screenshots)

| Area                      | Problem                                                                                                               | File                                                                 |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Footer vs bottom nav      | fixed tab bar overlaid the footer's last row; `pb-20` was on `<main>`, not around `<Footer>`                          | `(app)/layout.tsx`                                                   |
| Profile actions           | "Share Dossier" wrapped alone, then Edit + Log Out — uneven                                                           | `profile/dossier-header.tsx`                                         |
| Discover "2 Pending"      | chip wrapped ("2\nPending")                                                                                           | `persona/received-requests.tsx`                                      |
| Received-list header      | title wrapped once the chip stopped wrapping                                                                          | `persona/received-requests.tsx`                                      |
| Connection stat chips     | "2 Pending Requests" wrapped                                                                                          | `connect/connections-view.tsx`                                       |
| Feed list header          | title + count wrapped together                                                                                        | `persona/persona-feed.tsx`                                           |
| Posts "View All"          | wrapped                                                                                                               | `posts/posts-view.tsx`                                               |
| Persona pipeline + badges | "01 Account", "256-Bit Vault", privacy badges wrapped                                                                 | `persona/create-persona-view.tsx`                                    |
| Landing hero row          | "Open to connect" + button cramped                                                                                    | `landing-view.tsx`                                                   |
| Profile dispatch stats    | "42 Appreciations" / "Cultural Notes" wrapped                                                                         | `profile/dispatch-card.tsx`                                          |
| Login field labels        | bilingual labels wrapped; helper now drops below                                                                      | `auth/login-view.tsx`                                                |
| Bottom-nav type           | 10px badge / 11px label too small                                                                                     | `layout/bottom-nav.tsx` (12px / 11px)                                |
| Page title scale          | create-persona title was 32px vs 30px elsewhere                                                                       | `persona/create-persona-view.tsx`                                    |
| Marketplace price         | "$120\nUSD"                                                                                                           | `marketplace/marketplace-view.tsx`                                   |
| ES-only overflow          | `Solicitudes Recibidas` title nowrap; `Panel de Control General` breadcrumb; dispatch action row 340px > 320px column | `received-requests.tsx`, `admin/admin-view.tsx`, `dispatch-card.tsx` |

**Verification after round 3:** overflow sweep clean at 360/390 for **EN and ES**;
`format:check`, `typecheck`, `lint` (1 pre-existing `navbar.tsx:195` `<img>`
warning), `build`, and `e2e` (7/7) all pass.

---

## 4. OPEN — typography: "some text too big, some too small"

Measured font sizes in use at 360px (leaf text nodes, per page):

| Page           | sizes (px) → count                         |
| -------------- | ------------------------------------------ |
| landing        | 11, 12, 13, 14, 15, 17, 20, 24, 30, 38     |
| login          | 12, 13, 15, 20, 24, 30                     |
| register       | 12, 13, 14, 15, 20, 24                     |
| verify         | 10, 12, 13, 14, 15, 20, 24, 30             |
| create-persona | 11, 12, 13, 14, 15, 20, 24, 30             |
| discover       | 10, 11, 12, 13, 14, 15, 17, 20, 24, 26, 30 |
| posts          | 10, 11, 12, 13, 14, 15, 17, 20, 24, 30     |
| marketplace    | 10, 11, 12, 13, 14, 15, 17, 20, 24, 30     |
| connections    | 10, 11, 12, 13, 14, 15, 17, 20, 24, 30     |
| profile        | 10, 11, 12, 13, 14, 15, 17, 20, 24, 30     |
| admin          | 10, 11, 12, 13, 14, 15, 20, 24, 30         |

Observations:

- **Smallest tier = 10–11px.** `--text-label-caps` (11px, uppercase + `0.08em`
  tracking) is used 6–15×/page for eyebrows, badges, counters, section numbers and
  the bottom-nav labels. The bottom-nav notification badge was 10px (now 11px).
- **Heaviest tier = 24px**, used 20–52×/page for card and section titles.
- **Page titles** are 30px (`display-md-mobile`) everywhere except the profile
  dossier name at 38px (`display-lg-mobile`) and the landing hero at 38px.
- Hard to pin down because it reads as _inconsistency_ rather than one bad value.

Candidate directions (pick any):

1. **Bump the tiny tier** — change the token `--text-label-caps: 11px` → `12px`.
   One-line change, affects every eyebrow/badge/counter/nav label consistently.
   Re-run probe B first: several now-`whitespace-nowrap` chips may widen past 360.
2. **Shrink the profile name** — `display-lg-mobile` 38px → 30px to match the other
   pages (or keep, if the dossier is intentionally display-sized).
3. **Lighten card/section titles on mobile** — drop 24px → 20px for card titles.
4. **Point at specific screens** — if it's a handful of elements, a screenshot
   naming the page is faster than a global change.

Recommendation: **#1** has the clearest payoff (readability) and the smallest
blast radius; verify ES afterwards because the wider labels wrap sooner.

---

## 5. Known-acceptable wraps (not bugs)

Left as-is on purpose — wrapping a **sentence/heading** is fine:

- `Status: Pending Administrator Review` status pill (`verify-view.tsx`).
- `Unveiled solely after mutual acceptance`, `FEED LANGUAGE: BILINGUAL (EN/ES)`,
  dispatch meta like `Bogotá • Unlocked 4 days ago`.
- Bilingual **field labels** (`Profile Photo / Retrato de Perfil`,
  `Cultural Interests / Afinidades Culturales`).
- Step titles under the verify progress tracker (`03 Human Review`).
- Intentional horizontal-scroll rows (filter pills, profile archive tabs,
  post-composer toolbar) — they use `overflow-x-auto no-scrollbar` and may bleed
  past the page margin; this is by design and excluded by the probe.
- The marketplace `ProductDrawer` `aside` sits off-canvas (`translate-x-full`)
  when closed, so the overflow probe flags it — expected, not a bug.
