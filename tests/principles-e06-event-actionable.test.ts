// ⭐⭐ T4.1 · E-06 – ONE NAME FOR ONE PREDICATE: «CAN SHE ACT ON THIS CARD THIS WEEK».
//
// The finding (docs/review-principles-2026-09-26/05-ui.md, E-06): `composables/tierState.ts`'
// `eventActionable` carried a SECOND BODY of the engine's `eventIsHers` – byte-identical except the
// parameter name – and both sites' own notes claimed to be the one definition. `eventActionable`:
// «One definition, because `weekEventStack`, the Season header's counter and "is this week still
// hers to plan" must not come to mean three different things». `weekDays.ts`' `isSuitable`, which
// IS the engine's function re-exported: «or the markers under the grid and the control above the
// tab bar would disagree about what an empty stretch is». Two comments arguing for one spelling,
// over two spellings.
//
// ⚠⚠ FORM A, AND IT IS THE ONLY HONEST SHAPE HERE (docs/specs/engine-ui-parity-2026-09.md §1). The
// bodies were identical, so there was nothing to keep: the fix ASSIGNS the engine's own exported
// primitive to the UI's historical name, exactly as `isSuitable` already did. The parity is now a
// property of the CODE – there is no second implementation to drift – and this file can only
// WITNESS it. The spec's order is explicit that a witness is never a substitute for a primitive
// that could simply be called.
//
// ⚠ SO THE HEADLINE CLAIM IS AN IDENTITY, NOT A TABLE OF AGREEMENTS. A table of agreements is what
// the two copies already passed: they agreed today, by copy, which is precisely what both comments
// said must not be the mechanism. `toBe` is the assertion that cannot be satisfied by a second
// body, however faithful.
//
// ⚠⚠ THE MUTATION ARM: point ONE reader back at its own copy – restore `eventActionable`'s former
// body in `composables/tierState.ts` – and §1's identity case reddens while the behaviour table
// beside it stays green, because a restored copy still agrees on every input. Both outputs are
// quoted in the wave's report. The asymmetry is the whole record: the arm that breaks the SHARING
// cannot be seen by any test that only compares answers.
import { describe, it, expect } from 'vitest'
import { eventActionable, type StackableEvent } from '../src/composables/tierState'
import { isSuitable } from '../src/composables/weekDays'
import { eventIsHers } from '../src/engine/world'
import type { UpcomingEvent } from '../src/shared/protocol'

// A whole `StackableEvent`, because that is the signature this export declares – `vue-tsc` refused a
// three-field literal here and was right to: the assignment keeps the UI's parameter type, so a test
// that posed only the three fields the BODY reads would be asserting against a signature the callers
// do not have. `id` and `tier` are carried and never touched, which is the point.
const card = (entered: boolean, eligible: boolean, deadlineWeek: number): StackableEvent => ({
  id: `w${deadlineWeek}-local`,
  tier: 'local',
  entered,
  eligible,
  deadlineWeek,
})

describe('E-06 §1: three names, one body', () => {
  it('⚠⚠ `eventActionable` IS the engine\'s `eventIsHers` – not a faithful copy of it', () => {
    // THE MUTATION ARM LIVES HERE. Restoring the composable's own
    // `e.entered || (e.eligible && week <= e.deadlineWeek)` reddens this line and nothing else in
    // this file: a second body answers every question the same way and differs only in identity.
    expect(eventActionable).toBe(eventIsHers)
  })

  it('...and so is `weekDays`\' historical `isSuitable`, which already said so in as many words', () => {
    // Round 26 #1 moved the body into the engine and re-exported the old name. That half was never
    // in doubt; it is asserted beside its neighbour so the file states the whole of what «one
    // definition» now means – the engine's function under all three names.
    expect(isSuitable as unknown).toBe(eventIsHers)
  })
})

describe('E-06 §2: and the answer is unchanged, which is why this was a refactor', () => {
  // The bodies were identical, so every one of these rows passed before the fix as well. They are
  // the proof that nothing MOVED – E-06's «there is no behaviour change, because the bodies are
  // identical» measured rather than asserted in prose.
  const week = 40
  const rows: Array<{ label: string; e: StackableEvent; want: boolean }> = [
    { label: 'entered, list long closed – hers whatever the deadline says', e: card(true, false, 1), want: true },
    { label: 'entered and still eligible', e: card(true, true, 44), want: true },
    { label: 'eligible, list open this very week', e: card(false, true, week), want: true },
    { label: 'eligible, list open ahead', e: card(false, true, week + 3), want: true },
    { label: 'eligible but the list shut last week', e: card(false, true, week - 1), want: false },
    { label: 'ineligible, list wide open', e: card(false, false, week + 3), want: false },
    { label: 'ineligible and shut', e: card(false, false, week - 5), want: false },
  ]
  for (const { label, e, want } of rows) {
    it(label, () => {
      expect(eventActionable(e, week)).toBe(want)
      // Same input, same answer, through the engine's own name – the claim a reader of either site
      // is entitled to make now.
      expect(eventIsHers(e, week)).toBe(want)
    })
  }

  it('⚠ the deadline week is INCLUSIVE, which is the one clause a re-spelling gets wrong', () => {
    // `week <= deadlineWeek`, never `<`. It is called out on its own because it is the boundary a
    // hand-rolled copy drifts on, and the arm that proves this file can see such a drift.
    expect(eventActionable(card(false, true, week), week), 'the last week to enter is a week she may enter').toBe(true)
    expect(eventActionable(card(false, true, week - 1), week), 'one week past it is not').toBe(false)
  })

  it('⚠ and the UI\'s wider card satisfies the engine\'s narrower parameter', () => {
    // `StackableEvent` carries `id` and `tier`; `eventIsHers` asks for three fields. The assignment
    // keeps `eventActionable`'s declared signature, so every existing caller – SeasonScreen's
    // `actionable`, `weekEventStack`'s tail filter – type-checks unchanged. Asserted with a real
    // `UpcomingEvent` shape rather than the minimal one above.
    const ev = { id: 'w40-local', tier: 'local', entered: false, eligible: true, deadlineWeek: week } as unknown as UpcomingEvent
    expect(eventActionable(ev, week)).toBe(true)
  })
})
