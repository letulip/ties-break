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

## 4b. THE ON-RAMP IS A THRESHOLD, NOT A STANDING CONDITION (v34, 31.07)

§2 gives every table a bottom rung with no acceptance list, read off the table BELOW it, because a
player cannot hold a ranking in a table she has never played in and a rank gate there would be a
closed loop. That shape is right. **How it was read was not.**

Both on-ramp bands are denominated in a **rolling 52-week window** – J30 against her domestic best-6,
W15 against her ITF junior best-6 – and the gate was re-evaluated every single week. So the evidence
that she once cleared the bar *deletes itself*:

- a season spent abroad earns no domestic result, the old ones age out, and the J30 door closes
  behind her. **The better she does internationally, the more certainly it shuts.**
- from eighteen the J rungs are shut on AGE, so no junior point can ever be earned again – and 52
  weeks later the W15 on-ramp closes on its own, with nothing she could have done about it. That is a
  wall built across the handover at 19 (task #47) out of two rules that are each fine alone.

Owner, playing, 31.07: «бусинка много времени за сезон провела на J серии, побеждая и занимая там
крутые места, получила global спонсора и возможность w15, но теперь не может играть в J серии, потому
что ранг в national упал» – and, on the rule: «въезд – это порог, который переходят один раз, а не
условие, которое держат постоянно».

**Measured** (`tools/j30-onramp-lock.ts`, 216 careers, 14→20, the econ bench's own presets and
policies), separating "has not arrived yet" – which is the on-ramp doing its job – from "arrived and
was thrown back out":

| | before | after |
|---|---|---|
| went through the J30 door, then shut out again | **209/216** | 0/216 |
| locked out of J30 while J60 or J300 stood OPEN | **160/216** | 0/216 |
| weeks in that state, median / worst | 53 / 151 | – |
| domestic best-6 when the lock first bit | 235, against a floor of 250 | – |
| 18+ with nothing open on either real table | **188/216** | 7/216 |

The seven that remain never cleared the W15 standard at all. That is a girl who did not make it, and
it wants an ending (#47), not a rule change.

**The fix.** `WorldState.onRampCleared` latches per table, set by `latchOnRamps` the moment she can
prove she belongs there – either the band met, or a counting result on the table itself, which is the
stronger proof and the one that covers a girl whose domestic book has already decayed while she is
visibly out there playing J60s.

⚠ **Acceptance lists do NOT latch, and must not.** Only the bottom rung of a table is an on-ramp.
J60/J300/W35/W100 are entry cuts read against a **current** ranking, because no real entry list
admits you on a ranking you held two years ago. The latch guarantees a way back **onto** a table; it
never guarantees a place in a field. This is also what the real sport does: ITF junior entry is by
ITF junior ranking, and a national ranking matters only to a player who has no ITF one yet.

⚠ **It had to be state.** The question "did she ever clear this" has no honest derived answer once
the window has rolled – which is the whole reason the ratchet existed. Schema v34, back-filled
EXACTLY from `bestFinishByTier` (a high-water mark that is never pruned); see the corpus README.

⚠ **And it caught a second copy of the rule.** `entryStatus` re-derived the on-ramp comparison
instead of reading `tierOpenFor`, so the calendar offered a J30 that `enterEvent` then threw on – the
identical failure task #17 hit, found the identical way (the bench crashed mid-sweep). Both arms now
read the one piece of state, and `tests/rankingGate.test.ts` pins that they agree on every rung
across the states that have pulled them apart.

## 5. Open, and the owner's to answer when we get there

- The domestic table's own values (the research doc proposes Local 50 / Regional 160 / National 1000
  off the LTA ratios; inside a separate track the National number is free to be whatever reads best).
- What rank position opens each J rung. It replaces 180 / 400 / 900 points and is the one number
  that decides how fast the international door opens.


---

# Measured, 120 seeds per preset, 14→18

> ⚠ **EVERY RANK NUMBER IN THIS SECTION IS THE MIXED RANK, AND THE MIXED RANK DOES NOT EXIST.**
> Retracted 30.07 (`tune/rank-numbers`); the argument is at "What this re-opens" at the foot of this
> file, and the honest replacements are in "Measured: the acceptance lists re-picked" below it.
>
> These figures were read off `world.kidRank` on a build where that field had **two writers with two
> different meanings** — the weekly tick wrote a rank folded over BOTH ladders, and the mixed number
> always won. So "#87 / #88 / #75" is her place in a combined table the design does not have. Her
> honest ITF places for the same horizon are **#108 / #108 / #98** (self-coached grinder, 120 seeds).
> The `survival` column is unaffected — it reads money, not rank — and the domestic-points
> conclusions further down still stand for the same reason.
>
> **Do not quote the rank column, and do not "restore" it.** The two paragraphs that follow are kept
> only because they are the reasoning that was actually written at the time; both are wrong, and the
> way in which they are wrong is the finding.

| preset | survival before → after | mean season-end rank before → after |
| --- | --- | --- |
| 8k working · self-coached | 39/120 → **67/120** | ~~#111 #108 #111 #107 → #65 #98 #86 #87~~ |
| 25k middle · self-coached | 112/120 → **117/120** | ~~#111 #107 #110 #110 → #69 #99 #92 #88~~ |
| 25k middle · hired coach | 0/120 → 0/120 | ~~#98 #109 #124 #124 → #58 #113 #124 #124~~ |
| 120k wealthy · hired coach | 120/120 → 120/120 | ~~#101 #88 #83 #90 → #55 #83 #72 #75~~ |

~~**Her rank finally moves, and it finally tells the classes apart.** It sat at ~#110 for both
self-coached families and ~#88 for the wealthy one, whatever anybody did. It is now #87 / #88 / #75 —
still not a wide spread, but a real one, and the direction is right.~~

⚠ **Retracted.** The spread it celebrates was an artefact of the fold: the mixed table added her
large domestic book to her tiny international one, so the families with more domestic results
separated. On the honest ITF table the self-coached presets sit at #108 whatever anybody does, which
is the *original* complaint un-fixed rather than fixed. What actually tells the classes apart is
measured in "Measured: the acceptance lists re-picked" — and it took opening the ladder to do it.

~~Season 1 reads flatteringly (#55–#69) because almost nobody holds an ITF point yet, so one result
ranks her high; it settles from season 2.~~

⚠ **Retracted, and this one was the bug hiding in plain sight.** Season 1 read flatteringly because
the mixed table was scoring her domestic season as though it were international. The honest season-1
ITF rank is **#123–#128** — she is near the bottom of the table in her first year, which is what a
fourteen-year-old with no international results should read as. The thinness argument was a
rationalisation of a defect.

**Reach is NOT comparable across this table.** `REACH_PRO_POINTS` was re-based 300 → 60 for the new
scale and the 14→16 arm was reading the wrong table entirely (it had been pinned at "never" for
three presets of four). The numbers went 69→83%, 71→80%, 87→88%, 100→98%, but the target moved
underneath them. ⚠ And they moved again twice since: once when the rank fix removed the phantom from
the 14→18 arm, and once when the acceptance lists were re-picked. Use the table at the foot of this
file.

## What it exposed: National is now dead content

Entries per career, before → after:

| preset | local | regional | national | j30 | j60 | j300 |
| --- | --- | --- | --- | --- | --- | --- |
| 8k working | 17.6 → **34.9** | 23.4 → 26.1 | 3.5 → **0.3** | 24.5 → 12.7 | 2.8 → 9.8 | 0.0 → **0.5** |
| 25k middle | 18.5 → **39.8** | 23.2 → 26.1 | 3.2 → **0.2** | 31.3 → 13.0 | 2.9 → 11.2 | 0.0 → **0.6** |
| 120k wealthy | 11.5 → **31.9** | 9.7 → 21.4 | 3.4 → **0.6** | 51.7 → 18.5 | 18.1 → 25.3 | 0.0 → **2.4** |

Two good things and one bad one.

~~**Good: J300 exists now.** It was entered zero times per career in every preset and is now reached —
rarely, which is what a prestige rung should be. The ladder has a top that can be climbed.~~

⚠ **RETRACTED — this was the phantom rank buying her the trip.** Measured on the fixed build, J300
went back to **0.0–0.3 entries per four-year career** in all eighteen cells: the 0.5–4.0 celebrated
here was `j300.enterPct 0.25` (top 50) reading a mixed rank that averaged ~#55, so she was permanently
inside an acceptance list her real ITF rank (#89–#109) never came close to. **The ladder did not have
a top that could be climbed; it had a top the scoreboard was broken open.**

It has one now, and it took re-picking the number rather than restoring it — `j300.enterPct` 0.25 →
0.40, measured in "Measured: the acceptance lists re-picked" below. The sentence above is kept
struck-through because the mistake it made is the one this file exists to warn about: a ladder that
looks climbable because the rank is wrong reads exactly like a ladder that is climbable.

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

> ⚠ **The `national` / `j30` columns hold; the `j60`, `j300`, `reach` and `rank at 18` columns do
> not.** The stagger itself is denominated in DOMESTIC points, which never moved, so the decision this
> section records is sound and shipped. But the four columns on the right were all read through
> `world.kidRank` (directly, or via an acceptance list gated on it), and that field held the mixed
> rank. Read them as "what the buggy build did", not as a target.

| preset | national | j30 | j60 | j300 | survival | reach | rank at 18 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 8k working | 0.3 → **6.4** | 12.7 → 5.5 | ~~9.8 → 6.5~~ | ~~0.5 → 1.4~~ | 67 → **108**/120 | ~~83% → 66%~~ | ~~#87 → #76~~ |
| 25k middle · self | 0.2 → **6.6** | 13.0 → 5.5 | ~~11.2 → 7.2~~ | ~~0.6 → 1.3~~ | 117 → **120**/120 | ~~80% → 63%~~ | ~~#88 → #79~~ |
| 25k middle · hired | – → 3.0 | – → 6.1 | ~~– → 2.9~~ | ~~– → 0.8~~ | 0 → 0/120 | ~~87% → 87%~~ | ~~#124 → #124~~ |
| 120k wealthy | 0.6 → **5.4** | 18.5 → 10.6 | ~~25.3 → 21.5~~ | ~~2.4 → 4.0~~ | 120 → 120/120 | ~~98% → 98%~~ | ~~#75 → #64~~ |

**National is a rung again** — 0.2–0.6 entries per four-year career became 3.0–6.6. That is the
finding, it is measured in domestic points, and it has held through every slice since (see
`combined-measure.md` §5, and the table at the foot of this file).

~~And J300, the top of the ladder, is reached *more* often than before (0.5 → 1.4, 2.4 → 4.0), because
she arrives at it with a domestic base under her instead of having skipped straight to the airport.~~
⚠ **Retracted with the rest of the J300 claims** — a 21.5 j60 count and a 4.0 j300 count are what an
acceptance list looks like when it is reading a rank that is ~50 places too good. See below.

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

---

# The half that never shipped: the UI never learned there were two tables

*30.07, branch `fix/ranking-truth`, after the owner played a full season.*

This spec designed two currencies with no exchange rate, and then **every screen kept showing one
number called "rank" and one called "points"** — both read off the ITF table. The engine was right
and the surfaces were not, so a career spent on the domestic rungs (which is most of a
fourteen-year-old's, and *all* of a working-class one's) was invisible to the player who was living
it. Four items on his list were this, wearing four different clothes.

## §4's first claim was violated, and not by this slice

> **The frozen MAIN capture (41550 draws / `e6b0c709`) must not move.**

It did not move, and it still has not. But `world.kidRank` had **two writers with two different
meanings**, and one of them was introduced *here*:

| writer | what it wrote | when it ran |
| --- | --- | --- |
| `recomputeKidRank` | the ITF rank, plus `kidRankDomestic` beside it | `createWorld`, migration |
| `recomputeRankAndMilestones` | `computeRanking(results, week, ids)` — **no track predicate**, both ladders folded into one table | the tick's step 5, `finalizeTournament`, `skipTournament` |

The second ran last in every path, so the mixed number always won. `computeStandings` builds its
table fresh from the ITF fold at snapshot time and so was never affected — which is exactly why
Home said **#4** and Stats said **#128** in the same week.

`kidRankDomestic` was worse off: nothing in the tick wrote it at all, so it held its **week-0 value
for an entire career** (75 against a true 100 on the bench fixture; a season mean of 75.7 against a
true 15.0).

The guard tests could not catch it because they all assert `kidRank` equals a *number* — so they
moved with the bug and were re-pinned to it. The 135 → 126 re-pin in this slice claims 126 is "her
place in the ITF table"; it was the mixed place. `tests/condition.test.ts` B1c now asserts an
**identity** instead — each cache equals the fold it names, every week — and it fails against the
pre-fix code with the owner's own symptom.

**Re-pinned deliberately: `REF.kidRank` 126 → 119** in condition/injuries/planner. `count`, `hash`,
`head` and `tail` are byte-identical, re-derived before and after. 118 AI hold counting ITF points at
week 52 → #119; the mixed table holds 125 → #126. The arithmetic identifies which table each number
came from.

## The sponsorship valve is dead content (item 27)

> «And there was not a single "local sponsor" donation for a 8k girl through the whole season despite
> the fact she was good»

There are **two** sponsor mechanisms and only one of them is rank-gated. Measured, 120 seeds × 49
weeks, per season:

| | 8k working · self | 25k middle · self | 120k wealthy · elite |
| --- | --- | --- | --- |
| **gear valve**, ITF-gated (today) | **0.00 · 0/120 seasons** | **0.00 · 0/120** | **0.00 · 0/120** |
| gear valve, if it read her NATIONAL rank | 12.36 · 113/120 · $348 forgiven | 14.42 · 109/120 · $756 | 21.65 · 119/120 · $2,384 |
| cash cameo, fired | 3.10 · 113/120 | 0.00 (working-only by design) | 0.00 |
| cash cameo, **still visible** at season end | **0.65 · 62/120** | – | – |

**The gear valve has never fired for anybody.** `ECONOMY.sponsorship` gates at ITF rank ≤30 (half
price) and ≤10 (free). A working-class girl's ITF rank averages **#128** and never reaches it; nor
does the wealthy family's inside one season. It is an award for domestic prominence denominated in a
currency she does not hold — the same category of error as the two writers, and it arrived here, when
this slice redefined `kidRank` to mean the ITF table and silently retargeted every gate reading it.
Her **national** rank averages #15 and is top-30 in 107/120 seasons.

⚠ ~~**Not fixed, because the numbers are the owner's.**~~ **FIXED 30.07 (`tune/rank-numbers`), on the
owner's ruling** — «ок пока что, я поиграю и посмотрим. Может он и богатой будет что-то менять, мы
пока не знаем на сколько в реальности это всё будет разорительно». The paragraph below is kept because
its diagnosis was right and its *proposed* fix was the regressive one:

> Pointing it at the national table (or at the better of the two, which measures identically today and
> follows her up the ladder later) would forgive $348–$2,384 a season, and **it is regressive** — it
> pays the wealthy family seven times what it pays the poor one, because that family buys pricier gear
> more often *and* ranks better domestically.

**What shipped instead, and why it is not just a re-pointed gate.** Both halves of the valve were
wrong, and only one of them was the table:

* **the gate** moved to the national ladder, because a local sponsorship is a domestic-ladder reward.
  That was the diagnosis above and it was correct;
* **the amount stopped being a percentage.** A share of a gear bill is a share of a bill that runs
  through the wealth corridor, so *any* percentage is regressive by construction — re-pointing the
  gate alone would have shipped the 7× spread. It is now a **flat annual grant**: the same figure for
  every background, $1,000 a season at national ≤30 and $2,000 at ≤10.

**The figure is not invented and not tuned to be harmless.** `docs/research/02-tennis-economics.md`:
junior equipment sponsorship is *"mostly product-only (racquets/strings/shoes, ~$1k+/yr value), 3–4
year terms"*. The deal **is** an annual value in the sources, which is also why it is a grant rather
than a per-purchase cap — and a per-purchase cap could not have been flat anyway, since the wealthy
family buys 39 kit items a year against the working family's 25 and would collect ~1.6× on any
per-item figure. The stepped-up tier is `junior-economics.md`'s *"travel sponsorship only after
national/international wins"*, priced at the top of its £250–£2,000 merit-grant band.

**The justification is a fact about the cheque, not an assumption about who needs it.** A local shop's
cheque does not know how rich the family is. Whether it *matters* to the wealthy family is an open
question and deliberately left open — the owner's own point is that nobody has measured how ruinous
the whole road is at the top end, so all three presets are measured and reported below rather than one
being treated as noise.

**Thresholds deliberately unmoved at 30 / 10.** Same numbers, honest table, flat cheque — so the owner
can attribute the change to one thing.

**And the cash cameo works but cannot be seen.** It fires 3.10 times a season for an 8k girl and
banks $500–1500 each time. But the snapshot carries only the trailing 60 events, a 49-week season
generates far more than that, and so **only 0.65 of those donations per season are still on screen at
season end — 58 of 120 seasons show none at all**. The Money screen cannot rescue it either: it folds
every income category into a single "Total income" figure and has a per-category breakdown for
expenses only. So the owner reporting "not a single donation" is him accurately reporting what the
game showed him. A per-category **income** breakdown on the Money screen is the fix; it is not in this
branch.

## Item 26: the gate is legible now, and the mechanism is the one that was already there

> «No points visualisation for local-regional-national is super-strange. If we stick to it we need to
> change "entrance floor" for j30 from current points to "win national" of some sort»
>
> — and, asked which he wanted: «это было на обсуждение, мне главное, чтобы было наглядно и
> однозначно»

The requirement is a property, not a mechanism. Three shapes were weighed:

1. **Keep the points floor, make the currency visible.**
2. **Replace it with a milestone** ("win a National").
3. **Both**: the threshold gates, a milestone-shaped sentence explains it.

**Shipped: 3, and the finding is that most of 1 was the whole bug.** The floor was never illegible —
it was *invisible*, and in two separate ways:

* `useTierStates` fed `tierState` her points from `snapshot.standings`, **the ITF table**, while every
  rung's `enterPointBand` is denominated in national points (this file's own ladder diagram is drawn
  against "domestic pts →", and `entryStatus` reads `kidPoints(world, 'domestic')` for all six rungs).
  With 604 national points and 4 international ones the owner's Home ladder read Local "Open" and not
  outgrown, Regional "Reach 65 pts", National "Reach 150 pts", J30 "Reach 250 pts" — every one wrong,
  with the engine letting her enter all four. That is «Tournaments wrong current active active».
* The Stats screen showed no national table at all, so the number the ladder was counting **existed
  nowhere in the UI**.

So: the currency is named (`Reach 250 pts` → `112 / 250 national pts` — a fraction, because "how far
off am I?" is half the question and the old copy answered only the other half), and the tooltip adds
what the gap would take, priced off the `TIERS` catalogue so it can never quote a table the engine does
not pay: *"38 more national pts (she has 112 of 150) – one more semi-final at Regional Championship.
National points come from Local, Regional and National events."*

**Why not his milestone.** It is coarse in a way that would have cost him a story he already values: a
girl with three National semi-finals has plainly outgrown the domestic ladder, and a "win a National"
gate tells her she has achieved nothing. The threshold is continuous, moves every week, and — once
visible — is *more* legible than a binary, because it shows progress rather than only arrival. His
stated requirement is met without turning a climb into a coin-flip. **If he still wants the milestone,
it is one `enterPointBand` and one note away; nothing here forecloses it.**

⚠ **The two currencies stay unmerged.** `gapInResultsNote` reads the domestic rungs only and is swept
by a test over the whole plausible range to prove it never offers a Junior Tour result as a way to
close a national-points gap. Legibility must not be bought by quietly making one ladder out of two.

## What the screens do now

* `Snapshot.ladders` carries **both** tables in the same shape (`LadderView`: rank, prevRank, points,
  standings, countingResults). `rank: null` *is* "not ranked in this table" — the distinction every
  screen used to re-derive with its own `countingResults.length > 0`.
* `Snapshot.activeLadder` is the engine's single answer to "which table is she competing in" —
  §"Which rank is her rank", implemented once, so Home, Stats and the Kid screen cannot disagree
  again. `kidRank`/`standings`/`countingResults` remain as ITF aliases and the aliasing is pinned.
* `prevKidRankDomestic` joins `prevKidRank` on the world. Without it, Home's movement arrow would have
  diffed this week's national place against last week's international one — a quieter instance of the
  same bug, showing a triumphant "↑107" on a week nothing happened.
* Stats opens on her active ladder, labelled, with the other one a tap away and the no-exchange-rate
  rule stated in words. The Kid screen and the rank explainer show the ladder she is on rather than an
  empty ITF table and "No points yet".
* Player-facing copy says **National** and **International**, defined once in `LADDER_LABEL`. Nothing
  says "track", "domestic" or "ITF".

## Still open

* **The season wrap-up's `seasonPoints` adds the two currencies together** (`604 + 4 = 608 pts this
  season`) — a sum with no meaning, and it is persisted in `SeasonSummary.points` and
  `seasonHistory`, so splitting it is a schema decision rather than a copy fix. The *rank* on that
  popup is now named ("International rank #128"), which was the owner's actual complaint.
* The Money screen's income side has no per-category breakdown — see the cash cameo above. ⚠ Still
  open, and it now has a second customer: the local sponsor's annual grant lands in the same `sponsor`
  income category as the cash cameo, so the two cannot be told apart on that screen.
* ~~The gear valve's table and thresholds (item 27), the owner's to pick.~~ **Closed 30.07** — the
  valve is gone and the local sponsor is a flat annual grant on the national ladder. See the item-27
  section above and the measured table at the foot of this file.

# Measured, 120 seeds per cell, before → after the rank fix

`npm run bench:econ -- --seeds 120`, both arms run identically on this branch (the "before" from an
isolated checkout of the pre-fix tree, so the two outputs are directly comparable).

## The control: the 14→16 horizon does not move at all

**Reach is byte-identical in all eighteen cells** — 113/120 → 113/120, 110 → 110, 119 → 119, and so
on. That horizon's target is `kidPoints(world, 'domestic') >= 150`, which reads no rank at all. It is
the cleanest possible confirmation that the fix changed exactly one thing: the number in
`world.kidRank`.

## The 14→18 horizon: reach was inflated by the bug

| preset · policy | survived | reach | end funds |
| --- | --- | --- | --- |
| 8k working · self · grinder | 120/120 → 120/120 | 79/120 → **1/120** | $45,597 → $43,233 |
| 8k working · self · player | 120/120 → 120/120 | 102/120 → **5/120** | $48,581 → $45,135 |
| 8k working · budget · grinder | 115/120 → 112/120 | 116/120 → **17/120** | $21,465 → $17,820 |
| 8k working · budget · player | 120/120 → 119/120 | 116/120 → **46/120** | $22,104 → $18,356 |
| 8k working · middle · grinder | 95/120 → 80/120 | 117/120 → **16/120** | $9,957 → $6,801 |
| 25k middle · self · grinder | 120/120 → 120/120 | 76/120 → **0/120** | $74,645 → $73,587 |
| 25k middle · budget · player | 120/120 → 120/120 | 118/120 → **50/120** | $41,329 → $38,860 |
| 25k middle · high · grinder | 71/120 → 52/120 | 117/120 → **8/120** | $3,266 → $824 |
| 120k wealthy · high · grinder | 120/120 → 120/120 | 118/120 → **23/120** | $131,832 → **$135,969** |
| 120k wealthy · elite · player | 117/120 → 120/120 | 119/120 → **60/120** | $44,591 → **$48,363** |

The 14→18 target is `(itfPoints > 0 && kidRank <= 50) || itfPoints >= 60`. Its rank arm was reading
the mixed table, where an 8k girl averaged **#55.7** — just inside a top-50 gate. Her honest ITF rank
averages **#128** and never got under #103 in 120 single-season measurements. **So the reach figure was
not degraded by this fix; it was inflated by the bug.** The old number said 79–119 of 120 working-class
careers reached a "pro attempt" standard. They were nowhere near the top 50 of the world junior table,
and the game already knew it — the Stats screen was printing #128 the whole time.

Survival barely moves. End funds fall a few percent for the poorer presets (the gear valve had been
firing 0.34 times a season off the phantom rank and now fires never) and **rise** for the wealthy ones,
which is the next finding.

## ⚠ What this re-opens: the J60/J300 acceptance lists were calibrated on the phantom rank

Entries per career, 14→18, before → after:

| preset · policy | local | regional | national | j30 | j60 | j300 |
| --- | --- | --- | --- | --- | --- | --- |
| 8k working · budget · grinder | 27.3 → 19.1 | 24.9 → 27.6 | 5.6 → **8.0** | 10.5 → **22.3** | 19.1 → **2.3** | 3.6 → **0.0** |
| 25k middle · middle · grinder | 27.0 → 19.6 | 24.4 → 26.4 | 6.1 → **8.1** | 10.9 → **23.9** | 20.0 → **2.1** | 3.8 → **0.0** |
| 120k wealthy · elite · grinder | 27.7 → 19.4 | 23.6 → 26.4 | 5.7 → **7.8** | 10.6 → **23.4** | 21.5 → **3.4** | 4.0 → **0.1** |

`j60` gates on `enterPct 0.40` (top 80 of 200) and `j300` on `0.25` (top 50), both read against
`world.kidRank`. Against the mixed rank (~#55) those lists were open to her almost permanently; against
her real ITF rank (~#128) they are shut. **So the game was admitting her to J60s and J300s she had not
earned — the owner's «Tournaments wrong current active active», quantified.** It is also why the wealthy
family now *ends richer*: a J300 trip is the most expensive week in the game and it was taking four of
them per career on a rank that did not exist.

> ⚠ **Those two shares are no longer the shipped values** — `j60` is 0.50 and `j300` is 0.40 as of
> 30.07 (`tune/rank-numbers`). The diagnosis in this paragraph is exactly right and is what the
> re-pick was aimed at; only the literals have moved. §1 below explains why the *identity* they came
> from had to go rather than just the numbers.

**And this un-fixes something this document claimed.** The section above reads *"Good: J300 exists now.
It was entered zero times per career in every preset and is now reached — rarely, which is what a
prestige rung should be. The ladder has a top that can be climbed."* That was measured on the buggy
build. J300 is back to ~0.0–0.1 entries per four-year career, which is the exact problem the two-ladder
slice set out to solve.

⚠ **Every rank-denominated number in the game was tuned against a table that does not exist**, and they
all now need re-picking by the owner:

* `j60.enterPct` 0.40 and `j300.enterPct` 0.25 — the acceptance lists. This is the one that decides
  whether the top of the ladder is climbable at all. → **re-picked 0.50 / 0.40**, measured below.
* `REACH_PRO_RANK` 50 and `REACH_PRO_POINTS` 60 in `tools/econ-bench.ts` — the pro-attempt proxy.
  → **deliberately NOT moved**, and the reason is a finding about the instrument. Measured below.
* `ECONOMY.sponsorship` `halfPriceMaxRank` 30 / `freeMaxRank` 10 — see the sponsor section above.
  → **rebuilt**: national gate, flat annual grant. Item 27 above.
* The academy's review reads `world.kidRank` too (`reviewLevel`), so its thresholds are in the same
  position. → **confirmed reading it, deliberately NOT moved**, with the counterfactual measured below.

~~None of them is changed here.~~ The point of *that* branch was that the number they read is now the
number it claims to be. This one re-picks them, and the pass is below.

**Also restated: this document's own headline table is not trustworthy.** The "Measured, 120 seeds per
preset, 14→18" section near the top reports mean season-end ranks of #65/#98/#86/#87 and reach moving
83% → 66%. Those were read off `world.kidRank` on a build where it held the mixed place. The honest
season-end ranks for the same horizon are **S1 #125 · S2 #98 · S3 #95 · S4 #89** for the 8k
self-coached grinder. The *conclusions* about National becoming a rung again and the stagger working
still stand — they were measured in domestic points, which never moved — but every rank figure in that
table needs reading as the mixed number it was.

---

# Measured: the acceptance lists re-picked, and the sponsor rebuilt

*30.07, branch `tune/rank-numbers`. Every knob the rank fix left dangling, taken one at a time.
`npm run bench:econ -- --seeds 120`, both arms, nine presets. The baseline is this branch as the rank
fix left it, so every number below is a delta against a build whose `kidRank` is already honest.*

## 0. What a good career ladder looks like — written down BEFORE tuning

The ladder has to be aimed at something or "re-picking" is just moving numbers until they look nice.
Per four-year junior career (14→18) the calendar offers roughly **98 J30s, 65 J60s and 16 J300s**.

| rung | what the build says it is | entries per career, target |
| --- | --- | --- |
| `national` | the rung she climbs **through** (the stagger, above) | 4–8 — already settled, do not disturb |
| `j30` | *"THE dense entry level"*, explicitly a rung *"meant to be passed through"* | high early and **falling** as she climbs |
| `j60` | *"the same, one notch more serious"* — a small stand, a camera nobody watches | **3–5 if her career stalls, 12–16 if it climbs** |
| `j300` | *"the season is planned around these"*; the **only four-figure crowd in the game** (900–2,600 against j60's 110–320); *"the one rung where a junior plays in front of strangers"* | **0 for most careers, 1–2 for a good one, 2–3 for the best** |

Two shape rules fall out of that, and they matter more than the counts:

1. **J300 must stay rare even at the top of the market.** Four a season exist; a career that plays all
   four every year has turned the prestige rung into a commute, which is what the phantom rank did
   (4.0 a career) and what the crowd bands argue against.
2. **j60 exceeding j30 is the ladder WORKING, not a bug.** The entry policy prefers the strongest open
   rung, so a career that has genuinely climbed past the on-ramp should stop playing it. This file
   flagged that inversion as suspicious once before and cleared it on measurement ("A hypothesis that
   did NOT survive checking"); it is expected in the strong presets and should NOT appear in the weak
   ones. A gate that inverts them for *everybody* is too loose.

## 1. `enterPct` — the instrument has a ceiling, and the identity had to go

Two findings, and the first one is about the knob rather than the balance.

**The share stops meaning anything above ~0.65.** `acceptanceRank` is `pct × (cohort + 1)`, so a share
is denominated against the whole 200-strong cohort — but the ITF table is only **~120 deep**, because
every player without a counting international result ties at the floor. So a ranked player is never
worse than about #120, and any share from 0.65 up accepts all of them. Measured two ways: the number of
weeks she clears the list is **identical at 0.65, 0.70, 0.75, 0.80, 0.85 and 0.90** in all eighteen cells
(a static sweep), and re-running whole careers at **0.65 and 0.70 reproduces them byte-identically**
(entries, rank, funds). The usable range of this knob is 0.40 → 0.65 and nothing else,
which is worth knowing before anybody reaches for a bigger number to open the ladder further.

**The identity `enterPct === entrantPctBand[1]` is gone, deliberately.** It read beautifully — *"she is
accepted if she would be inside the field they draw from"* — and it is the reason the ladder was shut.
The two numbers answer different questions: `entrantPctBand` is where an AI player's **ambition** window
sits (a J300 regular is a top-25% player — a statement about who the field is *made of*), while
`enterPct` is the **acceptance cut** (the point at which the tournament stops saying no). In real
tennis the cut sits *below* the regulars; that is what qualifying and wildcards are for, and
`junior-economics.md` lists them as escape hatches we do not model. Setting the cut *at* the top of the
field it draws from is the strictest reading available, and against an honest rank it shut both rungs.

**Shipped: `j60.enterPct` 0.40 → 0.50, `j300.enterPct` 0.25 → 0.40.**

Why not looser: at `j60` 0.55 a **self-coached working** family plays **16.8 J60s** a career (against
3.0 at 0.50), and the 8k budget grinder plays 29.5 — J60 becomes everybody's home rung and the gate
stops telling the classes apart. 0.50 is the largest value that still discriminates.

Why `j300` 0.40 breaks the tightening rule against its own field (0.40 > `entrantPctBand[1]` 0.25) and
should: the prestige rung is precisely the one that has to admit players from outside its regular field,
or no career in any preset ever clears it. It still tightens relative to `j60` (0.40 < 0.50), which is
the rule that actually matters.

## 2. The sponsor, measured in isolation — and it is the most valuable change in the slice

Run on its own, with the acceptance lists still at their shipped 0.40 / 0.25, so every number here is
the sponsorship and nothing else. 120 seeds, 14→18, both arms.

| preset · arm | survival | end funds | Δ | Δ% | reach | rank at 18 |
| --- | --- | --- | --- | --- | --- | --- |
| 8k working · self · grinder | 120 → 120 | $42,229 → $46,432 | +$4,203 | +10% | 1 → 1 | #108 → #108 |
| 8k working · self · player | 120 → 120 | $44,339 → $50,039 | +$5,700 | +13% | 8 → 8 | #99 → #99 |
| 8k working · budget · grinder | **107 → 115** | $14,884 → $20,138 | +$5,254 | +35% | 6 → 7 | #101 → #100 |
| 8k working · budget · player | 120 → 120 | $17,526 → $22,450 | +$4,924 | +28% | 73 → 76 | #78 → #77 |
| 8k working · middle · grinder | **58 → 81** | $4,433 → $8,667 | +$4,234 | **+95%** | 9 → **4** | #100 → #101 |
| 8k working · middle · player | 118 → 118 | $6,786 → $9,211 | +$2,425 | +36% | 44 → **53** | #87 → #84 |
| 25k middle · self · grinder | 120 → 120 | $73,528 → $77,942 | +$4,413 | +6% | 0 → 0 | #108 → #108 |
| 25k middle · self · player | 120 → 120 | $75,282 → $81,030 | +$5,748 | +8% | 10 → 10 | #101 → #101 |
| 25k middle · budget · grinder | 120 → 120 | $35,652 → $41,282 | +$5,630 | +16% | 7 → 7 | #100 → #100 |
| 25k middle · budget · player | 120 → 120 | $38,201 → $43,572 | +$5,370 | +14% | 68 → 68 | #81 → #81 |
| 25k middle · middle · grinder | 118 → 119 | $19,446 → $24,975 | +$5,529 | +28% | 10 → 10 | #99 → #99 |
| 25k middle · middle · player | 120 → 119 | $15,078 → $19,848 | +$4,770 | +32% | 66 → 67 | #77 → #76 |
| 25k middle · high · grinder | **38 → 57** | −$1,782 → $2,086 | +$3,868 | **+217%** | 7 → 7 | #104 → #102 |
| 25k middle · high · player | **51 → 57** | −$3,046 → −$2,069 | +$977 | +32% | 22 → **29** | #107 → #105 |
| 120k wealthy · high · grinder | 120 → 120 | $131,214 → $136,961 | +$5,747 | **+4%** | 14 → 14 | #97 → #97 |
| 120k wealthy · high · player | 120 → 120 | $111,427 → $116,301 | +$4,875 | **+4%** | 78 → 78 | #69 → #69 |
| 120k wealthy · elite · grinder | 120 → 120 | $87,191 → $92,953 | +$5,761 | +7% | 13 → 13 | #98 → #98 |
| 120k wealthy · elite · player | 120 → 120 | $46,028 → $50,853 | +$4,825 | +10% | 81 → 81 | #68 → #68 |

### The regressiveness is gone, and the residual is not the corridor

The old percentage valve, measured on the national gate, paid the wealthy family **$2,384 a season
against the working family's $348 — 6.85×**. The flat grant pays **+$5,761 against +$4,203 over four
seasons — 1.37×**, and that remainder is not wealth at all: a solvent career collects all four annual
grants and a struggling one collects fewer. The two cells that gain least (+$2,425 and +$977) are the
two that go bankrupt, which is the mechanism being visible rather than a bias.

### It is flat in dollars and steeply progressive in meaning — without being tuned for it

Same cheque, wildly different consequence: **+95%** of end funds for the 8k working family on a middle
coach, **+217%** for the 25k family on a High coach (a cell that ends the horizon in the red and now
ends it solvent), against **+4%** for both wealthy High-coach cells. Nobody chose that ratio; it falls
out of a flat figure meeting unequal balance sheets, which is the whole argument for a flat figure.

### Survival moves exactly where survival was in doubt

- **8k working · middle coach · grinder: 58 → 81 / 120** (+23)
- **25k middle · high coach · grinder: 38 → 57 / 120** (+19)
- **8k working · budget coach · grinder: 107 → 115 / 120** (+8)
- 25k middle · high coach · player: 51 → 57 (+6)

Every cell already at 120/120 stays at 120/120. (One drifts 120 → 119 — see the entry-policy
interaction below; it is not a survival effect.) So the grant lands on precisely the families whose
solvency was the open question and does nothing for those who were never at risk.

### What it does for the wealthy family: nothing but cushion — and that is a finding, not an aside

Reported because it was asked for rather than assumed away. Across all four wealthy cells: survival
120/120 → 120/120, **reach byte-identical** (14→14, 78→78, 13→13, 81→81), **rank at 18 byte-identical**
(#97, #69, #98, #68). The money arrives and simply sits there. At the top of the market the constraint
was never cash, so cash does not convert into results — which is worth the owner knowing before he
concludes from a bigger end-funds number that the grant helped that family compete.

### ⚠ One perverse interaction, and it is the plateau finding again

**8k working · middle coach · grinder: reach 9 → 4.** Money given to the grinder arm is spent on more
tournaments (its j30 count rises 23.1 → 24.7, and every domestic rung rises with it), and a career that
enters more while keeping no reserve and no rest floor arrives at them tired. The same grant given to
the **player** arm on the same preset moves reach **44 → 53**, and 25k · high · player **22 → 29**.

So the sponsorship rewards a managed career and mildly punishes an unmanaged one. That is
`combined-measure.md` §4 restated — *"grinding is not merely inefficient in this game; it is actively
worse"* — and it means the grant is not a difficulty reduction. It is more rope, and what happens next
depends on the policy.

## 3. `REACH_PRO_RANK` — the instrument was wrong, not the world, and it is provable

**The rank arm has never decided a single reach verdict.** Measured by replaying the predicate week by
week over 2,160 careers on the *shipped* build (18 cells × 120 seeds, 14→18) and recording which arm was
true at the first week the target was met:

| preset · arm | reached | **rank arm alone** | points arm alone | both together | ever touched top 50 | ever held ≥60 pts |
| --- | --- | --- | --- | --- | --- | --- |
| 8k working · self · grinder | 1/120 | **0** | 1 | 0 | 0/120 | 1/120 |
| 8k working · self · player | 34/120 | **0** | 24 | 10 | 23/120 | 34/120 |
| 8k working · budget · grinder | 15/120 | **0** | 8 | 7 | 12/120 | 15/120 |
| 8k working · budget · player | 102/120 | **0** | 64 | 38 | 89/120 | 102/120 |
| 8k working · middle · grinder | 15/120 | **0** | 9 | 6 | 11/120 | 15/120 |
| 8k working · middle · player | 59/120 | **0** | 42 | 17 | 45/120 | 59/120 |
| 25k middle · self · grinder | 0/120 | **0** | 0 | 0 | 0/120 | 0/120 |
| 25k middle · self · player | 37/120 | **0** | 25 | 12 | 27/120 | 37/120 |
| 25k middle · budget · grinder | 19/120 | **0** | 16 | 3 | 8/120 | 19/120 |
| 25k middle · budget · player | 103/120 | **0** | 73 | 30 | 87/120 | 103/120 |
| 25k middle · middle · grinder | 18/120 | **0** | 16 | 2 | 8/120 | 18/120 |
| 25k middle · middle · player | 103/120 | **0** | 71 | 32 | 91/120 | 103/120 |
| 25k middle · high · grinder | 12/120 | **0** | 10 | 2 | 3/120 | 12/120 |
| 25k middle · high · player | 40/120 | **0** | 26 | 14 | 27/120 | 40/120 |
| 120k wealthy · high · grinder | 25/120 | **0** | 17 | 8 | 21/120 | 25/120 |
| 120k wealthy · high · player | 106/120 | **0** | 65 | 41 | 100/120 | 106/120 |
| 120k wealthy · elite · grinder | 28/120 | **0** | 21 | 7 | 21/120 | 28/120 |
| 120k wealthy · elite · player | 102/120 | **0** | 60 | 42 | 96/120 | 102/120 |

**`rankOnly` is zero in all eighteen cells.** Not one career in 2,160, at any week of 208, ever satisfied
`rank ≤ 50` without already satisfying `points ≥ 60` — and the last two columns show why it is arithmetic
rather than luck: "ever touched top 50" is a strict subset of "ever held ≥60 points" everywhere, because
you cannot be 50th in the ITF table while holding less than a J60 title's worth of points. The 50th-best
player holds more than that. **So the OR reduces exactly to its points arm, and `REACH_PRO_RANK` is a
dead sub-expression.**

⚠ **And it stays dead after the ladder opens, which is the interesting part.** On the shipped lists the
top 50 is now genuinely common — **100 of 120** careers touch it in the wealthy High-coach player cell,
against essentially none before. The clause still never binds. Opening the ladder did not rescue the rank
arm; it made its redundancy *more* visible.

**That makes the instrument mis-named rather than mis-tuned.** What the bench reports as *"pro attempt
proxy (top-50 once ranked, or 300 points)"* is, and has been since the 300 → 60 re-base, precisely
*"did she ever accumulate one J60 title's worth of international points"*. That is a real and useful
signal — it separates the arms sharply (1–28/120 grinder against 34–106/120 player) — but it is not a
pro attempt, and the top-50 clause contributes nothing to it.

⚠ **Deliberately NOT changed, and the reason is measurement discipline.** Two reasons:

1. **Top-50 is not unreachable — it was unreachable because the ladder was shut.** With the lists
   re-picked, the wealthy player arms land at a mean rank of **#44 / #45** with 134–136 ITF points, and
   96–100 of 120 careers touch the top 50 at some point. So the honest reading is *the ladder was too
   hard*, not *the target was wrong* — which is the opposite of what the shipped numbers looked like,
   and is why the lists were the thing to move rather than the proxy.
2. **Moving the measuring stick in the same slice that moves the ladder makes the before/after table
   unreadable.** Every "reach" figure in this document has already been re-based twice under a moving
   target, and this file has three retracted tables to show for it.

**What it wants next, and it is the owner's call:** either delete the rank arm as dead, or replace the
target with something that is not a synonym for "won a J60" — a rank *and* points conjunction, or a
higher points bar, or a genuinely different milestone. It should not simply be re-tuned, because
re-tuning a redundant clause changes nothing.

## 4. The academy — it WAS reading the phantom, and it is not being moved

**Confirmed: `reviewLevel` reads a rank, and the rank it reads is `world.kidRank`.** So before the fix
it was scoring her against the mixed table, and the fix roughly halved every scholarship in the game
without anybody deciding that. The arithmetic identifies it exactly: `resultScore` is linear from
`rankFull` 40 to `rankNone` 130, so the mixed ~#55.7 scored **0.83** on the results half and her honest
~#108 scores **0.24**.

Measured mean `reviewLevel` at each season boundary, 120 seeds, against the table it reads today and
against her national table as a counterfactual:

| preset · arm | level on ITF rank (today) | level on NATIONAL rank | academy kit over 4 seasons |
| --- | --- | --- | --- |
| 8k working · self · grinder | 0.310 | 0.749 | $839 |
| 8k working · budget · player | 0.438 | 0.725 | $1,126 |
| 25k middle · self · grinder | **0.147** | 0.433 | $403 |
| 25k middle · middle · player | 0.240 | 0.420 | $615 |
| 25k middle · high · player | **0.117** | 0.246 | $441 |
| 120k wealthy (all cells) | 0.000 | 0.000 | $0 — `needFactor` 0, by design |

⚠ **NOT moved, and unlike the sponsor this is a considered "leave it".** Three reasons and one flag:

1. **Its gate is defensibly the international table.** The sponsor was wrong *in kind* — a shop in her
   town cannot be reading a world ranking. An academy is the opposite case: it funds a prospect for the
   international game, and `travelCover` 0.8 is paying the J-tour airfare specifically. Its own
   `rankNone: 130` is documented as *"sized to a ~200-strong field where a career that never scores sits
   at the tie floor around #120"* — and #120 **is** the ITF table's tie floor, measured. The knob was
   sized for that table's shape and is still self-consistent with it.
2. **It is not dead content.** It backs **105/120** careers in the working presets and pays $839–$1,126
   of kit plus a quarter to a third of the travel bill. It got harder; it did not stop working. That is
   the whole difference between this item and item 27.
3. **Moving it would destroy the slice's main measurement.** The academy and the local sponsor pay the
   same family out of the same hole. Roughly doubling the academy in the same pass that adds a flat
   sponsorship would make the 58 → 81 survival gain unattributable, and would very likely over-fund the
   poorest preset — the sponsor alone already moved it that far.

⚠ **But one real defect found in passing, and it is a threshold rather than a table.** The **middle**
family now sits at **0.117–0.184**, straddling `ECONOMY.academy.minLevel` of **0.15**. So some middle
careers get a scholarship and some get nothing, decided by a hair — and the file's own design intent is
explicit that this must not happen: *"SIZE, NOT A SWITCH … the level is continuous in 0..1 … so the
middle of the distribution gets a middling scholarship instead of a cliff at some threshold."* The rank
fix pushed exactly one background onto the cliff the design was written to avoid. **`minLevel` is the
number to look at, and it is the owner's.**

## 5. The whole slice, measured — 120 seeds, 14→18, both arms

`survival` is given three ways — **baseline → sponsor only → sponsor + lists** — because the two
changes pull it in opposite directions and the middle number is the only way to see that. Everything
else is baseline → final.

| preset · arm | survival b→s→f | reach | rank at 18 | ITF pts | j30 | j60 | j300 | end funds |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 8k working · self · grinder | 120→120→120 | 1→1 | #108→#108 | 2→1 | 7.6→7.1 | 0.0→1.9 | 0.0→0.0 | $42.2k→$45.5k |
| 8k working · self · player | 120→120→120 | 8→**34** | #99→#93 | 14→25 | 6.6→5.5 | 0.5→3.6 | 0.0→0.3 | $44.3k→$47.3k |
| 8k working · budget · grinder | 107→115→**105** | 6→**15** | #101→#99 | 12→17 | 25.1→19.4 | 2.9→**14.6** | 0.0→0.9 | $14.9k→$15.3k |
| 8k working · budget · player | 120→120→120 | 73→**102** | #78→**#52** | 49→**109** | 12.8→7.4 | 4.6→**12.6** | 0.1→**2.0** | $17.5k→$18.2k |
| 8k working · middle · grinder | 58→81→**59** | 9→**15** | #100→#98 | 13→16 | 23.1→19.3 | 1.6→**11.6** | 0.0→0.6 | $4.4k→$5.3k |
| 8k working · middle · player | 118→118→**119** | 44→**59** | #87→**#75** | 35→**65** | 8.5→7.7 | 1.6→5.7 | 0.1→0.7 | $6.8k→$7.8k |
| 25k middle · self · grinder | 120→120→120 | 0→0 | #108→#108 | 1→2 | 7.2→7.2 | 0.0→1.4 | 0.0→0.0 | $73.5k→$77.1k |
| 25k middle · self · player | 120→120→120 | 10→**37** | #101→**#87** | 11→**39** | 6.5→5.3 | 0.3→4.1 | 0.0→0.4 | $75.3k→$76.3k |
| 25k middle · budget · grinder | 120→120→120 | 7→**19** | #100→#98 | 13→16 | 25.6→18.5 | 1.8→**16.4** | 0.0→0.9 | $35.7k→$31.8k |
| 25k middle · budget · player | 120→120→120 | 68→**103** | #81→**#52** | 42→**109** | 12.2→7.5 | 4.7→**12.7** | 0.2→**2.1** | $38.2k→$35.0k |
| 25k middle · middle · grinder | 118→119→**112** | 10→**18** | #99→#97 | 14→17 | 25.8→19.9 | 2.4→**15.2** | 0.0→0.8 | $19.4k→$17.5k |
| 25k middle · middle · player | 120→119→119 | 66→**103** | #77→**#58** | 52→**91** | 12.5→7.2 | 4.6→**11.6** | 0.3→**1.9** | $15.1k→$13.9k |
| 25k middle · high · grinder | 38→57→**40** | 7→**12** | #104→#104 | 7→7 | 20.4→16.3 | 1.4→9.6 | 0.0→0.4 | −$1.8k→−$0.8k |
| 25k middle · high · player | 51→57→**54** | 22→**40** | #107→#106 | 2→4 | 6.0→5.8 | 0.8→2.3 | 0.0→0.2 | −$3.0k→−$2.4k |
| 120k wealthy · high · grinder | 120→120→120 | 14→**25** | #97→#95 | 16→21 | 27.2→18.7 | 2.9→**17.6** | 0.0→1.2 | $131.2k→$127.9k |
| 120k wealthy · high · player | 120→120→120 | 78→**106** | #69→**#44** | 69→**136** | 12.7→6.9 | 5.3→**12.9** | 0.2→**2.1** | $111.4k→$104.9k |
| 120k wealthy · elite · grinder | 120→120→120 | 13→**28** | #98→#94 | 15→24 | 27.3→18.4 | 2.8→**17.4** | 0.0→1.3 | $87.2k→$86.2k |
| 120k wealthy · elite · player | 120→120→**115** | 81→**102** | #68→**#45** | 74→**134** | 12.4→7.1 | 5.6→**12.8** | 0.3→**2.1** | $46.0k→$40.1k |

### The ladder has a top, and this time the scoreboard is honest

**Reach rises in 16 of 18 cells**, and the player arm roughly doubles on the coached presets:
73 → 102, 68 → 103, 66 → 103, 78 → 106, 81 → 102 of 120. Rank at eighteen follows it: the top of the
market lands **inside the top 50 for the first time (#69 → #44, #68 → #45)** and two mid presets land
exactly on **#52**. ITF points double to triple (49 → 109, 69 → 136).

The two cells that do not move are the **self-coached grinders** (1 → 1 and 0 → 0). That is a true
sentence rather than a failure: a girl with no coach who enters everything and rests never is not near
a pro standard at eighteen, and no acceptance list should pretend otherwise.

### Against the target written down in §0

| rung | target | measured |
| --- | --- | --- |
| `j30` | high early, **falling** as she climbs | falls in **every one of the 18 cells** (27.3 → 18.4 at the top end) |
| `j60` | 3–5 if her career stalls, 12–16 if it climbs | **1.4–4.1** self-coached, **9.6–17.6** coached |
| `j300` | 0 for most, 1–2 for a good career, 2–3 for the best | **0.0–0.4** self-coached, 0.4–1.3 coached grinder, **1.9–2.1** coached player |

On target, with one honest miss: the **grinder** arm's j60 count runs hot at 14.6–17.6 against a 12–16
target. It is the entry policy rather than the gate — a policy with no reserve takes every open rung —
and `j300` stays properly rare at its own ceiling of **2.1 per four-year career, about 13% of the
sixteen on the calendar**. The j30/j60 inversion appears only in the player arm (7.4 against 12.6),
which is §0's second shape rule holding: careers that climbed stopped playing the on-ramp, careers that
stalled did not.

### ⚠ The honest cost: the ladder spends the sponsor's money

This is why survival is reported three ways. For the **grinder** arm the two changes very nearly
cancel:

| cell | baseline | + sponsor | + lists | net |
| --- | --- | --- | --- | --- |
| 8k working · middle · grinder | 58 | **81** | 59 | **+1** |
| 25k middle · high · grinder | 38 | **57** | 40 | **+2** |
| 8k working · budget · grinder | 107 | 115 | 105 | −2 |
| 25k middle · middle · grinder | 118 | 119 | 112 | −6 |

The sponsorship buys solvency and the open ladder spends it on aeroplanes — a J60 costs $1,100–2,400
of travel and a J300 $1,600–3,200. **So the slice does not make the game easier; it converts money
into ladder.** The grinder arms end where they started on survival and 6–15 places further up on
reach, which is a trade worth making, but nobody should read the reach gains as free.

**The player arm keeps both** — 118–120/120 survival on eight of nine presets *and* the reach gains —
because a $5k reserve is exactly the thing that stops an opened ladder from being a trap.

**One cell got worse and it is at the top: `120k wealthy · elite · player`, 120 → 115/120.** The
richest family in the game now loses four careers in 120 to solvency, because it can reach 2.1 J300s
and 12.8 J60s a career and an Elite coach on top of that is the most expensive way to play the game
that exists. `combined-measure.md` §3 called Elite "a trade rather than a trap ... it eats the
cushion"; the open ladder gives it more to eat. Worth the owner's eye, and it is the only cell in the
table where the slice makes something strictly worse.

### The control: the 14→16 horizon does not move at all — again

`reach` on the 14→16 horizon is **byte-identical in all eighteen cells** (114→114, 119→119, 120→120,
…): **0 of 18 moved**. That target is `kidPoints(world, 'domestic') >= 150` and reads no rank, so this
is the same clean control the rank fix used, confirming this slice touched only rank-denominated things.

⚠ **But it also shows that horizon has stopped being a measurement.** It now fires in **114–120 of
120** careers in every preset on both arms — a tracker pinned near "always" tells you as little as one
pinned at "never", which is the complaint this file already made about it once, from the other end.
`REACH_TARGET_MONEY` wants its own look; it is not touched here for the same reason `REACH_PRO_RANK` is
not (see §3).
