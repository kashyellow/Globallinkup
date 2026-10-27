# Feedback rounds

One file per client review round. Each round records what was asked, what the
code actually does today, the decision we took, and where that decision is
specified. Cross-cutting decisions graduate into `docs/adr/`.

| Round | Date       | Source                                       | Items | Status             | File                                                         |
| ----- | ---------- | -------------------------------------------- | ----- | ------------------ | ------------------------------------------------------------ |
| 1     | 2026-10-27 | Client review after the light-palette launch | 6     | Accepted, in scope | [2026-10-27-client-review.md](./2026-10-27-client-review.md) |

## Conventions

- Keep the client's wording in a quoted block, then answer it plainly. No
  marketing tone: if the code does not do something, say so.
- Numbered items are stable. Follow-ups on item 4 go in the next round's file and
  link back with `(see round 1, item 4)`.
- Anything that changes the data model, RLS, or a locked decision gets an ADR.
- Open questions live in the round file **and** in its "Open questions" table
  until answered, so nothing is silently dropped.
- Scope changes against `docs/CONTEXT.md` ("Out of scope") are called out
  explicitly; this round is what moved granular admin roles in.
