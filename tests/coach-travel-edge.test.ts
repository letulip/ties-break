// THE FROZEN CAREERS – the live hashes, and the version ladder's top (v62 – v67).
//
// ⚠ THIS FILE KEEPS ITS PATH BECAUSE IT IS THE ONE THE CITATIONS MEAN. `src/engine/world.ts` cites
// it for the schema roll-backs, `tools/frozen-key-diff.ts` is the tool this protocol demands,
// `tests/migrations.test.ts` and `tests/fixtures/saves/README.md` name it for the frozen careers,
// and some thirty dated entries in docs/specs and docs/rounds are the ledger of its re-freezes.
// Every one of them means the byte identity, so the byte identity is what was left here – and the
// handful that mean the ARITHMETIC (`src/engine/coach.ts`, `src/engine/world/player.ts`, the two
// round21-coach-travel suites) were repointed at tests/coach-travel-edge-helping.test.ts in the
// same commit rather than left resolving to a file that no longer holds what they describe.
//
// ⚠ WHY THERE ARE THREE FILES – the 62,889 ms CI stall with all 43 tests green, the measurement
// that put 98.5 % of the cost in ONE describe, and why cutting the behaviour off would not have
// been enough – is in tests/coachTravelEdgeFixtures.ts, which holds the eighteen constants, the
// walk and the per-key protocol this file and its `-older-schemas` sibling share.
//
// The claim held here is the fourth of the four the travel helping shipped with, quoted from the
// design header that travels with claims 1-3 in tests/coach-travel-edge-helping.test.ts:
//
//   4. A CAREER THAT DOES NOT TRAVEL IS BYTE-IDENTICAL to the one it ran before this shipped - same
//      sub-stream, same single draw, same arithmetic, same save.
//
// ⚠ AND THE LADDER SPANS THE PAIR, APPEND-ONLY ACROSS IT. `PRE_V61` down to `PRE_V50` are asserted
// in tests/coach-travel-edge-older-schemas.test.ts, under the SAME describe name and off the same
// `careerHashAtSchema`. A rung that stops reproducing goes red there rather than here, and the
// chain is only append-only if every rung below this one still reproduces.

import { describe, it, expect } from 'vitest'
import {
  careerHash,
  careerHashAtSchema,
  careerHashUnderTheWindowRule,
  FROZEN,
  PRE_R28B,
  PRE_V62,
  PRE_V63,
  PRE_V64,
  PRE_V65,
  PRE_V66,
  PRE_V67,
} from './coachTravelEdgeFixtures'

describe('the byte-identity of a career that does not travel', () => {
  it('reproduces the pre-change hash for a hired coach who stays at home, at two rungs', () => {
    expect(careerHash(5, 0), '25k · middle coach · grinder').toBe(FROZEN.middleGrinder)
    expect(careerHash(8, 0), '120k · elite coach · grinder').toBe(FROZEN.eliteGrinder)
  })

  it('⭐⭐ ROUND 28 #17-b: the re-freeze moved ONE field – put the window deadline back and the old hashes return', () => {
    // The measured diff behind the re-freeze, not a claim about it. See
    // `careerHashUnderTheWindowRule`: rewriting each kit letter's `deadlineWeek` to
    // `sponsorWindowClosesAt` - and applying the expiry that followed from it - reproduces every
    // pre-ruling constant byte for byte, which is the proof that nothing else in a career moved.
    expect(careerHashUnderTheWindowRule(5, 0), '25k · middle coach · grinder').toBe(PRE_R28B.middleGrinder)
    expect(careerHashUnderTheWindowRule(8, 0), '120k · elite coach · grinder').toBe(PRE_R28B.eliteGrinder)
    // ...and the career that was never written to did not move at all, which is the other half: the
    // whole diff is confined to the inbox.
    expect(careerHash(0, 1), '8k · self-coached · player').toBe(PRE_R28B.selfTravelling)
  })

  it('...and for a self-coached family with the switch ON, which has nobody to send', () => {
    expect(careerHash(0, 1), '8k · self-coached · player').toBe(FROZEN.selfTravelling)
  })

  it('⭐⭐ v62: rolling the schema back to 61 – and dropping the key v62 added – reproduces the previous hashes byte for byte', () => {
    // ⚠ THE WHOLE OF WHAT THE LONG GOODBYE'S STEP 1 DID TO THESE THREE CAREERS, as an identity. The
    // stored peak physical is written by the WEEKLY TICK rather than from behind the college freeze,
    // so unlike most of the rollbacks below it genuinely reaches all three – 156 times each. What
    // this case asks is whether it did anything BUT be written: a `Math.max` over a mean of numbers
    // `growWeek` has already produced cannot feed back into her tennis, and nothing reads it yet.
    // If it had – if the peak had changed a rate, a rank, a fare or an event – the drop would not be
    // enough and this case would be red beside the freeze, naming the wave rather than the number.
    // ⚠ THE KEY IS DROPPED HERE, as in v59's rollback and unlike v60's and v61's: the field that
    // moved is TOP-LEVEL, so a v61 serialisation of this world is exactly this world without it.
    expect(careerHashAtSchema(5, 0, 61), '25k · middle coach · grinder').toBe(PRE_V62.middleGrinder)
    expect(careerHashAtSchema(8, 0, 61), '120k · elite coach · grinder').toBe(PRE_V62.eliteGrinder)
    expect(careerHashAtSchema(0, 1, 61), '8k · self-coached · player').toBe(PRE_V62.selfTravelling)
  })

  it('⭐⭐ v63: rolling the schema back to 62 – and dropping the key v63 added – reproduces the previous hashes byte for byte', () => {
    // ⚠ THE WHOLE OF WHAT THE SHOP'S SLICE 1 DID TO A CAREER THAT NEVER OPENS IT, as an identity, and
    // it is acceptance §2e-4 checked rather than asserted in prose: a save from before the shelf must
    // load with `assets: []` and PLAY IDENTICALLY. `assets` is top-level, so a v62 serialisation of
    // this world is exactly this world without it – and if the shop had touched a price, a fare, a
    // rank or an event on the way in, the drop would not be enough and this case would go red beside
    // the freeze, naming the wave instead of leaving three hashes drifting.
    // ⚠ AND `walkFrozenCareer` ASSERTS THE ARRAY IS EMPTY rather than merely present, so the new key
    // is not just there, it is the nothing the comment says it is.
    expect(careerHashAtSchema(5, 0, 62), '25k · middle coach · grinder').toBe(PRE_V63.middleGrinder)
    expect(careerHashAtSchema(8, 0, 62), '120k · elite coach · grinder').toBe(PRE_V63.eliteGrinder)
    expect(careerHashAtSchema(0, 1, 62), '8k · self-coached · player').toBe(PRE_V63.selfTravelling)
  })

  it('⭐⭐ v67: rolling ONLY the schema number back to 66 reproduces the v66 hashes byte for byte', () => {
    // ⚠ THE WHOLE OF WHAT ROUND 30 ITEM 25's REPAIR DID TO A FROZEN CAREER, AS AN IDENTITY – and the
    // answer is NOTHING, which is the derived expectation and not a relief. v67 is a RENUMBER: the
    // units and name back-fills are the v66 step's own former contents, moved character for
    // character onto a new rung because v66 had shipped underneath them. They write `units` and
    // `name` onto ROWS of `assets`, and `walkFrozenCareer` asserts that array is empty here, so
    // neither has a row to reach and no bench policy buys one. If the move had altered a single
    // character of behaviour on the way across – a fallback, a price, an order – changing one number
    // back would not be enough and this case would be red beside the freeze, naming the wave.
    expect(careerHashAtSchema(5, 0, 66), '25k · middle coach · grinder').toBe(PRE_V67.middleGrinder)
    expect(careerHashAtSchema(8, 0, 66), '120k · elite coach · grinder').toBe(PRE_V67.eliteGrinder)
    expect(careerHashAtSchema(0, 1, 66), '8k · self-coached · player').toBe(PRE_V67.selfTravelling)
  })

  it('⭐⭐ v66: rolling ONLY the schema number back to 65 reproduces the v65 hashes byte for byte', () => {
    // ⚠ THE WHOLE OF WHAT THE 'business' CATEGORY DID TO A FROZEN CAREER, AS AN IDENTITY – and the
    // answer is NOTHING, which is the derived expectation rather than a relief: v66 appends no world
    // key (a category is a value inside `events` / `financeWeeks`), the businesses earn only for a
    // family that bought the shelf's earners, and no bench policy buys anything. If the wave had
    // reached any career fact – a row, a cent, a draw – changing one number back would not be
    // enough and this case would be red beside the freeze, naming the kind of change it was.
    expect(careerHashAtSchema(5, 0, 65), '25k · middle coach · grinder').toBe(PRE_V66.middleGrinder)
    expect(careerHashAtSchema(8, 0, 65), '120k · elite coach · grinder').toBe(PRE_V66.eliteGrinder)
    expect(careerHashAtSchema(0, 1, 65), '8k · self-coached · player').toBe(PRE_V66.selfTravelling)
  })

  it('⭐⭐ v65: rolling the schema back to 64 – and dropping the key v65 added – reproduces the merge hashes byte for byte', () => {
    // ⚠ THE WHOLE OF WHAT RECORDING A CHAMPION DID TO A CAREER, AS AN IDENTITY, and this is the
    // strongest form the claim can take. v65 writes `world.fieldSeasonTitles` on EVERY canonical
    // bracket – ~187 a season in each of these three careers – so unlike v63's empty `assets` the new
    // key is FULL here. If the write had reached anything, dropping it would not be enough: the
    // ledger, the ranking, the cohort, the feed or the funds would still differ and this case would
    // be red beside the freeze.
    // ⚠ AND THE POINT OF THE CHANGE IS THAT IT REACHES NOTHING. It is post-draw bookkeeping on a
    // table the bracket has already filled in (`finishes`), written to a tally nothing but a census
    // reads – deliberately NOT to `world.results`, which prunes at 52 weeks and IS what
    // `computeRanking` reads. `walkFrozenCareer` asserts the key is present and non-empty rather than
    // merely present, so a wave that silently stopped recording would go red here too.
    // ⚠ THIS ASSERTION WAS DEAD until 28.08: it shared a physical line with the comment above, so
    // `//` swallowed it and the arm ran green while checking nothing. Re-aimed, never weakened.
    expect(careerHashAtSchema(5, 0, 64), '25k · middle coach · grinder').toBe(PRE_V65.middleGrinder)
    expect(careerHashAtSchema(8, 0, 64), '120k · elite coach · grinder').toBe(PRE_V65.eliteGrinder)
    expect(careerHashAtSchema(0, 1, 64), '8k · self-coached · player').toBe(PRE_V65.selfTravelling)
  })

  it('⭐⭐ v64: rolling back to 63 – dropping v65\'s key as well – still reproduces the v63 hashes byte for byte', () => {
    // ⚠ THE SECOND WORKING RUNG, AND THE RENUMBER IS EXACTLY WHY IT MATTERS. Two schema moves landed
    // on this tree a day apart and this case walks BOTH of them off: `careerHashAtSchema(…, 63)`
    // drops `fieldSeasonTitles` and rolls the number past 64 to 63, so it is asking whether round 27
    // #6 AND the champion tally together left an ordinary tour career alone. The case above asks the
    // same of v65 alone; a chain is only append-only if every rung below it still reproduces.
    // ⚠ THE WHOLE OF WHAT ROUND 27 #6 DID TO A CAREER THAT NEVER GOES TO COLLEGE, as an identity.
    // The wave has three ways to reach an ordinary tour career and this closes all three at once:
    // the new save field (`college.callUpReveal` – nested, and `college` is null here), the new
    // LETTER (`settleCallUpLetter` writes to `world.offers`, which IS in this hash), and the moved
    // roll (`callUpFor`, same key, same view, same draw order). Every one of them is guarded on
    // `inCollege`, week 156 is 32 weeks short of the fork, and `walkFrozenCareer` asserts
    // `world.college === null` rather than assuming it – so if any of the three had leaked, rolling
    // the number back would NOT reproduce and this case would be red beside the freeze.
    // ⚠ RE-AIMED BY THE MERGE OF `origin/main`, NOT WEAKENED: `PRE_V64` now holds main's OWN
    // post-retirement hashes, because the retirement hazard's condition curve moved every frozen
    // career before this branch was merged. The case asks exactly what it always asked – does v64
    // move the version number and nothing else – but it now asks it ON TOP OF a change that moved
    // the careers, which is the first time this identity has had to survive one. It does.
    // ⚠ Dead the same way and for the same reason – see the note on the v65 arm above.
    expect(careerHashAtSchema(5, 0, 63), '25k · middle coach · grinder').toBe(PRE_V64.middleGrinder)
    expect(careerHashAtSchema(8, 0, 63), '120k · elite coach · grinder').toBe(PRE_V64.eliteGrinder)
    expect(careerHashAtSchema(0, 1, 63), '8k · self-coached · player').toBe(PRE_V64.selfTravelling)
  })

  it('MOVES when the same career sends him – so the three pins above are not vacuous', () => {
    // ⚠ THE MUTATION CHECK, and it is what makes this file a test rather than a photograph. The same
    // preset, the same policy, the same seed and the same 156 weeks, with only the stance flipped:
    // if the travel helping were inert the two would hash the same and the pins would be proving
    // nothing. (The fare moves with the switch too, which is the point of the switch - what is
    // isolated to the edge alone is asserted arithmetically in
    // tests/coach-travel-edge-helping.test.ts, which is where claims 1-3 went in the cut.)
    expect(careerHash(5, 0, { coachOnEventWeeks: true })).not.toBe(FROZEN.middleGrinder)
  })
})
