# Commit convention

This repository enforces [Conventional Commits](https://www.conventionalcommits.org)
with **commitlint**, run locally by a husky `commit-msg` hook and in CI on pull
requests. The configuration in `commitlint.config.mjs` is the contract.

> **Agents:** read the rules, validate before committing, and never bypass the
> hook with `git commit --no-verify`. See the "Agent workflow" section below.

## Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer(s)]
```

- **type** — required, lower-case, one of the list below.
- **scope** — optional here, but if present it must be from the allowed list.
- **subject** — required, imperative mood, lower-case start, no trailing period.

Example:

```
feat(connect): add accept/decline state machine

Adds the connections table, RLS policies, and server actions for the
request/accept/decline flow.

Closes #42
```

## Types

| Type       | Use for                                                 |
| ---------- | ------------------------------------------------------- |
| `feat`     | A new user-facing feature                               |
| `fix`      | A bug fix                                               |
| `docs`     | Documentation only                                      |
| `style`    | Formatting/whitespace, no behavior change               |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `perf`     | Performance improvement                                 |
| `test`     | Adding or fixing tests                                  |
| `build`    | Build system or dependencies                            |
| `ci`       | CI configuration                                        |
| `chore`    | Other changes that don't modify src or test files       |
| `revert`   | Revert a previous commit                                |

## Scopes

Scope is optional. When provided it must be one of:

`auth` · `persona` · `posts` · `connect` · `marketplace` · `admin` · `i18n` · `ui` · `db` · `config` · `deps` · `docs` · `ci`

Add new scopes in `commitlint.config.mjs` when a genuinely new area appears.

## Rules commitlint enforces

- `type-enum`, `type-case` — type from the list, lower-case.
- `scope-enum` — scope from the list above.
- `header-max-length` — header ≤ 100 characters.
- `subject-case` — subject is not sentence/Pascal/UPPER case (starts lower-case).
- `subject-full-stop` — no trailing period.
- `body-leading-blank` — blank line between subject and body.

## Agent workflow

```bash
# 1. See the resolved rules
npx commitlint --print-config json

# 2. Validate a candidate message before committing (exit 0 = valid)
printf '%s' "fix(auth): reject empty passwords" | npx commitlint
```

If the `commit-msg` hook rejects a commit, the output names each violated rule in
brackets (e.g. `[subject-case]`, `[type-enum]`). **Fix only the named rules and
retry.** Do not use `--no-verify`.

## Hooks

- `pre-commit` → `lint-staged` (ESLint `--fix` + Prettier on staged files).
- `commit-msg` → `commitlint --edit`.

## CI

The `commitlint` job lints every commit in a pull request's range. See
`.github/workflows/ci.yml`.
