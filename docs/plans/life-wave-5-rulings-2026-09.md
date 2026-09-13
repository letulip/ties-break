---
type: plan
status: current
area: life
canonical: false
last-reviewed: 2026-09-13
---

# Wave 5 – the architect's rulings, measured before the tasks that need them

Wave 4 shipped its rulings in a file of their own and the wave read better for it; the same here.
Each ruling names the measurement that produced it, so a builder can check the reasoning rather
than take it on authority.

## Ruling A – which temperament reads move to expression, and the law that decides it

**Measured 13.09, before T7 was briefed.** `src/engine/world/lifeBeat.ts` ALREADY splits the two
readings by function, and the doc comments already name the split:

* `voiceOf(world)` :1622 – "Who she is, for the WORDING alone" – ONE call site (:1986).
* `temperamentOf(world)` :2219 – "WHO SHE IS" – FIVE call sites: :1928, :2263, :2362, :2587, :2918.

So the obvious T7 move is to re-point `temperamentOf`'s body and be done. **That would be wrong**,
and this ruling is why.

## The law

**A draw whose RESULT IS PERSISTED may read EXPRESSION – it is stamped at the week it was true.
A draw that is RE-DERIVED from persisted facts must read BIRTH, because expression is not a
persisted fact of the episode; it is a fact about the world's current week, and re-derivation
would change history.**

## Applied, site by site (`temperamentOf`'s five)

| site | what it feeds | stored? | reads |
| --- | --- | --- | --- |
| :2362 `rollArrival` | `arrivalHazardFor`, `drawPartnerWants` → `wants`, `drawRawLag` → `knownWeek` | hazard evaluated now; wants and knownWeek STAMPED on the episode | **expressed** |
| :2263 | the ends cooldown `life.cooldownWeeks[…]` | evaluated now | **expressed** |
| :2918 | `endsHazardFor` | evaluated now | **expressed** |
| :1928 `beatEndsRead` | `drawEndsRead` – the card's priced option set | ⚠ RE-DERIVED, NEVER STORED | **birth** |
| :2587 told-late feed row | `drawEndsRead` – the kept row's text | the TEXT is persisted, the READ is re-derived | **birth** |

The last two are twins by design – the file's own comment: «the read comes off the ENDING's own
week … so the row and the card the same tick raises cannot disagree». They move together or not
at all, and this ruling says not at all.

## Why, in the code's own words

`beatEndsRead`'s ⚠⚠ block: «RE-DERIVED AND NEVER STORED, which is a correctness requirement and
not a preference. `answerLifeBeat` re-validates the chosen option against the priced set … so the
price has to be RECONSTRUCTIBLE at answer time from facts the world holds.» Expression is not such
a fact. The `'ended'` options are space/company at +3 or −3 BY THE READ – a read that moved between
the shown prompt and the validated answer would charge the opposite sign of what the player chose.

**Honest limit of the claim: this is LATENT, not live.** `LIFE_BEAT_BLOCKING.ended === true` in
both registers (:154), so the week cannot tick – and no leaning pass can run – between the raise
and the answer. The trap is for what comes next: the album (step 6+) is promised a read of the arc
«later», and any later re-derivation would rewrite wording the player already saw.

## What T7 must therefore do

Re-point **per call site**, never by re-pointing `temperamentOf`'s body – exactly what the brief
already asks («each swap is one import and one call-site with a ⚠ comment»), and now with the
reason written down. Three of the five move; two stay and carry a ⚠ comment naming this ruling.
`voiceOf` is untouched (§0.2's fence).

Outside `lifeBeat.ts`: `accrueSpirit`'s intensity read (`spirit.ts:393` – `returnPerWeek`,
`perturbationScale`) is evaluated now ⇒ **expressed**. `birthday.ts:1351` (the ask weighting) is
§0.2's named fence ⇒ **birth**.

## Ruling B – three facts T1 measured that correct the brief, and one habit of mine they retire

T1 was dispatched with a frozen-career table carried from memory. **It was wrong in three of five
cells** and the builder measured the truth: `elitePlayer` no longer exists – the 12.09 union merge
renamed that cell `highPlayer` – and the counts are middleGrinder **79** · eliteGrinder **78** ·
selfTravelling **80** · middlePlayer **79** · highPlayer **78**. A schema move now costs **eleven**
live constants, not nine, for the same reason.

⚠ **The habit, retired: no brief in this wave repeats that table from the architect's memory.**
Each task that touches the frozen corpus is told to MEASURE the cell set and the counts first. A
remembered number handed down as a measured one is the same failure as a guessed constant.

**The e2e corpus was stale at the wave's base, and this wave's regeneration silently pays another
round's debt.** The last regeneration was wave 4's `eeea42ad`; round 41's `043d49e1` (ad letters
from sixteen, her share from the first W cheque) landed afterwards and regenerated nothing. So the
`.tsave` drift inside T1's commit is NOT all T1's: `unheard` moves seed 13→1 and `belated` 472→671.
This is the debt recorded at the end of wave 4 – «the `.tsave` corpus has no gate of its own, and
the fixture and its manifest regenerate together» – arriving exactly one wave later, which is the
argument for paying it that the debt entry itself could not make.

**And the wave's own base shipped a red gate.** `ccc83cbc` – the architect's brief commit – added a
dated `decisions.md` entry without regenerating the index block above the archive, and
`decisions:check` is step 5 of `npm run check`, so nothing after it ran. Measured at the base in a
throw-away worktree, fixed in its own two-line commit (`89850de2`). The lesson is the house rule
this repo already has and the architect skipped: **a doc commit is gated like any other.**
