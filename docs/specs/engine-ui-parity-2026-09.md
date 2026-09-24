---
type: spec
status: current
area: quality-rig
canonical: true
last-reviewed: 2026-09-24
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
* **The feed filter and the plaque carry a COPY plus a witness.** The engine's verdict is right and
  the screen keeps its own rules beside it (`composables/tierState.ts`'s `paysIntoHerTables` and age
  filter, deliberately left by calendar Part 0 as the safe direction for a caller with no oracle).
  The unit nets (`tests/dead-rungs.test.ts`, `tests/round34-ladder-plaques.test.ts`) assert the
  composable; what was missing until 24.09 was the RENDERED surface, now
  `tests/component/parity-feed-ladder.test.ts` and `tests/component/parity-plaque-national.test.ts`.
* **Two live instances of the class are recorded and NOT fixed** – see §5. Both are `src/` changes
  and neither is a guard's to make.

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

## 5. The two live instances found while applying this, recorded and unfixed

Both were found by the 24.09 pass and both are `src/` changes, so neither was made by a guard's
builder. They are the class, today, in shipped code:

1. **`HomeScreen` re-authors the engine's refusal on the outgrown chip.**
   `src/components/screens/HomeScreen.vue:775-780`: for `state === 'outgrown'` the tooltip becomes a
   HomeScreen-composed line about a best result and DISCARDS `tierState`'s `title`, which is the
   engine's own `refusal.detail`. So `dead-rungs.test.ts:217`'s claim that the plaque carries the
   engine's words is true of the composable and **false of the strip**. On a professional fixture with
   no domestic best finish, the row promises a result that does not exist. ⚠ It is §3's second bullet
   exactly: the screen re-authored a sentence the engine composed.
2. **`tierState`'s locked arm reads two sources for one plaque.**
   `src/composables/tierState.ts:940-941` take the engine's `refusal.pointsToEnter` for the chip;
   `:949-950` re-derive the tooltip from the tier's own `minPoints`. They agree **today** only because
   `engine/world/medical.ts:1154` and `:1321` both write `tier.enterPointBand[0]` into
   `pointsToEnter` – so nothing is visible and no test can redden. A latent instance is still an
   instance, and this one is form A's argument in miniature: one of the two reads should not exist.

## 6. What this spec does not do

It adds no test framework, no helper and no CI step. It names a convention that two shipped files
already obey and gives the next wave the two questions to ask: **is there a primitive to call, and if
not, does the restatement carry its pair with both arms run?**
