<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# GlobalLinkup — Agent Rules

This project is a bilingual (EN/ES) people-discovery app: Persona · Posts ·
Connect · Admin-managed Marketplace. No chat/DMs.

## Source of truth

Read these before non-trivial planning or implementation:

1. `docs/PROJECT.md` — original handover brief.
2. `docs/PRD.md` — concrete requirements, decisions, open questions.
3. `docs/CONTEXT.md` — always-on summary, stack, deviations, glossary.

Where docs disagree: `docs/PROJECT.md` > `docs/PRD.md` > `docs/CONTEXT.md` >
this file. `docs/CONTEXT.md` is auto-injected every session (see
`opencode.json`); `PROJECT.md`/`PRD.md` are read on demand.

## Commands (npm)

```
npm run dev          # Next dev server
npm run build        # production build
npm start            # serve production build
npm run lint         # ESLint (flat config)
npm run format       # Prettier write
npm run format:check # Prettier check (CI)
npm run typecheck    # tsc --noEmit
npm test             # Vitest (unit/component)
npm run test:watch   # Vitest watch
npm run e2e          # Playwright
```

Prefer the local tooling; the repo uses npm, not pnpm.

## Commit convention

This repository enforces Conventional Commits with commitlint (husky `commit-msg`
hook) and lints commits in CI. Read `docs/COMMITS.md` before committing.

- Read the enforced rules: `npx commitlint --print-config json`
- Validate a message before using it:
  `printf '%s' "<message>" | npx commitlint` (exit 0 = valid)
- If the `commit-msg` hook rejects a commit, fix the rules named in brackets
  (e.g. `[subject-case]`) and retry. **Never use `git commit --no-verify`.**
- Allowed types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`,
  `build`, `ci`, `chore`, `revert`.
- Allowed scopes: `auth`, `persona`, `posts`, `connect`, `marketplace`, `admin`,
  `i18n`, `ui`, `db`, `config`, `deps`, `docs`, `ci`.

The `pre-commit` hook runs lint-staged (ESLint `--fix` + Prettier) on staged files.

## Conventions

- TypeScript strict. App Router. Feature code under `src/features/<feature>/`.
- **React Compiler is enabled.** Write plain React; do not hand-add
  `useMemo`/`useCallback`/`React.memo` unless a specific case needs it.
- All user-facing text goes through `next-intl` keys (`src/messages/{en,es}.json`).
  Never hardcode English in components.
- Validate every boundary with Zod (forms, server actions, route handlers).
- Never trust the client: enforce access in Supabase RLS and/or server-side.
  Contact info is RLS-gated on an accepted connection, never UI-hidden.
- Watched out-of-scope list: `docs/CONTEXT.md` → "Out of scope". Ask before
  building anything in it.

## Notes

- The `nextjs-agent-rules` block at the top of this file is written by
  `next dev`. Do not edit or remove it; add project rules below it.
- `CLAUDE.md` only matters to Claude Code; OpenCode reads this file and
  `opencode.json`.
