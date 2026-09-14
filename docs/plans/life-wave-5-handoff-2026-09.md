---
type: plan
status: current
area: life
canonical: false
last-reviewed: 2026-09-14
---

# Wave 5 handoff – «the psychologist's year» (`life/wave-5`, v76): the builder's record

The branch as it is handed back. Thirteen tasks, one builder, `4ceb7c0d..HEAD`. This is the
BUILDER's record and nothing else: what shipped, what the gate said out of its own log files, what
the benches measured against the numbers they were asked to price, what the wave deliberately did
not do, and what it leaves behind with the measurement that says why. **The questions for the owner
are the architect's to assemble** – they are not in this file, and where a number wants a ruling it
is reported here with its measurement and left standing.

Read beside [the builder brief](life-wave-5-builder-2026-09.md), [the rulings
A–S](life-wave-5-rulings-2026-09.md) and [the strings table](life-wave-5-strings-2026-09.md). On any
drift the spec wins: [the psychologist's year](../specs/the-psychologists-year-2026-09.md) for the
seat, [who-she-is §2a](../specs/who-she-is-2026-09.md) for the walls.

---

## 1. What shipped, task by task

| # | commit | what it ships, in one line |
| --- | --- | --- |
| T1 | `8c776cc8` | **schema v76** – six flat fields on `WorldState` (the seat's four, the two walls pairs), the append-only migration, the golden `v76.json`, the e2e corpus regenerated, eleven frozen constants re-stamped, and the ZERO-DIFF PIN that proves a migrated world reads every temperament against birth and plays byte-identical weeks |
| – | `89850de2` | the decision index regenerated: `npm run check` was **RED at the wave's own base** (ruling B), fixed in its own two-line commit before T2 started |
| T2 | `f4c77af4` | **the seat** – `src/engine/world/psychologist.ts`, `masseurUnlocked`'s twin on the professional gate, the flat weekly retainer per rung, the college/family stand-down pair, the command wire, and the second `StaffMember` entry the Support-staff tab was built for |
| T3 | `3363a974` | **the year-focus** – `setPsychologistFocus`, the free pick at hire, the one-change-a-season guard, and the two deterministic consent gates (the 18+ joint decline, the `'herself'` readiness card) |
| T3b | `ab305ed1` | ruling I applied: the window is the TRUE off-season (`isOffSeasonWeek`), and the stamp is the season the choice is FOR – which retires a lock of up to 101 weeks on a parent's first free pick |
| T4 | `c6efc7c5` | **«Back on her feet»** – the recovery slope as one term inside `accrueSpirit`'s return step, `spiritShock.weeks` counting the weeks the slope actually applied, and the clear-week receipt that checks them |
| T4b | `f1d910d2` | ruling J applied: the effect rides the BILLING predicate – `accrueSpirit(world, psychologistWorksThisWeek(world))` at the caller, so a stood-down seat gives nothing back for the week it is not paid |
| T5 | `3ef5b07f` | **«Cool head»** – a bounded composure walk toward HER OWN ceiling as its own named term in `growWeek`, zero at the ceiling, plus the one receipt a year that makes it visible at all |
| T6 | `35ea7415` | **«Learning to listen»** – the legible-wording coin on `seed:psy:listen:<kind>:<week>`, stamped on the row (ruling E), with the bond arithmetic and the priced option set byte-identical across the toggle |
| T6b | `a1f414bb` | ruling O applied: the told-now ending row stays READ-FREE in both arms – a focus may change how a surface reads, never create one. `ENDED_EVENT_HEARD` 16 → 8 cells, the wave's new string count 48 → 40 |
| T7 | `da15d3c2`, `c8e04b57` | **the walls** – `driftWalls` as a sibling of `accrueSpirit` (ruling P), the signed leaning per axis, the flip hazard with hysteresis on `seed:life:walls:<axis>:<week>`, `expressedTemperamentOf`, and ruling A's re-points PER CALL SITE: three mechanics read expression, two prices keep reading birth |
| T8 | `d5a3e687` | **the counsel seat** – `'fork-psy'` raised once at the reserved slot in `lifeBeat.ts`, gated on the hire, with the shock REGISTER stamped in the row's own detail (ruling Q) so the wording is reconstructible forever |
| T9 | `5f9056f2` | **the strings** – all 82 the wave added, collected from the diff and linted, nothing rewritten |
| T9b | `d752f9da` | the architect's вычитка: **three changes and no others** – the recovery receipt's TRIGGER (not its words), and two `PSY_COUNSEL` cells |
| T12 | `05762d9c` | **coach profiles** – the JOIN the market card never made, over axes that already existed; the personal edge placement refused on `coach-match-edge` §4 and the refusal pinned (ruling S) |
| T13 | `04e6fc64` | **the elite gate goes ON** – the flag flipped, the three built surfaces re-proven to tell one story, and the corpus measured unable to reach the bar by 154 weeks |
| T10 | `f2c8e4cf`, `91374ceb` | **the benches** – `tools/psy-grid.ts` (`bench:psy`), census v3 in `tools/life-arrival.ts`, every bar predicted before it was measured, two exit codes; plus the `fitFactor` paragraph that had described a balance the game stopped having at round 38 |
| T11 | this commit | **e2e, the frozen corpus, the gate, this document** |

## 2. The gate

Wave-3 §6's standard, run once, on a quiet machine, **every verdict read out of a log file the
command itself appended, with a unique log path per run** – never a pipe, never a background
notification.

> ⚠ The notification lied **twice more in this task**, both in the same costume and both in the
> wave's running count: a background wrapper reported «exit code 0» **within a second** of starting
> the fixture regeneration – which then ran for another twenty-one minutes – and again over the
> first e2e run, while Playwright had not yet started a test. Neither was believed. Every verdict
> below is `grep`ped out of a log file the command itself appended, at a path no other run in this
> session writes to (T10's twelfth costume: a killed run's wrapper appending to a recreated log
> path).

Run in this order, one at a time, nothing else running: `uptime` first (`0:10 up 11:22, load
averages: 2.04 2.21 2.83` – no agent, no bench, no orphan `vitest`).

| what | log file | the verdict, quoted |
| --- | --- | --- |
| `npm run check` | `gate-check-1789315837.log` (mtime 00:15, run started 00:10) **and re-run on the committed tree as `gate-check-head-1789317070.log`** (mtime 00:36, started 00:31, `unit: green in 261s`) | **`CHECK_EXIT=0`** in both · `result: ok` (context audit, 395 Markdown files) · `doc facts: ok – schema v76, live wave round 41` · `engine purity: ok` · `Source-pin ratchet … result: ok` · `decision index: ok – 107 entries, 17 areas` · `world map: … is current (484 symbols)` · `tools registry: ok – 36 live, 185 archival` · `unit: green in 263s` (`unit bulk … ok (136s, 5323 tests)`) · component `Test Files 178 passed (178) / Tests 1908 passed (1908)` |
| the frozen careers, inside it | same log | `unit coach-travel-edge … ok (21s, 11 tests)` · `coach-travel-edge-mid-schemas … ok (17s, 8 tests)` · `coach-travel-edge-older-schemas … ok (21s, 10 tests)` – **every frozen constant reproduces at head** |
| fixture freshness vs head, inside it | same log | `tests/e2e-fixtures.test.ts` runs in the `bulk` shard and asserts `manifest.schemaVersion === SAVE_SCHEMA_VERSION` plus every fact re-derived through the product's own reader – green, and §6c is the half that shard cannot see |
| the build line | same log | `✓ 401 modules transformed … ✓ built in 1.87s` · `precache 372 entries (16118.03 KiB)` · `install size: ok – 16118 KiB in 366 precache entries, 266 KiB under the 16384 KiB ceiling` |
| `npm run test:sim` | `gate-sim-1789316192.log` (mtime 00:28) | **`SIM_EXIT=0`** · `sim: 13 files green in 724s` |
| `npm run test:e2e` (the whole suite, 23 specs) | `gate-e2e-1789316938.log` (mtime 00:29) | **`E2E_EXIT=0`** · `119 passed (32.1s)` · `e2e: green in 33s`, **0** failure lines |
| the wave's own e2e case, inside it | same log | `✓ 71 [chromium] › e2e/psychologist.spec.ts:132:3 › the psychologist takes the weekly call › pro: hired at the default rung, given a year of work, and on the ledger the week after (4.2s)` |
| **the responsive parity harness at 375 / 768 / 900 / 1280** | same log | 29 `parity.spec.ts` lines, all `✓`, including `every screen in src/components/screens/ has a station in this file` and one `… carries the same controls at every width` per screen |
| the capture | `gate-capture-1789316992.log` (mtime 00:30) | **`CAPTURE_EXIT=0`** · `Test Files 1 passed (1) / Tests 51 passed (51)` – the MAIN capture stands at 41550 / `e6b0c709`, and §6b is the stronger statement about it |

⚠ **`npm run check` was run TWICE and the second run is the one that counts.** The first ran while
this document and the spec's header comment were still being written; the second ran on the tree that
was committed, so no verdict here is a stale green over a tree nobody checked. The only text not
covered by that second run is this paragraph and the row above it, which is where the regress has to
stop.

⚠ Not part of the gate, by design: **`npm run bench:psy` exits 1** on the eight bars of §3a. No bench
runs inside `npm run check`, so that red is a ruling request on §4's proposals and never a blocked
gate – it is quoted here so nobody reads a green gate as «every number was met».

## 3. The benches – what came back against the numbers

Both records live in the specs, in full, with every n and every SEM: the grid in
[the psychologist's year §8](../specs/the-psychologists-year-2026-09.md) and census v3 in
[who-she-is §4a](../specs/who-she-is-2026-09.md). What follows is the shape, for a reader who is
deciding what to rule.

**`npm run bench:psy` exits 1 on purpose** – a missed bar is the instrument working. No bench runs
inside `npm run check`, so a red there is a ruling request and never a blocked gate.

### 3a. The eight misses, and the constant each implicates

| # | miss | the number it implicates | what was measured |
| --- | --- | --- | --- |
| 1–6 | **«Back on her feet» cannot rank its rungs for a STEADY girl** – six bars (two temperaments × three rungs) | `recoverySlope [2, 3, 4]` – **RULED by the spec §2**, not a §4 proposal | a steady girl is under the knee 1.900 weeks with nobody hired; rung 0 buys Δ 0.000, and the whole ladder buys a quarter of a week. From a lifted 75 her shock is −22 and she returns at 5 a week, so she is under the knee for one or two weeks whatever the family pays. The same ladder is clean for an INTENSE girl (3.34 / 4.36 / 2.18 × SEM). **The 23.08 slope-blur is still there, inside one focus, for half the roster** |
| 7–8 | **«Working on herself» cannot rank its rungs on the FLIP COUNT** – two bars | `flipHazardPerWeek 0.05` × `wallsHazardScale [1, 1.5, 2]`, against `leanMax 100` | 1.000 / 1.000 / 1.000 flips a career (Δ 0.000 ± 0.180): the lean saturates at ±`leanMax` and then sits armed for hundreds of weeks, so the flip is a near-certainty at every rung and the count is capped by how many growable axes she has. **The ladder is in the WAIT and there it is clean** – median 19.0 → 12.5 → 4.5 weeks |

**Everything else HIT.** Cool head beats its training-only control at 81 / 88 / 39 × SEM and each
rung beats the one below by 12–36 × SEM; zero at the ceiling is exact (48 at-or-above states, 0
non-zero); listen's realised clarity is 61.7 % / 81.0 % / 96.1 % against 0.60 / 0.80 / 0.95 with
every per-temperament cell inside its CI; the anti-«hugged into an extravert» dam holds exactly (0
beyond-baseline weeks and 0 flips in the caring no-focus arm against 42 408 weeks and 96 flips in
the seat arms); O6's slow-down is ×0.7333 to four decimals.

### 3b. Two predictions of the architect's that the walked career moved

* **Ruling M's «a held season delivers ~0.9× the card» is a probe-world number.** Measured in a
  walked career it is **0.61–0.65×**, decomposed: a held season is ≈ 38.7 worked weeks and not 52
  (21–23 % of post-hire weeks are stood down), ×0.744; ruling M's own headroom mechanism is ≈ 0.86
  rather than 0.90; 0.744 × 0.86 = 0.64.
* **Ruling M's fourth number is right to four decimals** – ×0.7333, the tenths grid eating part of
  O6's ×0.75.

### 3c. The never-fired corridor, printed

Per focus, the share of **paid** weeks with nothing to do, at rung 1:

| focus | paid weeks | never fired | stood down |
| --- | ---: | ---: | ---: |
| recovery | 11 006 | **96.2 %** | 23.1 % |
| listen | 6 532 | **93.8 %** | 20.4 % |
| herself | 10 960 | **56.2 %** | 22.5 % |
| cool head | 5 348 | **75.7 %** | 16.7 % |

Every focus is idle for most of the weeks it is billed for, and 17–23 % of held weeks are suspended
on top. ⚠ The sharpest cell is not in the table: **a `sunny` girl is born open AND steady, so ruling
N clamps her positive lean at 0 on both axes and «Working on herself» can buy her NOTHING at any
rung** – 0 beyond-baseline weeks across every sunny seat arm. One girl in four, a year's retainer,
and no card says so. Reported, not fixed: what corridor is acceptable is a ruling.

### 3d. Census v3

The walls arms, and the third one is the bench's own: caring 0.0 % raised · grinding **95.0 %**
raised / 20.0 % lowered / 76 collapse flips · «turned» (grinder → player at the halfway week)
91.3 % raised / **86.3 %** lowered and round-tripped. ⭐ The finding is that §2a's «a closed-again
girl can be opened again … that sentence is earned drama» **is not reachable under either shipped
parent**, because neither `econ-bench` policy ever changes its mind – the turned arm is the bench's
own construction and is labelled as one. The ±1.5 pp fairness corridor, re-read on BIRTH cohorts
(the fence): worst pair **−0.088 pp**, not vacuous at 756 of 1 200 diverged pairs.

## 4. Every §4 proposal, with its measured number beside it

The brief's §4 lists ten proposals; T7 added an eleventh and flagged it. **None is ruled.** Nothing
below is a recommendation – it is the measurement, put next to the number it prices.

| §4 proposal | shipped value | what the bench measured about it |
| --- | --- | --- |
| salaries, cents/week | `[10000, 20000, 40000]` | the ladder is real for three of the four focuses and for the WAIT of the fourth (§3a); the never-fired corridor says every rung is idle 56–96 % of the weeks it bills for, and 17–23 % of held weeks are suspended on top (§3c) |
| `wallsRisePerWeek` | `1.5` | 1.5000 ± 0.0000 over 1 624 unslowed kicked axis-weeks; under the grinding arm it raises the walls on **95.0 %** of careers |
| `wallsRepairPerWeek` | `1.0` | the turned arm walks **86.3 %** of raised careers back to 0 and round-trips them inside a career – which is the number `leanMax` was sized to make reachable |
| `wallsGrowthPerWeek` | `0.5` | the dam is exact: **0** beyond-baseline weeks without the focus against **42 408** with it. The rate itself is only visible through the flip WAIT below |
| retention slow-down, rung ≥ 2 (O6) | `0.75` | **realised ×0.7333** – the tenths grid, ruling M's fourth number, HIT to four decimals. ⚠ The arm that can see it is «hire, then start kicking», not a grinding career: the walls saturate ~67 kicked weeks in and the pro gate opens later than that |
| `'herself'` repair acceleration | `1.5` | **not separately priced.** The census measures the repair arm as a whole (86.3 % lowered under the turned parent); no column isolates the ×1.5. The honest statement is that this number is UNMEASURED, and it is the only §4 proposal of which that is true |
| `flipArm` | `60` | the census's «raised» column IS this threshold (the lean reaching −60 on some axis): 0.0 % caring, 95.0 % grinding |
| `flipRelease` | `40` | un-flips: 0 caring · 21 grinding · 73 turned – the release band is crossed whenever a parent actually comes back |
| `flipHazardPerWeek` | `0.05` | the armed wait, median **19.0 / 12.5 / 4.5** weeks by rung against a predicted 13.5 / 8.9 / 6.6. The flip COUNT cannot rank rungs at all (§3a) |
| the beyond-baseline hazard scale | `[1, 1.5, 2]` – **RULED** (spec §2) | clean on the wait (HIT at both steps), unrankable on the count |
| `leanMax` (T7's seventh walls constant, **flagged not slipped**) | `100` | the cap is what makes §2a's «the road back always exists» arithmetically true – unbounded, 300 grinding weeks reach −450 and the walk home is nine years. Its cost is visible: the saturation is why the flip count cannot rank the rungs, and it is what made the first O6 arm read ×1.0000 |

## 5. The strings

**The table is [life-wave-5-strings-2026-09](life-wave-5-strings-2026-09.md) and this document does
not copy it.** 82 added, 9 ruled and 73 draft, **0 changed**; the вычитка ran on 13.09 and moved
three things (the recovery receipt's trigger, and two `PSY_COUNSEL` cells). The owner's playtest is
final on all 82.

⭐ **One finding this task adds to that table, measured in a real browser and not by reading:** the
four `PSY_FOCUS_LINE` sentences – the note that says what the running year is FOR – are on screen
only while **nothing** is closed, because `psychologistFocusNote` prints the engine's refusal
whenever there is one. After the first pick that is the **three off-season weeks of each year and
nothing else**; for the other 49 the note is `PSYCHOLOGIST_FOCUS_SEASON_REFUSAL`. The behaviour is
right (R10-16: the card explains a refused control with the sentence the command throws), and the
consequence is that four of the wave's 73 drafts are nearly unreadable in play. The e2e case now
pins the sentence a player actually meets. **Reported, not fixed – it is a wording/UX call.**

## 6. The corpora – what moved, measured

### 6a. The frozen careers: `rngMain` byte-identical on all five cells, and one shared key moved

Measured base → head with `tools/frozen-key-diff.ts` on all five preset/policy pairs, the whole wave
in one reading rather than one task at a time. The cell set was measured rather than carried:
**`FROZEN` holds three** (`middleGrinder` 5/0 · `eliteGrinder` 8/0 · `selfTravelling` 0/1),
**`PRE_R28B` five** (those plus `highPlayer` 6/1 and `middlePlayer` 5/1).

| cell | preset/policy | keys base → head | MOVED (shared) | NEW | `rngMain` |
| --- | --- | ---: | --- | ---: | --- |
| `middleGrinder` | 5/0 | 79 → 85 | `schemaVersion` | 6 | `1dbff28caca2` → `1dbff28caca2` |
| `eliteGrinder` | 8/0 | 78 → 84 | `schemaVersion` | 6 | `aebc8101d6df` → `aebc8101d6df` |
| `selfTravelling` | 0/1 | 80 → 86 | `schemaVersion` | 6 | `d84bcbf0c481` → `d84bcbf0c481` |
| `highPlayer` | 6/1 | 78 → 84 | `schemaVersion` | 6 | `1dbff28caca2` → `1dbff28caca2` |
| `middlePlayer` | 5/1 | 79 → 85 | `schemaVersion` | 6 | `1dbff28caca2` → `1dbff28caca2` |

**Exactly one shared key moved on every cell and it is `schemaVersion` (75 → 76).** The six new keys
are T1's six fields. **No behavioural key moved anywhere in thirteen tasks**, so T11 re-stamps
NOTHING: the constants at head are T1's, and they still reproduce. The STOP condition never came
near firing.

⚠ **And the brief's expectation about these careers is FALSE, as T7 already measured and this
confirms for the whole wave.** The brief says «the leanings' deterministic drift in re-walked
fixtures is the wave's own expected diff». `driftWalls` does run on them; the leanings do not move,
because all five cells spend zero weeks below the `steady` band (the corpus's minimum bond is 58.5
against a cut of 55), so the kick row is never reached and the repair row is a no-op at a lean of 0.

⚠ **What that zero is worth is bounded by rulings K and R**, and this document will not overstate
it: the corpus diffs END STATES, it cannot see a convergent change, and for this wave's mechanics it
cannot reach the state at all – 0 love episodes, 0 endings, no shock, no hire. **It is a coupling
detector for this wave, not a measurement.** §3's paired arms are the only instrument that priced
anything.

### 6b. The MAIN capture has not moved, and the proof is a `git log` over the path

```
$ git log 4ceb7c0d..HEAD --oneline -- tests/condition.test.ts
$
```

**Empty.** Nothing in thirteen tasks touched the file that pins the capture, which is a stronger
statement than a diff: a diff cannot see a move-and-move-back. The pin stands at **41550 draws /
hash `e6b0c709`**, and the base→head per-key diff above says the same thing from the other side –
`rngMain` byte-identical on every frozen career.

### 6c. The `.tsave` corpus: regenerated, and NOTHING MOVED

`npm run e2e:fixtures` re-ran all ten fixtures at head, from
`…/t11/fixtures-regen-1789314556.log`, ending `FIXTURES_EXIT=0` after 1 257 s – of which `belated`'s
seed search alone is 1 239 s. **Every one of the ten came back byte-identical, seed for seed and
byte for byte** – `git status --short e2e/fixtures/` is empty, `manifest.json` included.

| fixture | seed the search landed on | seeds tried | week | moved? |
| --- | --- | ---: | ---: | --- |
| `fresh` | `e2e-fresh-0` | 1 | 0 | no |
| `junior` | `e2e-junior-19` | 20 | 120 | no |
| `pro` | `e2e-pro-0` | 1 | 412 | no |
| `sinking` | `e2e-sinking-0` | 1 | 96 | no |
| `broke` | `e2e-broke-0` | 1 | 94 | no |
| `ending` | `e2e-ending-0` | 1 | 242 | no |
| `unheard` | `e2e-unheard-1` | 2 | 242 | no |
| `soft` | `e2e-soft-1` | 2 | 9 | no |
| `breakup` | `e2e-breakup-0` | 1 | 157 | no |
| `belated` | `e2e-belated-671` | **672** | 246 | no |

⚠ **A null result is a claim, so here is why it is one and not a broken arm.** The instrument works:
T1 ran the same command at the start of this wave and it MOVED two fixtures, `unheard` seed 13 → 1
and `belated` 472 → 671 (ruling B) – so a regeneration that finds nothing has been seen to find
something on this corpus, in this wave. `belated` searching 672 seeds and landing on the same one is
the sharpest form of that: 672 careers were walked against a predicate the engine answers week by
week, and the 672nd was still the first that passed it.

**And the reason is structural rather than lucky: every mechanic wave 5 added is gated on a HIRE, and
`tools/e2e-fixtures.ts` never hires anybody.** `git grep -n hirePsychologist -- tools` returns
`tools/psy-grid.ts` and the generated symbol map, and nothing else. The walls pass does run on these careers and is a no-op for the
same reason it is a no-op on the frozen corpus (§6a). So the brief's «the `.tsave` corpus is
behaviourally stale AGAIN» is **not what the measurement says** – and the regeneration was still the
right thing to run, because it is the only instrument that could have said so.

## 7. What wave 5 did NOT do

The brief's §8, as it stands at the end, plus what the tasks themselves left on purpose:

* **No fifth focus** – «The public life» ships with the spotlight wave (O7).
* **No burnout, no breaking point, no on-court conduct** – named later beats with their own specs.
* **No travel and no fare for the seat** (ruling Б); **no results share** (O3). Measured rather than
  asserted: `git diff 4ceb7c0d..HEAD -- src` names `staffSeatFareCents` and `staffResultShareBps` on
  exactly **two added lines, both COMMENTS** saying he is never asked for either – no removed line
  names them, and neither definition moves a character.
* **No bond write from anything of his** – the listen focus's byte-identity pin is the fence, and it
  was re-proven on the bench's own runs (16 of 16 pairs byte-identical across the bond series).
* **No spirit write outside T4's slope inside `accrueSpirit`**, which stayed provably draw-free;
  T7's hazard lives in `driftWalls` beside it (ruling P).
* **No walls surface.** No leaning on any screen, no flip announcement, nothing in the album yet –
  the existing surfaces (the face, the Mood word, the diary bands, the feed's silence) are the
  telegraph. Named so nobody adds one.
* **No temperament rewrite** – identity is immutable; the voices, the prompt registers and the
  birthday-ask weighting all still read BIRTH (§3's fence).
* **No paywall on repair** – measured with the seat empty, not asserted.
* **No `ECONOMY.bond` retune** – планка-3's session owns it.
* **No wording change outside the drafts** – 0 shipped strings moved, measured on the removed lines
  of the `src/` diff.
* **No new coach lever in T12** – the profile is words over axes that already exist, and the
  skill-lean idea stays out of v1 by ruling H's own text.
* **The personal edge placement is not on any card** – T12 refused that line of its brief on
  `coach-match-edge` §4 and the refusal is pinned (ruling S).
* **The elite gate's constant was not touched** – T13 flipped the flag it was asked to flip and
  reported the number the owner's open question needs (58.4 % of careers refused in the first tenth,
  100 % for the back eight) without acting on it.
* **`bench:psy`'s eight misses were not tuned away.** Nothing in `ECONOMY` moved after a miss. A
  miss is this wave's product, not its failure.
* **T11 added no engine change at all** – the e2e case, the corpora, the gate and this document.

## 8. The debts, each with the measurement that says why it is a debt

| debt | the measurement | why it was left |
| --- | --- | --- |
| **`'herself'` repair ×1.5 is unpriced** | the census measures the repair ARM (86.3 % lowered, turned parent) but no column isolates the multiplier | pricing it needs an arm that holds `'herself'` against a caring no-focus twin over a repair walk – a fifth grid cell, not a line. The only §4 proposal with no number beside it |
| **«a closed-again girl can be opened again» is unreachable under either shipped parent** | census v3: neither `econ-bench` policy ever changes its mind, so the round-trip column exists only in the bench's own «turned» arm | a third policy is a bench-design decision, and inventing a parent to make a spec sentence true is the wrong way round |
| **The recovery focus cannot rank its rungs for half the roster** | §3a: Δ 0.000 / 1.71 / 0.57 × SEM for a steady girl, against a ruled constant | the constant is the spec's, so it is a ruling and not a builder's edit |
| **A `sunny` girl can buy nothing with «Working on herself»** | 0 beyond-baseline weeks across every sunny seat arm at every rung | the design is §5's («the drift focus only means anything where a leaning has room»); what is missing is a CARD that says so, which is a wording change and the owner's |
| **The four `PSY_FOCUS_LINE` sentences are on screen ~3 weeks a year** | §5 above, measured on the regenerated `pro` and in the browser | the behaviour is correct (R10-16); the fix is a wording/UX call |
| **The `.tsave` corpus still has no gate of its own** | §6c: the rot alarm compares each fixture to its own manifest and the two regenerate together, so a behaviourally stale pair passes silently – this wave's regeneration found nothing, which does not make the alarm sound | a real gate means re-generating in CI and diffing, which is minutes per run; the cheap half is what this wave did – regenerate at the end of every wave and attribute the churn |
| **`npm run bench:psy` is not in any gate** | by design – it exits 1 today, on eight bars | it becomes gateable the week its bars are ruled |
| **`tools/econ-bench.ts` never calls `answerLifeBeat`** | T8's measurement, restated by ruling R | it is why the frozen corpus is blind to every beat this wave added; widening the walker is a bench change with its own blast radius |

## 9. What T11 found in its own brief, and in the wave's records

Recorded because thirteen tasks have each found something, and the last one is meant to find what
the others walked past.

1. **The `.tsave` corpus was NOT behaviourally stale.** The brief's §B says it is «stale AGAIN» and
   asks which fixtures moved and by how much. Measured: **nothing moved** (§6c). The reason is
   structural and worth writing down – every wave-5 mechanic is gated on a HIRE, and
   `tools/e2e-fixtures.ts` never hires anybody (`psy-grid.ts` is the only tool in the repo that
   calls `hirePsychologist`). The regeneration was still right to run: it is the only instrument
   that could have said so.
2. **The brief's frozen-career expectation is false** – the leanings do not drift on those careers
   (§6a). T7 measured it first; this confirms it for the whole wave, base to head.
3. **The college suspend does not fit the e2e walk, and was not forced.** Measured: the only two
   fixtures the professional gate opens for are `pro` (week 412, age 21) and `unheard` (week 242),
   and neither is in college – a career is a professional long after the programme ends, so the
   college arm of `psychologistWorksInWeek` is unreachable from any pro-unlocked fixture. **The
   other arm of the same predicate was reachable and is in the walk instead**: `pro` wakes on a
   booked family holiday, and the salary the tick charges is stamped with the week it ARRIVES at –
   so the stand-down is exercised without the case having to name it.
4. **`unheard` is a second pro-unlocked fixture and the brief assumes one.** It boots holding a
   blocking life beat, so it is not the cheaper walk it looks like; recorded so a later wave does not
   re-measure it.
5. **The e2e case's first drafting produced one of each kind of wrong test, and both are worth more
   than the green.** A WRONG EXPECTATION – the note under the focus row was expected to be the
   focus's own sentence and is the engine's refusal (§5) – and the **«unable to fail» family's TENTH
   costume**: «the week advanced» written as `getByText(onScreenWeek(week + 1))` passes on a page
   that has not moved, because the week-ahead strip already carries the next week's date line. It is
   not reasoning – the run that passed that line reached a Money screen still showing the seeded
   funds and the seeded week. Both are recorded in the spec's own header with the fix.
6. **Ruling G.3 struck a row of the brief's T9 string list that the brief still carries.** §2 T9's
   item 2 still asks for «the freeze refusal» as a draft; ruling G.3 says it must not be written and
   it was not. The brief's own text is the stale half. Not edited – it is the architect's document.
7. **The count `all nine cells` is used in two senses in the wave's records.** `tools/psy-grid.ts`
   and ruling R say the corpus was measured «at 156 weeks on all nine cells»; the frozen CORPUS is
   five preset/policy pairs and `FROZEN` itself is three. Nine is the number of `PRESETS`. Both
   readings are defensible and neither is wrong, but a reader who has just been told to measure the
   cell set will trip on it. Named, not edited.
8. **`e2e/journey.ts` says `ConfirmDialog` «cannot be scoped by `getByRole('dialog')`» and it can.**
   The component carries `role="dialog"` and `aria-modal="true"` today; the note dates from before
   that. Older than this wave, so it is left alone – but the new e2e case scopes the hire confirm by
   role, which is the measurement that says the note is stale.
