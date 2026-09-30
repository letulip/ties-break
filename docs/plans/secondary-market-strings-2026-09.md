---
type: plan
status: current
area: economy
last-reviewed: 2026-09-30
---

# The secondary market – the strings table

Every sentence the secondary-market wave adds for a player to read, laid out for his wording pass: id, where it lives, the
sentence, and its status. The wave's plan ([secondary-market-builder-2026-09.md](secondary-market-builder-2026-09.md)) asks for
this file: nothing he already reads changes, and every new sentence is listed here so that any of them can be rewritten.
`tests/secondary-market-strings-roundtrip.test.ts` holds each row to the sentence in the code, letter for letter, so the table and
the code go red together whichever one is edited – **the table and that test own the count; this prose states none.**

Every row is a draft until he has read it. Sections are added step by step, and a step that ships no new sentence adds none.

## 1. Step S2 – putting a thing on the market, and taking it off

`src/engine/world/shop.ts`: four refusals and two lines in the family's Money feed.

The four refusals are the engine's answers to a request the screens will not normally make – a stale tab, a hand-built
request – so a player should rarely read one. Two more refusals in the same commands reuse sentences that already shipped, so
they are not new copy and are not tabled: «The family does not own that» for something the family does not hold, and «That one
cannot be sold right now» for a contract that is still being delivered.

`${label}` is what the shelf calls the thing. For the academy it is the name the family gave it, and the stage's own name if it
never named it.

| id | home | text | status |
| --- | --- | --- | --- |
| SM1 | `src/engine/world/shop.ts` | That is money, not a thing – it cannot be put on the market | `DRAFT` |
| SM2 | `src/engine/world/shop.ts` | The academy cannot be put on the market while a stage is still being built | `DRAFT` |
| SM3 | `src/engine/world/shop.ts` | That is already on the market | `DRAFT` |
| SM4 | `src/engine/world/shop.ts` | That is not on the market | `DRAFT` |
| SM5 | `src/engine/world/shop.ts` | Put on the market: ${label} | `DRAFT` |
| SM6 | `src/engine/world/shop.ts` | Taken off the market: ${label} | `DRAFT` |

- **SM1** – the savings deposit and the index fund are money, not a thing, so they never go on the market and keep today's
  instant partial sale. Both commands refuse them with this sentence.
- **SM2** – the academy is one lot: listing it means every stage, so it cannot be listed while any stage is still being built.
  The popup will warn before this; the engine enforces it.
- **SM3** and **SM4** – putting a thing on the market twice, and taking off a thing that is not on it.
- **SM5** and **SM6** – the two lines in the Money feed. They carry no amount, because no money moves.
