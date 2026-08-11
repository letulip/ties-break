---
type: spec
status: current
area: content/commentary
canonical: false
last-reviewed: 2026-08-11
---

# Round 16, the commentary cluster – items 11, 12, 14, 18, and the pre-match preview

Item #10 (key/full driving the playback) is **not** in this slice and was left alone.

Everything here is RNG-free by construction. `tests/viz/commentary.test.ts:43` traps `Math.random`
behaviourally and `:58` pins that the module imports no RNG at all; both are untouched and still
green. `tests/viz/preview.test.ts` carries the same behavioural trap for the new module.

---

## 1. Item 11 – "`full` shows almost nothing"

**The complaint was not row count.** `full` sits at ~16 beats a match and always has – measured
again here at 16.0/match, 6.3/set over 200 seeded matches. What the owner was looking at was
**sameness**: every repeated beat drew from five authored strings behind `variant()`, a hash of the
point index with no memory, and the manner clause after it only ever had one shape.

### 1.1 What shipped

| # | Fix | Where | Effect |
|---|---|---|---|
| 1 | **used-recently rotor** | `rotor()`, `commentary.ts` | a family cannot repeat what it just said |
| 2 | **the industry template** | `outcomeLine()` | a second sentence mould for the same fact |
| 3 | **Morris point importance** | `pointImportance()` | decides register; never printed |
| 4 | **a `games` beat** | the game-run scan | "four games in a row" – a fact nothing could state |

**Measured effect on repetition** (200 matches, the same corpus the density test uses): rows that
repeat a sentence already present in their own log went **2.4% → 1.4%**, and *adjacent* identical
rows went to **zero** – now asserted, not hoped for.

**The rotor's real bug was ordering, and it was found by reading output rather than by reasoning.**
The per-game loop walks every game, and most games print nothing (a routine hold falls out). Built
eagerly, the rotor was advanced by rows nobody would read, so two visible beats either side of three
silent games could still land on the same mould. The manner clause is now computed lazily at the
push site: *"what was just said" has to mean what was just printed.*

**A second thing reading the output caught:** the plain industry template printed
`Bianca breaks. Bianca wins the game with a winner cross-court.` – the name twice in two short
sentences, and a unit the claim had just announced. `outcomeLine` therefore has two shapes, which is
referring-expression generation rather than a template variant: when the ball was the hero's own it
pronominalises and drops a unit ("She wins the **point** with…"), and when it was the other
player's the name is the whole information and the unit is the real one.

### 1.2 The descriptor is narrower than the real feeds' – deliberately

The observed industry descriptor is `[wing] [shotType] [outcome]`. **We model no wing and no
volley**, so ours is `[serve|return|groundstroke] [outcome]` and never says forehand or backhand.
Inventing a wing would break the honesty rule the module is built on. `tests/viz/commentary.test.ts`
asserts the absence directly.

What *is* honest and newly said: a **second-serve ace** (`Shot.kind`), and whether a miss was struck
**on the return** (the first `rally`-kind shot in the list – not `shots.length === 2`, because a
first-serve fault repeats the server).

### 1.3 Morris importance – exact, and how

`I(state) = P(A wins | A wins this point) − P(A wins | A loses this point)`, from the pre-point
score, via the engine's own `matchWinProbability`. Two inputs were needed and both were already in
the log:

* **the pre-point `MatchScore`** – reconstructed in `scan()`, which was already tracking every part
  of it to answer other questions and throwing it away;
* **pA/pB, the base serve probabilities** – *recovered exactly* from `PointLogEntry.pServe`. All
  three modifiers in `modifiedPServe` are gated (momentum needs a streak ≥ 3, the big-point penalty
  needs a break point, fatigue needs point > 120) and the final clamp cannot bite, so a point with
  none of them carries the base value untouched. Point 1 of a match is clean by construction.

**Measured** (`tools/commentary-register-probe.ts`, 200 matches / 32,641 points):

| population | mean | median | p90 | p99 | max |
|---|---|---|---|---|---|
| all points | 0.064 | 0.051 | 0.121 | 0.241 | 0.511 |
| break points | 0.097 | 0.086 | – | – | – |
| set points | 0.090 | 0.059 | – | – | – |
| match points | 0.112 | 0.077 | – | – | – |
| **at beats** | 0.077 | 0.061 | 0.154 | 0.303 | 0.511 |

Threshold sweep, over beats:

| `PEAK_IMPORTANCE` | share of beats | per match | …on a real set/match point |
|---|---|---|---|
| 0.10 | 23% | 3.6 | 27% |
| 0.12 | 16% | 2.5 | 33% |
| **0.15** | **11%** | **1.7** | **41%** |
| 0.18 | 6% | 0.9 | 40% |
| 0.20 | 4% | 0.6 | 48% |
| 0.25 | 2% | 0.3 | 61% |

**0.15 is the pick**, on the last two columns read together: the top of the ladder has to be
somewhere a match actually goes (at 0.20+ most matches never reach it once) and it has to be about
the stakes without being only about them.

### 1.4 ⚠ The register ladder shipped with TWO steps, not the three the research proposed

`docs/research/commentary-generation.md` §5.3.3 recommends flat / raised / peak. Built and measured,
**the middle bucket changed nothing a reader could see**: the register's levers are the sentence
mould and the row's budget, and a claim plus a manner clause is 90–100 characters, so any budget
between 104 and 120 never cuts. A third name that renders the same string is a comment pretending to
be a feature. Recorded rather than quietly dropped – invariant 4 cuts both ways.

What `peak` does: forces the plain feed mould, drops the row's budget to 88 characters, and **drops
the forward look** ("She serves for the set next"). That is the lexicon's own rule – tier 5 has
*fewer* modifiers than tier 1, not more.

### 1.5 The `games` beat, and why it is heard from less than it fires

`GAMES_MIN = 4`, measured: the longest run per set exists 0.87×/set at three, **0.43 at four**, 0.24
at five. Three is most of a 6-3 and every 6-2 – it would say out loud what the score column already
prints.

**Its anchor is a game end, where a `break` or `hold` beat also sits and outranks it**, so 49 of
~130 in a 120-match corpus survive the collision: the ones whose closing game was a routine hold.
That is the right outcome rather than a loss – "Break! Bianca breaks." next to `5-0` already tells a
reader the set is gone, and this beat exists for the quiet game in the middle of a rout. It fires in
about a third of matches.

---

## 2. Item 18 – the retirement line

The beat **existed** and said almost nothing: *"cannot continue. Bianca goes through."* Next to the
score column that reads as the fragment the owner reported – «4-5 cannot continue», an event with no
explanation. Three things were wrong and all three are fixed:

1. **It did not say what happened.** It now says she *retires hurt* in the world's own words – the
   tournament summary already prints "Semifinalist (+30 pts) – she retired hurt".
2. **It did not say why, and the model has an answer.** `retireHazard` is
   `RETIRE_K * spentness(pointNumber, stamina)`, and `spentness` is **exactly zero** up to
   `FATIGUE_START`. So every retirement this engine can produce happened past 120 points to a girl
   who is not fresh: *"A long match on tired legs."* is true by construction. The test asserts the
   >120 property directly, so the sentence cannot outlive the mechanism that licenses it.
3. **"Goes through" is the wrong verb.** The rulebooks are explicit: the opponent **advances**, and
   did not beat her (`commentary-lexicon.md` §4.6).

⚠ **There is no earlier beat, deliberately.** The obvious ask is a line when she starts to struggle,
and the engine gives no such signal – the hazard is a per-point coin the log does not record, so a
"she is labouring" row would be the narrator inventing a fact.

---

## 3. The pre-match preview – the ladder of voices

`src/viz/preview.ts`. Zero engine change, zero new state, zero RNG. Rendered as the **bottom** rows
of the commentary log, because the log reads newest-first and the intro is older than the first ball.

**Monotonicity is structural, not a promise.** Every line is an entry in one ordered table with a
`from` storey, and a preview is that table filtered – so a storey cannot lose a line its junior has.
Measured line counts at a fixed round: **3 → 4 → 5 → 7**.

| storey | rungs | what arrives |
|---|---|---|
| 1 | local / regional / national | the occasion + weather, the girl across the net, the self-officiating argument |
| 2 | J30 – J300 | + her rank, + what the round is for, + the chair-umpire ladder |
| 3 | W15 – W125 | + **the numbers**: her chance, what the round pays |
| 4 | WTA 250+ / majors | + where the two of them stand, + how the surface will play |

⚠ **Facts that are only true low down are REPLACED, not dropped.** Self-officiating is true at
storey 1 and a lie at storey 4, so the officiating line is one entry whose text varies by storey –
the count never falls and nothing is asserted where it is false. This is the one place the
junior/adult difference the research found becomes *content* rather than absence.

⚠ **The weather survives to the top.** The first draft dropped it above the junior rungs on the
grounds that the weather plate already carries it. That breaks the ladder: monotone means a storey
never has *less* than the one below, and "the top of the ladder stops telling you what the day is
like" is exactly the quiet subtraction the rule exists to forbid.

**Sample, low rung and high:**

```
local / Quarterfinal
   Quarterfinal at the Local Open. Clay, 21 degrees.
   Across the net: Dana, 17.
   Nobody in the chair. They call their own lines, and the mark on the court settles it.

wta250 / Final
   Final at the WTA 250. Grass, 22 degrees.
   Across the net: Dana, 17, ranked #31.
   Chair, review, and every point of it published as it happens.
   Win it and Olivia has the title – and the round pays 250 points.
   Olivia goes in with a 34% chance of winning it.
   #88 against #31, and Dana is 57 places ahead.
   It will stay low and skid through, so the points will be short.
```

### 3.1 ⚠ What the preview does NOT have, and why

**The head-to-head.** The triage said «prior meetings in `world.results`». **`world.results` is a
points ledger** – `{playerId, week, points, tier}` – with no opponent field at all, so prior meetings
are not derivable from it. Match rows live in `TournamentResult.matches` (`MatchRecord`), which the
world does not retain past the event and the `Snapshot` does not carry. Adding it is a save-schema
change and an engine change, which this slice was scoped to avoid. **Left undone, deliberately, and
flagged rather than faked.**

**The opponent's nation.** `COUNTRY_NAMES` exists twice already (`OnboardingWizard.vue`,
`KidScreen.vue`) and neither copy is exported. Writing a third to say "from Spain" was worse than
leaving it out; the flag is already on the pre-match card. Age and rank carry the same job.

---

## 4. Items 12 and 14

**#12 – the `out` call at ×2, at half the ×1 rate.** ⚠ The rate is applied **at the comparison, not
at the draw**: `outRng` is seeded from the match seed, so halving by drawing 6–10 instead of 3–5
would have made the sequence depend on which speed the player was on when each draw came up.
Drawing 3–5 always and doubling the *target* means a mid-match speed change takes effect on the next
miss and changes nothing about what was drawn. Verified behaviourally in
`tests/component/match-viewer-sound.test.ts` – the component is mounted, the speed pill clicked, the
clock driven to the end of a real match, and the cues counted.

**#14 – the bullets align with the rail.** Measured on the shipped rule: column 1 is 22px, the gap
8px, so column 2 opens at 30px and a 9px dot centred in a 12px column sits at **36px**, while the
1.5px rail at `left: 33px` has its centre at **33.75px**. Two and a quarter pixels – which on a 9px
dot is exactly "the line comes out of the side of the circle". `--mv-rail-x` now owns both.

---

## 5. Verification

`npm run check`, plus:

* `tests/viz/commentary.test.ts` – 33 tests (was 23)
* `tests/viz/preview.test.ts` – 17 tests, new
* `tests/component/match-viewer.test.ts` – 31 tests (was 27)
* `tests/component/match-viewer-sound.test.ts` – 2 tests, new
* `tests/screen-i-live-match.test.ts` – 52 tests (was 51)

**Mutation-verified, ten mutations, every one caught by the test that claims to cover it:**

| # | mutation | caught by |
|---|---|---|
| 1 | rotor made memoryless again | "never prints the same sentence twice in a row" |
| 2 | retirement verb back to "goes through" | "says a body stopped… ADVANCED" |
| 3 | peak register stops shortening the row | "a peak beat is shorter… never looks ahead" |
| 4 | officiating line dropped above storey 2 | "IS MONOTONE" |
| 5 | the chance line moved down to storey 2 | "the numbers start at storey 3" |
| 6 | preview rows moved to the top of the log | "sits at the BOTTOM of the log" |
| 7 | preview unwired from the component | "is on screen BEFORE a ball is struck" |
| 8 | `out` silenced at ×2 again | "fires at ×2 at all" |
| 9 | the ×2 halving removed | "roughly half as often as at ×1" |
| 10 | rail back on a hand-written offset | "placed from ONE number" |
