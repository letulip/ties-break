---
type: reference
status: current
area: process
last-reviewed: 2026-09-29
---

# docs/handoff – the physical wave boundary (the owner's 29.09 law)

A wave CLOSES by writing `<wave>.md` into this directory, and the next wave OPENS in a fresh
session whose first read is that file – never by continuing the old session. One Read costs a
couple of thousand tokens; re-warming a long history costs the history. The law's full text:
[token-discipline.md](../context/token-discipline.md) §4.

Template – short, factual, no narrative:

```markdown
---
type: report
status: current
area: <wave's area>
last-reviewed: <date>
---
# Handoff – <wave> (<date>)

## Shipped
- <one line per landed thing, with the commit sha>

## Open
- <one line per loose end, with where it is written down (spec §, plan step, backlog row)>

## Files touched
- <path> – <half-line why>

## Gates
- check: <verdict> (<log path>) · sim: <verdict> · e2e: <verdict>
```

The file answers the only three questions a fresh session asks: what is DONE, what is OPEN, and
where NOT to re-explore. Anything longer belongs in the spec, the plan or decisions.md – this file
is a pointer card, not a chronicle.
