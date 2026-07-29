# Two ladders — the national table and the ITF table

The owner's ruling, 29.07: «Ведите два рейтинга: Национальный (для Local/Regional/National) и ITF
Junior (для J30+)». This is the design for it, plus the two things that ride with it because they
move the same numbers and must be measured once.

## 1. Why this dissolves three open problems at once

**No junior tour ladder to re-order.** We were stuck on whether National sits above J60. It does not
sit anywhere near it: in reality a national result produces **zero** ITF points (Reg 10's list of
ranking tournaments is closed and contains only ITF grades), and federations import ITF results at
their own valuation, never the reverse. Two currencies, no exchange rate — so there is no single
ladder to sort, and the question was malformed.

**A National title cannot be farmed.** It was going to pay 1000 into a table its entrant band
(#40–#139) could reach. It now pays into the national table only, where a mid-table domestic player
winning her national championship is exactly what should happen.

**The two entry rules become one.** `rank-plateau.md` §2b: she qualifies for a tier by an absolute
points threshold while the AI qualifies by a standings percentile with a backfill that reaches to
#140. Once the J rungs are gated on **ITF rank position**, both sides read the same signal, and the
unfairness closes as a side effect rather than as a patch.

## 2. The shape

**Nothing new is persisted.** `SeasonResult` already carries `tier` on both kid and AI rows, so a
ranking is a filtered fold over the ledger we already keep. Two tables = two calls with a tier
predicate. **No schema bump, no migration, no golden save.**

```
DOMESTIC  local · regional · national     ->  the national ranking
ITF       j30 · j60 · j300                ->  the ITF junior ranking
```

### Points, from the primary source

`docs/research/ranking-points-by-tier.md` §1 (ITF Reg 31, 2026 regulations, pp. 12–13), at their
real values — the grade name IS the winner's points, which is the convention every rung of the real
ladder follows:

| rung | W | F | SF | QF | R16 | R32 |
| --- | --- | --- | --- | --- | --- | --- |
| J30 | 30 | 18 | 9 | 5 | 2 | – |
| J60 | 60 | 36 | 18 | 10 | 5 | – |
| J300 | 300 | 210 | 140 | 100 | 60 | 30 |

Two corrections against what circulates, both from the same regulation: the J30 row **18/9/5/2** is
singles — 13/6/3 is the **doubles** column (whose winner is 25, not 30) — and the 30/20 qualifying
consolation points exist **only at junior Grand Slams**. Everywhere else it is zero until you win a
main-draw round, which we already implement.

The domestic rungs keep a table of their own. They are ours to invent (no federation currency is
being modelled), and the only published ITF↔national exchange rate — the LTA's ×40 — is what the
research doc used to place them. They are re-anchored inside the national track, not against the J
rungs, because the two tables never meet.

### Windows

The junior ITF rule is **best 6 over 52 weeks** and we already implement it verbatim. The domestic
table keeps the same window: it is our invention, one rule is easier to explain than two, and
nothing in the sources argues otherwise. (The WTA's best-16 belongs to the adult tour and arrives
with it — `adult-tour-and-endings.md` §2.)

### Which rank is "her rank"

The ITF one, once she has it — it is the one that opens the J rungs and the one the game is about.
Before she has a counting ITF result she is **unranked internationally**, and the screens show her
national rank instead, labelled as such. That is the real shape of a junior career, and the moment
the first ITF point lands is a beat worth having.

## 3. Riding with it, because it moves the same numbers

**The retired-player leak** (`junior-conveyor.md`, task #50). `computeRanking` treats its roster as a
base ORDER and then adds anyone with a counting result in the window, roster or not. Since the
conveyor, a player who leaves at nineteen holds a ranking place for a year afterwards under an id
nobody can read, pushing everyone below her — the kid included — down a place. The roster becomes a
**filter** when one is passed. It changes every rank number in the game, which is exactly why it
goes in the same measured run as everything else here rather than in its own.

## 4. What has to stay true

- **The frozen MAIN capture (41550 draws / `e6b0c709`) must not move.** Nothing here draws at all:
  points tables are lookups and rankings are folds.
- **Every rank number in the game moves.** So: `bench:econ` at 120 seeds before and after, and the
  reach targets restated — `REACH_TARGET_MONEY` (150 pts) and `REACH_PRO_POINTS` (300) are
  denominated in the OLD scale and become meaningless the moment the J rungs pay 30/60/300.
- **`enterPointBand` disappears from the J rungs** and is replaced by a rank gate. The domestic rungs
  keep a points band, in national points, rescaled.
- Guard tests get re-aimed with a ⚠ note, never deleted.

## 5. Open, and the owner's to answer when we get there

- The domestic table's own values (the research doc proposes Local 50 / Regional 160 / National 1000
  off the LTA ratios; inside a separate track the National number is free to be whatever reads best).
- What rank position opens each J rung. It replaces 180 / 400 / 900 points and is the one number
  that decides how fast the international door opens.


---

# Measured, 120 seeds per preset, 14→18

| preset | survival before → after | mean season-end rank before → after |
| --- | --- | --- |
| 8k working · self-coached | 39/120 → **67/120** | #111 #108 #111 #107 → **#65 #98 #86 #87** |
| 25k middle · self-coached | 112/120 → **117/120** | #111 #107 #110 #110 → **#69 #99 #92 #88** |
| 25k middle · hired coach | 0/120 → 0/120 | #98 #109 #124 #124 → #58 #113 #124 #124 |
| 120k wealthy · hired coach | 120/120 → 120/120 | #101 #88 #83 #90 → **#55 #83 #72 #75** |

**Her rank finally moves, and it finally tells the classes apart.** It sat at ~#110 for both
self-coached families and ~#88 for the wealthy one, whatever anybody did. It is now #87 / #88 / #75 —
still not a wide spread, but a real one, and the direction is right.

Season 1 reads flatteringly (#55–#69) because almost nobody holds an ITF point yet, so one result
ranks her high; it settles from season 2. That is honest thinness rather than a bug — a real junior
table in January looks like that too — but it is worth knowing before anybody quotes a first-season
rank.

**Reach is NOT comparable across this table.** `REACH_PRO_POINTS` was re-based 300 → 60 for the new
scale and the 14→16 arm was reading the wrong table entirely (it had been pinned at "never" for
three presets of four). The numbers went 69→83%, 71→80%, 87→88%, 100→98%, but the target moved
underneath them.

## What it exposed: National is now dead content

Entries per career, before → after:

| preset | local | regional | national | j30 | j60 | j300 |
| --- | --- | --- | --- | --- | --- | --- |
| 8k working | 17.6 → **34.9** | 23.4 → 26.1 | 3.5 → **0.3** | 24.5 → 12.7 | 2.8 → 9.8 | 0.0 → **0.5** |
| 25k middle | 18.5 → **39.8** | 23.2 → 26.1 | 3.2 → **0.2** | 31.3 → 13.0 | 2.9 → 11.2 | 0.0 → **0.6** |
| 120k wealthy | 11.5 → **31.9** | 9.7 → 21.4 | 3.4 → **0.6** | 51.7 → 18.5 | 18.1 → 25.3 | 0.0 → **2.4** |

Two good things and one bad one.

**Good: J300 exists now.** It was entered zero times per career in every preset and is now reached —
rarely, which is what a prestige rung should be. The ladder has a top that can be climbed.

**Good: the international rungs are earned rather than bought.** The wealthy family's j30 count fell
by two thirds while its j60 count rose, because the acceptance list moved her up rather than letting
her farm the entry rung.

**Bad: National collapsed to ~0.3 entries per four-year career.** The cause is precise and it is not
the two ladders themselves — it is that **National and J30 open on the same threshold**. Both want
150 domestic points, and the entry policy walks the calendar strongest-tier-first, so the week
National becomes available is the week J30 does too, and J30 always wins. National is now content
nobody sees.

The fix is one number: **stagger them** — National at 150, J30 at something higher (250 is a
regional book plus a national quarter-final, and it makes National the rung you climb THROUGH rather
than past). It restores the sequence the ladder-up slice designed, Local → Regional → National → the
world, and it is exactly the "she always plays up" trap from `rank-plateau.md` 2c seen from the other
side. **Owner's number to pick.**

# The stagger, measured — 120 seeds, 14→18

Owner, 29.07: «National становится ступенью, через которую проходят, а не мимо которой – вот это мне
нравится, да». So: **J30's floor 150 → 250, and regional's ceiling 230 → 250 with it** — the two are
one decision, because at 230 there would have been a 20-point band in which National (six events a
season) was the only tier open, and a career can sit in a band like that for months.

| preset | national | j30 | j60 | j300 | survival | reach | rank at 18 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 8k working | 0.3 → **6.4** | 12.7 → 5.5 | 9.8 → 6.5 | 0.5 → **1.4** | 67 → **108**/120 | 83% → **66%** | #87 → **#76** |
| 25k middle · self | 0.2 → **6.6** | 13.0 → 5.5 | 11.2 → 7.2 | 0.6 → **1.3** | 117 → **120**/120 | 80% → **63%** | #88 → **#79** |
| 25k middle · hired | – → 3.0 | – → 6.1 | – → 2.9 | – → 0.8 | 0 → 0/120 | 87% → 87% | #124 → #124 |
| 120k wealthy | 0.6 → **5.4** | 18.5 → 10.6 | 25.3 → 21.5 | 2.4 → **4.0** | 120 → 120/120 | 98% → 98% | #75 → **#64** |

**National is a rung again** — 0.2–0.6 entries per four-year career became 3.0–6.6. And J300, the
top of the ladder, is reached *more* often than before (0.5 → 1.4, 2.4 → 4.0), because she arrives
at it with a domestic base under her instead of having skipped straight to the airport.

**There is a real cost and it is not small: reach fell for the two poor presets, 83% → 66% and
80% → 63%, while survival rose sharply.** The mechanism is plain — a J30 costs $900–2000 in travel
and a regional costs $150–400, so holding the international door shut for another 100 points keeps
her at home, solvent, and further from a pro attempt at eighteen. The wealthy preset paid nothing
for it (98% → 98%, and its rank improved #75 → #64), because it could always afford both ladders.

That is the class gap widening, which is the thesis — but it is the owner's call whether a working
family surviving *by not trying* is the story he wants, or whether reach at 66% is too low. The
knob is the same one: J30's floor.

## A hypothesis that did NOT survive checking

The working family enters more J60s (6.5) than J30s (5.5), which looked like the "unranked means
rank one" bug returning through a thin ITF table. Measured: **110–115 of 199 players hold counting
ITF points** at every season boundary, so the acceptance lists gate against a dense, real field.
The ordering is the entry policy preferring the strongest open rung — which is correct for J30
(explicitly "the dense entry level", a rung meant to be passed through) and was only wrong for
National because National is a marquee event, not an on-ramp.
