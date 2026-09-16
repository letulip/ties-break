// THE FROZEN CAREERS – the live hashes, and the version ladder's top (v71 – v74).
//
// ⚠⚠ THE LADDER IS THREE FILES SINCE 12.09 (wave 3, PR #135 – the fifth red `unit-heavy`), and the
// rung range in the line above is the ONLY thing about this file that moved. v69 down to v62 now sit
// in tests/coach-travel-edge-mid-schemas.test.ts, under the SAME describe name and off the same
// `careerHashAtSchema`; the measurement that forced it – 29.69 s solo against a 60 s window at this
// file's own 2.24x, with the cost flat across all 17 cases so the walk count WAS the seam – is in
// that file's header.
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
// ⚠ WHY THERE IS MORE THAN ONE FILE – the 62,889 ms CI stall with all 43 tests green, the
// measurement that put 98.5 % of the cost in ONE describe, and why cutting the behaviour off would
// not have been enough – is in tests/coachTravelEdgeFixtures.ts, which holds the eighteen constants,
// the walk and the per-key protocol this file and its two frozen siblings share.
//
// The claim held here is the fourth of the four the travel helping shipped with, quoted from the
// design header that travels with claims 1-3 in tests/coach-travel-edge-helping.test.ts:
//
//   4. A CAREER THAT DOES NOT TRAVEL IS BYTE-IDENTICAL to the one it ran before this shipped - same
//      sub-stream, same single draw, same arithmetic, same save.
//
// ⚠ AND THE LADDER SPANS ALL THREE, APPEND-ONLY ACROSS THEM. `PRE_V69` down to `PRE_V62` are
// asserted in tests/coach-travel-edge-mid-schemas.test.ts and `PRE_V61` down to `PRE_V50` in
// tests/coach-travel-edge-older-schemas.test.ts, both under the SAME describe name and off the same
// `careerHashAtSchema`. A rung that stops reproducing goes red there rather than here, and the
// chain is only append-only if every rung below this one still reproduces.

import { describe, it, expect } from 'vitest'
import {
  careerHash,
  careerHashUnderTheOldName,
  careerHashUnderTheWindowRule,
  windowRuleWitness,
  FROZEN,
  PRE_NAME_VERA,
  PRE_R28B,
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
    //
    // ⚠⚠ RE-AIMED 12.09.2026 (wave 4, T1b), NOT WEAKENED - AND THE REASON IS THE ONLY THING IN THIS
    // FILE A READER SHOULD TAKE AWAY BEFORE THE HASHES. **THIS CASE WAS DOWN TO ZERO DISCRIMINATING
    // CAREERS, FROM ONE, AND WAS GREEN THE WHOLE TIME.** The rewrite is a NO-OP on a kit letter that
    // landed on the window's OPENING week - there the letter rule and the window rule are the same
    // number by arithmetic - so on such a career the identity below is true by construction and says
    // nothing about the ruling. `eliteGrinder` was the one career that still held a mid-window letter
    // (`kit-152`, deadline 156 by the letter / 155 by the window); it stopped holding one at
    // `ac2b5de3` on 03.09, when the first-round draw pin moved her results, her standing and with them
    // which rungs wrote in her window. `middleGrinder` never discriminated on any tree and
    // `selfTravelling` is identity by design. The full dating, the eighteen-career sweep and the
    // engine-toggled A/B that produced the two constants below are over `PRE_R28B` in the fixtures
    // module. ⚠ Nothing was invented to make this green: both restored careers are existing bench
    // pairs, and the third outcome - «the ruling is unobservable» - was REFUTED by that sweep.
    //
    // ⭐⭐ SO THE CASE NOW ASSERTS ITS OWN SUBJECT FIRST, which is exactly what it never did and what
    // let it die in silence: a career is only a WITNESS while it holds a letter the two rules disagree
    // about, so that letter is named, its two deadlines are named, and if a wave moves her ranking off
    // it again this goes RED HERE with a sentence instead of quietly proving nothing.
    //
    // ARM: three mutations, 12.09.2026, all run in a detached worktree at `97b4e6c9` carrying this
    // file and the fixtures module, control green first (18 passed).
    //   1. THE RULE ITSELF – `src/engine/offers.ts:965` and `:1059` put back to
    //      `sponsorWindowClosesAt(week)`: **1 case red**, this one, on «THE LETTER RULE … expected 155
    //      to be 156». ⚠ AND THE OTHER SEVENTEEN STAYED GREEN, which is the measurement that dates the
    //      defect from the other side: un-shipping round 28 #17-b altogether is INVISIBLE to `FROZEN`,
    //      to the three original `PRE_R28B` careers and to every `PRE_V*` rung in this file.
    //   2. THE WITNESS LOSING ITS LETTER – `windowRuleWitness(8, 1)` re-pointed at `(8, 0)`, the career
    //      that stopped discriminating on 03.09: **1 case red**, on «the witness letter exists and
    //      landed MID-window: expected undefined to be 152». That is this task's own defect reproduced
    //      as a red test, and it is the arm that did not exist before.
    //   3. THE RECONSTRUCTION REPAIR – the `o.state === 'expired'` branch deleted from
    //      `underTheWindowRule`: **1 case red**, on «25k · middle coach · player: expected
    //      '23ba204dc0ca…' to be 'de9a7dda7916…'» – the broken reconstruction against the hash the
    //      engine itself produced with the old rule compiled in.
    //
    // ⭐⭐⭐ AND ARM 2 FIRED FOR REAL ON 12.09.2026, THE SAME DAY IT WAS BUILT – THE UNION MERGE OF
    // ROUND 41 INTO WAVE 4 (round 41 x wave 4). The witness above, `windowRuleWitness(8, 1)`, walked
    // into the merge holding `kit-152` and came out holding `kit-47` and `kit-151`, both on slot 0 –
    // and this case went RED on the precondition three lines down, «expected undefined to be 152»,
    // which is the sentence arm 2 exists to produce. Nine days of silence last time; one test run
    // this time. The witness is re-pointed at preset 6 / policy 1 below, at the SAME letter and the
    // SAME two deadlines.
    //
    // ⚠ WHAT MOVED HER IS BISECTED, NOT GUESSED, AND IT IS NOT THE PRIVATE LIFE AND NOT THE JUNIOR AD
    // LETTER. Four trees walked with one probe, then the 59 commits between them binary-searched on
    // «does 8/1 hold kit-152?» in six runs: the merge base `3dda7566` holds it, wave 4 `af6007da`
    // holds it (so the private life never touched her), round 41 `bdab3c64` does not, and the union
    // tree does not. **The commit is `bea3d58e` «round 41 P1 – one market, different baskets»** – a
    // PRICE change reaching a `PLAYER`-policy career through her wallet: her accepted entries inside
    // the sponsor window went from one to five, `kidRankWta` moved 310 -> 539 with them, and
    // `windowLadder(standing)` is read fresh every week of the window, so a different rung cleared and
    // the slot-1 letter was never raised. The A1 junior ad letter (`043d49e1`) lands earlier in the
    // bisect with the witness still intact, and 8/1 receives no `ad` letter on any of the four trees.
    // The full sweep, the eight-career engine A/B and the naming rule are over `PRE_R28B`.
    const high = windowRuleWitness(6, 1) // 25k middle · HIGH coach · PLAYER policy
    const mid152 = high.kitLetters.find((o) => o.id === 'kit-152')
    expect(mid152?.week, 'the witness letter exists and landed MID-window (slot 1, not the opening week)').toBe(152)
    expect(mid152?.slot, '...which is the whole reason the two rules can disagree about it').toBe(1)
    expect(mid152?.deadlineWeek, 'THE LETTER RULE, which is what the engine writes since the ruling').toBe(156)
    expect(mid152?.windowRule, 'THE WINDOW RULE, one week earlier - the thing the ruling replaced').toBe(155)
    expect(mid152?.state, '...so under the letter rule it is still OPEN at the horizon instead of expired').toBe('open')
    // ...and only NOW is the negative worth asserting, because the two lines above prove its target
    // exists. A case whose two arms cannot differ is the failure this whole re-aim is about.
    expect(high.underTheWindowRule, 'the two rules produce DIFFERENT careers here').not.toBe(high.live)
    expect(high.underTheWindowRule, '25k · high coach · player - the pre-ruling career').toBe(PRE_R28B.highPlayer)

    // ⭐ AND THE OTHER BRANCH OF THE RECONSTRUCTION, which is a letter that had ALREADY lapsed by the
    // horizon: moving its deadline moves the week it lapsed WITH it, and rewriting one without the
    // other reconstructs a world the engine never wrote. That was a real defect in the helper until
    // this pass, invisible while every frozen career's letters sat on the opening week.
    const middle = windowRuleWitness(5, 1) // 25k middle · middle coach · PLAYER policy
    const mid100 = middle.kitLetters.find((o) => o.id === 'kit-100')
    expect(mid100?.slot, 'the expired witness landed mid-window too').toBe(1)
    expect(mid100?.state, '...and unlike kit-152 it is already gone by the horizon').toBe('expired')
    expect(mid100?.deadlineWeek, 'the LETTER rule gave it until 104...').toBe(104)
    expect(mid100?.decidedWeek, '...so `expireOffers` lapsed it on `deadlineWeek + 1`').toBe(105)
    expect(mid100?.windowRule, 'the WINDOW rule closed a week earlier, so it would have lapsed on 104').toBe(103)
    expect(middle.underTheWindowRule, '25k · middle coach · player - the pre-ruling career').toBe(PRE_R28B.middlePlayer)

    // The three careers this case has always carried. They no longer witness the RULE - every kit
    // letter they hold landed on the window's opening week - but they still say «this career did not
    // move», which is worth having and is what they now stand for.
    expect(careerHashUnderTheWindowRule(5, 0), '25k · middle coach · grinder').toBe(PRE_R28B.middleGrinder)
    expect(careerHashUnderTheWindowRule(8, 0), '120k · elite coach · grinder').toBe(PRE_R28B.eliteGrinder)
    // ...and the career that was never written to did not move at all, which is the other half: the
    // whole diff is confined to the inbox.
    expect(careerHash(0, 1), '8k · self-coached · player').toBe(PRE_R28B.selfTravelling)
  })

  it('...and for a self-coached family with the switch ON, which has nobody to send', () => {
    expect(careerHash(0, 1), '8k · self-coached · player').toBe(FROZEN.selfTravelling)
  })

  it('⭐⭐ 02.09 – the `Vera -> Alice` default moved HER NAME: put it back and the old hashes return', () => {
    // The measured diff behind the re-stamp, as an identity rather than as a claim about it. The
    // per-key diff said `profile` and `events` moved and nothing else; this says the same thing at
    // byte level, which is the stronger half – walk the same career with `kidName: 'Vera'` restored
    // BEFORE birth and all three pre-02.09 constants come back exactly. If the owner's default had
    // reached one number in a career – a draw, a cent, a ranking place – this would be red beside a
    // green freeze, which is the one signal a whole-world hash cannot otherwise give.
    // ⚠ AND THE OVERRIDE GOES IN BEFORE `createWorld`, NOT AFTER IT. Patching `world.profile` on the
    // opened career reproduces every key except `events`, because the career's opening events are
    // written at birth and already carry the old name. See `careerHashUnderTheOldName`.
    expect(careerHashUnderTheOldName(5, 0), '25k · middle coach · grinder').toBe(PRE_NAME_VERA.middleGrinder)
    expect(careerHashUnderTheOldName(8, 0), '120k · elite coach · grinder').toBe(PRE_NAME_VERA.eliteGrinder)
    expect(careerHashUnderTheOldName(0, 1), '8k · self-coached · player').toBe(PRE_NAME_VERA.selfTravelling)
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
