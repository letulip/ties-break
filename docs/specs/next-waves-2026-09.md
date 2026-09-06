---
type: spec
status: draft
area: planning
canonical: false
last-reviewed: 2026-09-06
---

# The three waves after round 37

His instruction, 06.09: «сделай спеку пока что и план работ» for the snapshot cache and the App.vue
extraction, and «к ней вернёмся после мержа 37, запиши или зафиксируй в документации вместе со
снапшотом и выносом владельца» for the balance wave. All three are written down here rather than in
three files, because he asked for them together and because the third one depends on a measurement
the first one does not.

**None of these is started.** Each needs his word, and the balance wave needs it twice – once to
begin and once on the design fork inside it.

---

## Wave A – the snapshot cache

### What is wrong

`toSnapshot` runs after **every** command – entering an event, changing a plan, buying a racket – and
costs **13 ms hot, 22-28 ms cold**, against **6.4 ms** for the week tick itself. It is the most
expensive computation in the app and the one the player waits on most often, because a tick happens
once a week and a snapshot happens on every action.

Measured with `node --cpu-prof` over a mid-career fixture
(`docs/review-principles-2026-09-05/04-performance.md` §B-C, finding P-02):

| what | share of a snapshot-only run |
| --- | --- |
| `season/ranking.ts` | 15.4% |
| `season/tournament.ts` | 14.8% |
| `season/preview.ts` | 14.7% |
| `world/snapshot.ts` itself | 3.2% |

The cause is not the projection – it is that the projection **re-derives** two tables from scratch
each time:

* the full ranking, through `computeRanking` → `windowedBestSum` over ~2,200 result rows × 200
  players, called from four separate sites inside one `toSnapshot`;
* for each of ~22 upcoming events, `previewEvent` → `selectEntrants` + `ratedField` /
  `tierExpectedField`.

Neither depends on the command that just ran. Buying a racket recomputes the world ranking.

### The design, and why it touches no save

⚠ **This is the decision his question is about** – «можно ли что-то сделать для совместимости с
предыдущими сейвами дополнительно».

Three places the cache could live, and only one of them is safe:

1. **A field on `WorldState`.** Rejected. `WorldState` is what gets serialised, so a cache field is a
   schema move, and worse, a stale cache could be **written to disk and loaded back** – a save that
   carries its own wrong answer is the one failure mode no test in this repo is shaped to catch.
2. **A module-level `WeakMap` keyed by the world object.** Rejected, and this is the subtle one:
   `mutate` in `sim.worker.ts` **clones the world** on every command before running it, so the object
   identity changes on each mutation and an identity-keyed cache would miss every single time. It
   would cost memory and buy nothing.
3. **A module-level cache keyed by CONTENT.** ⭐ This is the design. The key is derived from the data
   the table reads – `(week, results.length, cohort revision, the entries set)` – so it survives the
   clone, it cannot be serialised because it is not on the world, and it cannot be loaded stale
   because it does not exist until something computes it in this process.

**So the answer to his question is: nothing about saves changes at all.** Old saves load exactly as
they do today and produce a byte-identical snapshot, because a content-keyed memo of a pure function
is invisible by construction. `SAVE_SCHEMA_VERSION` does not move, no migration is written, no golden
fixture is added.

### The extra safety he asked for

He asked whether anything **more** could be done for old saves. Two things, and they are cheap:

1. **A verification mode.** `TB_SNAPSHOT_VERIFY=1` computes both the cached and the uncached answer
   and throws on any difference, naming the key. It is off in the product and **on for the whole
   golden-fixture corpus in the sim suite**, so every save schema from v1 to v70 is asserted to
   produce the same snapshot with the cache as without it. This is the arm that makes the claim
   above a measurement rather than an argument.
2. **The frozen careers are the second net.** The three frozen career hashes in
   `tests/coachTravelEdgeFixtures.ts` walk 156 weeks each and hash 72 keys; a cache key that misses a
   dependency shows up there as a rank drift, which is exactly the shape this repo already knows how
   to read.

### Plan of work

| step | what | proof |
| --- | --- | --- |
| A1 | Bench first: a `tools/` probe that times `toSnapshot` per command kind on three fixtures, so the "after" has a "before" to be measured against | the table above reproduced on this machine |
| A2 | The ranking table's key and memo, alone | A1's probe re-run; `tests/goldenSaves.test.ts` green |
| A3 | `previewEvent`'s per-event memo, keyed `(event.id, week)` past the draw horizon | A1's probe re-run |
| A4 | `TB_SNAPSHOT_VERIFY` and its sim-suite arm over all 71 fixtures | the arm fails when a key is deliberately narrowed |
| A5 | Re-run the frozen careers and the parity spec | three hashes unmoved |

**Expected: 13 ms → 5 ms or less, hot.** **Effort: 3-5 days.** **Risk:** a key that misses a
dependency. It is bounded by A4 and by the frozen hashes, and it never reaches disk.

---

## Wave B – one owner out of `App.vue`

### What is wrong

`App.vue` is 1,855 lines and it is not only a shell. Four "has the player seen this tab" watchers and
their persisted-per-device flags live in it, together with the logic that decides when each one
fires. That state has nothing to do with mounting screens, and it is the largest single reason the
file cannot be read in one sitting.

The 02.09 review asked for «one or two measured UI extractions» and the 05.09 review named this one
as the first, because it has the most independent state and the fewest edges outward
(`docs/review-principles-2026-09-05/03-ui.md`, finding U-04).

### The design

One composable under `src/composables/` owns the four watchers, their flags and their persistence;
`App.vue` calls it once and renders. Nothing else moves. In particular:

* ⚠ **Not a rewrite, and not a second extraction in the same pass.** The 05.09 review's own ruling on
  `world.ts` applies here: move a seam when something needs it, one at a time.
* ⚠ **The flags are per-device and never persisted into the save** (they live in web storage). The
  composable keeps that property, and the guarded accessor U-07 introduced is what it uses – a
  private window must not take the shell down.
* ⚠ **`tests/component/` must mount `App.vue` before and after and see the same behaviour.** The four
  watchers are exactly the kind of thing that "still works" while firing at the wrong moment.

### Plan of work

| step | what | proof |
| --- | --- | --- |
| B1 | Pin the current behaviour: a mounted test that drives all four watchers through their real triggers and asserts when each fires and what it writes | it fails when a watcher's condition is inverted |
| B2 | Move the four into `src/composables/tabSeen.ts`, verbatim, comments included | B1 green unchanged |
| B3 | Re-aim the source pins the move breaks – run the pin query FIRST (`git grep -l "App.vue'" -- tests/`) | every hit repointed at `componentLogic`, none deleted |
| B4 | Measure `App.vue`'s script lines before and after | reported, not celebrated |

**Effort: 1-2 days.** **Risk:** low, and it is all in B3 – three source pins went red on a merge on
05.09 for exactly the reason the pin query exists.

---

## Wave C – the balance wave

⚠ **His instruction: after round 37 is merged.** Recorded here so it is not re-derived.

⚠⚠ **And it must obey invariant 5: tuning is measured, not guessed.** Every change below ships with a
bench run and a spec recording predicted against measured. `docs/specs/rank-plateau.md` is the model –
it predicted a fix, measured it doing nothing, and found the real cause.

### C1 – the age curve

In `ECONOMY.development.ageCurve` today:

```
growthStart   13     growth begins
growthEnd     18     growth slows
plateauStart  23     growth ENDS – from here it is maintenance only
declineStart  29     decline begins
```

**His objection, 03.09:** «мы же вроде обсудили, что рост как раз идет до 28-29». The curve stops
growing at **23**; between 23 and 29 she only holds what she has.

**Proposed:** `plateauStart` 23 → **28**, `declineStart` 29 → **33**. The RATE is untouched – only the
phase boundaries move. Growth to 28, maintenance 28-33, decline after 33.

⚠ **This gives every career five more years of growth, so it almost certainly raises every ceiling at
once – which makes C2 mandatory rather than optional, and makes the order below load-bearing.**

### C2 – `potentialBand`

`ECONOMY.development.potentialBand` is `[4, 26]` – the spread of potential a girl is born with over
her starting skills.

**Measured:** careers that reach the all-time top 100 arrive at **93.3%** of their own band. A
ceiling almost every successful career exhausts is not a ceiling; it is a promise.

**Target: 30-40%.** Then two careers with the same potential diverge on how they were run rather than
on how many weeks passed.

⚠ **C1 moves this number, so C2 is retuned after C1 and on the same run** – not in parallel.

### C3 – coach tenure

**Proposed:** each coach gets a hidden personal ceiling – the level he can take her to. Past it he
stops growing her whatever he is paid, which is what would make changing coach a real decision rather
than a budget line.

⚠⚠ **HIS OWN QUESTION IS STILL OPEN AND BLOCKS THIS ONE.** He asked it in the previous wave: «как это
не превратить в гарантию?» If the ceiling is visible or derivable, the player simply waits for it and
swaps. If it is entirely invisible, changing coach is a lottery. **That is a design fork and it is
his; C3 does not start until it is answered.**

### C4 – the two skills that do not reach the field

⭐ **This entered the wave on 06.09, after he challenged a claim I had relayed wrongly.**

The facts, verified in the code:

* `rivalMatchPlayer` (`engine/season/rival.ts`) multiplies **all five** attributes by
  `conditionMatchFactor(condition)`, so **between-match fatigue does affect AI-vs-AI results** – that
  mechanism is live and is the one he remembered building.
* `basePServe` (`engine/match/point.ts`), which the closed form uses, reads **serve, return,
  groundstrokes, age pace and surface**. It does **not** read `composure` or `stamina` – they are
  computed onto every rival and then never consulted.
* Her own matches run the point loop, which does read them, plus momentum and a break-point penalty.

So two of the five skills the player trains change nothing for anybody but her, and the card's
printed chance is up to **5.1 pp** away from what she will actually experience (stamina 30 against
90; composure 30 against 80 is 1.7 pp).

**His instruction, 06.09: «хорошо бы одинаковые условия для всех, раз уж мы считаем.»**

**Proposed:** one calibrated closed form, read by everyone. Fit a correction to `basePServe` – or a
term beside it – against the simulated point loop, so that for the same pair the closed form's answer
matches what the simulation actually produces. Then:

* the card prints that number, and the 5.1 pp gap closes because both sides use one model;
* AI-vs-AI matches use it too, so the field feels stamina and composure exactly as much as she does.

⚠ **This moves every AI result, and therefore rankings and every calibration band.** It is the reason
C4 belongs in this wave and not in a UI round. The order is C1 → measure → C2 → measure → C4 →
measure, with C3 waiting on his answer.
