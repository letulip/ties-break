---
type: plan
status: draft
area: wave/flags-grant
canonical: false
last-reviewed: 2026-08-10
---

# Wave plan: the flags, then the grant

**Branch: fresh from `main` after the owner merges `wave/dials`.** Owner's instruction, 10.08:
«Оба этих плана в свежей ветке от main после моего мержа.» One branch, both slices, in this order –
the second cannot be measured without the first.

## Why the order is not a preference

`tools/nation-depth.ts`, measured: **177 of 199 cohort juniors (89%) carry a flag that is not hers**,
and `selectEntrants` filters the domestic rungs by age, by condition and by ranking percentile –
never by nation. So `standing.nationalRank` is a place in a field that is 89% foreign.

The grant is awarded on national rank. **Build it first and it is awarded on nothing.**

---

## SLICE 1 – FLAGS: a national championship is contested by nationals

### 1.1 The rule
The three domestic rungs (`local`, `regional`, `national`) draw only players whose `nation` matches
`world.profile.country`. The international rungs (J and W) are untouched.

### 1.2 Where it lands
`selectEntrants` (season/tournament.ts), on the **universe**, beside `ofAge` – the same place the age
gate and the week-exclusivity rule land, and for the reason those two are already there in comments:
**both backfills reach OUTSIDE the entrant window**, so a rule they could walk around would be no
rule at all. A nation filter applied after the band would be handed straight back by the
tired-elite backfill.

### 1.3 The fillability problem – ⚠ AND IT ALREADY FIRED, BEFORE A LINE WAS WRITTEN

**The rule must yield to fillability**, in exactly the ladder the age gate already uses:

    same-nation and of-age  →  of-age  →  everybody

A draw that cannot be filled is a crash, not a compromise. This is the third rule to be added to that
cascade and it goes FIRST in it (the most specific), so it is also the first thing dropped.

⚠ **AT `national` IT WOULD DROP EVERY SINGLE TIME.** Measured against the real constants:

| rung | `drawSize` | her nation's juniors | can the rule hold? |
|---|---|---|---|
| `local` | **8** | ~17–22 across 13–19 | yes, comfortably |
| `regional` | **16** | ~17–22 | yes, tightly |
| `national` | **32** | ~17–22 | **no – never** |

And it is not her nation's luck: across 8 worlds the **best-supplied nation in the world averages
19.4 juniors** over the whole 13–19 band (`tools/nation-depth.ts`). **No nation in our world can fill
a 32-draw on its own.** So a nation filter at `national` would be dropped at every event, silently,
and ship as a no-op that reads like a feature.

**This is a decision for the owner and it comes BEFORE slice 1 starts**, because every option is a
different piece of work:

* **(a) `national` drawSize 32 → 16.** One constant, and 16 is a realistic national championship.
  ⚠ Not free: `TierDef.points` is indexed by finish position, so a shorter bracket re-prices the rung,
  and the event's sub-stream moves. Needs its own measurement.
* **(b) Grow the cohort.** `COHORT_SIZE` is 199 and the MAIN weekly draw budget is
  `base + 4 × COHORT_SIZE` – so this touches invariant 2's plausibility bound and the frozen capture.
  The most expensive option.
* **(c) Skew `NATION_WEIGHTS` toward her country.** Cheap, and it makes the rest of the world thinner
  to make her nation thick. Realistic for a large tennis nation; wrong if she is Portuguese.
* **(d) Flags at `local` and `regional` only, `national` stays international.** Honest about the
  world we have, but it leaves the grant's denominator exactly as broken as it is today – so it also
  postpones slice 2.

**My recommendation is (a)**, with the points table re-measured in the same slice: it is the only
option that fixes the denominator without touching world generation or the RNG budget.

### 1.4 RNG
⚠ **The domestic rungs currently have NO age gate and their sub-streams are byte-identical to
pre-cap ones** (the comment in `selectEntrants` says so explicitly). This slice changes the candidate
COUNT on those three rungs, so their event sub-streams move and **domestic draws in existing careers
will differ**. That is unavoidable and must be stated in the commit rather than discovered.

**Nothing on MAIN.** Every draw here is on `seed:aitour:<id>` / `seed:kidtour:<id>`. The frozen
capture (41550 / `e6b0c709`) must re-derive byte-for-byte – verify, do not assume.

### 1.5 Tests
* `selectEntrants` at each domestic rung returns only compatriots when the pool allows.
* The fillability cascade: shrink the pool below `drawSize` and assert the draw still fills.
* J and W rungs unchanged – a mounted assertion that a J30 field is still international.
* MAIN capture re-derives.

### 1.6 Surfaces
Opponent flags already render (`Snapshot.opponent.nation`). Nothing new to draw – the flags simply
stop being wrong.

---

## SLICE 2 – GRANT: the federation pays the family

Spec: `docs/specs/federation-grant.md`. Build only after slice 1 is green, because ship rule 2 reads
the national table.

### 2.1 Engine
* `reviewFederation(world)` at the season wrap, beside `reviewAcademy` – the same cadence, the same
  place in the tick.
* Award = **the best k of her nation in her age band**, off the national table. Scarcity, never a
  threshold (§2 of the spec; the `kidRank <= 30` sponsorship bar that fired for nobody is the
  precedent).
* `needFactor` prices the AMOUNT and never the AWARD (§2a). A guard test asserts this directly by
  running the same seed at three backgrounds and comparing award rates.
* Payment is an `income` event with its own category, at a known week, for a stated amount – **a
  line, not a discount** (§1a; this is task #90's lesson applied before the mistake repeats).

### 2.2 Schema
One field: the live grant `{ seasonIndex, amountCents }` or null. **Bump `SAVE_SCHEMA_VERSION`
(48 → 49), append-only migration, golden fixture** – CLAUDE.md invariant 3, all three parts.
Migration is a pure default: `null`, i.e. a career that has never been reviewed holds no grant.

> ⚠ **THIS WAVE NOW TAKES 49, NOT 48.** It reserved 48 while it was still documents, and the birthday
> slice shipped first and took it – `SAVE_SCHEMA_VERSION` is **48** in code today (`birthdays`,
> `docs/specs/birthday-and-gifts.md`). The rule that decided it is "whoever lands in code first owns
> the number"; the spec that had assumed the other order has been corrected the same way. Nothing here
> depends on which integer it is, and migrations are append-only either way.

### 2.3 RNG
The award is a consequence of results, not a player choice. If any draw is needed (tie-breaking),
it goes on a purpose-scoped sub-stream. Invariant 2; MAIN untouched.

### 2.4 Measurement, before merge
`tools/two-cells.ts` grows a grant arm; `tools/failure-modes.ts` is the tail read. The six ship rules
in the spec's §4, each with its number:
1. award rate flat across backgrounds
2. reaches `working` girls in the top national decile
3. **bankruptcy falls but does not reach zero** – measured baseline: `working` self-coached goes
   broke in **100%** of careers over four seasons
4. the unfunded arm does not move
5. MAIN capture holds
6. grant income shown == grant income paid, to the cent

### 2.5 Surfaces
Money breakdown line, and one sentence wherever the season review speaks. **No new screen.**

---

## What is NOT in this wave

* The academy rewrite. `docs/specs/academy-invitation.md` keeps its `status: draft` and gets one note
  at the top recording that the research overturned its premise and the grant replaces it. Deleting
  a spec loses the reasoning; the round ledger's own lesson.
* The 14U team event. Separate, and its own decision.
* Anything about form or slumps (see the failure-modes finding) – that is a design conversation, not
  a slice.

## Sequencing

    day 1   slice 1 engine + tests + MAIN re-derive
            → measure nation depth against real draw sizes; report before going on
    day 2   slice 2 engine + schema v49 + migration + fixture
    day 3   the six ship-rule measurements, spec updated with predicted vs measured
            → one report, then the owner's gate

⚠ **Gate between the slices.** If slice 1's fillability cascade drops to "everybody" more than
occasionally, the world-generation question (§1.3) comes back to the owner BEFORE the grant is built
on top of it.
