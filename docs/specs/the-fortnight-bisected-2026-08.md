---
type: spec
status: draft
area: engine/balance
canonical: false
last-reviewed: 2026-08-27
---

# The fortnight, bisected – what actually moved the ladder between 12.08 and 27.08

**Status: MEASUREMENT. Nothing shipped.** No engine constant moved, no test bound moved, no bench
policy was edited in a source tree. What this page adds is `tools/engine-bisect.sh` – a runner that
checks out a commit, pins the bench's manager, runs the 12.08 probe unmodified, and writes the
probe's own exit code into the log – and this document.

This is candidate 1 of [how-fast-she-grows-2026-08.md](how-fast-she-grows-2026-08.md) §10 –
«explain the drift first … it is a `git bisect` over one 80-second command. **Everything below is
tuning against a table that moved for reasons nobody has written down.**» This page writes them
down. **43 probe runs over 25 commits, 4,616 full careers, every one on the same seeds.**

---

## 0. The one-page answer

1. **The drift is a PRODUCT, not a sum, and «how much is engine, how much is manager» has no
   additive answer.** As a 2x2 on the same 100 seeded careers: the engine alone is worth
   **+2 careers per hundred**, the manager alone **+24**, the two together **+93**. The
   difference-of-differences – the part belonging to neither factor – is **67 points, 72% of the
   gap.** §6.
2. **The engine's own step function has ONE dominant step and it is a SINGLE COMMIT.**
   `a412162` (17.08, «round 21 skill: the law is the live 2026 curve») – one file,
   `src/engine/season/fieldPros.ts` – takes top-100 reach from **1/100 to 15/100** with the 12.08
   manager held fixed, and the corpus's best rank from **#82 to #5**. The commit before it and the
   commit before that are byte-identical to each other on all nine figures. §4c.
3. **⭐ That step was INTENDED, PREDICTED AND MEASURED at the time, and it must not be reported as a
   drift.** [the-skill-gap-2026-08.md](the-skill-gap-2026-08.md) §6 registered «median peak rank
   improves by **at least 40 places**» before the implementation; §7c reported «⚠⚠ **THE CAREER
   ACCELERATED, HARD** … median career high #97 → #12 … S6 predicted at least 40 places. **It is 85,
   and that is not a rounding – it is a different game at the top**», corroborated it with a second
   instrument, and escalated it to the owner as «THE THING HE MUST RULE ON». **This is a shipped
   decision that was measured, doubted and declared.**
4. **⚠ Three other steps moved career outcomes while the wave was doing something else**, which is
   this repo's own recurring shape (`fieldPros.ts` moving the college ending «without saying so»):
   - **`6c7507b` (14.08)** shipped `slam.drawSize` **32 → 128** and `wta1000.drawSize` **32 → 64**
     as a *sourcing* change, and measured injuries and condition. On today's manager it is worth
     **+10 careers per hundred** in top-100 reach. Nothing costed the reach.
   - **`d5defec` (16.08)**, the corrected acceptance cuts, registered «prize money flat to −$20k».
     On the 12.08 manager the median career prize falls **$574,030 → $18,500** – a factor of 31.
     The prediction was measured on today's parent and does not say so.
   - **`52a5f13` (23.08)**, round 25's money rulings, costs the 12.08-managed career **17 careers
     per hundred** of top-100 reach and costs today's manager **nothing** (93 → 94).
5. **⚠⚠ The «entered a Slam» half of the drift is mostly NOT the ladder, and its cause is in
   `tools/`.** Isolated to `d6eb021` (17.08): Slam entries go **1/100 → 43/100** while top-100
   reach, the corpus best rank and the top-250 count move by **exactly zero**. That commit is the
   bench starting to pass the event id, so it could finally see the eight wild cards.
   [the-wild-cards-2026-08.md](the-wild-cards-2026-08.md) §0 predicted precisely this – «a wild card
   buys a story, not progress» – and its prediction holds. §4c.
6. **The 12.08 reading reproduces, and one thing in it is wrong.** At 100 careers `51a8360` gives
   0 top-100, best #123, median #176, peak book 394 against the spec's 0/160, #115, #180, 375.
   ⭐ But at **400 careers one career does reach the top hundred and the corpus's best is #21**. The
   12.08 ceiling is a rare tail, not a wall. §3, §8.

---

## 1. The two anchors, and the commit each one really is

### 1a. The 12.08 reading

[ladder-vs-targets-2026-08.md](ladder-vs-targets-2026-08.md) says «Measured on `wave/flags-grant`
head `97ed54f`». ⚠ **`97ed54f` does not contain the instrument.** `tools/ladder-vs-targets.ts`
arrives with `51a8360`, whose parent is `97ed54f` and which touches `docs/` and `tools/` only –
`git diff 97ed54f 51a8360 -- src/` is empty. Both statements are therefore true, and the usable
anchor is **`51a8360`: the engine of `97ed54f`, with the probe on top.** It is also the commit
`how-fast-she-grows` §4b ran its own control at, so the two pages agree by construction.

### 1b. The 27.08 reading

`wave/the-shop` at **`d0d8944`** – the branch head when this bisection started, two commits after
`429f23f` where `how-fast-she-grows` was written. ⚠ The branch moved during this work (`23eff19`,
«fix(retirement): the hazard finally knows how fresh she arrived», landed at 13:47 while the sweep
was running). **Nothing here was re-run against it**; every figure below is `d0d8944` or older.

---

## 2. THE DESIGN – what «manager held fixed» means, and the two places it leaks

### 2a. The probe is the 12.08 spec's own tool, unmodified

`tools/ladder-vs-targets.ts --only 2 --seeds 25 --policy player` – 4 background/coach cells x 25
seeds = **100 full careers per commit, identical seeds in every run**, so every comparison here is
PAIRED. The tool changed by exactly **one line** across the whole fortnight (`kidAgeExact` gained a
`birthDay` argument at `ef776eb`), so the 12.08 and 27.08 readings are comparable by construction.
It ran unmodified at all 25 commits tested; **nothing was patched to make it run, no probe failed to
run, and no run was skipped.**

### 2b. The manager is pinned, and the pin refuses rather than guesses

`econ-bench`'s `player` policy is **not** a slow drift. It changed in exactly one commit –
`69796d3` (13.08, «the bench player, rebuilt: six rules a parent could say out loud»), first merged
at `9a1809e` – from three fields to thirteen, and the literal has been **byte-identical at every
commit since** (`md5` of the literal is the same at all fourteen candidates from `9a1809e` to
`d0d8944`; both engine constants it references, `ECONOMY.practice.rescueCondition` 80 and
`rescueTargetCondition` 85, are unchanged too). So this fortnight has exactly **two** managers, and
both are expressible everywhere they exist:

- **JULY ARM** – the runner appends a block to the checked-out `tools/econ-bench.ts` that sets every
  field the policy has at that commit to its 12.08 value (`reserveCents 5_000_00 · restFloor 70 ·
  coachOnEventWeeks true`, plus every field added since at the historical default `econ-bench`
  itself documents – the grinder's). At the 12.08 commits it pins three fields and is a no-op; at
  27.08 it pins twelve. **It throws if the policy has a field with no 12.08 value.**
- **TODAY ARM** – `--policy player` unpinned, valid from `9a1809e` onward.

Every behaviour the new manager added is *gated on a policy field* – `restFloorFor` returns the flat
gate when `restRelief` is 0, `reserveFor` returns the flat reserve when `reserveWeeks` is 0,
`planRecoveryWeek` and `reviewCoach` return at their first line – so pinning the fields genuinely
disables the parent's new rules rather than relabelling them.

### 2c. ⚠⚠ THE TWO PLACES THE FIXED MANAGER LEAKS – named, because one of them is a step

**Leak 1 – the bench's entry call follows the engine's API.** Across the fortnight
`tools/econ-bench.ts` changes in exactly three ways beyond the policy literal:
`availabilityStatus` → `entryStatus` (a rename), an expense category, and
`tierOpenFor(world, tier)` → `tierOpenFor(world, tier, e.id)`. **The third is not cosmetic.** It is
`d6eb021`, and it is a step in the series – §4c measures it and reports it as an **instrument** step,
not an engine one. On the headline it is worth zero; on «entered a Slam» it is worth everything.

**Leak 2 – the horizon is neither engine nor manager.** `FULL_CAREER_WEEKS` lives in
`tools/endings-bench.ts`, and `the-long-goodbye` step 2 (`89f86ab`, 26.08, on `wave/the-shop` and
**not** on `main`) changed it from `(ENDINGS.stopAskingAgeYears − 14 + 1) x 52` = **1300 weeks** to
`(FULL_CAREER_AGE_YEARS − 14 + 1) x 52` = **1612 weeks**. Every career after that point runs 24%
longer. **Neither spec names it as a confound.** Measured, it is inert on this page's headline on
both arms (§4, the-shop leg) – which is worth saying, because a 24% longer career is exactly the
kind of window change that could have flattered every figure.

⚠ **And the probe's own header still prints «full careers 14->38» while running 1612 weeks** – a
stale string at `tools/ladder-vs-targets.ts:29` and `:638`. Harmless to the numbers, misleading to a
reader, and it is how a horizon change gets past one.

### 2d. The headline number, chosen and stated before the runs

**Share of all starts whose career-best WTA rank ever reaches #100 or better.** Three reasons: it is
the row both target pages argue about; it is **door-independent** – a pure rank threshold, so no
acceptance cut and no wild card can move it, and both of those moved in this fortnight; and its
12.08 value is the 12.08 spec's own headline sentence.

⚠ **Its weakness, stated with it.** On the JULY arm the whole-fortnight endpoint is 3 of 100, and
0/100 [0.0–3.7%] against 3/100 [1.0–8.5%] **overlap** – so at 100 careers the headline cannot
resolve that arm's small steps. Two things were done about it rather than one:

- the endpoints were **re-run at 400 careers**, where they separate absolutely (§3);
- every step below carries three door-independent companions from the same printed block – **best
  rank of the corpus**, **median career-best rank**, **median peak best-18 book** – and where the
  headline's interval overlaps, this page says «suggestive» and does not quote the point estimate as
  a finding.

`Slam entered` is printed throughout and is **never** a headline: it depends on `acceptsRank`
(104 → 112 in this window) and, after 17.08, on the wild cards.

### 2e. The instrument's own controls

- **Byte-reproducible at one commit.** `d0d8944`, July arm, the same command twice: the two logs
  differ in **one line**, the tag.
- **Seven nulls landed as nulls.** `45255a4`, `43af8f9` and `db04d51` are identical to the anchor on
  all nine printed figures; `6393d08`, `a3ea116`, `924080f` and `6610f73` are identical to
  `52a5f13`. **Two** of those seven have no `src/engine` diff at all (`52a5f13`→`6393d08` and
  `924080f`→`6610f73`) and are the instrument's own control. ⭐ **The other five changed 10, 2, 10,
  24 and 16 engine files and still returned a byte-identical nine-figure result** – which is the more
  interesting half: most engine work in this fortnight moved no career outcome whatsoever, and that
  is what makes the ones that did worth naming.
- **The pin's refusal arm is mutation-verified.** A field named `inventedFieldForMutationTest` added
  to the `player` literal makes the run die with
  `JULY PIN: manager field(s) with no 12.08 value: inventedFieldForMutationTest – REFUSING to run`
  and exit 1. A guard that cannot fail on the broken version is not this guard.
- **The runner refuses a tree it must not reset.** It exits 9 on a non-repository and on a worktree
  that is on a branch rather than detached; both arms were exercised.
- **Exit codes were read out of the log file** (`RUN_EXIT=` appended by the runner itself), never
  from a pipe and never from a background notification. It caught one: `6610f73`'s July run was
  killed mid-flight when its background task was stopped, and the missing `RUN_EXIT=` is the only
  thing that said so. It was re-run. **All 43 completed runs exited 0.**

---

## 3. THE 12.08 READING REPRODUCED – and the one thing in it that is wrong

| | this page, `51a8360` | | `ladder-vs-targets` §2c |
| --- | --- | --- | --- |
| | **n = 100** | **n = 400** | n = 160 |
| reached top-100 | **0** | **1 (0.3%, CI 0.0–1.4)** | **0** |
| **best rank in the whole run** | #123 | **#21** | **#115** |
| median best rank | #176 | #174 | #180 |
| top-250, of all starts | 67.0% | 67.3% | 66.3% |
| peak best-18 book, median | 394 pts | 403 pts | 375 pts |
| entered a Slam | 0 | 1 | 0 |

**The anchor reproduces.** ⭐ And at 400 careers the 12.08 engine's own headline sentence – «the
Slam's door is #104 of 1800, and **nobody in 160 careers reaches it**» – turns out to be a sample
size: one career in four hundred reaches it, and the run's best rank is **#21**, not #115. It was a
rare tail, not a wall, and the difference matters because a wall invites a structural fix and a tail
invites a distribution one.

---

## 4. THE STEP FUNCTION – engine moving, 12.08 manager held fixed

100 careers per row, same seeds throughout. `Slam` counts ENTRIES – see §2d.

| # | commit | date | wave | **top-100** | Slam | top-250 | best | med rank | med prize | peak book |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | `51a8360` | 12.08 | **the anchor** | **0** | 0 | 67 | #123 | #176 | $538,590 | 394 |
| 1 | `45255a4` | 12.08 | #88 flags-grant | 0 | 0 | 67 | #123 | #176 | $538,590 | 394 |
| 2 | `43af8f9` | 12.08 | #89 flags-grant | 0 | 0 | 67 | #123 | #176 | $538,590 | 394 |
| 3 | `db04d51` | 13.08 | #90 flags-grant | 0 | 0 | 67 | #123 | #176 | $538,590 | 394 |
| 4 | `0ec164f` | 13.08 | **#91 coach-edge** | 1 | 0 | 66 | **#94** | #174 | $533,670 | 387 |
| 5 | `9a1809e` | 14.08 | #92 coach-edge | 1 | 0 | 66 | #94 | #174 | $533,670 | 387 |
| 6 | `4806382` | 14.08 | #93 coach-edge | 1 | 0 | 66 | #94 | #174 | $533,670 | 387 |
| 7 | `6c7507b` | 14.08 | **#94 opener-price** | 0 | 0 | **73** | #112 | #168 | **$574,030** | **441** |
| 8 | `d5defec` | 16.08 | **#95 round 21 P3** | 0 | 0 | **47** | #114 | #182 | **$18,500** | **123** |
| 9 | `13d8f95` | 17.08 | **#96 round 21 pt 2** | **16** | **42** | 52 | **#10** | #160 | $91,390 | 364 |
| 10 | `94993f2` | 19.08 | #97 round 22 | 28 | 44 | 52 | #8 | #137 | $64,400 | 281 |
| 11 | `3ab5d77` | 20.08 | #99 round 23 | 20 | 41 | 57 | #8 | #157 | $133,339 | 360 |
| 12 | `2bdf64b` | 22.08 | #100 round 24 | 20 | 41 | 57 | #8 | #157 | $133,339 | 360 |
| 13 | `52a5f13` | 23.08 | **#101 round 25** | **3** | 29 | 47 | #14 | #217 | $167,333 | 234 |
| 14 | `6393d08` | 23.08 | #104 backlog | 3 | 29 | 47 | #14 | #217 | $167,333 | 234 |
| 15 | `a3ea116` | 25.08 | #105 review-intake | 3 | 29 | 47 | #14 | #217 | $167,333 | 234 |
| 16 | `924080f` | 26.08 | #106 review-intake | 3 | 29 | 47 | #14 | #217 | $167,333 | 234 |
| 17 | `6610f73` | 26.08 | #107, **main head** | 3 | 29 | 47 | #14 | #217 | $167,333 | 234 |
| 18 | `d0d8944` | 27.08 | **`wave/the-shop`** | 3 | 28 | 48 | #13 | #212 | $163,919 | 251 |

**The endpoints, at 400 careers**, where the headline resolves:

| | `51a8360` (12.08) | `d0d8944` (27.08) |
| --- | --- | --- |
| **top-100, of all starts** | **1/400 – 0.3% [0.0–1.4]** | **17/400 – 4.3% [2.7–6.7]** |
| top-100, of horizon | 0.3% [0.1–1.8] | 5.7% [3.6–9.0] |
| entered a Slam | 1/400 | 137/400 |
| top-250, of all starts | 269/400 – 67.3% | 209/400 – 52.3% |
| best rank in the run | #21 | #13 |
| median best rank | #174 | #204 |
| median career prize | $504,390 | $168,479 |
| median peak book | 403 | 263 |

⭐⭐ **THE ENGINE'S OWN CONTRIBUTION, WITH THE 12.08 PARENT IN CHARGE, IS ABOUT FOUR CAREERS IN A
HUNDRED – and it BUYS THAT BY MAKING THE MEDIAN CAREER WORSE.** Top-250 reach falls 67.3% → 52.3%,
the median career prize falls by two thirds, the median peak book falls 403 → 263, the median rank
falls #174 → #204, and eighteen more families in four hundred go bankrupt. **Fifteen days of engine
work did not lift the distribution; it stretched it – opening a top that barely existed and lowering
the middle underneath it.**

**Steps that clear the headline's own interval at n = 100** (Wilson 95%):

| step | headline | interval | verdict |
| --- | --- | --- | --- |
| `d5defec` → `13d8f95` | 0 → 16 | [0.0–3.7] vs [10.1–24.4] | **REAL** |
| `2bdf64b` → `52a5f13` | 20 → 3 | [13.3–28.9] vs [1.0–8.5] | **REAL** |
| `13d8f95` → `94993f2` | 16 → 28 | [10.1–24.4] vs [20.1–37.5] | overlapping – suggestive |
| `94993f2` → `3ab5d77` | 28 → 20 | [20.1–37.5] vs [13.3–28.9] | overlapping – suggestive |
| `db04d51` → `0ec164f` | 0 → 1 | [0.0–3.7] vs [0.2–5.4] | does not generalise – see below |
| `4806382` → `6c7507b` | 1 → 0 | overlapping | does not generalise – see below |

⚠ **The last two rows are one career each and prove nothing on their own – and both are real changes
anyway**, because the corpus is deterministic and paired: `0ec164f` moves the corpus's best rank
**#123 → #94** on the same seeds, and `6c7507b` moves top-250 **66 → 73**, the median prize
**+$40,360** and the median peak book **387 → 441**. **A one-career move in the headline is not
evidence; a simultaneous move in three door-independent companions on identical seeds is.** They are
small steps, not absent ones.

### 4a. The same series with TODAY's manager – valid from 14.08, when today's manager exists

The `player` literal is byte-identical at every one of these commits (§2b), so this is the same
experiment with the other parent.

| commit | date | wave | **top-100** | Slam | top-250 | best | med rank | med prize | peak book |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `9a1809e` | 14.08 | #92 | **25** | 22 | 96 | #10 | #127 | $1,119,820 | 671 |
| `4806382` | 14.08 | #93 | 25 | 22 | 96 | #10 | #127 | $1,119,820 | 671 |
| `6c7507b` | 14.08 | **#94 opener-price** | **35** | 34 | 96 | #5 | #113 | $1,211,960 | 766 |
| `d5defec` | 16.08 | **#95 round 21 P3** | **44** | 46 | 92 | #8 | #101 | $1,339,750 | 808 |
| `13d8f95` | 17.08 | **#96 round 21 pt 2** | **92** | 95 | 95 | #1 | **#9** | $20,913,070 | 4386 |
| `94993f2` | 19.08 | #97 round 22 | 96 | 97 | 97 | #1 | #9 | $22,904,310 | 4738 |
| `3ab5d77` | 20.08 | #99 round 23 | 93 | 94 | 95 | #1 | #9 | $13,384,128 | 4883 |
| `2bdf64b` | 22.08 | #100 round 24 | 93 | 94 | 95 | #1 | #9 | $13,384,128 | 4883 |
| `52a5f13` | 23.08 | #101 round 25 | 94 | 95 | 95 | #1 | #9 | $12,818,985 | 4705 |
| `a3ea116` | 25.08 | #105 review-intake | 94 | 95 | 95 | #1 | #9 | $12,818,985 | 4705 |
| `924080f` | 26.08 | #106, **main head** | 94 | 95 | 95 | #1 | #9 | $12,818,985 | 4705 |
| `d0d8944` | 27.08 | `wave/the-shop` | 94 | 95 | 95 | #1 | #9 | $13,196,215 | 4705 |

**One step carries the whole explosion: `d5defec` → `13d8f95`, +48 points** ([34.7–53.8] vs
[85.0–95.9], no overlap, and **all four cells move the same way**: 10→22, 7→23, 12→23, 15→24).
Everything after 19.08 is inside noise of everything else, and the-shop's leg is flat.

⚠ `6c7507b`'s +10 here has overlapping unpaired intervals and moves 3 of 4 cells up (7→12, 6→5,
5→7, 7→11). **Suggestive, on the same seeds, not established** – the probe does not print per-career
output, so a paired test is not available from these logs.

### 4b. ⚠⚠ AND THE TWO ARMS DISAGREE IN SIGN, TWICE. That is the finding, not a discrepancy

| the same commit | with the JULY manager | with TODAY's manager |
| --- | --- | --- |
| `d5defec` – the corrected acceptance cuts (16.08) | top-250 **73 → 47**, median prize **$574,030 → $18,500**, peak book **441 → 123** | top-100 **35 → 44**, median prize **+$128k**, peak book **766 → 808** |
| `52a5f13` – round 25's money rulings (23.08) | top-100 **20 → 3**, median rank **#157 → #217** | top-100 **93 → 94** – nothing |

A door that pushes her down a rung is a **substitution**: she plays where she wins. A parent holding
eight weeks of bills, entry discipline and a season coach review can pay for that substitution; a
parent holding a flat $5,000 and no rules cannot, and **the same commit that helps the first ruins
the second.** Round 25's team share of prize money and per-match tour pricing are the same shape – a
cost the managed career absorbs and the unmanaged one dies of.

### 4c. INSIDE THE BIG STEP – the drill, and the two things it separates

`d5defec..13d8f95` is 132 linear commits on `wave/round21`. JULY arm, same 100 careers:

| commit | what it is | **top-100** | Slam | best | med rank | med prize | peak book |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `d5defec` | the merge before | 0 | 0 | #114 | #182 | $18,500 | 123 |
| `f2f8919` | «the score is re-shaped onto the rung that actually separates careers» | 1 | 1 | #73 | #200 | $81,280 | 230 |
| `fd66d52` | **the wild cards, engine side** | 1 | 1 | #82 | #198 | $342,610 | 301 |
| `9785639` | (college drawdown) | 1 | 1 | #82 | #198 | $342,610 | 301 |
| **`d6eb021`** | **the BENCH starts passing `e.id`** | 1 | **43** | #82 | #192 | $369,160 | 307 |
| `daaa677` | (college odds) | 1 | 43 | #82 | #192 | $369,160 | 307 |
| **`a412162`** | **the skill re-deal – `fieldPros.ts`, one file** | **15** | 45 | **#5** | #163 | $103,480 | 333 |
| `13d8f95` | the merge (24 further commits) | 16 | 42 | #10 | #160 | $91,390 | 364 |

Two clean separations, and they are the most useful results on this page.

**⭐ ONE COMMIT OWNS THE LADDER.** `a412162` moves top-100 reach **1 → 15** ([0.2–5.4] vs [9.3–23.3],
no overlap) and the corpus's best rank **#82 → #5**, on its own, with the 12.08 manager and the same
seeds. `daaa677` immediately before it is byte-identical to `d6eb021` on all nine figures, so the
step is that commit and nothing else. It replaces the discrete storey bands in
`src/engine/season/fieldPros.ts` with `SKILL_LAW` – a continuous curve interpolated in log2(rank)
through thirteen anchors fitted to the live 2026 WTA Elo-by-rank list. In its own spec's words, «the
top 50 lose **14 core points** and #100 loses 5, while everything past #365 **gains 3 to 4**».
**The world's head got weaker and its tail got stronger, and our player climbs the part that got
weaker.**

**⭐ AND ONE COMMIT OWNS THE SLAMS, AND IT IS NOT AN ENGINE COMMIT.** `d6eb021` moves Slam entries
**1 → 43** and moves top-100 reach, the best rank and the top-250 count by **exactly zero**. It is
`tools/econ-bench.ts` passing `e.id` to `tierOpenFor`; its own comment says «the bench was strictly
stricter than the game … a null from an instrument that cannot see the change is a null ARM, not a
null result». **So the «she plays Slams now» half of the drift is a bench that stopped being blind,
plus eight places a Slam gives away – not a ladder anybody climbed.**
[the-wild-cards](the-wild-cards-2026-08.md) §0 asked for exactly this test – «a material improvement
in who reaches what would be a finding to report, not a success» – and the answer is that there is
none: **0 careers.**

---

## 5. Round 22, and the one step this page cannot attribute

`13d8f95` → `94993f2` moves the July headline 16 → 28 and the median best rank #160 → #137, and the
two intervals overlap, so the step is **suggestive and not established**. It was not drilled. Two
commits inside it are world-strength changes by their own messages and both are the right shape:

- `faa5a6c` «The cohort gets a real fifth skill: its own ceiling, and room to specialise» –
  `rivalGroundstrokes` stops being a third reading of serve and return, so all 199 live rivals gain
  a genuine fifth axis and a ceiling.
- `cacf5b8` «A pro climbs into her chair instead of inheriting it» – `tenureRamp(seasons on tour)`
  replaces `ageRampFloor`. ⚠ Its own message records that the first two shapes of it **deflated the
  merged table ~10% and handed the kid a professional rung she had not earned**
  («tests/unranked-sentinel.test.ts went from a three-rung acceptance window to four»), and that the
  shipped shape is the third.

**Neither carries a career-reach measurement and round 22 shipped no spec in `docs/specs/`.** If
anything on this page deserves a follow-up bisect, it is this merge.

---

## 6. THE SPLIT – and why it is not a split

The manager changed exactly once, so all four cells of the 2x2 are measurable to within one wave.
`9a1809e` is the 12.08 engine plus `wave/coach-edge`; on the July arm it reads 1/100 against the true
anchor's 0/100, so it stands in for «the old engine» at a cost of one career, stated rather than
hidden.

| top-100 of 100 careers | **12.08 manager** | **today's manager** | the manager is worth |
| --- | --- | --- | --- |
| **engine `9a1809e`** (14.08) | **1** | **25** | **+24** |
| **engine `d0d8944`** (27.08) | **3** | **94** | **+91** |
| **the engine is worth** | **+2** | **+69** | |

⭐⭐ **NEITHER FACTOR REPRODUCES THE EXPLOSION ALONE, AND THE INTERACTION IS LARGER THAN EITHER MAIN
EFFECT.** On the balanced decomposition over the four cells: baseline 1, engine main effect
**+35.5**, manager main effect **+57.5**, and the difference-of-differences – the part that belongs
to neither – is **+67 of the 93-point gap, 72% of it.**

Both existing readings of this fortnight are true and both are incomplete:

- «the same tool, unchanged, went from nobody in 160 careers to 16/16» – true, and it compares
  (old engine, old parent) with (new engine, new parent). Neither factor did that on its own.
- how-fast §4b's «⭐⭐ **the outcome distribution is the BENCH'S MANAGER far more than it is the
  engine**» – true **on today's engine**, where the manager is worth +91 and the engine +2. On the
  14.08 engine the same manager is worth +24, and on today's manager the engine is worth +69.
  **The manager is a multiplier on an engine that has something to multiply, and before 17.08 it did
  not.**

⚠ **What this does not license.** With 72% of the effect in the interaction, no number on this page
may be quoted as «the engine's share of the drift». The honest statements are the four cells and the
two conditional differences, and this page declines to reduce them to one percentage.

### 6a. The cell that cannot be built, and why it was not faked

«Today's manager on the 12.08 engine» would need `reviewCoach`, `planRecoveryWeek`, `onlyHerTable`
and `skipOutgrown` back-ported into the 12.08 `econ-bench`. Every engine function they call already
exists at `51a8360` except `SEASON_WRAP_OFFSET`, so it is *nearly* possible – **and a reconstructed
manager is not the manager**, so it was not done. `9a1809e` stands in and the one career it costs is
declared above.

---

## 7. WHAT EACH STEP WAS FOR – and whether it was intended

⚠ **Why this section exists**: a step a spec predicted is a shipped decision; a step nobody costed is
a drift. They must not be reported the same way.

| step | what the commit was FOR | did anything predict the career-outcome move? |
| --- | --- | --- |
| `0ec164f` 13.08 | `coach-match-edge.md` – the coach's edge inside the match model | the spec is still `status: draft` with «§6's re-measure against its registered prediction» open by its own admission. Effect here is one career plus three companions – small, and **unclosed**. |
| **`6c7507b` 14.08** | **sourcing and realism.** «(c) ships: the Slam draws 128 and the WTA 1000 draws 64, fully sourced», on the owner's «доделывай пожалуйста». `slam.drawSize` 32 → **128**, `wta1000.drawSize` 32 → **64**, both points tables and both prize tables extended, the tier surcharge capped at five matches | ⚠ **No.** The commit measured *injuries* and *condition* («the A/B says the deep draws leave her LESS injured») and the wave's spec, `the-band-is-not-the-draw`, is a per-round win-rate measurement. **Nothing costed the reach.** It is worth **+10 careers per hundred** of top-100 reach on today's manager and +7 top-250 with +$40k median prize on the July arm. |
| **`d5defec` 16.08** | `acceptance-cuts-corrected-2026-08.md` – w50 550→330, w75 450→300, w100 350→240, wta125 250→180, each sourced from observed real cuts | **Intended, with ten predictions registered before the arms ran.** ⚠ But P6 predicted «prize money **flat to −$20k**» and was measured on `POLICIES[1]`, i.e. today's parent. **On the 12.08 parent the median career prize falls $574,030 → $18,500.** The prediction is not wrong – it is conditional on a manager, and it does not say so. |
| **`a412162` 17.08** | `the-skill-gap-2026-08.md` – the owner's «скилл особо ни на что не влияет». `fieldPros`'s storey bands replaced by a curve fitted to the live 2026 Elo-by-rank list | ⭐ **YES, completely.** S6 registered «median peak rank improves by at least 40 places» **before the implementation**; §7c reported «**THE CAREER ACCELERATED, HARD**», median career high **#97 → #12**, stated «S6 predicted at least 40 places. It is 85… a different game at the top», corroborated it with a second instrument (the college bench, #114 → #16) and escalated it as «THE THING HE MUST RULE ON». **The biggest engine step of the fortnight is a shipped, measured, declared decision.** |
| `d6eb021` 17.08 | the bench stops being blind to the wild cards (**`tools/`, not `src/`**) | **Yes, and correctly** – its own comment names the null-arm hazard. ⚠ It is an INSTRUMENT step inside an engine bisection, and this page reports it as one. It moves the headline by zero. |
| `94993f2` 19.08 | round 22 – `faa5a6c` (rivals' fifth skill) and `cacf5b8` (tenure instead of age) | ⚠ **No spec, no registered prediction, intervals overlap.** §5. |
| `3ab5d77` 20.08 | round 23 – «the top of the ladder gains rungs», the domestic table becomes season-to-date | intervals overlap; **not established** |
| **`52a5f13` 23.08** | round 25 – the owner's 22.08 rulings: the team's share of prize money (coach 10%/5%, masseur 3%/1.5%), per-match tour pricing, recovery variant C, the condition dial stepping | **Intended, owner-ruled, specced.** ⚠ But the whole cost lands on the unmanaged parent: **20 → 3** on the July arm, **93 → 94** on today's. Nothing recorded that a parent without a coach review and without a weeks-of-bills reserve loses seventeen careers per hundred to it. |
| `d0d8944` 27.08 | `wave/the-shop` – the long goodbye (horizon 1300 → **1612 weeks**), the shop, the masseur | **inert on the headline on both arms** (3 → 3 July, 94 → 94 today). Worth stating: a 24% longer career is exactly the kind of window change that could have flattered every figure, and it did not. |

---

## 8. What the two specs got wrong

Neither page's verdict is wrong. Five corrections, in order of how much they matter.

1. **⚠⚠ `how-fast-she-grows` §4b's attribution is right about today and wrong as a general claim.**
   «The outcome distribution is the BENCH'S MANAGER far more than it is the engine» holds on the
   27.08 engine (+91 manager against +2 engine) and inverts on the 14.08 one, where the same engine
   change is worth +69 to a modern parent. The two are multiplicative and 72% of the gap is the
   interaction. §6.
2. **⚠ `how-fast-she-grows` §4b reduces PR #94 to «two constants (`slam.points` and
   `wta1000.points` last element → 10)».** The same PR shipped `slam.drawSize` **32 → 128** and
   `wta1000.drawSize` **32 → 64**, extended both prize tables by two and one rung, and capped the
   tier surcharge. That is the largest structural change to the top of the ladder in the fortnight.
3. **⚠ The door table in the same section is correct and incomplete.** w50 550→330, w75 450→300,
   w100 350→240, wta125 250→210 – all verified against `51a8360` and `d0d8944`. It omits
   **`slam.acceptsRank` 104 → 112**, the one door that got *easier*, and the eight wild cards that
   opened beside it; and its "so the doors are not the cause" is asserted, not measured. Measured,
   the doors ARE a cause – of the July arm's collapse (§4b) – just not of the explosion.
4. **⚠ `how-fast-she-grows` §4a's «Slam-level A – PLAYED a Slam main draw, 93.3%» is not a ladder
   figure after 17.08.** §4c isolates 42 of every 100 Slam entries to a wild card the bench could
   not previously see – the count moves **1 → 43 per hundred at one bench commit** with zero
   movement in rank. That row measures a story feature and a fixed instrument, not a climb.
5. **⚠ `ladder-vs-targets`'s «nobody in 160 careers reaches it» is a sample size.** At 400 careers
   on the same engine, one does, and the run's best rank is **#21** rather than #115 (§3). Its
   engine anchor is also named as `97ed54f`, which does not contain the tool; the usable anchor is
   `51a8360` (§1a).

---

## 9. What this page did NOT do

- **It changed no engine number and no bench policy in any source tree.** The July pin is appended
  to a checked-out `tools/econ-bench.ts` by the runner and reverted immediately after; every commit
  tested ends with a clean worktree.
- **It did not drill round 22** (§5) – the one step it cannot attribute.
- **It did not re-run anything against `23eff19`**, which landed on `wave/the-shop` mid-sweep.
- **It did not build the fourth cell of the 2x2** and says why (§6a).
- **It did not measure the pace.** ⭐ And there is a reason worth recording: `ageCurve` **never moved
  in this fortnight** – `growthStart 13 · growthEnd 18 · plateauStart 23 · peakRate 0.0062 ·
  growthEase 0.5`, byte-identical at all twenty-one candidate commits. So the pace defect
  `how-fast-she-grows` §9a measures is not in this window at all, which is the strongest available
  reason to believe its separation of the pace from the outcome.
- **It proposes no fix.** CLAUDE.md invariant 4 owns every constant named here.
