---
type: spec
status: current
area: quality-rig
canonical: true
last-reviewed: 2026-09-25
---

# Engine/UI parity – when a screen restates an engine verdict

The quality rig's row 13, named and applied. The class is one sentence: **the screen holds a
predicate the engine does not.** Round 29 produced three instances in one round, each of which
looked like a separate bug, and the instrument that catches the shape already existed – it was
invented for something else.

## Current truth

The convention below is NAMED here for the first time (24.09) and applied to the three known sites
on `rig/parity-wake`. What stands today, measured on the branch head rather than assumed:

* **The masseur's week carries the STRONGEST form and a complete net.** The screen asks the engine's
  own primitive – `weekDays.ts` calls `masseurWorksInWeek` (`engine/world/masseur.ts`) – and
  `tests/component/round29-masseur-parity.test.ts` witnesses it across four week kinds with both
  mutation arms. Nothing was added there; a second guard would have been strictly worse than none.
* **The feed filter carries a COPY plus a witness, and that is now a DECISION rather than an
  inheritance** – see «The feed filter's copy stays» below. The unit nets
  (`tests/dead-rungs.test.ts`, `tests/round34-ladder-plaques.test.ts`) assert the composable; what was
  missing until 24.09 was the RENDERED surface, now `tests/component/parity-feed-ladder.test.ts` and
  `tests/component/parity-plaque-national.test.ts`.
* **§5's two live instances are CLOSED (25.09)**, both on `rig/parity-wake` with their arms run. §5
  keeps the records; the guards are `tests/component/parity-plaque-national.test.ts` §3 and
  `tests/round34-ladder-plaques.test.ts`' «BOTH HALVES … read the ENGINE's number».

### The feed filter's copy stays (25.09) – the reason, and what would have to change

`composables/tierState.ts`' `paysIntoHerTables` (:200-209) and the age term in `feedContext`
(:254-257) STAY. This is a decision taken against a measurement, not a task left undone, and the
justification on record until today was **wrong about what the code does**:

⚠ **The copies never run for a caller with no oracle.** `feedContext`'s first line is
`if (!open) return { rungs: whole ladder, working: whole ladder }`, so the no-oracle case is answered
BEFORE either copy is reached. They only ever second-guess an oracle that IS present – they guard
against a WRONG `tierOpen`, never a missing one. «The safe direction when no oracle arrives»
(`parity-feed-ladder.test.ts`, 24.09) describes a case that cannot reach them.

**What the measurement says.** Both copies are subsumed by the engine today by construction, not by
coincidence: the age half by `tierOpenFor`'s own `tierAgeBlock(tier, …) === 'old'` clause
(`engine/world/ladder.ts`, calendar Part 0), the table half by `playDownBars`' domestic limb, whose
own note says it is *that rule moved off the screen and into the ladder*. Measured over **181 live
snapshots** – six built careers plus 175 sampled weeks of a seventh walked from 13 to 27, on the
domestic and the professional tables – deleting BOTH copies produced **0 differences in `rungs`, 0 in
`working` and 0 in the rendered row set**, and neither copy removed a single rung the engine held open
on any sample. `tierOpen` persists nothing (`shared/protocol/competition.ts`: «Derived at snapshot
time; persists nothing»), its only producer is `toSnapshot` in the same process, and all four live
callers take `ageYears` and `tierOpen` off ONE snapshot – so a present-but-wrong oracle is not a state
this app can reach.

**So why keep them.** §1's own carve-out: a witness is what you build «when removing the copy is a
change with its own risk». The conversion's product gain is measurably NIL and its cost is two
deliberate nets:

* `tests/tier-window.test.ts`' round-17 #19 case reddens – the ONE red in the whole measurement
  (`dead-rungs`, `round34-ladder-plaques`, `ladder-floor` and all 221 component files stay green). It
  poses `tierOpen` with the J rungs open at 19, which the engine can no longer emit.
* ⚠⚠ worse, `tests/dead-rungs.test.ts`' `fold(snap, { table: false, age: false })` knob – the
  instrument behind every «asserted with the UI's own filters WITHHELD» claim in that file, which is
  how Part 0 proved the closure had moved into the engine – becomes a NO-OP. It would not go red; it
  would stop being able to. Trading a falsifiable net for a tautology, to remove code that provably
  does nothing, is the wrong direction.

**What would have to change for the copy to go**, in the order that makes it cheap:

1. `dead-rungs.test.ts` gets a replacement for `judge`, or says in as many words that its claim is now
   STRUCTURAL – there is no UI filter left to withhold, which is §1's «a test can only witness it».
2. `tier-window.test.ts`' round-17 #19 case is re-aimed at the ENGINE (`tierOpenFor` at 19), where
   `dead-rungs.test.ts` fault 3 already asserts it, so no coverage is lost.
3. `paysIntoHerTables`, `FEED_TABLE_SLACK` and the `LADDER_TRACKS` import go with it. ⚠ The TABLE half
   is the one that earns the removal: it is a genuine second implementation with a constant of its own
   (`FEED_TABLE_SLACK = 1`) and it can silently defeat `PLAY_DOWN.domesticFromProTable`, a documented
   A/B knob whose `false` re-opens the club draws in the engine while the screen would go on hiding
   them. The AGE half is not a copy at all – it CALLS the engine's `tierAgeBlock`, so it cannot drift;
   it is merely redundant.
4. And it is the owner's call, because what is being removed for a tidiness gain is defence-in-depth
   on a shipped screen.

## 1. The two forms, and the order between them

**Form A – the screen asks the engine's own exported primitive.** Round 14's «literally the same
function» idiom. There is no second implementation, so there is nothing to drift: the parity is a
property of the CODE and a test can only witness it. `masseurWorksInWeek` is the worked example –
`masseurWorksThisWeek`'s body taking primitives, exported for exactly this, on `spanWorthOffering`'s
precedent.

⭐ A second structural spelling of form A, from the instrument's own origin: **a component that takes
NO PROPS and reads the source itself.** `round28-household-shared.test.ts` says it in as many words –
«`HouseholdStrip.vue` takes NO PROPS. It reads `snapshot.coachBilling.household` itself, so a host
cannot hand it a different number, and there is nothing for a second implementation to be.» Where a
figure appears on two screens, one propless component beats two callers of one function.

**Form B – the paired mount test.** Where a copy has to stay – a filter the screen applies for its
own reasons, a sentence the screen composes – the restatement carries a mounted test asserting BOTH
surfaces from ONE posed snapshot, with the mutation table that proves the sharing.

⚠⚠ **THE ORDER IS NOT A PREFERENCE. Form A GUARANTEES the parity; form B only WITNESSES it.** A
witness is what you build when the guarantee is unavailable or when removing the copy is a change
with its own risk – never as a substitute for a primitive that could simply be called. A wave that
finds itself writing form B twice for one mechanic is looking at a missing export.

## 2. The mutation table is the convention, not a garnish

A paired test is worth nothing unless both arms have been RUN and their outputs recorded. Two arms,
and the ASYMMETRY between them is the whole record:

| arm | what is broken | what must go red |
| --- | --- | --- |
| **A** | the shared SOURCE (the engine's own value) | BOTH surfaces, together – that is what «they read one source» looks like from outside |
| **B** | the SHARING (a hand-rolled second implementation on one surface) | the parity test ALONE, while the other surface's own file stays entirely green |

Arm B's asymmetry is the proof the file earns its place: a test that only ever reddens beside its
neighbours is a restatement of them. Round 28 #8's ledger records five reds across two surfaces from
one engine edit for arm A, and «the Coaches-tab file cannot see a second implementation on the other
tab, and §2 can» for arm B.

⚠ A THIRD ARM IS OWED WHERE THE SURFACE IS A TEMPLATE. The copy that drifts is not always in a
composable: `parity-feed-ladder.test.ts` carries an arm that adds a fourth filter term to
`SeasonScreen.vue`'s own `visibleUpcoming`, and it reddens the mounted file **alone** while every
unit net stays green. That arm is the one-line argument for why a rendered assertion exists at all
beside a composable one.

## 3. When each applies

* The screen prints a **refusal, a price, an openness, a count or a date** that the engine also
  computes → form A if the primitive exists or can be exported without moving behaviour; otherwise
  form B.
* The screen prints a **sentence the engine composed** (a `refusal.detail`, a blurb) → it prints the
  engine's string or it does not print one. ⚠ A screen that RE-AUTHORS the sentence is the class
  wearing a different hat – §5 has a live one.
* The screen applies a filter the engine does not know about → that is not a restatement and this
  spec does not reach it. It becomes a restatement the moment the engine grows its own answer, which
  is what calendar Part 0 did.

## 4. Why Playwright is the wrong tool for this class

Row 13's own sentence, kept: **it catches a symptom you already knew to assert.** An end-to-end case
walks a journey and looks at a screen – so it can only fail on a state a human already predicted and
posed. The parity defect is not a state, it is a DISAGREEMENT between two computations, and it shows
up on whatever state happens to separate them. The mounted pair poses that state directly and, more
importantly, the arm-B mutation proves the pair is reading one source, which no journey can.

⚠ This is a statement about the CLASS and not about the e2e suite, whose own row (15) stands: every
wave that ships a mechanic still owes it a case.

## 5. The two live instances found while applying this – ⭐ BOTH CLOSED 25.09

Both were found by the 24.09 pass and both are `src/` changes, so neither was made by a guard's
builder. They were the class in shipped code; each record is kept verbatim, because what a defect
looked like before it was closed is the useful part, and each now carries what shipped:

1. **`HomeScreen` re-authors the engine's refusal on the outgrown chip.**
   `src/components/screens/HomeScreen.vue:775-780`: for `state === 'outgrown'` the tooltip becomes a
   HomeScreen-composed line about a best result and DISCARDS `tierState`'s `title`, which is the
   engine's own `refusal.detail`. So `dead-rungs.test.ts:217`'s claim that the plaque carries the
   engine's words is true of the composable and **false of the strip**. On a professional fixture with
   no domestic best finish, the row promises a result that does not exist. ⚠ It is §3's second bullet
   exactly: the screen re-authored a sentence the engine composed.
   ⭐ **CLOSED 25.09.** The arm keeps the fragment WHERE IT IS TRUE and lets the engine's sentence
   through, on the shape the `reached` arm one line up already had – the screen's fact, a `·`, then the
   engine's sentence – so no word is new; a rung with no finish prints the engine's sentence and
   nothing else. ⚠ The second half of the defect was that the claim was UNCONDITIONAL: measured on a
   professional at #110, all three club rungs asserted a best result and `bestFinishByTier` held none
   for any of them. The accessible name needed nothing – `chipName`'s `outgrown` arm reads
   `chip.label`, never `title`, so the claim never reached a screen reader. Guard:
   `tests/component/parity-plaque-national.test.ts` §3, whose arm B reddens it ALONE while
   `dead-rungs.test.ts` stays 18/18 green – this finding, reproduced.
2. **`tierState`'s locked arm reads two sources for one plaque.**
   `src/composables/tierState.ts:940-941` take the engine's `refusal.pointsToEnter` for the chip;
   `:949-950` re-derive the tooltip from the tier's own `minPoints`. They agree **today** only because
   `engine/world/medical.ts:1154` and `:1321` both write `tier.enterPointBand[0]` into
   `pointsToEnter` – so nothing is visible and no test can redden. A latent instance is still an
   instance, and this one is form A's argument in miniature: one of the two reads should not exist.
   ⭐ **CLOSED 25.09.** The re-derivation is deleted; the distance, the «she has N of M» and the gap
   the results plan is priced against all read one binding off `refusal.pointsToEnter`. The
   invisibility was PROVEN before the change rather than assumed: **351 hits of that arm over 181
   built snapshots, 0 with the engine's number absent, 0 divergences**, and with the re-derivation
   still in place `parity-plaque-national.test.ts` is 9/9 green including the row re-pointed at the
   engine's number. The arm that matters: `medical.ts:1321` made to quote `enterPointBand[0] + 45` – on
   the PRE-FIX code the rendered tooltip states the band's distance while the chip states the engine's
   («expected 'Regional Championship – locked: 35 mo…' to contain '80 more national pts'»), and on the
   fixed code the whole plaque follows the engine. Guard:
   `tests/round34-ladder-plaques.test.ts`' «BOTH HALVES … read the ENGINE's number», which POSES the
   divergence no fixture can produce.

## 6. What this spec does not do

It adds no test framework, no helper and no CI step. It names a convention that two shipped files
already obey and gives the next wave the two questions to ask: **is there a primitive to call, and if
not, does the restatement carry its pair with both arms run?**
