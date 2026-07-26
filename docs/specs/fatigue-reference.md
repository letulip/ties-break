# Fatigue reference — the canonical numbers (26.07.2026)

Written because the same question was re-litigated three times, twice from a mislabeled table in a
report. **Every number here is generated from the live `ECONOMY` knobs and pinned by
`tests/fatigueReference.test.ts`** — if a knob moves, that test fails and this doc is stale by
definition. Nothing here is from memory.

## The rule (owner's design, round 9 + round 10)
```
one match  = scoreline + tier surcharge
             scoreline: 1 simple (2 sets, no TB) · 2 with a TB or a 3rd set · +1 more if 3 TB sets
             surcharge: local 0 · regional 1 · national 2 · j30 3 · j60 4 · j300 5
one run    = Σ over matches IN ORDER of ( match cost + cumulative ladder[index] )
             ladder index is 0-based WITHIN THE RUN, so the FIRST match never pays extra:
             the cumulative only starts once she plays more than one match that week.
```
Recovery is the other half and is unchanged: +1 base per week, +0/1/2 slider bonus on match-free
weeks, +2 physio, +1 blackout week; a tournament week pays no base (V2.1).

## Per-match cost
| tier | simple | TB or 3rd set | 3 TB sets |
|---|---|---|---|
| local | **1** | 2 | 3 |
| regional | 2 | 3 | 4 |
| national | 3 | 4 | 5 |
| j30 | 4 | 5 | 6 |
| j60 | 5 | 6 | 7 |
| j300 | **6** | 7 | 8 |

So a match costs **1 to 8**: 1 for a straight-sets Local, 8 for a three-tiebreak epic at J300.

## Whole-run cost, all matches simple
Ladders: `off [0]` · `D [0,1,1,1,1]` · `C [0,1,1,2,2]` (SHIPPED) · `B [0,1,1,2,4]` · `A [0,1,2,3,4]`.
(The owner's written B increments were +1,+1,+2,+3 = 7; the bench ran +8 to match his stated total.
B was not the pick either way.)

| tier | ladder | 1 | 2 | 3 | 4 | 5 (title) |
|---|---|---|---|---|---|---|
| local | off | 1 | 2 | 3 | 4 | 5 |
| | D | 1 | 3 | 5 | 7 | 9 |
| | **C** | 1 | 3 | 5 | 8 | **11** |
| | B | 1 | 3 | 5 | 8 | 13 |
| | A | 1 | 3 | 6 | 10 | 15 |
| regional | off | 2 | 4 | 6 | 8 | 10 |
| | **C** | 2 | 5 | 8 | 12 | **16** |
| | A | 2 | 5 | 9 | 14 | 20 |
| national | off | 3 | 6 | 9 | 12 | 15 |
| | D | 3 | 7 | 11 | 15 | 19 |
| | **C** | 3 | 7 | 11 | 16 | **21** |
| | B | 3 | 7 | 11 | 16 | 23 |
| | A | 3 | 7 | 12 | 18 | **25** |
| j30 | off | 4 | 8 | 12 | 16 | 20 |
| | **C** | 4 | 9 | 14 | 20 | **26** |
| | A | 4 | 9 | 15 | 22 | 30 |
| j60 | **C** | 5 | 11 | 17 | 24 | **31** |
| j300 | off | 6 | 12 | 18 | 24 | 30 |
| | D | 6 | 13 | 20 | 27 | 34 |
| | **C** | 6 | 13 | 20 | 28 | **36** |
| | B | 6 | 13 | 20 | 28 | 38 |
| | A | 6 | 13 | 21 | 30 | **40** |

**The owner's own benchmark — "a five-match National run maxes at 25" — is variant A.** Shipped C
gives 21. That is the single clearest statement of what the choice costs.

## Why the four variants feel alike (measured, not argued)
Run-depth distribution on the current calendar (5 400 careers, all profiles × policies × horizons):

| policy | 1 match | 2 | 3 | 4 | 5 | runs/season |
|---|---|---|---|---|---|---|
| grinder | **49-51%** | 24-25% | 19-20% | 4-5% | 1% | 12.6-13.2 |
| balanced | **42-44%** | 23-25% | 21% | 7-8% | 4-5% | 14.2-14.7 |
| careful | **41-44%** | 23-25% | 21% | 7-9% | 4-5% | 14.1-14.7 |

- At depth 1 (~half of all runs) every ladder is identical — the first match never pays extra.
- At depth 2 (another ~24%) all four are identical again (+1).
- D, C and B stay identical through depth 3 — together **88-93% of all runs**.
- They separate only at depths 4-5, i.e. 5-14% of runs; depth 5 happens 0.13×/season for a grinder
  and 0.6-0.7×/season otherwise.

So no variant is meaningfully more "felt" than another: the rungs that differ are charged where she
almost never is. **If the cumulative effect itself should bite, the lever is the rungs at depths 2-3
(where the runs actually live), not the slope of the tail** — e.g. `[0,2,2,3,3]` would land on
44-46% of runs instead of 5-14%. Still open, not shipped.

## Where the "local runs feel free" impression comes from
Pre-round-9 the engine charged a FLAT `tournamentStrain` per tournament: local 8, regional 16,
national 26 — the same whether she lost in round one or won the title. The per-match redesign made a
straight-sets three-match Local title cost 5 under C, so an easy local title got ~40% cheaper while
a hard-fought one stayed put. That is a consequence of the owner's own (correct) redesign, and it is
independent of which ladder ships.

## Bench outcomes of the four ladders (5 400 careers, full model)
Rival-side proof that the ladder is SHARED — mean cohort condition falls monotonically with
steepness (83.7 off → 81.4 D → 81.0 C → 80.7 B → 79.8 A), on the field she actually faced.
Distance outside the owner's wk49 60-85 band, summed over policies (lower is better): off 15.0 ·
**C 19.0** · B 19.6 · A 20.8 · D 22.2 → **C is the best of the four ladders**, and best on the 52w
and 104w horizons specifically. C is also cheapest for the family (best end funds and survival among
the shallow variants) and gentlest at the medical floor. The grinder/careful injury ratio is
unmoved by ladder choice (2.25-2.41× pooled; the ≥3× anchor is met only at 208w).
