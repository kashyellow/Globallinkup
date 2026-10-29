# Architecture decision records

Short, dated records of decisions that change the data model, the security
boundary, or a locked product rule. One file per decision, numbered in order.
A record is not a plan: it states the context, the decision, and what it costs.

| #                                           | Title                                 | Status   | Date       |
| ------------------------------------------- | ------------------------------------- | -------- | ---------- |
| [0001](./0001-content-lifecycle.md)         | Post and comment lifecycle            | proposed | 2026-10-27 |
| [0002](./0002-granular-admin-rbac.md)       | Granular admin roles and capabilities | proposed | 2026-10-27 |
| [0003](./0003-audit-log-and-pii.md)         | Audit log and PII-safe logging        | proposed | 2026-10-27 |
| [0004](./0004-notifications.md)             | In-app notifications                  | proposed | 2026-10-27 |
| [0005](./0005-pii-access-boundaries.md)     | PII access boundaries                 | proposed | 2026-10-27 |
| [0006](./0006-theme-modes.md)               | Light, dark, and system themes        | proposed | 2026-10-27 |
| [0007](./0007-global-countries.md)          | Global country coverage               | proposed | 2026-10-27 |
| [0008](./0008-remove-cultural-interests.md) | Remove cultural interests             | accepted | 2026-10-30 |

## Template

```markdown
# ADR NNNN — Title

- **Status:** proposed | accepted | superseded by ADR NNNN
- **Date:** YYYY-MM-DD
- **Related:** links

## Context

What is true today, with file paths. Why a decision is needed.

## Decision

What we will do, in enough detail to implement without guessing.

## Consequences

What gets easier, what gets harder, what we accept as residual risk.

## Alternatives considered

What we rejected and why.

## Follow-ups

Migrations, tests, docs, or work that must land with (or after) this decision.
```
