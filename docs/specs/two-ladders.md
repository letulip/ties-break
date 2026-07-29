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
